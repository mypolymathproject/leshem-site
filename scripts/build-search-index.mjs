#!/usr/bin/env node
/**
 * Builds the "search by meaning" index.
 *
 * Reads every chapter under docs/, cuts the English text into passages of
 * roughly 100 words, turns each passage into a 384-number vector with a small
 * open embedding model, and writes two files into static/:
 *
 *   search-passages.json   passage text (shortened) + where it lives
 *   search-vectors.bin     one Int8 vector per passage, same order
 *
 * The page src/pages/search-by-meaning.js loads both and compares a visitor's
 * question against them in the browser. No server is involved.
 *
 * This script never fails the site build. If the model cannot be downloaded,
 * it deletes any half-written output, warns, and exits 0; the search page then
 * says the index is unavailable and everything else deploys as normal.
 *
 * Usage:
 *   node scripts/build-search-index.mjs             full build (needs the model)
 *   node scripts/build-search-index.mjs --dry-run   split only; no model, no files
 *   ... --dry-run --show=/shaar-1/chapter-1         print that chapter's first passages
 */
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const OUT_PASSAGES = path.join(ROOT, 'static', 'search-passages.json');
const OUT_VECTORS = path.join(ROOT, 'static', 'search-vectors.bin');

// The page loads the same model and dtype; change them together.
const MODEL = 'Xenova/all-MiniLM-L6-v2';
const DTYPE = 'q8';
const DIM = 384;
const BATCH = 16;

const SKIP_DIRS = new Set(['illustrations']);
const FLUSH_AT = 80; // words: close a passage once it reaches this
const MAX_WORDS = 160; // a single paragraph longer than this is split by sentence
const SPLIT_TO = 110; // target words per piece when splitting
const MIN_WORDS = 12; // passages shorter than this are merged or dropped
const SNIPPET_CHARS = 320;

const DRY = process.argv.includes('--dry-run');

const words = (s) => (s.match(/\S+/g) ?? []).length;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) out.push(...(await walk(p)));
    } else if (/\.mdx?$/.test(e.name)) {
      out.push(p);
    }
  }
  return out.sort();
}

function splitFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { fm: {}, body: src };
  const fm = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return { fm, body: src.slice(m[0].length) };
}

/** URL Docusaurus serves this doc at (routeBasePath is '/'). */
function urlFor(file, fm) {
  if (fm.slug?.startsWith('/')) return fm.slug;
  const rel = path.relative(DOCS, file).split(path.sep).join('/');
  const dir = path.posix.dirname(rel);
  const id = fm.id ?? path.posix.basename(rel).replace(/\.mdx?$/, '');
  return '/' + (dir === '.' ? '' : dir + '/') + id;
}

/**
 * Finds the '>' that closes a JSX opening tag, ignoring any '>' inside
 * "quoted" attribute values or {braced} expressions (the hebrew={<>...</>} prop).
 */
function findTagEnd(src, from) {
  let depth = 0;
  for (let i = from; i < src.length; i++) {
    const c = src[i];
    if (depth === 0 && c === '"') {
      const j = src.indexOf('"', i + 1);
      if (j === -1) return -1;
      i = j;
    } else if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return i + 1;
  }
  return -1;
}

/**
 * Shaar 1 and 2 chapter 1 keep the English translation inside a <Passage
 * translation="..."> prop. Turn each tag into a marker line plus a plain
 * paragraph, and keep the commentary children as they are.
 */
function expandPassages(src) {
  let out = '';
  let i = 0;
  for (;;) {
    const start = src.indexOf('<Passage', i);
    if (start === -1) {
      out += src.slice(i);
      break;
    }
    out += src.slice(i, start);
    const end = findTagEnd(src, start + '<Passage'.length);
    if (end === -1) {
      out += src.slice(start);
      break;
    }
    const tag = src.slice(start, end);
    const marker = tag.match(/marker="([^"]*)"/)?.[1];
    const translation = tag.match(/translation="([^"]*)"/)?.[1];
    out += '\n\n' + (marker ? `@@${marker}@@\n\n` : '') + (translation ? translation + '\n\n' : '');
    i = end;
  }
  return out.replace(/<\/Passage>/g, '\n\n');
}

function cleanInline(s) {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/[֐-׿יִ-ﭏ]/g, '') // Hebrew: the model reads English
    .replace(/[*_`]+/g, '')
    .replace(/\\([^\sA-Za-z0-9])/g, '$1') // markdown escapes such as "3\."
    .replace(/\s+/g, ' ')
    .trim();
}

function toBlocks(body) {
  const blocks = [];
  let buf = [];
  const flush = () => {
    if (buf.length) blocks.push({ kind: 'p', raw: buf.join(' ') });
    buf = [];
  };
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^(import|export)\s/.test(line)) continue;
    if (/^\[\^[^\]]+\]:/.test(line)) {
      flush(); // footnote definitions are bare citations; skip them
      continue;
    }
    if (line.includes('={{') || /^\/?>$/.test(line)) continue; // JSX diagram plumbing
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      flush();
      blocks.push({ kind: 'h', raw: h[1] });
      continue;
    }
    const mk = line.match(/^@@(.+)@@$/);
    if (mk) {
      flush();
      blocks.push({ kind: 'm', raw: mk[1] });
      continue;
    }
    buf.push(line);
  }
  flush();
  return blocks;
}

function splitLong(text) {
  if (words(text) <= MAX_WORDS) return [text];
  const pieces = [];
  let cur = [];
  let n = 0;
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    cur.push(sentence);
    n += words(sentence);
    if (n >= SPLIT_TO) {
      pieces.push(cur.join(' '));
      cur = [];
      n = 0;
    }
  }
  if (cur.length) pieces.push(cur.join(' '));
  return pieces;
}

function chunkDoc(doc) {
  const passages = [];
  let label = '';
  let cur = [];
  let n = 0;

  const emit = () => {
    const text = cur.join(' ').replace(/\s+/g, ' ').trim();
    cur = [];
    n = 0;
    if (!text) return;
    const last = passages[passages.length - 1];
    if (words(text) < MIN_WORDS) {
      if (last && last.l === label) last.text += ' ' + text; // fold a short tail into its neighbour
      return;
    }
    passages.push({ u: doc.url, c: doc.title, l: label, text });
  };

  for (const b of doc.blocks) {
    if (b.kind === 'h' || b.kind === 'm') {
      emit();
      label = cleanInline(b.raw);
      continue;
    }
    const text = cleanInline(b.raw);
    if (!/[A-Za-z]/.test(text)) continue;
    for (const piece of splitLong(text)) {
      cur.push(piece);
      n += words(piece);
      if (n >= FLUSH_AT) emit();
    }
  }
  emit();
  return passages;
}

function snippet(text) {
  if (text.length <= SNIPPET_CHARS) return text;
  return text.slice(0, SNIPPET_CHARS).replace(/\s+\S*$/, '') + '…';
}

async function main() {
  const t0 = Date.now();
  const files = await walk(DOCS);
  const passages = [];
  for (const file of files) {
    const { fm, body } = splitFrontmatter(await readFile(file, 'utf8'));
    const doc = {
      url: urlFor(file, fm),
      title: cleanInline(fm.title ?? path.basename(file)),
      blocks: toBlocks(expandPassages(body)),
    };
    passages.push(...chunkDoc(doc));
  }
  const totalWords = passages.reduce((s, p) => s + words(p.text), 0);
  console.log(
    `[search-index] ${files.length} files, ${passages.length} passages, ${totalWords} words (avg ${Math.round(totalWords / passages.length)})`,
  );

  if (DRY) {
    const show = process.argv.find((a) => a.startsWith('--show='))?.slice(7);
    if (show) {
      for (const p of passages.filter((x) => x.u === show).slice(0, 4)) {
        console.log(`\n--- ${p.u} | ${p.l}\n${snippet(p.text)}`);
      }
      return;
    }
    for (const i of [0, Math.floor(passages.length / 2), passages.length - 1]) {
      const p = passages[i];
      console.log(`\n--- #${i} ${p.u} | ${p.c} | ${p.l}\n${snippet(p.text)}`);
    }
    return;
  }

  const { pipeline } = await import('@huggingface/transformers');
  console.log(`[search-index] loading ${MODEL} (${DTYPE})`);
  const extractor = await pipeline('feature-extraction', MODEL, { dtype: DTYPE });

  const vecs = new Int8Array(passages.length * DIM);
  for (let i = 0; i < passages.length; i += BATCH) {
    const batch = passages.slice(i, i + BATCH).map((p) => p.text);
    const out = await extractor(batch, { pooling: 'mean', normalize: true });
    if (out.dims[1] !== DIM) throw new Error(`expected ${DIM} dimensions, model gave ${out.dims[1]}`);
    const data = out.data;
    for (let j = 0; j < data.length; j++) {
      vecs[i * DIM + j] = Math.max(-127, Math.min(127, Math.round(data[j] * 127)));
    }
    if ((i / BATCH) % 25 === 0) console.log(`[search-index] embedded ${Math.min(i + BATCH, passages.length)}/${passages.length}`);
  }

  const meta = {
    model: MODEL,
    dtype: DTYPE,
    dim: DIM,
    count: passages.length,
    passages: passages.map((p) => ({ u: p.u, c: p.c, l: p.l, t: snippet(p.text) })),
  };
  await writeFile(OUT_PASSAGES, JSON.stringify(meta));
  await writeFile(OUT_VECTORS, Buffer.from(vecs.buffer));
  console.log(`[search-index] done in ${Math.round((Date.now() - t0) / 1000)}s`);
}

main().catch(async (err) => {
  console.warn('[search-index] skipped, the site will build without search by meaning:', err?.message ?? err);
  if (DRY) {
    process.exitCode = 1;
    return;
  }
  await Promise.all([rm(OUT_PASSAGES, { force: true }), rm(OUT_VECTORS, { force: true })]);
});

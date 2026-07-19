// Generates a single print-ready PDF (6x9in, KDP-style) from the Docusaurus
// production build in `build/`. Run `npm run build` first.
//
// Usage: node scripts/build-pdf.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');

// ── Placeholders — edit before final KDP submission ─────────────────────────
const COPYRIGHT_NAME = '[Translator/Copyright Holder Name]';
const COPYRIGHT_YEAR = '[Year]';

// ── Volume split (each volume stays well under KDP's 828-page paperback cap) ─
const VOLUMES = [
  {
    file: 'book-vol1-gates-1-4.pdf',
    number: 'One',
    range: 'Gates One Through Four',
    shaarIds: ['intro', 'shaar-1', 'shaar-2', 'shaar-3', 'shaar-4'],
  },
  {
    file: 'book-vol2-gates-5-6.pdf',
    number: 'Two',
    range: 'Gates Five and Six',
    shaarIds: ['shaar-5', 'shaar-6'],
  },
  {
    file: 'book-vol3-gate-7.pdf',
    number: 'Three',
    range: 'Gate Seven',
    shaarIds: ['shaar-7', 'illustrations'],
  },
];

// ── Chapter order (mirrors sidebars.js / _category_.json position fields) ──
const SHAARS = [
  {
    id: 'shaar-1',
    label: "Shaar 1 — The Names Havaye and Ad-nai",
    dir: 'shaar-1',
    chapters: ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-6', 'chapter-7', 'chapter-8', 'chapter-9'],
  },
  {
    id: 'shaar-2',
    label: "Shaar 2 — Matter, Form, and the Chain of Worlds",
    dir: 'shaar-2',
    chapters: ['chapter-1', 'chapter-2'],
  },
  {
    id: 'shaar-3',
    label: "Shaar 3 — Five levels of form: nefesh, ruakh, neshama, chaya, yehida (narnhai)",
    dir: 'shaar-3',
    chapters: ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-6', 'chapter-7'],
  },
  {
    id: 'shaar-4',
    label: "Shaar 4 — Discussion of the first three levels of the Divine as related to us",
    dir: 'shaar-4',
    chapters: ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-6'],
  },
  {
    id: 'shaar-5',
    label: "Shaar 5 — The five general Divine revelations",
    dir: 'shaar-5',
    chapters: ['chapter-1', 'chapter-2', 'chapter-3'],
  },
  {
    id: 'shaar-6',
    label: "Shaar 6 — How the Divine Light expands: tsimtsum, the surrounding and inner lights, reward and karma",
    dir: 'shaar-6',
    chapters: ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-6', 'avnei-miluim', 'chapter-7', 'chapter-8', 'chapter-9', 'chapter-10', 'chapter-11'],
  },
  {
    id: 'shaar-7',
    label: "Shaar 7 — The Five Revelations in the Worlds and the Partzufim",
    dir: 'shaar-7',
    chapters: ['chapter-1', 'chapter-2', 'chapter-3', 'chapter-4', 'chapter-5', 'chapter-6', 'chapter-7'],
  },
];

// ── Page setup (KDP 6x9in trim, uniform safe margins) ───────────────────────
const PDF_OPTIONS = {
  printBackground: true,
  preferCSSPageSize: false,
  width: '6in',
  height: '9in',
  margin: { top: '0.75in', bottom: '0.75in', left: '0.75in', right: '0.75in' },
};

// ── CSS ──────────────────────────────────────────────────────────────────
const cssFile = fs.readdirSync(path.join(BUILD, 'assets', 'css')).find(f => f.endsWith('.css'));
const CSS_PATH = path.join(BUILD, 'assets', 'css', cssFile);
const FONTS_CSS_PATH = path.join(ROOT, 'scripts', 'fonts', 'fonts.css');

const PRINT_CSS = `
  html, body { background: #ffffff !important; margin: 0; padding: 0; }
  .theme-doc-markdown { max-width: none !important; }
  img { max-width: 100% !important; height: auto !important; break-inside: avoid; }
  * { box-shadow: none !important; }
  article h1 { font-size: 19px !important; line-height: 1.35 !important; margin-top: 0 !important; margin-bottom: 22px !important; }
  .pdf-divider {
    height: 7.2in;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .pdf-divider-label { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: var(--color-gold); margin-bottom: 18px; }
  .pdf-divider-title { font-family: var(--font-body); font-size: 22px; font-style: italic; color: var(--color-ink); line-height: 1.5; max-width: 4in; }
  .pdf-title-page { height: 7.2in; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
  .pdf-title-hebrew { font-family: var(--font-hebrew); font-size: 40px; color: var(--color-gold-dark); direction: rtl; margin-bottom: 18px; }
  .pdf-title-english { font-family: var(--font-display); font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-ink); margin-bottom: 14px; }
  .pdf-title-sub { font-family: var(--font-body); font-style: italic; font-size: 14px; color: var(--color-ink-mid); max-width: 3.5in; line-height: 1.6; margin-bottom: 40px; }
  .pdf-title-by { font-family: var(--font-body); font-size: 13px; color: var(--color-ink-light); }
  .pdf-copyright-page { font-family: var(--font-body); font-size: 10.5px; line-height: 1.7; color: var(--color-ink-mid); padding-top: 5.5in; }
  .pdf-copyright-page p { margin: 0 0 10px; }
  .pdf-toc-title { font-family: var(--font-display); font-size: 16px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-gold-dark); margin-bottom: 24px; }
  .pdf-toc-shaar { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-gold-dark); margin-top: 16px; margin-bottom: 4px; break-inside: avoid; }
  .pdf-toc-row { display: flex; align-items: flex-end; gap: 6px; font-family: var(--font-body); font-size: 11px; color: var(--color-ink-mid); margin: 3px 0; break-inside: avoid; }
  .pdf-toc-row-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1; }
  .pdf-toc-leader { flex: 1; border-bottom: 1px dotted var(--color-ink-light); margin-bottom: 3px; }
  .pdf-toc-page { flex-shrink: 0; line-height: 1; }
`;

function wrapHtml(bodyHtml) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="file://${FONTS_CSS_PATH}">
<link rel="stylesheet" href="file://${CSS_PATH}">
<style>${PRINT_CSS}</style>
</head><body>${bodyHtml}</body></html>`;
}

// ── Extraction helpers ───────────────────────────────────────────────────
function readBuiltPage(routeDir) {
  const file = path.join(BUILD, routeDir, 'index.html');
  const html = fs.readFileSync(file, 'utf-8');
  const articleMatch = html.match(/<article>([\s\S]*?)<\/article>/);
  if (!articleMatch) throw new Error(`No <article> found in ${file}`);
  const articleInner = articleMatch[1];
  const markerIdx = articleInner.indexOf('<div class="theme-doc-markdown markdown">');
  if (markerIdx === -1) throw new Error(`No markdown div found in ${file}`);
  let content = articleInner.slice(markerIdx);
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : routeDir;
  content = rewriteAssetPaths(content);
  return { title, html: content };
}

const MIME_TYPES = { png: 'png', jpg: 'jpeg', jpeg: 'jpeg', gif: 'gif', svg: 'svg+xml', webp: 'webp' };

function rewriteAssetPaths(html) {
  // Inline as base64 data URIs — Chromium blocks file:// subresource loads
  // (images specifically) from a page.setContent() document, even though
  // file:// <link> stylesheets/fonts load fine.
  return html.replace(/src=(")?(\/(?:img|assets)\/[^"\s>]+)\1?/g, (_m, _q, p) => {
    const abs = path.join(BUILD, p);
    const ext = path.extname(abs).slice(1).toLowerCase();
    const mime = MIME_TYPES[ext] || 'png';
    const b64 = fs.readFileSync(abs).toString('base64');
    return `src="data:image/${mime};base64,${b64}"`;
  });
}

// ── Build the ordered content chunk list ────────────────────────────────
function buildChunks() {
  const chunks = [];
  const intro = readBuiltPage('.');
  chunks.push({ id: 'intro', shaarId: 'intro', title: 'About This Work', html: intro.html, isDivider: false });

  for (const shaar of SHAARS) {
    chunks.push({ id: `${shaar.id}-divider`, shaarId: shaar.id, title: shaar.label, isDivider: true });
    for (const ch of shaar.chapters) {
      const page = readBuiltPage(`${shaar.dir}/${ch}`);
      chunks.push({ id: `${shaar.id}-${ch}`, shaarId: shaar.id, title: page.title, html: page.html, isDivider: false });
    }
  }

  chunks.push({ id: 'illustrations-divider', shaarId: 'illustrations', title: 'Illustrations', isDivider: true });
  const illus = readBuiltPage('illustrations/charts');
  chunks.push({ id: 'illustrations', shaarId: 'illustrations', title: 'Illustrations', html: illus.html, isDivider: false });

  return chunks;
}

function dividerHtml(label) {
  return wrapHtml(`<div class="pdf-divider"><div class="pdf-divider-label">Gate</div><div class="pdf-divider-title">${label}</div></div>`);
}

function chapterHtml(html) {
  return wrapHtml(`<article><div class="theme-doc-markdown markdown">${html}</div></article>`);
}

function titlePageHtml(volume) {
  return wrapHtml(`<div class="pdf-title-page">
    <div class="pdf-title-hebrew">ספר לשם שבו ואחלמה</div>
    <div class="pdf-title-english">Leshem Shvo v'Achlama</div>
    <div class="pdf-title-sub">Introductions and Gates &middot; An Annotated English Translation</div>
    <div class="pdf-title-sub" style="margin-bottom:14px;">Volume ${volume.number} &middot; ${escapeHtml(volume.range)}</div>
    <div class="pdf-title-by">Translated and Annotated by ${COPYRIGHT_NAME}</div>
  </div>`);
}

function copyrightPageHtml(volume) {
  return wrapHtml(`<div class="pdf-copyright-page">
    <p>Copyright &copy; ${COPYRIGHT_YEAR} ${COPYRIGHT_NAME}. All rights reserved.</p>
    <p>No part of this publication may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the copyright holder, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.</p>
    <p>The Hebrew source text of <em>Leshem Shvo v'Achlama</em> by Rabbi Shlomo Elyashiv (1841&ndash;1926) is a historical work. This edition's English translation, commentary, and annotations are original to this publication.</p>
    <p>Volume ${volume.number} of ${VOLUMES.length} &middot; ${escapeHtml(volume.range)}</p>
    <p>First edition.</p>
  </div>`);
}

function tocHtml(entries) {
  const rows = [];
  for (const e of entries) {
    if (e.isDivider) {
      rows.push(`<div class="pdf-toc-shaar">${escapeHtml(e.title)}</div>`);
    } else {
      rows.push(`<div class="pdf-toc-row"><span class="pdf-toc-row-title">${escapeHtml(e.title)}</span><span class="pdf-toc-leader"></span><span class="pdf-toc-page">${e.page}</span></div>`);
    }
  }
  return wrapHtml(`<div class="pdf-toc-title">Contents</div>${rows.join('\n')}`);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function countPages(buffer) {
  const doc = await PDFDocument.load(buffer);
  return doc.getPageCount();
}

async function main() {
  console.log('Reading built pages...');
  const chunks = buildChunks();
  console.log(`Found ${chunks.length} content chunks.`);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  async function render(html) {
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');
    const buf = await page.pdf(PDF_OPTIONS);
    return Buffer.from(buf);
  }

  console.log('Rendering content chunks (this takes a while)...');
  for (const chunk of chunks) {
    const html = chunk.isDivider ? dividerHtml(chunk.title) : chapterHtml(chunk.html);
    chunk.buf = await render(html);
    chunk.pages = await countPages(chunk.buf);
    console.log(`  ${chunk.id}: ${chunk.pages}p`);
  }

  for (const volume of VOLUMES) {
    console.log(`\nAssembling Volume ${volume.number} — ${volume.range}...`);
    const volChunks = chunks.filter(c => volume.shaarIds.includes(c.shaarId));

    let acc = 1;
    for (const c of volChunks) {
      c.volStartPage = acc;
      acc += c.pages;
    }

    const titleBuf = await render(titlePageHtml(volume));
    const titlePages = await countPages(titleBuf);
    const copyrightBuf = await render(copyrightPageHtml(volume));
    const copyrightPages = await countPages(copyrightBuf);

    const frontOffset = titlePages + copyrightPages;
    let tocPages = 0;
    let tocBuf = null;
    for (let i = 0; i < 4; i++) {
      const offset = frontOffset + tocPages;
      const entries = volChunks.map(c => ({ title: c.title, isDivider: c.isDivider, page: c.volStartPage + offset }));
      tocBuf = await render(tocHtml(entries));
      const newTocPages = await countPages(tocBuf);
      console.log(`  TOC pass ${i + 1}: ${newTocPages} page(s)`);
      if (newTocPages === tocPages) break;
      tocPages = newTocPages;
    }

    const volDoc = await PDFDocument.create();
    const order = [titleBuf, copyrightBuf, tocBuf, ...volChunks.map(c => c.buf)];
    for (const buf of order) {
      const src = await PDFDocument.load(buf);
      const copied = await volDoc.copyPages(src, src.getPageIndices());
      copied.forEach(p => volDoc.addPage(p));
    }

    const font = await volDoc.embedFont(StandardFonts.TimesRoman);
    const pages = volDoc.getPages();
    pages.forEach((p, i) => {
      if (i === 0) return; // skip title page
      const num = String(i + 1);
      const { width } = p.getSize();
      const textWidth = font.widthOfTextAtSize(num, 9);
      p.drawText(num, { x: width / 2 - textWidth / 2, y: 36, size: 9, font, color: rgb(0.35, 0.32, 0.3) });
    });

    const bytes = await volDoc.save();
    const outFile = path.join(ROOT, volume.file);
    fs.writeFileSync(outFile, bytes);
    console.log(`Wrote ${outFile} (${pages.length} pages).`);
  }

  await browser.close();
  console.log('\nAll volumes done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

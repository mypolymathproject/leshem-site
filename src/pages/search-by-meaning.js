import React, {useRef, useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './search-by-meaning.module.css';

// Results below this cosine similarity are hidden. A starting guess: tune it
// against real queries once the index exists.
const MIN_SCORE = 0.2;
const MAX_RESULTS = 10;
const PER_CHAPTER = 2;

const EXAMPLES = [
  'how does the soul have levels',
  'why did the vessels break',
  'the four worlds',
];

const UNAVAILABLE =
  'Search by meaning is not available right now. The regular search in the top bar still works.';

/**
 * Loads the passage index, the vectors and the embedding model, once.
 * The model library is fetched from a CDN at run time (not bundled) so the
 * site build stays untouched; keep this version equal to the devDependency
 * in package.json, because the vectors were made with the same model and dtype.
 */
async function loadEngine(passagesUrl, vectorsUrl) {
  const [passagesRes, vectorsRes, tf] = await Promise.all([
    fetch(passagesUrl),
    fetch(vectorsUrl),
    import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1'),
  ]);
  if (!passagesRes.ok || !vectorsRes.ok) throw new Error('index files missing');
  const meta = await passagesRes.json();
  const vecs = new Int8Array(await vectorsRes.arrayBuffer());
  if (vecs.length !== meta.count * meta.dim) throw new Error('index files out of step');
  const extractor = await tf.pipeline('feature-extraction', meta.model, {dtype: meta.dtype});
  return {meta, vecs, extractor};
}

function rank({meta, vecs}, queryVec) {
  const {count, dim, passages} = meta;
  const scored = new Array(count);
  for (let i = 0; i < count; i++) {
    let dot = 0;
    const offset = i * dim;
    for (let k = 0; k < dim; k++) dot += vecs[offset + k] * queryVec[k];
    scored[i] = [dot / 127, i];
  }
  scored.sort((a, b) => b[0] - a[0]);

  const perChapter = new Map();
  const picked = [];
  for (const [score, i] of scored) {
    if (score < MIN_SCORE || picked.length >= MAX_RESULTS) break;
    const p = passages[i];
    const seen = perChapter.get(p.u) ?? 0;
    if (seen >= PER_CHAPTER) continue;
    perChapter.set(p.u, seen + 1);
    picked.push({...p, score});
  }
  return picked;
}

export default function SearchByMeaning() {
  const passagesUrl = useBaseUrl('/search-passages.json');
  const vectorsUrl = useBaseUrl('/search-vectors.bin');
  const engine = useRef(null);
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | loading | searching | error
  const [result, setResult] = useState(null); // {q, items}

  function load() {
    if (!engine.current) {
      engine.current = loadEngine(passagesUrl, vectorsUrl);
      engine.current.catch(() => {
        engine.current = null; // allow a retry
      });
    }
    return engine.current;
  }

  async function run(q) {
    const text = q.trim();
    if (!text) return;
    setPhase(engine.current ? 'searching' : 'loading');
    try {
      const loaded = await load();
      setPhase('searching');
      const out = await loaded.extractor(text, {pooling: 'mean', normalize: true});
      setResult({q: text, items: rank(loaded, out.data)});
      setPhase('idle');
    } catch (err) {
      console.error('[search-by-meaning]', err);
      setPhase('error');
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    run(query);
  }

  function pickExample(text) {
    setQuery(text);
    run(text);
  }

  const busy = phase === 'loading' || phase === 'searching';

  return (
    <Layout title="Search by meaning" description="Find passages by what they mean, not only by the words they use.">
      <main className={styles.page}>
        <h1>Search by meaning</h1>
        <p className={styles.lead}>
          Describe an idea in your own words and the search finds the passages closest to it, even
          when they use different words. For an exact phrase or a Hebrew term, use the search box
          in the top bar.
        </p>

        <form className={styles.form} onSubmit={onSubmit} role="search">
          <label htmlFor="meaning-query" className={styles.srOnly}>
            Describe what you are looking for
          </label>
          <input
            id="meaning-query"
            className={styles.input}
            type="search"
            value={query}
            placeholder="For example: how does the soul have levels"
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => load().catch(() => {})}
            autoComplete="off"
          />
          <button className="button button--primary" type="submit" disabled={busy || !query.trim()}>
            Search
          </button>
        </form>

        <div className={styles.examples}>
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className={styles.chip} onClick={() => pickExample(ex)} disabled={busy}>
              {ex}
            </button>
          ))}
        </div>

        <p className={styles.status} role="status" aria-live="polite">
          {phase === 'loading' && 'Preparing the search. The first visit downloads a small model (about 25 MB) that your browser keeps afterwards.'}
          {phase === 'searching' && 'Searching…'}
          {phase === 'error' && UNAVAILABLE}
        </p>

        {result && phase !== 'error' && (
          <section aria-label="Results">
            <h2 className={styles.resultsTitle}>
              {result.items.length
                ? `Closest passages to “${result.q}”`
                : `Nothing close to “${result.q}”. Try describing the idea with different words.`}
            </h2>
            <ol className={styles.results}>
              {result.items.map((r, i) => (
                <li key={`${r.u}-${i}`} className={styles.result}>
                  <Link to={r.u} className={styles.resultTitle}>
                    {r.c}
                  </Link>
                  {r.l && <div className={styles.resultLabel}>{r.l}</div>}
                  <p className={styles.resultText}>{r.t}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <p className={styles.note}>
          Your question stays in your browser. The matching model is downloaded to your browser from
          public servers (jsDelivr and Hugging Face), and no search text is sent anywhere.
        </p>
      </main>
    </Layout>
  );
}

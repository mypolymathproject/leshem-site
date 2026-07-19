# Leshem Shvo v'Achlama — Site Notes for Claude

## What This Project Is

A Docusaurus 3 static site publishing an annotated English translation of *Leshem Shvo v'Achlama*, a Kabbalistic text by Rabbi Shlomo Elyashiv (the Baal haLeshem). Each page contains Hebrew source text, English translation (in bold), commentary, and footnotes.

## Tech Stack

- **Docusaurus 3** — static site generator (React under the hood)
- **Markdown** — one `.md` file per chapter
- **Vercel** — hosting (auto-deploys from GitHub on push)
- **Custom CSS** — `src/css/custom.css` — handles Hebrew RTL, serif fonts, amber palette

## Dev Commands

```bash
cd leshem-site
npm start        # local dev server at http://localhost:3000
npm run build    # production build into build/
npm run serve    # serve the production build locally
```

## Key Files

| File | Purpose |
|---|---|
| `docusaurus.config.js` | Site title, navbar, footer, plugins |
| `sidebars.js` | Auto-generated from folder structure — rarely needs editing |
| `src/css/custom.css` | All custom styling including Hebrew RTL |
| `docs/intro.md` | About page, serves at `/` (root) |
| `docs/shaar-N/_category_.json` | Sidebar label and collapse config for each Shaar |
| `docs/shaar-N/chapter-N.md` | Chapter content |
| `docs/illustrations/_category_.json` | Illustrations section (position 9) |
| `docs/illustrations/charts.mdx` | Gallery page — all 17 charts, each wrapped in `<ProtectedImage>` |
| `src/components/ProtectedImage.jsx` | Copyright-protection wrapper for chart images |
| `src/components/ProtectedImage.module.css` | Scoped styles for ProtectedImage (overlay, copyright strip) |
| `static/img/illustrations/` | Chart images (PNG converted from PDF, plus original JPGs) |

## How to Add a New Chapter

1. Create `docs/shaar-N/chapter-N.md` with frontmatter:
   ```markdown
   ---
   id: chapter-N
   title: "Chapter N"
   sidebar_position: N
   ---
   ```
2. Paste chapter content (Hebrew paragraphs, bold English translation, commentary, footnotes)
3. `git add . && git commit -m "..." && git push` — Vercel deploys automatically

## How to Add a New Shaar (Gate)

1. Create folder `docs/shaar-N/`
2. Add `_category_.json`:
   ```json
   {
     "label": "Shaar N — Title",
     "position": N,
     "collapsible": true,
     "collapsed": true
   }
   ```
3. Add chapter files inside it

## Sidebar

Each Shaar in the sidebar is **collapsible and collapsed by default** (`collapsible: true, collapsed: true` in `_category_.json`). This keeps the sidebar clean when there are many chapters. The active chapter's Shaar expands automatically.

## Content Format

Each chapter follows this pattern:

```markdown
Hebrew paragraph text

**English translation in bold**

Commentary in regular text explaining the Hebrew.

**Next Hebrew paragraph**

**English translation**

More commentary.

[^1]: Footnote text here.
```

## Hebrew Rendering

Hebrew/English bidirectionality is handled via two mechanisms working together:

**1. Remark plugin** (`src/plugins/remark-hebrew-rtl.mjs`): runs at build time and adds `dir="rtl"` to any paragraph whose first character is in the Hebrew Unicode range. Registered in `docusaurus.config.js` under `docs.remarkPlugins`.

**2. CSS** (`src/css/custom.css`): `article p[dir="rtl"]` applies Frank Ruhl Libre / 22px / weight 500, matching the `<Passage>` component's `.hebrew` class. A base rule `unicode-bidi: plaintext; text-align: start` on `.markdown p` handles visual alignment.

**Two chapter authoring patterns:**
- **`<Passage>` component** (Shaar 1, Shaar 2 Ch 1): Hebrew passed as `hebrew="..."` prop; component renders its own `<div dir="rtl">` with the `.hebrew` CSS class.
- **Plain markdown** (Shaar 2 Ch 2 onward): Hebrew paragraphs written as bare text; remark plugin adds `dir="rtl"` at build time; `article p[dir="rtl"]` CSS applies matching styles.

Do NOT try to use `:dir(rtl)` CSS pseudo-class — it only fires based on the HTML `dir` attribute algorithm, not the CSS `unicode-bidi` property.

## Footnotes

Markdown footnotes (`[^1]`, `[^2]`, etc.) are supported natively. Keep footnote definitions at the bottom of each chapter file. Numbering resets per chapter — use whatever numbers match the source document.

## Source Files

Source chapters arrive as `.md` files exported from Word/DOCX (e.g. `~/Downloads/Shaar 7 Chapter 2 a-e.md`). Shaar 1–5 used `.rtf` source files. Shaar 6 onward uses `.md` source files.

## Converting MD Source Files to Site Markdown (Shaar 6+)

Use this Python pattern for Word-exported `.md` files:

```python
import re

with open('path/to/source.md', 'r') as f:
    text = f.read()

# 1. Remove the top-level "**Sha'ar N Chapter M**" heading line
#    Note: Sha'ar uses Unicode curly apostrophe (U+2019), not straight apostrophe
text = re.sub(r'^\*\*Sha’ar \d+ Chapter \d+\*\*\s*\n\n', '', text)

# 2. Convert section headers + their bold title lines to ## headings
#    Pattern: **Chapter Na** + blank line + **Title text** → ## Na — Title text
#    Titles with ***italic bold*** need custom handling per chapter
text = re.sub(
    r'\*\*Chapter (Na)\*\*\s*\n\n\*\*Title text\*\*\s*\n',
    r'## Na — Title text\n\n', text
)

# 3. Strip bold markers from Hebrew-only lines
#    Hebrew paragraphs in bold (**Hebrew text**) must be bare text
#    so the remark-hebrew-rtl plugin can detect and add dir="rtl"
def strip_hebrew_bold(text):
    lines = text.split('\n')
    result = []
    for line in lines:
        m = re.match(r'^\*\*(\s*[֐-׿].+)\*\*\s*$', line)
        if m:
            result.append(m.group(1).strip())
        else:
            result.append(line)
    return '\n'.join(result)

text = strip_hebrew_bold(text)

# 4. Handle embedded base64 images (if any)
import base64
img_match = re.search(r'\[image1\]: <data:image/png;base64,([^>]+)>', text)
if img_match:
    img_data = base64.b64decode(img_match.group(1))
    with open('static/img/shaar-N/name.png', 'wb') as f:
        f.write(img_data)
text = re.sub(r'\*\*!\[.*?\]\[image1\]\*\*', '![alt text](/img/shaar-N/name.png)', text)
text = re.sub(r'!\[.*?\]\[image1\]', '![alt text](/img/shaar-N/name.png)', text)
text = re.sub(r'\[image1\]: <data:image/png;base64,[^>]+>', '', text)

# 5. Add frontmatter and write
frontmatter = '''---
id: chapter-N
title: "Chapter N — Title"
sidebar_position: N
---

'''
with open('docs/shaar-N/chapter-N.md', 'w') as f:
    f.write(frontmatter + text)
```

**Key gotchas:**
- The curly apostrophe in `Sha'ar` is U+2019 — straight apostrophe regex will not match
- Hebrew paragraphs **must not** be wrapped in `**bold**` — the remark plugin detects bare Hebrew
- Footnotes in source are usually already in `[^N]: text` format (Shaar 2 Ch 2 onward)
- Chapter 1 (Shaar 7) had bare-number footnote defs (`1 text`) requiring conversion
- Titles using `***bold-italic***` need custom regex — extract exact bytes with `repr()` first

## Converting RTF Chapters to Markdown (Shaar 1–5)

Use this Python pattern to convert any Shaar 3 chapter RTF:

```python
import re

with open('path/to/chapter.rtf', 'rb') as f:
    raw = f.read().decode('latin-1')

def replace_hex(m):
    try:
        return bytes([int(m.group(1), 16)]).decode('cp1255')
    except:
        return ''

def replace_unicode(m):
    n = int(m.group(1))
    if n < 0: n += 65536
    return chr(n)

text = raw
# IMPORTANT: use `.` (not `\?`) to match the skip char after \uN — this file uses a space
text = re.sub(r'\\u(-?\d+).', replace_unicode, text)
text = re.sub(r"\\'([0-9a-fA-F]{2})", replace_hex, text)
text = re.sub(r'\\b\b(?!0)', '<<<B>>>', text)   # mark bold spans
text = re.sub(r'\\b0\b', '<<<E>>>', text)
text = re.sub(r'\\par\b', '\n\n', text)          # paragraph breaks
text = re.sub(r'\\[a-zA-Z]+[-\d]*\s?', '', text) # strip RTF control words
text = re.sub(r'[{}]', '', text)
text = re.sub(r'\\[^\n]', '', text)
```

**Paragraph classification:**
- Contains >3 Hebrew chars → plain Hebrew paragraph (remark plugin handles RTL)
- Contains `<<<B>>>` → **bold** paragraph (English translation)
- Otherwise → plain text (commentary/footnote)

**Footnotes:** paragraphs matching `^1\s+(word)` mark the footnote section start; format as `[^N]: text`.

**Diagrams:** If the RTF contains a visual diagram (tables, boxes, arrows), recreate it as JSX in the `.md` file. Use `style={{...}}` object syntax (not `style="..."` strings) — Docusaurus 3 uses MDX which requires JSX prop syntax. Example layout for a 3-row world/organ diagram:

```jsx
<div style={{margin: '2rem 0', fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--color-ink)'}}>
  <div style={{display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.8rem'}}>
    <div style={{border: '2px solid currentColor', padding: '0.6rem 0.8rem', textAlign: 'center', minWidth: '110px', flexShrink: 0, lineHeight: 1.5}}>
      <div style={{fontStyle: 'italic', fontWeight: 700}}>Beriah</div>
      <div style={{fontStyle: 'italic', fontWeight: 700, marginTop: '0.2rem'}}>Macro-<br/>NESHAMA</div>
    </div>
    <div style={{flex: 1, fontStyle: 'italic', fontWeight: 700, lineHeight: 2.2}}>
      <div>NESHAMA n*r<sup>1</sup>"n<sup>2</sup></div>
      ...
    </div>
    <div style={{border: '2px solid currentColor', padding: '0.6rem 1rem', textAlign: 'center', flexShrink: 0, fontWeight: 700}}>
      Brain
    </div>
  </div>
  ...
</div>
```

## Chapter Title Format

Chapter titles in frontmatter include a descriptive subtitle, not just the number:

```markdown
title: "Chapter 1 — The worlds of bia (briah, yetsirah, asiya), their nature and expression in man."
```

The `_category_.json` label for each Shaar also includes a descriptive subtitle:

```json
{ "label": "Shaar 3 — Five levels of form: nefesh, ruakh, neshama, chaya, yehida (narnhai)." }
```

## Adding Illustrations

Charts and diagrams live in `static/img/illustrations/` and are shown on `docs/illustrations/charts.mdx`.

**To add new images:**
1. Place JPGs directly in `static/img/illustrations/`
2. For PDFs, convert using macOS built-in Quick Look (no install needed):
   ```bash
   qlmanage -t -s 2000 -o /tmp/output_dir /path/to/file.pdf
   # produces file.pdf.png in the output dir
   cp /tmp/output_dir/file.pdf.png static/img/illustrations/clean-name.png
   ```
3. Add a section to `docs/illustrations/charts.mdx` using the `<ProtectedImage>` component — do NOT use plain `![alt](src)` markdown:
   ```mdx
   ## Chart Title
   <ProtectedImage src="/img/illustrations/clean-name.png" alt="Chart Title" />
   ---
   ```

## Image Copyright Protection

All charts on the illustrations page are wrapped in `<ProtectedImage>` (`src/components/ProtectedImage.jsx`), which provides:

- **Right-click blocked** — `onContextMenu` on a transparent overlay intercepts the event, calls `e.preventDefault()`, and shows a copyright alert
- **Drag-to-save blocked** — `draggable={false}` on `<img>` and `-webkit-user-drag: none` / `pointer-events: none` in CSS
- **Copyright strip** — a dark translucent bar pinned to the bottom of every image reads "© All Rights Reserved — Leshem Shvo v'Achlama Translation"

**What it cannot prevent:** OS-level screenshots (Cmd+Shift+4, PrintScreen) and browser DevTools network downloads — these are impossible to block in any browser.

The gallery file is `.mdx` (not `.md`) so it can import and use the React component. Always keep it as `.mdx`.

## Search

Local search is provided by `@easyops-cn/docusaurus-search-local`. It builds a search index at deploy time — no external service or API key needed.

**Configuration** in `docusaurus.config.js` under `themes`:
```js
[
  require.resolve('@easyops-cn/docusaurus-search-local'),
  {
    hashed: true,
    language: ['en', 'he'],
    highlightSearchTermsOnTargetPage: true,
    explicitSearchResultPath: true,
    docsRouteBasePath: '/',
  },
]
```

Note: search only works on the production build (`npm run build` + `npm run serve`), not on the dev server (`npm start`).

## Deployment

- Push to GitHub → Vercel auto-deploys
- Build command: `npm run build`
- Output directory: `build`
- No environment variables needed

## Print PDF Generation (Amazon KDP)

`scripts/build-pdf.mjs` renders the whole site into print-ready PDFs for Amazon KDP print-on-demand, split into 2 volumes so each stays under KDP's 828-page paperback cap:

| File | Content | ~Pages |
|---|---|---|
| `book-vol1-gates-1-6.pdf` | About This Work + Shaar 1–6 | 530 |
| `book-vol2-gate-7.pdf` | Shaar 7 + Illustrations | 475 |

**Run it:**
```bash
npm run build          # production build first — the script reads static HTML from build/
node scripts/build-pdf.mjs
```

**How it works:** for each chapter/divider/title/copyright/TOC unit, it renders a standalone HTML document (site CSS + self-hosted fonts + print overrides) through Puppeteer's `page.pdf()` (6×9in, 0.65in margins), then stitches the resulting per-unit PDFs together per volume with `pdf-lib`, computing real TOC page numbers in a two-pass render (guess → measure → re-render) and stamping running page numbers after merge.

**Print density:** the site's web CSS (16-22px text, 1.85-2x line-height, browser-default ~1em paragraph gaps) is tuned for airy browser reading, not print — rendered near-verbatim it produces books at a small fraction of the source Word manuscript's density. `PRINT_CSS` in the script overrides this for print: ~10pt body/commentary text, ~12.5pt Hebrew, ~1.3x line-height, tight paragraph margins (0.25–0.35em). This alone cut total page count by ~28% (1389 → ~1007 pages for the whole work) with no loss of legibility. If more density is ever needed, prefer shrinking `PRINT_CSS` font-size/line-height/margins further or increasing the trim size in `PDF_OPTIONS` (6×9in → 7×10in gives ~30% more area per page for free) — both are safer levers than fighting the site's own cascade (see next gotcha).

**Known gotchas (don't redo this debugging):**
- **Don't try to override the `<Passage>` component's Hebrew block by targeting `div[dir="rtl"]`.** This was tried and made things *worse* — for reasons rooted in the site's own CSS cascade (not fully understood, but reproduced twice), the Passage Hebrew div already renders smaller under the print body-font override than any explicit override we tried forces it to. If Shaar 1 / Shaar 2 Ch1 (the `<Passage>`-based chapters) ever need further Hebrew-specific tuning, verify with a computed-style diff (`getComputedStyle` before/after) rather than assuming a smaller explicit value shrinks it — it may do the opposite.
- **Images must be inlined as base64 data URIs, not `file://` links.** Chromium silently fails to load `<img src="file://...">` from a `page.setContent()` document even though `file://` `<link>` stylesheets/fonts load fine — you'll get broken-image icons with no error. `rewriteAssetPaths()` in the script handles this.
- **Fonts are self-hosted in `scripts/fonts/`** (downloaded from Google Fonts, `fonts.css` rewritten to local `font-N.woff2` files) rather than linked live. The sandboxed environment this was built in couldn't complete `networkidle0` against the live Google Fonts URL (hung/timed out), even though plain `curl` to the same URL worked fine.
- Chapter content is extracted from the built HTML's `<div class="theme-doc-markdown markdown">` (`readBuiltPage()` keeps this wrapper div in the returned HTML) and must be wrapped in a bare `<article>` only — not another copy of that div — when re-rendered (`chapterHtml()`). Several custom.css rules (`article h1`, `article p[dir="rtl"]`, etc.) are scoped to an `article` ancestor and silently fall back to unstyled defaults without it.
- Chapter order / Shaar grouping / volume boundaries are hardcoded in the `SHAARS` and `VOLUMES` arrays at the top of the script — update both if you add a new Shaar or chapter.
- KDP's 828-page cap is a hard ceiling on a *single* print file — merging the whole 7-Gate work into one omnibus file isn't possible at 6×9in even at current density (~1001 pages combined). It only works for subsets that land under 828 (e.g. the current Gates 1–6 volume at 530).

**Before final KDP submission:**
- Replace the `COPYRIGHT_NAME` / `COPYRIGHT_YEAR` placeholders near the top of the script.
- Margins are currently a uniform 0.65in on all sides. KDP wants a larger inside/gutter margin that scales with final page count for perfect binding — tighten `PDF_OPTIONS.margin` per volume once page counts are final.
- KDP requires a separate cover PDF per volume (not generated by this script) — use KDP's Cover Calculator with each volume's trim size + exact page count.

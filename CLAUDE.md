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
| `docs/shaar-1/_category_.json` | Sidebar label for Shaar 1 |
| `docs/shaar-1/chapter-N.md` | Chapter content |

## How to Add a New Chapter

1. Create `docs/shaar-1/chapter-N.md` with frontmatter:
   ```markdown
   ---
   id: chapter-N
   title: "Chapter N: Title Here"
   sidebar_position: N
   ---
   ```
2. Paste chapter content (Hebrew paragraphs, bold English translation, commentary, footnotes)
3. `git add . && git commit -m "..." && git push` — Vercel deploys automatically

## How to Add a New Shaar (Gate)

1. Create folder `docs/shaar-N/`
2. Add `_category_.json`:
   ```json
   { "label": "Shaar N — Title", "position": N, "collapsible": false }
   ```
3. Add chapter files inside it

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

Source chapters arrive as `.rtf` files (e.g. from `~/Downloads/`). No pre-converted markdown exists — convert directly from RTF using the Python script below.

## Converting RTF Chapters to Markdown

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

## Deployment

- Push to GitHub → Vercel auto-deploys
- Build command: `npm run build`
- Output directory: `build`
- No environment variables needed

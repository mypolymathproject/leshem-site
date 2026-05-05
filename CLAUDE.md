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

Original Word document and converted Markdown are in the parent directory:
- `../word doc/` — original `.docx` files
- `../md file/` — Markdown conversions of the Word docs (source of truth for content)

## Deployment

- Push to GitHub → Vercel auto-deploys
- Build command: `npm run build`
- Output directory: `build`
- No environment variables needed

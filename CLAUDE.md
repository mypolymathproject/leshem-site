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

Hebrew/English bidirectionality is handled purely via CSS:

```css
.markdown p { unicode-bidi: plaintext; text-align: start; }
```

This means: a paragraph that starts with a Hebrew character renders RTL automatically; an English-first paragraph renders LTR. No `dir` attributes needed in the Markdown.

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

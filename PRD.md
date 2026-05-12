# PRD — Leshem Shvo v'Achlama Translation Website
**Version:** 1.5  
**Author:** Prasad Karunakaran  
**Date:** May 11, 2026  
**Status:** Live

---

## 1. Overview

A public-facing web publication of an annotated English translation of *Leshem Shvo v'Achlama* (ספר לשם שבו ואחלמה), the magnum opus of Rabbi Shlomo Elyashiv (the Baal haLeshem, 1841–1926). The work is a systematic exposition of Lurianic Kabbalah.

The site presents:
- The original **Hebrew source text**
- A close **English translation** (in bold)
- **Commentary and explanatory notes** for readers unfamiliar with Kabbalistic terminology
- **Footnotes** with primary sources (Zohar, Etz Chaim, Talmud, etc.)

The site is read-only — no login, no accounts. It is a scholarly reading experience optimised for desktop and mobile.

**Live URL:** https://leshem-site.vercel.app/

---

## 2. Goals

- Make this translation accessible to English-speaking readers interested in Kabbalah
- Preserve the integrity of the Hebrew original alongside the translation
- Provide clean, distraction-free reading suitable for study
- Allow the translator to add new chapters incrementally as they are completed
- Enable easy sharing of specific chapters or sections by URL

---

## 3. Content Structure

The book is divided into **Shaarim** (Gates), each subdivided into chapters.

```
Shaar 1 — The Names Havaye and Ad-nai
  Chapter 1–9                                                    ✓ live

Shaar 2 — Matter, Form, and the Chain of Worlds
  Chapter 1–2                                                    ✓ live

Shaar 3 — Five levels of form: nefesh, ruakh, neshama, chaya, yehida (narnhai).
          Only the first three are related to the body.
  Chapter 1: The worlds of bia, their nature and expression in man          ✓ live
  Chapter 2: Only the first 3 soul levels reside in the body                ✓ live
  Chapter 3: The generic nefesh and ruakh of bi"a are not Divine energy     ✓ live
  Chapter 4: Locations of nefesh, ruakh, neshama — brain, heart, liver      ✓ live
  Chapter 5: Each soul grouping exists within each of them                  ✓ live
  Chapter 6: Ruakh and nefesh intertwined from above via the neshama        ✓ live
  Chapter 7: How the five soul levels derive from the world of atsilut      ✓ live

Shaar 4 — Discussion of the first three levels of the Divine as related to us.
  Chapter 1: The narnhai leading to its final expression on the material plane ✓ live
  Chapter 2: Revelation of Divine Light via His Holy Names                     ✓ live
  Chapter 3: The first three levels of hitpashtut of Divine Light              ✓ live
  Chapter 4: The fourth level of hitpashtut — world of Atsilus                 ✓ live
  Chapter 5: The fifth level of revelation — worlds of Bi"a                    ✓ live
  Chapter 6: The division between the first three and the final two revelations ✓ live

Shaar 5 — The five general Divine revelations
  Chapter 1: Two varieties of the five revelations: one above the other and one within the other  ✓ live
  Chapter 2: Two aspects of illumination: the makif (transcendent) and the penimi (immanent)      ✓ live
  Chapter 3: The enclothing and overlapping of the heikhalot, physical bodies, and the neshama    ✓ live
  Chapter 4+: Pending
```

Each chapter file contains:
1. Hebrew paragraph
2. English translation (bold)
3. Commentary (regular text)
4. Footnotes (numbered, at bottom of page)

---

## 4. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Docusaurus 3 (React) | Static site generator ideal for book/doc-style content |
| Content | MDX (.mdx) | One file per chapter; chapters use `<Passage>` component or plain markdown |
| Components | `src/components/Passage.js` | Renders Hebrew / translation / commentary as a styled block |
| Remark plugin | `src/plugins/remark-hebrew-rtl.mjs` | Adds `dir="rtl"` to Hebrew-first paragraphs at build time |
| Root wrapper | `src/theme/Root.js` | Docusaurus root wrapper; injects the compact/spacious toggle button |
| Styling | Custom CSS with `oklch()` tokens | EB Garamond body, Cinzel display, Frank Ruhl Libre Hebrew; parchment light + midnight dark themes |
| Analytics | Google Analytics 4 (`G-8XJNSZMNEV`) | Via Docusaurus `gtag` preset option; `anonymizeIP: true` |
| Hosting | Vercel | Free tier, auto-deploys from GitHub |
| Source control | GitHub | Private repo (`mypolymathproject/leshem-site`) |

**Total infrastructure cost: $0** on free tiers.

---

## 5. Hebrew / Bidirectional Text

Hebrew and English appear in the same document. The rendering approach uses two layers:

**Remark plugin** (`src/plugins/remark-hebrew-rtl.mjs`): registered in `docusaurus.config.js` under `docs.remarkPlugins`. At build time it scans every markdown paragraph and adds `dir="rtl"` to any paragraph whose first character is Hebrew Unicode (U+0590–U+05FF). This gives the HTML element an explicit `dir` attribute.

**CSS** (`src/css/custom.css`): `article p[dir="rtl"]` matches those paragraphs and applies the Hebrew typography — Frank Ruhl Libre, 22px, weight 500, line-height 2 — identical to the `<Passage>` component's `.hebrew` class.

A base rule `unicode-bidi: plaintext; text-align: start` on `.markdown p` handles visual alignment for all paragraphs regardless of direction.

**Two authoring patterns for Hebrew text:**
- **`<Passage>` component** (Shaar 1, Shaar 2 Ch 1): Hebrew passed via `hebrew="..."` prop; component applies its own `dir="rtl"` and `.hebrew` styling.
- **Plain markdown** (Shaar 2 Ch 2 onward): Hebrew written as plain paragraph text; remark plugin adds `dir="rtl"` automatically; CSS applies matching styles.

Note: `:dir(rtl)` CSS pseudo-class does NOT work for this purpose — it is driven by the HTML `dir` attribute algorithm, not by the CSS `unicode-bidi` property.

---

## 6. Reading Mode Toggle (Compact / Spacious)

A floating **Compact / Spacious** toggle button is always visible in the bottom-right corner, allowing readers to switch between two typographic densities.

**How it works:**
- `src/theme/Root.js` — Docusaurus root wrapper that injects the floating button into every page
- Clicking the button toggles `data-reading="compact"` / `data-reading="normal"` on `<html>`
- State persists across page loads via `localStorage` key `leshem-compact`
- An **anti-flash inline script** in `docusaurus.config.js` `headTags` reads localStorage before first paint, preventing a flash of the wrong mode on reload

**Compact mode overrides** (in `Passage.module.css` using `:global([data-reading='compact']) .class`):

| Element | Spacious (default) | Compact |
|---|---|---|
| Passage margin-bottom | ~28px | 14px |
| Hebrew font-size | 22px | 19px |
| Hebrew line-height | 1.85 | 1.6 |
| Marker font-size | 11px | 10px |
| Translation line-height | 1.75 | 1.5 |
| Commentary font-size | 15px | 14px |
| Commentary line-height | 1.75 | 1.65 |
| Border-left | 2px solid gold | 1px solid gold (45% opacity) |

**Global body overrides** (in `custom.css`):
- `[data-reading='compact'] body` → `line-height: 1.65`
- `[data-reading='compact'] article p` → `line-height: 1.7`

**Button styles** (`.leshem-density-btn` in `custom.css`): fixed bottom-right, Cinzel font, gold border and hover, blends into the parchment theme.

---

## 7. Adding New Content

To add a new chapter:

1. Create a new `.mdx` file in the appropriate `docs/shaar-N/` folder
2. Add frontmatter: `id`, `title`, `sidebar_position`
3. Add `import { Passage } from '@site/src/components/Passage';` at the top
4. Wrap each Hebrew/translation/commentary triplet in a `<Passage>` component
5. Commit and push — Vercel auto-deploys

Example passage block:
```mdx
<Passage
  marker="§ 1:1"
  hebrew="יְסוֹד הַחְכָּמָה"
  translation="The foundation of wisdom"
>
Commentary text here in italic.
</Passage>
```

**Note:** Hebrew abbreviations using `"` (gershayim) must be written as `״` (U+05F4) to avoid MDX parse errors.

To add a new Shaar (Gate):

1. Create a new folder `docs/shaar-N/`
2. Add `_category_.json` with the label and position
3. Add chapter files inside it

The sidebar is **auto-generated** from the folder structure — no manual sidebar config needed.

**JSX attribute gotcha:** Never use `\"` (backslash-escaped quotes) inside double-quoted JSX attribute strings — use `&quot;` instead. Similarly, Hebrew gershayim must be `״` (U+05F4), never ASCII `"`.

---

## 8. Site Structure

```
leshem-site/
├── docs/
│   ├── intro.mdx              ← About page / hero (serves at /)
│   ├── shaar-1/               ← 9 chapters ✓
│   ├── shaar-2/               ← 2 chapters ✓
│   ├── shaar-3/               ← 7 chapters ✓
│   ├── shaar-4/               ← 6 chapters ✓
│   ├── shaar-5/               ← 3 chapters ✓ (ongoing)
│   └── illustrations/
│       ├── _category_.json    ← Sidebar label: "Illustrations", position 7
│       └── charts.md          ← Gallery of all 17 charts (inline images)
├── src/
│   ├── components/
│   │   ├── Passage.js         ← MDX component: Hebrew + translation + commentary block
│   │   └── Passage.module.css ← Scoped styles for Passage (includes compact mode overrides)
│   ├── plugins/
│   │   └── remark-hebrew-rtl.mjs ← Adds dir="rtl" to Hebrew-first paragraphs at build time
│   ├── theme/
│   │   └── Root.js            ← Docusaurus root wrapper; injects compact/spacious toggle button
│   └── css/custom.css         ← oklch() color tokens, typography, Hebrew RTL, toggle button styles
├── docusaurus.config.js       ← Site title, Google Fonts, anti-flash script, GA4, navbar, footer
├── sidebars.js                ← Auto-generated from folder structure
└── static/
    ├── img/illustrations/     ← 17 chart images (PNG converted from PDF via qlmanage, + 2 original JPGs)
    └── ...                    ← Favicon, other images
```

---

## 9. Design

**Visual theme:** Scholarly parchment aesthetic — warm off-white background, gold accents, no rounded corners.

| Element | Specification |
|---|---|
| Body / commentary | EB Garamond, 17.5px, line-height 1.85 |
| Display / headings / nav | Cinzel (all-caps, wide letter-spacing) |
| Hebrew source text | Frank Ruhl Libre, 22px, `dir="rtl"` |
| Color system | `oklch()` tokens — parchment light theme, midnight dark theme |
| Background | `oklch(96.5% 0.012 80)` — warm off-white parchment |
| Accent | Gold (`oklch(62% 0.10 75)`) — used for markers, borders, CTAs |
| Max content width | 68ch for body text |
| Dark mode | Supported — midnight blue palette, respects system preference |
| Mobile | Responsive by default via Docusaurus/Infima |

**Passage layout** (per chapter paragraph):
1. Hebrew source block — right-aligned, Frank Ruhl Libre, gold bottom border
2. Gold section marker (§ X:Y) in Cinzel
3. Bold English translation — EB Garamond 700
4. Italic commentary — slightly muted, parchment card background

---

## 10. Monetization

A **Support / Donate button** has been added to the navbar (top right). It currently links to a placeholder URL — replace `href` in `docusaurus.config.js` with the actual platform URL once set up.

Recommended platforms:
| Platform | Fees | Best for |
|---|---|---|
| Ko-fi | 0% (free tier) | Simple one-off donations |
| Buy Me a Coffee | 5% | Simple one-off donations |
| Patreon | 8–12% | Recurring supporters + perks |
| Stripe | 2.9% + 30¢ | Most professional, lowest fees |

To update the URL: edit `docusaurus.config.js`, find the `href: 'https://ko-fi.com'` line in the navbar items, and replace with the actual URL.

---

## 11. Analytics

Google Analytics 4 is configured via the Docusaurus `gtag` preset option.

- **Measurement ID:** `G-8XJNSZMNEV`
- `anonymizeIP: true` is set
- No additional plugin install required — `@docusaurus/plugin-google-gtag` is bundled with the classic preset
- Tracks page views automatically on every route change (SPA-aware)

---

## 12. Future Enhancements

| Feature | Priority | Notes |
|---|---|---|
| Shaar 5 remaining chapters | High | Source files to be provided by translator |
| Search | ~~High~~ | ✓ Live — `@easyops-cn/docusaurus-search-local`, Hebrew + English, index built at deploy time |
| Illustrations section | ~~High~~ | ✓ Live — 17 charts at `/illustrations/charts` |
| Descriptive chapter titles | ~~High~~ | ✓ Done — all Shaar 3 and 4 chapters titled |
| Glossary page | Medium | Kabbalistic terms (Atzilut, tzimtzum, sefirot, etc.) |
| Cross-references | Medium | Link from commentary to glossary or other chapters |
| Print-friendly CSS | Low | For those who want to print chapters |
| Custom favicon | Low | Replace default Docusaurus icon |
| Social card image | Low | For link previews (og:image) |

---

*End of PRD v1.5 — Leshem Shvo v'Achlama Translation Site*

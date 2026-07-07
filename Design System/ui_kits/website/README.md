# Jonathan Pay — Website UI Kit

A pixel-disciplined recreation of [jonathanpay.com](https://jonathanpay.com), the personal website. Built as a click-through prototype with reusable JSX components.

## Run

Open `index.html` in any browser. The prototype:

- Lands on the homepage with the navy header, cover hero, and a list of recent posts
- Lets you click a category chip (Faith / Fun / Life / Work) to filter
- Lets you click a post to open the article view (with pull-quote, links, blockquote, etc.)
- Lets you submit the newsletter form at the bottom (mock — logs to console)
- Header click returns home

## Components (all in this folder)

| File | What it is |
|---|---|
| `Header.jsx` | Navy bar with JP gold mark, "Jonathan Pay" wordmark, and nav |
| `Hero.jsx` | Full-bleed cover image with navy overlay, italic heading, tagline |
| `CategoryChips.jsx` | Faith / Fun / Life / Work chips, click to filter |
| `PostList.jsx` | Stacked list of `PostCard`s with hairline rules between |
| `PostCard.jsx` | Meta line + italic title + dek |
| `PostBody.jsx` | Article body with pull-quote, blockquote, and inline links |
| `Newsletter.jsx` | Subscribe form (navy ground, gold button) |
| `Footer.jsx` | Navy footer with social glyphs, bio tagline, copyright |
| `data.js` | Mock posts (titles, dates, categories, body fragments) |
| `app.jsx` | Composes the kit into an interactive single-page experience |

## Substitutions

- **Cover photography** is a CSS gradient placeholder in navy tones. The real site uses Jon's personal photography. Drop a real image into `hero-cover` if you have one.
- **Social glyphs** use [Lucide](https://lucide.dev) via CDN at 18px stroke 1.75 — substituted for the unknown originals.
- **Open Sans** loads from Google Fonts.

If the original WordPress theme's CSS or SVG sprite becomes available, I can swap both above for exact fidelity.

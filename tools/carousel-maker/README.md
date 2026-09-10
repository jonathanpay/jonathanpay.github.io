# Carousel Maker

Jon's browser tool for designing and exporting social carousels. Everything is
client-side; opened at `https://jonathanpay.github.io/tools/carousel-maker/`.

## Files

| File | Role |
|---|---|
| `index.html` | Shell; loads html2canvas/html2pdf, then `templates.js` → `families.js` → `app.js` |
| `templates.js` | Engine: built-in layout families, layouts, field defs, custom-family registration |
| `templates.css` | Engine styles (built-in families + the `.cstm` generic custom-family block) |
| `app.js` | UI: pickers, editor, import/export, share links, localStorage persistence |
| `families.js` | Stock (repo-shipped) custom-style families — see below |
| `assets/` | Icons and static assets |

## Layouts

Eleven layouts, available to every family: `cover`, `cover-image`, `stat`,
`tip`, `list`, `quote`, `compare`, `case`, `image`, `author`, `cta`.

`cover-image` (Cover + Image) is a cover with a feature image between the
top row and the headline. Fields: `eyebrow`, `headline`, `sub`, `photoUrl` —
same as `cover` plus the image. With no `photoUrl` it renders the family's
own placeholder block, so slides look right before the photo is chosen.

## Two kinds of family

**Built-in families** (`jp-editorial`, `jp-magazine`, `hea-clean`, `hea-shapes`)
have their own CSS-bound layouts and ship in the repo.

**Custom-style families** render on the generic `.cstm` engine: two font
families plus per-theme colour roles (`bg`, `bgAlt`, `text`, `textMuted`,
`accent`, `accentText`, `rule`, `swatch`). Imported via the app's
Import-template modal, they persist in **browser localStorage**
(`carouselMaker_customTemplates`) — per browser and per machine, lost on site-data
clear, and not present on other devices.

## Stock families (`families.js`)

Stock families are custom-style families that ship with the tool instead of
living only in localStorage, registered at load. `families.js` runs after
`templates.js` and registers each entry via
`window.CarouselTemplates.registerCustomFamily(cfg)`, re-registering on
`window.load` so a stale localStorage copy of the same id can never override
the repo version.

To add one, append its cfg (identical in shape to the app's Import-template
JSON) to `CAROUSEL_STOCK_FAMILIES`.

Currently shipped:

- **LTSL — Brand** (`ltsl-brand`) — *Living the Scandalous Life* publication
  brand: themes `paper` / `mend` / `navy` (navy `#1E1B4B`, gold mend
  `#D9BA45`, paper `#FAFAFA`), Bebas Neue caps headings with Barlow Condensed
  as the web-loaded fallback, Inter body. Mirrors the deck spec
  `Sermon Deck — Visual Style Specification (LTSL Brand)`.

### Engine notes for family authors

- Headings are forced to `font-weight: 800/900`. Single-weight faces (e.g.
  Bebas Neue) render as synthesised bold — visible and acceptable at carousel
  sizes, but choose fallbacks deliberately (Impact reads very differently from
  Bebas; a condensed web font is a closer second).
- The generic engine has no italic slot: a family cannot render an italic
  face. Serif presence is only possible as an upright heading/body font.
- Eyebrows and kickers are auto-uppercased; plain headlines keep their case —
  caps-only faces need copy typed in caps.

# Jonathan Pay — Design System

A personal brand design system for **Jonathan Pay** — email marketer, writer, board-game and RPG enthusiast, stroke survivor; "the world's first second-generation email marketer." Reverse-engineered from [jonathanpay.com](https://jonathanpay.com) (March 2026 audit) and a deep voice-and-tone guide.

This system covers the personal website and brand identity. It is a **single voice across personal and professional registers** — faith, family, work, and hobbies all sit under the same name, type, and palette.

---

## Sources

Everything in this system was distilled from:

- `uploads/jonathan-pay-brand-guidelines.md` — visual audit of jonathanpay.com (palette, type, layout)
- `uploads/Jon Pay — Personal Brand Voice Guidelines 1.md` — tone-of-voice and writing style (528 lines, v4)
- `uploads/jp-logos.zip` — three logo PNGs (now extracted to `assets/logos/`)
- Live site: <https://jonathanpay.com> — WordPress, Open Sans, navy + gold, four blog categories: Faith / Fun / Life / Work
- Alternate landing page: <https://github.com/jonathanpay/jonathanpay.github.io> — lighter, hand-rolled HTML/CSS. Source of the **image-overlay card** pattern (`.jp-image-card`) now in the system.

No codebase or Figma was attached; visual primitives are reverse-engineered from the audit, not inspected in source. If you have access to the site's WordPress theme or original Figma file, attaching either would let me refine the spacing/spacing scale and component edge cases beyond what the audit documents.

---

## Index — what's in this folder

```
/
├── README.md                  ← you are here
├── SKILL.md                   ← Agent-Skills-compatible entrypoint
├── colors_and_type.css        ← Base + semantic CSS variables, element defaults
├── assets/
│   ├── logos/
│   │   ├── jp-logo-fullname-2016.png       (navy wordmark)
│   │   ├── jp-logo-initials-2016.png       (JP navy on white)
│   │   └── jp-logo-initials-2016-gold.png  (JP gold on white — for navy backgrounds)
│   └── photos/                             (sample personal photography for image-overlay cards)
├── preview/                   ← Design System tab cards (typography, colors, components)
└── ui_kits/
    └── website/               ← jonathanpay.com recreation
        ├── README.md
        ├── index.html         ← interactive homepage + post + categories
        ├── Header.jsx, Hero.jsx, PostCard.jsx, PostBody.jsx, Footer.jsx …
        └── ImageOverlayCard.jsx  ← photo-background card primitive (from jonathanpay.github.io)
```

No `fonts/` folder: the system uses **Open Sans** loaded from Google Fonts (`@import` in `colors_and_type.css`). The site itself loads it the same way. If you'd prefer self-hosted woff2s, swap the `@import` and drop files into a `fonts/` directory.

---

## 01 — Brand at a glance

- **Name**: Jonathan Pay
- **Core claim**: *"The world's first second-generation email marketer"* — memorable, slightly wry, verifiable
- **Bio tagline (as it appears on site)**:

  > Christian. Husband. Father. Feminist, increasingly socialist, always anti-fascist. Antipodean immigrant in UK. Cinephile. Jack-of-all email marketing trades. Board game & RPG enthusiast. Stroke survivor.

  The ordering matters: faith, family, and values come *before* professional credentials. This is not alphabetical — it's a deliberate statement about identity hierarchy.
- **Categories** (blog taxonomy): Faith / Fun / Life / Work — alphabetical, but the word choices ("Work" not "Professional", "Fun" not "Hobbies") signal the brand's informality
- **Archetype**: *The Expert Friend* — someone who knows more than you about their specific thing, and tells you what they actually think rather than what's safe to say

---

## 02 — Content fundamentals (voice & tone)

The most important structural rule for Jon's writing is the **articles vs posts** distinction. They are not interchangeable. Treating them as one flattens both.

| | **Articles** | **Posts** (LinkedIn, Bluesky, Substack Notes, blog) |
|---|---|---|
| Mode | Composed & authoritative | Thinking happening in public |
| Self-correction | Resolve before publishing | Preserve as texture |
| Endings | Resolved | Open observation, can trail off |
| Voice | Same Jon — grounded, direct, human | Same Jon — looser, mid-thought |

### Voice qualities

- **Grounded** — every claim anchored in a specific memory, named example, number, or situation. No floating generalisations.
- **Direct** — commit to the point. Shortest path. Active voice. Declarative sentences.
- **Witty when it fits** — the joke arrives **inside** the thought, not announced. "Well, except for the rogue, who ignored every plan." The wit is tucked into the closing clause, never set up.
- **Reflective** — willing to sit with complexity. Refuses to wrap everything in a tidy moral. Self-correction is technique, not error.
- **Authoritative through specificity** — credentials shown via origin story ("my mum ran one of Australia's first email service providers") and timeline ("I've worked in email since before Gmail existed. Literally."), never CV-first signalling.

### Person, pronouns, casing, register

- **First person throughout** ("I", not "we" — unless the experience is genuinely shared)
- **You** is fine in articles; never assume reader agreement
- **British English** spelling — *colour, organisation, realised, behaviour*
- **Oxford comma always**
- **Contractions welcome**
- **Italics for emphasis only**, never bold. (Bold is reserved for headings, which are *always* italic too — see Typography.)
- **No em-dashes for breaks** — use commas or parentheses instead. This is unusual but consistent across the guidelines.
- **No emoji** in articles. Sparingly on LinkedIn only, for tone balance.
- **No unicode-art** or decorative typography. The voice doesn't need garnish.

### Sentence rhythm

- Short declarative sentences as the default
- Fragments allowed for **rhythm and emphasis**, not drama
- Vary sentence length deliberately — short for emphasis, longer for nuance
- Parenthetical asides that feel **occurred-to**, not allocated
- **"Stop one sentence sooner."** The natural endpoint almost always arrives before the actual endpoint

### Connective movements (use these instead of "moreover/furthermore")

Yet… · Except… · Which is where… · Then suddenly… · And honestly… · Actually… · Which is a different thing entirely.

### What the voice doesn't do

- Bullet points in post content (allowed in long-form articles only)
- Tidy moral or slogan endings
- Hedge with "perhaps" or "arguably" without cause
- Inflate credentials with buzzwords
- Separate personal identity from professional identity

### Banned phrases & LLM-tells (high-confidence cut list)

`quiet [emotion]` constructions · `journey` (unless literal) · `in today's world…` · `let's dive in` · `at the end of the day` · `now more than ever` · `delve into / deep dive` · `it's worth noting` · `bear in mind` (as opener) · `let that sink in` · `crucial / pivotal / notable / significantly` as filler · `underscore` as a verb · `vibrant / nestled / showcasing` · `serves as` where `is` would do · `not just X, but also Y` · `It's not X, it's Y` · Rule-of-three lists by default · Decorative `-ing` participial clauses (`"…making this a pivotal moment for the industry"`)

### Characteristic samples (use these as the calibration set)

> "Permission-based email honours that. Yes, it's slower to build and more work to maintain. But the list is yours, because people added themselves to it, giving you access to their inbox, and that relationship is more durable than it might sound."

> "I used to think I was an extrovert. Back in uni, I was always the first to suggest a trip to the pub or a game night. Fast forward a few years, add a full-time job, a kid, and a stroke, and suddenly I realised… maybe I just liked having energy."

> "You can look completely fine whilst your brain and body are doing something entirely different. This is roughly how I see every day. Everything, twice and wonky. Six years on, still here, and grateful."

> "LLMs don't think. They predict. That distinction matters more than most people realise."

---

## 03 — Visual foundations

The system is restrained on purpose. Two colours do almost all the work; one type family does all of it.

### Colour

| Token | Hex | Role |
|---|---|---|
| Navy | `#2c3d50` | Header, footer, cover overlay. The dominant structural colour. |
| Mid Navy | `#39536f` | Borders and dividers within dark header/footer zones. |
| Muted Navy | `#aab3bf` | De-emphasised text on navy (tagline, widget text). |
| Highlight Gold | `#dfb81f` | Nav links, social icons, pull-quotes. Active highlight on dark. |
| Link Gold | `#8b7417` | Body links, buttons, accents on white. The workhorse accent. |
| White | `#ffffff` | Page background. Content canvas. |
| Black | `#000000` | Primary body text. **No softening to dark grey.** |
| Mid Grey | `#6d6d6d` | Post meta, captions, secondary info. |
| Light Grey | `#dbdbdb` | Subtle backgrounds, table stripes, rule lines. |

**Hierarchy in plain English:** navy structures, gold highlights, white breathes. Both golds are warm and slightly aged rather than sharp or corporate. The bright gold (`#dfb81f`) goes on navy; the deeper gold (`#8b7417`) is the body-link colour on white. Don't mix them: the bright gold has poor contrast on white, the deep gold disappears on navy.

### Typography

- **Single family**: Open Sans (Google Fonts).
- **All headings are Bold Italic** — H1 through H6, plus buttons. This is the defining typographic choice. Differentiation is by weight, style, and size only. No second family.
- **Body** is Regular 21px, line-height ~1.7 — generous and readable.
- **Meta** (dates, captions, categories) is 13px in `--jp-mid-grey`.
- **Italic for emphasis** in body copy. Italic + bold for headings. Never plain bold.

If the system ever needs to expand — featured content, pull quotes, a newsletter archive — a complementary serif would add depth without breaking the existing system. **It is currently a single-family system by design.**

### Layout & structure

- **Navy header + footer frame every page.** They are persistent, not transparent, not sticky.
- **Full-bleed cover image on homepage** with a navy overlay at ~45–55% opacity. Personal photography, not stock.
- **White content area** is unadorned — no sidebar on blog posts. The post is the page.
- **Sharp corners.** The site uses `border-radius: 0` almost everywhere. Where rounding appears, it's hairline (2px) on form controls. The system intentionally avoids the soft-rounded SaaS look.
- **No drop shadows** in the live site itself. Cards are flat — separated by whitespace, light-grey rules, or a coloured background block. (Tokens `--shadow-soft` and `--shadow-card` are provided for prototyping needs but should be used sparingly.)
- **Wide line-height (1.7)** is the dominant spacing decision. Everything else breathes around it.

### Spacing

Multiples of 4px. The site itself is generous: section padding is typically 48–64px on desktop, 24–32px on mobile. Tokens: `--space-1` through `--space-9` (4, 8, 12, 16, 24, 32, 48, 64, 96).

### Borders & dividers

- 1px solid `--jp-light-grey` for content rules
- 1px solid `--jp-mid-navy` for dividers inside dark zones
- 3px solid `--jp-highlight-gold` for left-rule on blockquotes / pull-quotes

### Backgrounds & imagery

- **Imagery is personal.** Reverse-engineered cover image on the homepage uses Jon's own photography — warm-leaning, not stock-cool.
- **No repeating patterns, no textures, no illustrated motifs.** The site has none.
- **Photography under cards.** The image-overlay card pattern (see Cards, above) is the second sanctioned home for photography — backgrounded under a navy gradient so the text still wins.
- **No gradients** other than the navy overlays sitting over hero and card photography.
- The brand's "texture" comes from typography (italic headings) and copy, not from background graphics.

### Animation & interaction

- **Minimal motion.** The reference site does not animate beyond default browser link behaviour.
- **Link hover**: underline appears. No colour shift. Same gold, plus an underline.
- **Nav link hover (on navy)**: colour stays gold; cursor change is the affordance.
- **Button hover**: background fills with the accent colour, label flips to white. Quick (120ms ease).
- **Press states**: no shrink, no scale; the colour swap is the affordance.
- **No bouncing, easing-out animations, or scroll-triggered reveals.** Adding them would feel out of register.

### Use of transparency & blur

- Transparency is used in **one place**: the navy overlay on cover photography (~45–55% navy over the image). No glassmorphism, no backdrop-filter blur.

### Corner radii

- **0px almost everywhere.** Sharp.
- 2px hairline rounding on form controls is acceptable if needed.
- Pills (`--radius-pill`) reserved for tag chips in the UI kit recreation; not present on the live site.

### Cards

Two card patterns live in the system, used for different jobs:

**1. Editorial card (post / project tile)** — the dominant pattern on jonathanpay.com.
- Flat. No shadow. 1px `--jp-light-grey` rule on white, or sat directly on navy separated by spacing.
- Heading: Bold Italic. Meta line: 13px mid-grey. Body: 21px regular.

**2. Image-overlay card** (`.jp-image-card`) — lifted from [jonathanpay.github.io](https://github.com/jonathanpay/jonathanpay.github.io), the lighter alternate landing page. Use it when a card needs to do real visual work — a "Work" tile, a project showcase, a feature link.
- **Personal photography as the background.** Stock photos cheapen the brand; this card depends on Jon's own imagery to read right.
- **Navy gradient overlay** on top (`--jp-card-overlay`): 92% navy at the bottom, fading to 35% at the top. Hover deepens to 97/50%.
- **Content bottom-anchored.** Eyebrow in `--jp-highlight-gold`, 12px uppercase, 0.06em tracked. Title in Bold Italic white. Optional 15px white dek.
- **Slight rounding** — 6px (`--radius-2`), not sharp. This is the one place the brand softens corners, because the photo edge wants a bit of give. Don't propagate this radius elsewhere.
- Component: `ui_kits/website/ImageOverlayCard.jsx`. Preview: `preview/image-card.html`. Reference photos: `assets/photos/`.

### Layout rules (fixed elements)

- Header is non-sticky on the reference site. (Sticky is a reasonable accessibility upgrade; not required for brand fidelity.)
- Footer is full-width navy with a 1px mid-navy top border.

---

## 04 — Iconography

The reference site is **almost iconography-free.** This is a real brand trait, not an omission.

- **No built-in icon font** is used on the live site.
- **Social icons** in the footer are small filled glyphs in Highlight Gold on Navy — the only place icons appear.
- **No emoji** in editorial content, in posts, or in headings. Sparing emoji use is allowed on LinkedIn for tone balance only.
- **No unicode characters as decorative icons** (no ›, ▸, ★, ✓ for bullets or list markers). Lists use plain dots; chevrons in nav are not used.
- **No iconography on buttons.** Buttons are Bold Italic text, full stop. No leading icon, no trailing arrow.

### Substitution flag

The original site's social glyphs are not in the upload zip. For the UI kit, I'm using **[Lucide](https://lucide.dev)** icons via CDN at 18–20px stroke weight 1.75, recoloured to `--jp-highlight-gold` for footer social, and `--jp-link-gold` for any in-content use. This is a **substitution** and should be flagged if a higher-fidelity recreation is needed — request the original WordPress theme's SVG sprites if so.

### Where to add iconography (and where not to)

- **OK**: footer social row, post category chips (very small dot or pill, no glyph), share buttons
- **Not OK**: headings, hero, nav, body links, button labels
- If unsure, **don't add an icon.** The brand reads as more itself without one.

---

## 05 — How to use this system

1. Import `colors_and_type.css` for tokens, element defaults, and `.btn` classes.
2. Pull logos from `assets/logos/` — pick the navy-on-white initials for light contexts and the gold-on-navy initials for dark.
3. Read the **Content fundamentals** section above before writing any copy. If you're about to write a heading: it's Bold Italic. If you're about to start a post with "In today's fast-paced world", stop.
4. Use the `ui_kits/website/` recreation as the visual baseline for any new page. Open `ui_kits/website/index.html` to interact with it.
5. Check the cards in the Design System tab — every token, type spec, and component preview is there.

---

## 06 — Open questions / things to confirm

- **Cover photography**: I don't have access to Jon's personal photo library. The UI kit uses a placeholder slot in the right shape and overlay; please drop a real photo in.
- **Original WordPress theme**: getting the live CSS would let me tighten the spacing scale (currently inferred) and capture exact form-control styles.
- **Holistic Email Marketing / Holistic Email Academy**: the voice guide mentions these as separate products. They are out of scope for this system unless you'd like a separate folder for them.
- **Font hosting**: Open Sans is loaded from Google Fonts. If you'd like to self-host woff2s, ask and I'll wire it up.

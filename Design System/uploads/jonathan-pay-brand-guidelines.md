---
title: Jonathan Pay – Personal Brand Guidelines
type: reference
tags: [brand, personal, design, tone-of-voice, jonathanpay-com]
created: 2026-03-26
source: reverse-engineered from jonathanpay.com
status: active
---
# Jonathan Pay – Personal Brand Guidelines

Reverse-engineered from jonathanpay.com, March 2026. This is a descriptive audit of what the site currently does, not a prescriptive ideal. Gaps and recommendations are noted separately.

---

## 01 – Positioning

**Core claim:** "The world's first second-generation email marketer"

Memorable, slightly wry, verifiable. Makes a claim that's both specific and a little absurd — characteristic of the voice throughout the site.

**Bio tagline (as it appears on site):**

> Christian. Husband. Father. Feminist, increasingly socialist, always anti-fascist. Antipodean immigrant in UK. Cinephile. Jack-of-all email marketing trades. Board game & RPG enthusiast. Stroke survivor.

The ordering is significant. Professional credentials appear near the end of a list that starts with faith, family, and values. This is not alphabetical — it's a deliberate statement about identity hierarchy.

**Positioning approach:** Narrative over claim. The site establishes authority through origin story ("my mum ran one of Australia's first email service providers") and specific detail ("I've worked in email since before Gmail existed. Literally.") rather than credentials-first signalling.

---

## 02 – Colour Palette

Two golds exist in the codebase. They are not formally named but serve distinct roles.

| Name (suggested)      | Hex       | Role                                                                        |
| --------------------- | --------- | --------------------------------------------------------------------------- |
| Highlight Gold        | `#dfb81f` | Nav links, social icons, pull-quotes. Active highlight on dark backgrounds. |
| Link Gold / Deep Gold | `#8b7417` | Body links, buttons, accent colour on white. The workhorse accent.          |
| Navy                  | `#2c3d50` | Header, footer, cover overlay. Dominant structural colour.                  |
| Mid Navy              | `#39536f` | Borders and dividers within the dark header/footer zone.                    |
| Muted Navy            | `#aab3bf` | De-emphasised text within the dark header zone (e.g. tagline, widget text). |
| White                 | `#ffffff` | Page background. Content canvas.                                            |
| Black                 | `#000000` | Primary body text. No softening to dark grey in the main copy.              |
| Mid Grey              | `#6d6d6d` | Post meta, captions, secondary information.                                 |
| Light Grey            | `#dbdbdb` | Subtle backgrounds, table stripes, rule lines in content.                   |

**Notes:**
- The palette hierarchy is clear: navy structures, gold highlights, white breathes.
- Both golds are warm and slightly aged rather than sharp or corporate.
- The logo mark uses Highlight Gold (`#dfb81f`) on navy.
- The `#8b7417` accent is used for in-content links and buttons — it reads as more considered and less high-contrast on white than the brighter gold.

---

## 03 – Typography

**Typeface:** Open Sans (Google Fonts) — used exclusively across the site.

| Role | Style | Size | Notes |
|---|---|---|---|
| H1 | Bold Italic | 26px+ | The defining typographic choice. All headings are italic. |
| H2 | Bold Italic | ~20px | Same style as H1, reduced scale. |
| H3–H6 | Bold Italic | Scaled down | Consistent italic treatment throughout. |
| Body | Regular | 21px | Line-height ~1.7. Generous and readable. |
| Body (inputs) | Regular | 16px | Forms and interface elements. |
| Links | Regular | Inherited | Colour `#8b7417`. Underlined on hover. |
| Meta / Secondary | Regular | 13px | Colour `#6d6d6d`. Dates, categories, captions. |
| Buttons | Bold Italic | Inherited | Italic applied to UI elements too — consistent with heading treatment. |

**Key observation:** The most distinctive typographic choice is that *all headings are Open Sans Bold Italic* — not just bold. The italic gives headings a forward-leaning, slightly editorial quality without introducing a second typeface. The body stays in the same family at regular weight. Single-font system, differentiated entirely by weight, style, and size.

This leaves limited typographic range if the site ever needs to expand expressively. A complementary serif for pull quotes or featured content would add depth without breaking the system.

---

## 04 – Logo & Identity Mark

The logo is a "JP" initials mark — Open Sans Bold Italic, rendered in two configurations:

- **Highlight Gold on Navy** (`#dfb81f` on `#2c3d50`) — used in header, favicon, touch icons
- **Navy on Highlight Gold** (`#2c3d50` on `#dfb81f`) — reversed version for light contexts

No wordmark or strapline currently appears alongside the mark in the header. The site title "Jonathan Pay" appears as a text element separate from the logo image.

---

## 05 – Visual Structure & Layout

- Full-bleed cover image on homepage with a navy overlay at ~45% opacity. Personal photography rather than stock.
- Dark navy header and footer frame every page.
- Gold nav links on dark ground.
- White content area — clean, unadorned. No sidebar on blog posts.
- Blog category taxonomy: **Faith / Fun / Life / Work** — alphabetical, but the word choices (casual and human rather than polished) signal the brand's informality. "Work" rather than "Professional." "Fun" rather than "Hobbies."

---

## 06 – Tone of Voice

### Core qualities (observed from site copy)

**Earned authority.** Credentials established through specificity and timeline, not a CV-first approach. Origin stories carry more weight than titles.

**Analogical thinking.** Extended metaphors do real argumentative work. The crows/birdsong metaphor in the CAWing post is the structural spine of the whole argument — analogy as architecture, not decoration.

**Wry confidence.** "The obituaries keep getting written. The channel keeps living." Short sentences. Resigned and certain simultaneously. Humour embedded in observation rather than announced.

**Thinking out loud.** "Which is a different thing entirely." Self-corrections mid-essay. The writing catches itself and refines. Intentional texture — feels like arriving at something rather than delivering a conclusion already reached.

**Concessive structure.** "Yes, it's slower to build and more work to maintain. But..." Acknowledges counterarguments without weakening the central claim.

### The voice does

- First person throughout
- Short declarative sentences as the default
- Fragments used for rhythm and emphasis
- Parenthetical asides that feel spontaneous, not placed
- Extended metaphor resolved into principle
- Ends posts on an observation, not a summary or tagline

### The voice doesn't

- Use bullet points in post content
- Close with a tidy moral or slogan
- Hedge with "perhaps" or "arguably" without cause
- Inflate credentials with buzzwords
- Separate personal identity from professional identity

### Characteristic sample

> "Permission-based email honours that. Yes, it's slower to build and more work to maintain. But the list is yours, because people added themselves to it, giving you access to their inbox, and that relationship is more durable than it might sound."

> "Which is a different thing entirely. Though I'll admit, I was already swimming in the same warm water when I started noticing the temperature."

---

## 07 – Platform Signals

The blog categories (Faith / Fun / Life / Work) tell you something about the intended scope. This is a personal site that happens to have professional content, rather than a professional site that occasionally gets personal. That distinction shapes tone, structure, and what counts as on-brand.

The site does not use a persistent descriptor or strapline beyond the name. This means the positioning relies entirely on the homepage and the writing to orient a new visitor — which works if they arrive via the homepage, but leaves a gap for post-entry via search or social share.

---

## 08 – Gaps & Recommendations

### Two golds in the codebase

`#dfb81f` and `#8b7417` are both actively used but not formally distinguished. Naming them explicitly ("Highlight Gold" vs "Link Gold") would clarify the system and prevent drift.

### No persistent descriptor for cold visitors

A reader arriving on a post directly has a name and a logo. Nothing more. Two low-effort fixes:

1. **Site tagline in the header** (Settings → General in WordPress). One line under the name — e.g. "Email marketer. Writer. Weston-super-Mare." — visible on every page entry point without competing with the nav.

2. **Title tag suffix** (via Yoast / Rank Math / Jetpack SEO). Changing the site-level suffix from "Jonathan Pay" to "Jonathan Pay, email marketer & writer" affects every post's search result and link preview automatically. One setting, site-wide.

An author blurb at the end of posts is a secondary reinforcement, not a primary fix — it requires finishing the post first. Worth adding if the above two are in place, but keep it short and first-person. The current Gravatar bio ("With over 18 years of experience...") is too CV-ish for the voice of the site.

### Typography range

The bold italic single-family system works well at current scope. If the site expands — featured content, pull quotes, a newsletter archive — a complementary serif face would add depth without breaking the existing system.

---

*Audit conducted by Claude (Anthropic) based on live site inspection of jonathanpay.com, March 2026.*

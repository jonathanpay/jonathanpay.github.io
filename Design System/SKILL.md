---
name: jonathan-pay-design
description: Use this skill to generate well-branded interfaces and assets for Jonathan Pay (jonathanpay.com), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

The system covers Jonathan Pay's personal brand: email marketer, writer, board-game and RPG enthusiast, stroke survivor. The visual language is **navy + two golds + white + Open Sans Bold Italic headings**. The voice is **first-person, grounded, direct, wry, anti-LLM-slop, British English, Oxford comma, no em-dashes for breaks**.

Key files to skim before producing anything:

- `README.md` — brand at a glance, voice rules, visual foundations, iconography
- `colors_and_type.css` — CSS variables (base + semantic) and element defaults
- `assets/logos/` — three logo PNGs (gold initials, navy initials, navy wordmark)
- `ui_kits/website/` — recreation of jonathanpay.com with reusable JSX components
- `preview/` — small cards previewing typography, palette, and components

If creating visual artifacts (slides, mocks, throwaway prototypes), **copy assets out** of `assets/` and create static HTML files for the user to view. Import `colors_and_type.css` for tokens. Use the components in `ui_kits/website/` as a baseline.

If working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions (article or post? web page, slide, social card? which voice register — Faith / Fun / Life / Work?), and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

**Hard rules — do not violate without explicit permission:**

1. Headings are Open Sans **Bold Italic**. Never plain bold.
2. Two golds, not one. `#dfb81f` lives on navy; `#8b7417` lives on white. Don't mix.
3. No em-dashes for breaks in copy. Use commas or parentheses.
4. British English spelling, Oxford comma, first person.
5. No emoji in editorial content. No decorative unicode icons.
6. No "delve into", "deep dive", "in today's world", "underscore" as verb, "serves as" where "is" works, "not just X but also Y", "it's not X it's Y", three-item lists by default, decorative `-ing` participles.
7. Sharp corners (radius: 0) almost everywhere. No glassmorphism, no SaaS gradients. **Exception:** image-overlay cards (`.jp-image-card`) use 6px (`--radius-2`) — see README §Cards.
8. Card photography is **personal**, not stock. Always under a navy gradient overlay; never raw.

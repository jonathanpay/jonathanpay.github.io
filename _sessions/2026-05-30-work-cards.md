# Session: Add work cards to jonathanpay.github.io
Date: 2026-05-30
Branch: `claude/sharp-feynman-qTRq5`
Repo: `jonathanpay/jonathanpay.github.io`

---

## Request

Add 4 service cards — **Consulting**, **Digital Publishing**, **Digital Events**, and **Video Editing** — to the Work section of the `jonathanpay.github.io` home page (`index.html`), styled identically to the existing **Consultancy** and **Education** work cards.

---

## Context

- `jonathanpay.github.io` is the GitHub Pages personal site.
- `jonathanpay.com` is the separate WordPress blog/main site.
- The home page (`index.html`) already had a Work section with two `work-card` entries:
  - **Consultancy** → [holisticemailmarketing.com](https://holisticemailmarketing.com), background photo from jonathanpay.com uploads
  - **Education** → [holisticemailacademy.com](https://holisticemailacademy.com), background photo from jonathanpay.com uploads

### work-card style (defined inline in index.html `<style>`)

Cards use:
- `border-radius: 6px`, `padding: 2rem 1.75rem`, `min-height: 13rem`
- `display: flex; flex-direction: column; justify-content: flex-end`
- `background-size: cover; background-position: center`
- A `::before` pseudo-element gradient overlay: navy (`#2c3d50`) fading from 92% opacity at the bottom to 35% at the top
- Hover darkens the overlay and adds a box-shadow
- Inside `.work-card-inner`: a gold uppercase label (`.work-card-label`), an italic white `h3`, and a white `p`

---

## What was done

Four new `work-card` `<a>` elements were appended inside the existing `.work-grid` div in `index.html`, after the Education card:

```html
<a href="#" class="work-card" style="background: var(--navy);">
  <div class="work-card-inner">
    <div class="work-card-label">Consulting</div>
    <h3>Consulting</h3>
    <p>One-to-one strategic guidance for email marketers and teams looking to level up their programmes.</p>
  </div>
</a>

<a href="#" class="work-card" style="background: var(--navy);">
  <div class="work-card-inner">
    <div class="work-card-label">Digital Publishing</div>
    <h3>Digital Publishing</h3>
    <p>Newsletters, content strategy, and digital publishing built around email as the primary channel.</p>
  </div>
</a>

<a href="#" class="work-card" style="background: var(--navy);">
  <div class="work-card-inner">
    <div class="work-card-label">Digital Events</div>
    <h3>Digital Events</h3>
    <p>Online events, webinars, and virtual experiences designed to engage and grow an email audience.</p>
  </div>
</a>

<a href="#" class="work-card" style="background: var(--navy);">
  <div class="work-card-inner">
    <div class="work-card-label">Video Editing</div>
    <h3>Video Editing</h3>
    <p>Video production and editing for email marketers, educators, and content creators.</p>
  </div>
</a>
```

---

## Placeholders to complete

For each of the 4 new cards, update:

| Card | Replace `href="#"` with | Add background image |
|---|---|---|
| Consulting | real URL | `style="background-image: url('...')"` |
| Digital Publishing | real URL | `style="background-image: url('...')"` |
| Digital Events | real URL | `style="background-image: url('...')"` |
| Video Editing | real URL | `style="background-image: url('...')"` |

Also update the placeholder descriptions if needed.

---

## Commit

```
Add Consulting, Digital Publishing, Digital Events, and Video Editing work cards

Four new work-card entries added to the Work grid on the home page,
matching the style of the existing Consultancy and Education cards.
Using solid navy backgrounds and placeholder links for now.
```

Commit hash: `168d634` on branch `claude/sharp-feynman-qTRq5`

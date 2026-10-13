# Plan — Academy course CTAs on the email tools

Written 2026-10-12 for whoever builds this (another Claude session or Jon). Nothing here is built yet. Read it top to bottom before touching `email-tools/`.

The tool-to-course mapping and the live/waitlist split come from Jon's Academy wiki review (course roster signed off 2026-08-05) and were relayed in conversation. Course pages could not be fetched from the planning session. Titles for the courses not in the confirmed list below use the shorthand names in this note; Jon confirmed on 2026-10-13 that the shorthand is what to use on the site.

---

## Goal

Every tool in `/email-tools/` points to the Academy course it leads to, whether that course is live or on a waitlist. One source of data drives the index pills, a closing block on each tool page, and (for some tools) a short contextual line after the result.

## Where things stand (audit, 2026-10-12)

All 13 index cards already carry a course pill. In-page links are patchy:

| In-page Academy link | Tools |
|---|---|
| Yes | Hypothesis Builder, Duration, Significance, Persona Matcher, Emotional Appeal, CURVE, DMARC |
| None | We-We, Readability, Feature-to-Benefit, Tone Analyzer, Personalisation, Accessibility |

Existing disagreements to resolve:

- Duration and Significance link in-page to `intermediate-holistic-testing-for-deeper-insights`; their index pill says `foundation-email-a-b-testing`. The Hypothesis Builder (same pipeline) links to Foundation.
- CURVE links in-page to `foundations-email-copywriting` and `intermediate-the-buyers-mind`; its index pill says only `foundations-email-copywriting`. **The Buyer's Mind link is correct and stays** (CURVE is taught in Module 2 and reused in Module 5). The index pill is what changes.
- Existing consulting CTAs on We-We, Tone and Readability (shown at certain scores) are separate from this work and stay.

## Courses and status

Live (7): Strategic Email Marketing, Foundation Ecommerce, Foundation Deliverability, Buyer Modalities & GenAI, The Buyer's Mind, Foundation Email Design, Foundation Distributed Marketing. **Every other course is waitlist.** The wiki says planned courses are not all built, so waitlist copy promises no date and no content details.

Public titles confirmed so far:

| Slug | Public title | Status |
|---|---|---|
| `email-design-course-for-beginners` | Foundation: Email Design Excellence | live |
| `foundations-email-copywriting` | Email Copywriting | waitlist |
| `strategic-email-marketing-from-vision-to-value` | Strategic Email Marketing — From Vision to Value (Intermediate) | live |
| `intermediate-the-buyers-mind` | The Buyer's Mind — Understanding System 1 & System 2 Thinking | live |
| `intermediate-buyer-modalities-genai` | Buyer Modalities & GenAI — Scale Personalised Messaging with Precision | live |

Other courses used by the mapping (shorthand titles, confirmed for use):

| Slug | Status |
|---|---|
| `foundation-email-deliverability-fundamentals` | Foundation Deliverability, live |
| `intermediate-managing-and-optimising-deliverability` | Intermediate Deliverability, waitlist |
| `foundation-email-a-b-testing` | Foundation A/B Testing, waitlist |
| `intermediate-email-copywriting-techniques` | Email Copywriting Techniques, waitlist |
| `foundation-psychology-for-email` | Foundation Psychology, waitlist |
| `intermediate-email-design-course` | Intermediate Email Design, waitlist |

Full URL form: `https://holisticemailacademy.com/courses/<slug>/`. The complete 27-course list is in Jon's message; the courses not in the mapping (lifecycle, ecommerce intermediate/advanced, distributed marketing intermediate/advanced, and the remaining advanced courses) are not used yet.

## Mapping

| Tool (page file) | Primary | Next step / live companion |
|---|---|---|
| CURVE (`curve-tool.html`) | The Buyer's Mind (live) | Email Copywriting (waitlist) |
| Emotional Appeal (`emotional-appeal-tool.html`) | The Buyer's Mind (live) | Foundation Psychology (waitlist) |
| Persona Matcher (`persona-tool.html`) | Buyer Modalities & GenAI (live) | The Buyer's Mind (live) |
| Personalisation Checker (`personalisation-tool.html`) | Buyer Modalities & GenAI (live) | The Buyer's Mind (live) |
| Feature-to-Benefit (`f2b-tool.html`) | The Buyer's Mind (live) | Email Copywriting (waitlist) |
| We-We (`wewe-tool.html`), Readability (`ers-tool-feedback.html`) | Email Copywriting (waitlist) | The Buyer's Mind (live) |
| Tone Analyzer (`tone-tool.html`) | Email Copywriting Techniques (waitlist) | Buyer Modalities & GenAI (live) |
| Hypothesis, Duration, Significance | Foundation A/B Testing (waitlist) | Strategic Email Marketing (live) |
| Accessibility Checker (`accessibility-tool.html`) | Foundation: Email Design Excellence (live) | Intermediate Email Design (waitlist) |
| DMARC (`dmarc-checker-tool.html`) | Foundation Deliverability (live) | Intermediate Deliverability (waitlist) |

Live-led tools (7): CURVE, Emotional Appeal, Persona, Personalisation, Feature-to-Benefit, Accessibility, DMARC. Waitlist-led (6): We-We, Readability, Tone, and the testing trio. Each waitlist-led tool has a live companion so every visitor has something to act on today. Fit notes: Readability is the weakest fit for Buyer's Mind (treat it as a next step, not the same topic); the testing trio's live companion is a reasonable fit, not a perfect one (Strategic Email Marketing covers A/B testing as an audit pillar).

Duration and Significance lead with Foundation A/B Testing (Jon confirmed 2026-10-13).

## Design

**Data file:** `email-tools/assets/course-ctas.js`, hand-written (not hashed build output). Each course has `title`, `url`, `level`, `status` (`live` | `waitlist`) and an optional `offer`. Each tool maps to `{ primary, next }`. Launching a course is a one-line status change that updates the pill, the closing block and the button copy.

**Surfaces:**

1. **Index pill:** shows level plus a "Waitlist" tag where it applies. Reads from the data file. CURVE moves from the Foundation (green) pill to the Intermediate (cyan) one.
2. **Closing block on every tool page:** primary course, then next step. DMARC's existing block (all three levels, shipped in PR #23) is the visual reference. It moves onto the shared data last, as a mixed-status block.
3. **Contextual line after a result:** closing block first; contextual lines only for the seven live-led tools (CURVE, Emotional Appeal, Persona, Personalisation, Feature-to-Benefit, Accessibility, DMARC), because a contextual waitlist line is low value. Jon confirmed 2026-10-13 that Personalisation and Feature-to-Benefit are included.

**Rules:**

- Waitlist button copy: "Join the waitlist". No dates, no content promises.
- The Buyer's Mind is the free front door (free with code `BUYERSMIND`; Jon confirmed on 2026-10-13 that the code is active). Carry that in `offer`, not in hard-coded copy, so it can be switched off when the code ends.
- UTMs on every Academy link: `utm_source=hem-tools&utm_medium=tool&utm_campaign=<tool-slug>`. Jon confirmed on 2026-10-13 that `hem-tools` is free in GA4.
- Keep existing consulting CTAs.
- Styles for new blocks go in a hand-authored CSS file (see `email-tools/assets/landing.css` from PR #23), not the hashed `style-*.css` bundle, which a rebuild overwrites.

## Rollout (three PRs)

Status: rollouts 1 to 3 are built and all 13 tools carry the shared block (data file `email-tools/assets/course-ctas.js`, styles `course-cta.css`, tests `tests/course-ctas.test.mjs`). To add a block to a new tool, put `<div data-course-cta="<tool-key>"></div>` below its tool card, outside any results panel that starts hidden, and load `course-cta.css` after the main stylesheet bundle plus `course-ctas.js`. The index pills read from the same file: each is `<a data-course-pill="<tool-key>">`, and a status change in the data file updates the pill, the block and the button copy. Index pill links add `utm_content=index` to tell them apart from the in-page blocks. Not built: the contextual lines after a result (surface 3 above).

1. Data file, shared component, and the testing trio. Fixes the Foundation/Intermediate disagreement and proves the component.
2. Copy and psychology tools: We-We, Readability, Tone, Emotional Appeal, CURVE, Persona, Feature-to-Benefit.
3. Personalisation, Accessibility, and DMARC onto the shared data. Update the index pills to read from the same file.

Check each page in a browser before pushing: the closing block renders, links carry UTMs, the waitlist and live variants read correctly, and the tool still works.

## Open items for Jon

None blocking. For later:

- Distributed Marketing and Ecommerce are live but no tool leads to them. Fine to leave, unless the tools should cover the whole live catalogue.
- `sscc.html` shows an Intermediate pill on the page itself while the index lists the Significance Calculator as Foundation (the Duration and Hypothesis pages say Foundation). Not changed in PR 1; decide which is right.
- DMARC used to show three courses (Foundation, Intermediate, Advanced) in two places, with copy naming BIMI and ARC for the waitlist courses. Rollout 3 follows the mapping instead: Foundation Deliverability plus Intermediate Deliverability, one block, topic-level copy. Advanced Deliverability is no longer linked. Say if it should come back.

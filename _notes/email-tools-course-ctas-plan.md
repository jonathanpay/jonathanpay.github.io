# Plan — Academy course CTAs on the email tools

Written 2026-10-12 for whoever builds this (another Claude session or Jon). Nothing here is built yet. Read it top to bottom before touching `email-tools/`.

The tool-to-course mapping and the live/waitlist split come from Jon's Academy wiki review (course roster signed off 2026-08-05) and were relayed in conversation. Course pages could not be fetched from the planning session, so titles and levels not listed below are slug-derived and marked TBC.

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
| `strategic-email-marketing-from-vision-to-value` | Strategic Email Marketing — From Vision to Value | live |
| `intermediate-the-buyers-mind` | The Buyer's Mind — Understanding System 1 & System 2 Thinking | live |
| `intermediate-buyer-modalities-genai` | Buyer Modalities & GenAI — Scale Personalised Messaging with Precision | live |

Other courses used by the mapping (titles TBC, slug-derived):

| Slug | Status |
|---|---|
| `foundation-email-deliverability-fundamentals` | live |
| `intermediate-managing-and-optimising-deliverability` | waitlist |
| `foundation-email-a-b-testing` | waitlist |
| `intermediate-email-copywriting-techniques` | waitlist |
| `foundation-psychology-for-email` | waitlist |
| `intermediate-email-design-course` | waitlist |

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

Not yet decided: whether Duration and Significance sit at Foundation or Intermediate level. Foundation leading is a judgement from course titles only.

## Design

**Data file:** `email-tools/assets/course-ctas.js`, hand-written (not hashed build output). Each course has `title`, `url`, `level`, `status` (`live` | `waitlist`) and an optional `offer`. Each tool maps to `{ primary, next }`. Launching a course is a one-line status change that updates the pill, the closing block and the button copy.

**Surfaces:**

1. **Index pill:** shows level plus a "Waitlist" tag where it applies. Reads from the data file. CURVE moves from the Foundation (green) pill to the Intermediate (cyan) one.
2. **Closing block on every tool page:** primary course, then next step. DMARC's existing block (all three levels, shipped in PR #23) is the visual reference. It moves onto the shared data last, as a mixed-status block.
3. **Contextual line after a result:** closing block first; contextual lines only for live-led tools, because a contextual waitlist line is low value. Open question: Personalisation and Feature-to-Benefit are live-led under this mapping but were not on the original contextual list — confirm with Jon.

**Rules:**

- Waitlist button copy: "Join the waitlist". No dates, no content promises.
- The Buyer's Mind is the free front door (free with code `BUYERSMIND`; Jon confirmed on 2026-10-13 that the code is active). Carry that in `offer`, not in hard-coded copy, so it can be switched off when the code ends.
- UTMs on every Academy link: `utm_source=hem-tools&utm_medium=tool&utm_campaign=<tool-slug>`. Jon confirmed on 2026-10-13 that `hem-tools` is free in GA4.
- Keep existing consulting CTAs.
- Styles for new blocks go in a hand-authored CSS file (see `email-tools/assets/landing.css` from PR #23), not the hashed `style-*.css` bundle, which a rebuild overwrites.

## Rollout (three PRs)

1. Data file, shared component, and the testing trio. Fixes the Foundation/Intermediate disagreement and proves the component.
2. Copy and psychology tools: We-We, Readability, Tone, Emotional Appeal, CURVE, Persona, Feature-to-Benefit.
3. Personalisation, Accessibility, and DMARC onto the shared data. Update the index pills to read from the same file.

Check each page in a browser before pushing: the closing block renders, links carry UTMs, the waitlist and live variants read correctly, and the tool still works.

## Open items for Jon

- Public titles for the courses marked TBC.
- Foundation or Intermediate for the Duration and Significance calculators.
- Contextual lines: include Personalisation and Feature-to-Benefit?
- Distributed Marketing and Ecommerce are live but no tool leads to them. Fine to leave, unless the tools should cover the whole live catalogue.

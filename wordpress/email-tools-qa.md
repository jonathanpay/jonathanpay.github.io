# Email tools QA log

QA before moving the email tools from jonathanpay.github.io/email-tools/ to holisticemailacademy.com. Severity:

- **Wrong**: the tool gives a wrong or misleading answer.
- **Misleading**: the copy says something inaccurate, or the tool can mislead in edge cases.
- **Polish**: wording, spelling, consistency.

Status: open, fixed, or **decision** (needs Jon).

Every "Wrong" and "Misleading" finding below is fixed and has a test in `tests/` (run `node --test "tests/*.test.mjs"`). The logic for each tool now lives in a module with no DOM so it can be tested: `curve-score.js`, `readability.js`, `pronouns.js`, `f2b-match.js` (+ `f2b-templates.js`), `personalisation-rules.js`, `contrast.js`, `dmarc-rules.js`, and `site.js` for links.

## Site-wide

| # | Finding | Severity | Status |
|---|---|---|---|
| S1 | Mixed spelling: "Optimisation", "analyse", "Personalisation", but "Analyzer" in three tool names. HEA writes British English. | Polish | fixed |
| S2 | Branding is Holistic Email Marketing (titles, header, footer). The "Get expert help / Talk to us" boxes on We-We, Readability and Tone sell "our consulting service" and link to holisticemail.com/contact. Decision made: HEA branding and addresses. | Polish | fixed (copy reworded; see decision S7) |
| S3 | Course links carry `utm_*` tags; the assessment plugin uses `?ref=` on the same site. | Polish | fixed |
| S4 | The level pill at the top of each tool page is hard-coded and disagrees with the course data the index uses: CURVE says "Foundation Copywriting" (data: Intermediate Buyer's Mind), Emotional Appeal says "Foundation" (data: Intermediate), Accessibility says "Intermediate" (data: Foundation Design). | Misleading | fixed |
| S5 | The Buyer's Mind card shows "Free with code BUYERSMIND". Is the offer still running? | — | **decision** |
| S7 | The three "Get expert help" boxes (We-We, Readability, Tone) now say "get in touch" and link to holisticemailacademy.com/contact/ instead of selling Holistic Email Marketing consulting. Keep them, or remove them on the Academy site? | — | **decision** |
| S6 | Links between tools are relative file names (`ab-duration-tool.html?…`, `persona-tool.html`). They need the new page addresses in WordPress. | Migration | fixed (site.js + plugin page map) |

## Testing tools

| # | Tool | Finding | Severity | Status |
|---|---|---|---|---|
| T1 | Hypothesis Builder | `hypothesis-content.js` is marked DRAFT: lever wording and example problems are for Kath to review. The Apple Mail Privacy Protection note it asks to fact-check is accurate (MPP pre-fetches images, which records an open). | — | **decision** |
| T2 | Duration Calculator | Exactly 365 days shows "365+". | Polish | fixed |
| T3 | Duration Calculator | A "decrease" hypothesis (unsubscribe or complaint rate) is sized as an increase of the same size. The difference is small and errs towards a longer test. | Polish | open (note only) |

## Copy tools

| # | Tool | Finding | Severity | Status |
|---|---|---|---|---|
| C1 | Readability | The score labelled "Flesch-Kincaid" is the Flesch Reading Ease formula (0–100, higher is easier). Flesch-Kincaid is a grade level. | Wrong | fixed |
| C2 | Readability | Sentences are only split on `. ! ?`. Email copy is full of headings, bullets, buttons and sign-offs with no full stop, so they merge into one long "sentence" and every score reads harder than it is. Decimals ("2.5%") also count as sentence ends. | Wrong | fixed |
| C3 | Readability | The syllable counter treats "-ed" as a syllable ("jumped" = 2) and drops the "-le" syllable ("table" = 1). | Misleading | fixed |
| C4 | Readability | US school grades only ("8th grade"). UK readers need reading age. | Polish | fixed |
| C5 | We-We | Misses "ours", "yours", "yourself", "myself", "ourselves", "mine". With no pronouns at all it shows 0% / 0% instead of saying so. | Misleading | fixed |
| C6 | Feature-to-Benefit | Category detection takes the *last* matching category, not the best one: "Automated reporting dashboard with 24/7 support" scores as Support. | Wrong | fixed |
| C7 | Feature-to-Benefit | Substring matching: "roi" matches "android", "scale" matches "escalate", "fast" matches "breakfast". | Wrong | fixed |
| C8 | Feature-to-Benefit | A feature typed in lower case starts the sentence in lower case ("automated reporting takes…"). | Polish | fixed |
| C9 | Feature-to-Benefit | When nothing matches it silently falls back to an ease-of-use framing. | Misleading | fixed |
| C10 | Personalisation | A token used more than once is judged by its first use only: `{{ first_name \| default: 'there' }}` in the greeting hides a bare `{{ first_name }}` further down. | Wrong | fixed |
| C11 | Personalisation | HubSpot: tells people to write `{{ contact.firstname \| fallback: "Friend" }}`, which isn't HubSpot syntax. HubSpot sets defaults per token in the editor or under Settings › Marketing › Email › Personalization. | Wrong | fixed |
| C12 | Personalisation | Brevo: fallback syntax is `{{ contact.FIRSTNAME \| default:"there" }}`; the tool only recognises `or`. | Wrong | fixed |
| C13 | Personalisation | Marketo: `{{lead.FirstName:default=Friend}}` isn't recognised as a token at all, so a correct fallback reports "no tokens found". | Wrong | fixed |
| C14 | Personalisation | SendGrid (`{{insert first_name "default=Friend"}}`) and Iterable (`{{defaultIfEmpty firstName "Friend"}}`) have inline fallbacks; the tool says only `{{#if}}` blocks work. | Wrong | fixed |
| C15 | Personalisation | MailerLite and Pardot fallback guidance couldn't be confirmed from public docs. | — | **decision** (check in the platforms) |
| C16 | Accessibility | Large-text threshold is 18px / 14px bold. WCAG large text is 18pt (24px) / 14pt bold (about 18.7px), so 18–23px text is held to 3:1 instead of 4.5:1. | Wrong | fixed |
| C17 | Accessibility | Font sizes in `pt` (common in email HTML) are ignored by the size and contrast checks. | Misleading | fixed |
| C18 | Accessibility | "12px accessibility floor": WCAG sets no minimum font size. It's a common email convention. Also, only inline styles are checked, and the page doesn't say so. | Misleading | fixed |

## Psychology tools

| # | Tool | Finding | Severity | Status |
|---|---|---|---|---|
| P1 | CURVE | Since the September scorer fix, `countHits` returns `{hits, total}`, but CURVE still treats it as a number. Every keyword-based element (Curiosity, Urgency, Value, Emotion) reads as Present for any subject line: "Hello" scores 4/5. | Wrong | fixed |
| P2 | CURVE | "The same framework taught in Foundations: Email Copywriting" — the course data says CURVE is taught in The Buyer's Mind. | Misleading | fixed |
| P3 | Tone, Persona, Emotional Appeal | When the scorer declines a verdict because the text is long-form (900+ words) or too thin on signals, the tools show the generic "no single tone stands out" message, which reads as a verdict on the copy. | Misleading | fixed |

## Deliverability

| # | Tool | Finding | Severity | Status |
|---|---|---|---|---|
| D1 | DMARC | `p=` is matched anywhere, so `sp=none; p=reject` reads as policy "none". | Wrong | fixed |
| D2 | DMARC | SPF lookup count misses bare `a` and `mx` mechanisms. | Misleading | fixed |
| D3 | DMARC | `+all` (lets anyone send as you) is reported as "no all mechanism"; `?all` passes as valid. | Wrong | fixed |
| D4 | DMARC | Two SPF or two DMARC records (an automatic failure) aren't flagged; the first is reported. | Wrong | fixed |
| D5 | DMARC | A revoked DKIM key (`p=` empty) is reported as found and valid. | Misleading | fixed |

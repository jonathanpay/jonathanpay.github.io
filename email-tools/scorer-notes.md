# Scorer notes — keyword matching and verdict floors

Applies to the shared scoring behind the **Emotional Appeal Analyzer**, **Email
Tone Analyzer**, **Buyer Persona Matcher** and the **CURVE Subject Line
Builder**.

## What was wrong

`countHits` in `assets/utils-*.js` counts raw substring occurrences with
`indexOf` and no word boundaries, so unrelated words scored as hits:

| keyword | was matching | category |
|---|---|---|
| `now` | **know** | Urgent |
| `hey` | **they** | Friendly |
| `tested` | **contested** | Trust |
| `ending` | **defending**, depending, sending | Fear |
| `lose` | **closely** | Fear |
| `gain` | **against** | Persuasive |
| `only` | **commonly** | Urgent |

Function words in the lexicons (`without`, `behind`) compounded it by firing on
any prose in any register.

There was also no confidence floor. Share-of-total always produces a winner, so
a 2,000-word document scoring a handful of incidental words was reported as a
confident reading. Measured hit density explains why that is unsound:

| register | hits per 1,000 words |
|---|---|
| marketing email copy | ~50–200+ |
| long-form prose | ~1–17 |

The lexicons are calibrated for the first band. In the second, three or four
incidental words decide the verdict.

## What changed

**`assets/dominance-scorer.js`** now owns a boundary-aware matcher and no longer
imports `countHits`. This matters beyond correctness: `utils-*.js` is a
hash-named build output, so a hand-edit there is reverted by the next build.
`dominance-scorer.js` is hand-authored and shared, so the fix survives rebuilds.

- Whole-word and whole-phrase matching; `\s+` allowed between the words of a
  multi-word keyword.
- A trailing `*` marks a **stem**: `trust*` matches trust, trusts, trusted,
  trusting. Stems exist because boundaries strictly reduce matches. Applied
  only where the inflection family is intended *and* the stem has no
  wrong-polarity false friend — deliberately not `hope` (hopeless), `care`
  (careless), `test` (testament).
- `MIN_HITS = 4`, `MIN_DENSITY_PER_1K = 25`, `MAX_WORDS_FOR_VERDICT = 900`. In
  the gap between the two density bands, and outside the copy length the
  lexicons were written for, the scorer returns `verdict: "mixed"` with
  `lowSignal` / `longForm` flags rather than inventing a reading.

**`assets/appeal-keywords.js`** — only `keywords` changed. `id`, `name`,
`color`, `tint`, `desc`, `note` and `phrases` are untouched, because CURVE keys
off `id` and the renderers show the rest directly.

**`assets/curve-tool.js`** — one import swap. CURVE called `countHits` straight
from utils and so carried the same defect; its four call sites needed no change.

## Rule for future edits

**The `*` stem convention only works with the corrected matcher.** Any consumer
that reaches for the old literal `countHits` treats `trust*` as a literal
asterisk and silently stops matching those keywords. Route every scoring
consumer through `dominance-scorer.js`.

## Still open

1. **Badge copy.** The three tool bundles treat any verdict other than
   `"mixed"`/`"tie"` as dominant and read `.name` off it, so a new verdict
   string would throw in their render path. That is why "low signal" and
   "long-form" report as `mixed`. Honest wording ("Not enough signal to call
   this", "This reads like long-form, not an email") needs a matching change in
   the bundles, or in the source project they are built from.
2. **The tone lexicon has no module.** It is inlined inside the built
   `assets/tone-CsQZ9GR2.js`, so its function words (`now`, `only`, `ends`,
   `final`, `feel`, `for you`) cannot be cleaned without editing a build
   artifact. Extract it to `tone-keywords.js` upstream; the matcher fix already
   benefits the Tone Analyzer, the lexicon hygiene does not yet.

The proper home for both is the source project that builds the hashed bundles.

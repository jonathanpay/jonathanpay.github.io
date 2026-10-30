# Source and parity record

| Item | Value |
|---|---|
| Repository default branch | `master`, rechecked 30 Oct 2026 |
| Starting commit | `57b5797123520a9bf135d7fba2af99ac25ac1c69` (same as the handover pack's observed head; no newer fixes to preserve) |
| Pilot source | `pilots/email-maturity-assessment/` (unchanged by this work) |
| Questionnaire version | `V2-questionnaire-review-04` |
| `data.js` SHA-256 | `c8888daae0b97c88406c99138d0508cc84288e68c3ba9d74c54c527ff0198b3c` (matches the pack snapshot byte for byte) |
| `engine.js` SHA-256 | `7dc4c7b3b72fe2554e3178e3e01583574fefc1176d665687e47ad5fff71ca4f7` (matches the pack snapshot byte for byte) |
| Repository instructions | None found (no AGENTS.md, CLAUDE.md or CONTRIBUTING). `tests/README.md` says `node --test "tests/*.test.mjs"` |

## What is copied unchanged
`data.js`, `engine.js`, `advice.js`, `courses.js`, `styles.css` and the logo are pinned copies in `email-maturity-assessment/`. `tests/workshop-parity.test.mjs` fails if any drifts from the pilot, so a later pilot fix is a deliberate re-sync rather than a silent mid-event change.

## What differs in the forked `app.js`
- Config: workshop collector only (`HEA_WORKSHOP`), session from `?session=`. The pilot collector ID is refused.
- Removed: the email-a-copy form, name/email/company/job title/marketing capture and the `contact` field.
- Added: session check on load; workshop notice; record schema `hea-assessment-workshop-v1` with `eventId`, `sessionId`, `responseId`; save confirmation required from the collector (`ok`, schema, `saved`, matching IDs, revision) before "saved" is shown; timeout and back-off retries; a workshop takeaway panel (focus, evidence, first action) built from the existing result.
- Import accepts only workshop records; imported records are never sent.
- Unchanged: C1-C3, Q1-Q17, helpers, options, IDs, scoring, result, courses/support logic, P1 and skip, print, download, answer review, the existing unknown and save-order fixes.

## Collector differences from the pilot's `Code.gs`
Own project; explicit `SPREADSHEET_ID`; session and environment model; stricter validation (canonical IDs only, answer IDs match scores); no mail or contact code; aggregate API behind a facilitator key; same scoring function, compared with `engine.js` on 4,000 random answer sets plus the 13 independent fixtures.

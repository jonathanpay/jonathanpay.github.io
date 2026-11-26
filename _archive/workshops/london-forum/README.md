# London Forum workshop: assessment and room dashboard

A workshop-specific copy of the HEA email maturity assessment with its own collector and spreadsheet, plus a facilitator dashboard that shows combined patterns for one session. The pilot at `pilots/email-maturity-assessment/` is unchanged and keeps its own collector.

| Path | Purpose |
|---|---|
| `email-maturity-assessment/` | Participant page (`?session=<id>`). Pinned copies of the pilot's `data.js`, `engine.js`, `advice.js`, `courses.js`, `styles.css`; a forked `app.js` |
| `dashboard/` | Facilitator view of server-side aggregates |
| `apps-script/Code.gs`, `appsscript.json` | The workshop collector and aggregate API (separate Apps Script project) |
| `docs/SETUP.md` | Owner steps: new sheet, script, key, sessions, deployment, rollback |
| `docs/RUNBOOK.md` | Rehearsal and run-of-show, small-room rules, limits |
| `docs/PRIVACY-NOTICE-DRAFT.md` | Participant wording and decisions for Jon |
| `docs/PARITY.md` | Source commit, hashes and what differs from the pilot |

Tests: `node --test "tests/*.test.mjs"` from the repository root (Node 22+; the browser tests need Playwright's Chromium and are skipped by setting nothing special: they run if it is installed).

Kept out of the Jekyll site build: this README, `docs/` and `apps-script/` (see `_config.yml`).

# HEA email maturity assessment — GitHub pilot

A working, build-free prototype using the exact Review 04 questionnaire dated 13 October 2026. Prototype version: `github-pilot-01`, prepared 14 October 2026.

## Try it

Open `index.html` in a browser. No installation or build is required. All fonts and scripts are local/system resources. The three context questions and 17 diagnostic questions appear one at a time. Select an answer and continue; back navigation retains choices. Results appear immediately after Q17. Optional P1 and an optional debrief note appear after the result.

Answers are held in memory for this browser tab. Refreshing or closing it clears them. At the result, choose **Download my test record** to save an anonymous JSON record. Send it to your facilitator through your agreed channel if you choose. **Open a saved test result** on the start screen recomputes a downloaded Review 04 record; it does not trust the stored calculated result.

The code contains no email/name capture, outbound integration, analytics, browser storage or automated submission. The anonymous pilot code is a reference for the exported record, not a private access token. No participant account or permanent hosted result link exists in this first version.

## Hosting

This copy lives in the `jonathanpay.github.io` repository at `/pilots/email-maturity-assessment/`, published as https://jonathanpay.github.io/pilots/email-maturity-assessment/ when merged to `master` (jonathanpay.com itself is served by WordPress.com, not this repository). It is deliberately separate from `/email-tools/` and is not linked from the site navigation or tools index.

- The page carries `noindex,nofollow`, and `_config.yml` sets `sitemap: false` for everything under `/pilots/`. The URL is unlisted, not private: anyone with the link can open it.
- This README is excluded from the published build. The engine test lives at `tests/maturity-assessment-engine.test.mjs`.
- All paths are relative, so the folder still works opened directly from disk.

Do not commit exported participant records, contact details or internal raw source documents to this repository. Hosting exposes the questionnaire and client-side calculation code; no secret belongs in them.

## Scoring implemented

- Exact source stems, helpers and 102 diagnostic answer statements; three context questions and nine P1 options.
- Graded answers 1–5; unknown is a separate null value. An incomplete dimension has no definitive mean or level.
- Half-down label boundaries. Exact halves remain at the lower level.
- A dimension’s final level is `min(initial level, lowest question + 1, 5)`.
- Overall is the minimum final dimension level. Every complete dimension at that level is a joint constraint, regardless of raw-mean differences.
- Unknown result bounds apply the same rules to all-1 and all-5 temporary completions. No unknown response is assigned a persistent score.
- Complete, confirmed-partial, ranged and insufficient-visibility states. Partial profiles do not pretend to identify definitive binding constraints.
- Named-level bars with no public raw averages or score percentages, separate foundational-risk/ceiling messages, unknown topics and practices to retain.
- Optional, unscored P1, with area attribution and skip. Recommendations do not alter scores.

## Pilot limitations

This version tests the questionnaire, deterministic engine, mobile flow, results explanation, P1 and downloadable records. It does not prove respondent comprehension or the 15–20-minute target. Local browser testing used simulated responses, not external respondents.

Immediate actions and support text are conservative prototype guidance. The full dimension×level action matrix, verified course/resource links and commercial routing remain unfinished. There are no paid-course links. Styling follows the HEA email tools: CMG Sans (loaded from `/email-tools/assets/`, so opened from disk it falls back to the system sans), the HEA colour tokens and the circular HEA logo icon.

There is no server-side storage, automatic result delivery, HubSpot handoff, marketing/research consent collection or unique persisted results URL. A later production version needs that architecture and its ownership agreed. Do not put HubSpot credentials or private service keys in client JavaScript. A static client is deliberately sufficient for this initial test, not a claim of production readiness.

## Test records and timing

Downloads contain source/prototype version, pilot code, context, canonical answer IDs and wording, raw grades/unknowns, derived result, P1/area, optional feedback, timestamps and accumulated milliseconds per question. Context indexes are zero-based; raw grades are 1–5 or null.

Questionnaire timing begins at **Begin assessment** and ends when the result appears. A separate duration includes time since the introduction opened. Back navigation accumulates additional time on a question. Time includes pauses with that screen open; inspect participant notes before interpreting it as reading/decision time. Optional P1/debrief time is excluded. The facilitator should independently record total/session timing as appropriate.

Treat downloaded records as programme information and share them only through your agreed pilot channel. Feedback asks participants to avoid names/confidential client detail. JSON is a plain readable file, not encrypted storage.

## Verification

From the repository root, run `node --test tests/maturity-assessment-engine.test.mjs` to verify half-down boundaries, ceilings, complete/partial states, joint constraints, flags and bounds against independent enumeration of all 1,512 dimension patterns. Node is needed only for development checks, not to use or host the prototype.

Desktop and 390px-wide browser checks covered the full 20-question flow, required selection, back navigation, keyboard radios, ceiling/risk explanations, optional support, JSON download/reload and all-unknown results. No horizontal overflow, external page requests or JavaScript errors were observed. This is not a comprehensive accessibility audit or mobile-device study.

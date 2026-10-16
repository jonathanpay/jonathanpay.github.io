# HEA email maturity assessment — GitHub pilot

A working, build-free prototype using the exact Review 04 questionnaire dated 13 October 2026. Prototype version: `github-pilot-01`, prepared 14 October 2026.

## Try it

Open `index.html` in a browser. No installation or build is required. All fonts and scripts are local/system resources. The three context questions and 17 diagnostic questions appear one at a time. Select an answer and continue; back navigation retains choices. Results appear immediately after Q17. Optional P1 and an optional debrief note appear after the result.

Answers are held in memory for this browser tab. Refreshing or closing it clears them. At the result, choose **Download my test record** to save an anonymous JSON record. Send it to your facilitator through your agreed channel if you choose. **Open a saved test result** on the start screen recomputes a downloaded Review 04 record; it does not trust the stored calculated result.

The code contains no email/name capture, analytics or browser storage, When `config.js` holds a collector URL, the intro tells people their anonymous answers and result are saved, and the page sends them when the result appears and again when the optional answers or debrief note change (see Collecting responses). The anonymous pilot code is a reference for the exported record, not a private access token. No participant account or permanent hosted result link exists in this first version.

## Hosting

This copy lives in the `jonathanpay.github.io` repository at `/pilots/email-maturity-assessment/`, published as https://jonathanpay.github.io/pilots/email-maturity-assessment/ when merged to `master` (jonathanpay.com itself is served by WordPress.com, not this repository). It is deliberately separate from `/email-tools/` and is not linked from the site navigation or tools index.

- The page carries `noindex,nofollow`, and `_config.yml` sets `sitemap: false` for everything under `/pilots/`. The URL is unlisted, not private: anyone with the link can open it.
- This README is excluded from the published build. The engine test lives at `tests/maturity-assessment-engine.test.mjs`.
- All paths are relative, so the folder still works opened directly from disk.

Do not commit exported participant records, contact details or internal raw source documents to this repository. Hosting exposes the questionnaire and client-side calculation code; no secret belongs in them.

## Collecting responses

Each completed assessment is saved to a Google Sheet, [HEA maturity assessment pilot responses](https://docs.google.com/spreadsheets/d/1gdTLFaaORQ_Z-_rgy1Lng6NBj4jB0hHGzkOK-54tSPc/edit). The intro says so before anyone starts. Later saves with the same pilot code update that row rather than adding a new one. Records opened with **Open a saved test result** are never sent.

`apps-script/Code.gs` receives the record, checks it, recalculates the result from the answers (it ignores the result the browser sends), and writes one row per pilot code. Text that would start a formula is stored as plain text. `tests/maturity-assessment-collector.test.mjs` runs it against a stub sheet and compares its scoring with `engine.js`. The folder is excluded from the published site.

To connect it:

1. Open the sheet, then **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with `apps-script/Code.gs` from this folder and save.
3. **Deploy → New deployment**, type **Web app**, *Execute as* **Me**, *Who has access* **Anyone**. Authorise when asked.
4. Copy the web app URL (it ends in `/exec`) into `submitUrl` in `config.js`.

After changing `Code.gs`, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same. With `submitUrl` empty nothing is sent and the intro does not mention saving.

The URL is public by design: anyone who finds it could post a record. The script only accepts well-formed records for this questionnaire, which is enough for a pilot, but check the sheet for junk rows.

## Email copy of the result

The result is free on screen. To get a copy by email, the person gives their name and work email, and optionally company, job title and an unticked marketing consent box. The form sends the record plus these details to the collector, which:

- stores them in the person's row (columns Name to Result emailed at, after the existing ones);
- emails the result once per pilot code, from the account that owns the script, as "Holistic Email Marketing";
- builds the email itself from the answers and its own copies of the next-step text and course data, never from text the browser sends;
- allows at most three result emails per address in six hours;
- keeps the contact details when later autosaves arrive without them.

Before launch, fill in `privacyUrl` in `config.js` and `PRIVACY_URL` (and optionally `REPLY_TO`) at the top of `Code.gs`. Code.gs keeps copies of the next-step actions (`data.js`) and the course mapping (`courses.js` and `email-tools/assets/course-ctas.js`); `tests/maturity-assessment-collector.test.mjs` fails if they drift, so update both when either changes, then deploy a new version.

## Moving to the business Google account (after QA)

During QA the sheet and script run from Jon's personal Gmail. To move them to the Holistic Email Marketing or Academy Google account:

1. In the business account, create a new spreadsheet. Add a tab named `Responses` (the script writes the header row itself on the first save).
2. In that sheet, go to Extensions → Apps Script, paste `apps-script/Code.gs`, and set `PRIVACY_URL` and `REPLY_TO`.
3. Deploy → **New deployment** → Web app, Execute as: Me, Who has access: Anyone. Approve the spreadsheet and email permissions. This gives a new `/exec` URL.
4. Put the new URL in `submitUrl` in `config.js` and merge. From then on, saves and result emails go to the new sheet and come from the business address.
5. Send one test from the live page and check the row and the email.
6. Decide what happens to the QA sheet: archive it or delete it. It may hold testers' names and emails.

Optionally, copy the column widths and header formatting from the QA sheet. Nothing in the page or the script refers to the old sheet by ID.

## Course suggestions

`courses.js` maps each dimension to Academy courses by the level reached (Ad Hoc or Foundational: foundation; Strategic or Optimised: intermediate; Innovative: advanced). The result page shows up to three, for the areas holding the result back. Titles, live or waitlist status, offers and links come from `email-tools/assets/course-ctas.js`, so launching a course there updates this page as well. Links carry `utm_source=hem-assessment`, `utm_medium=assessment`, `utm_campaign=maturity-assessment` and `utm_content=dimension-N`. `tests/maturity-assessment-courses.test.mjs` checks every slug exists.

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

Apart from the Google Sheet collector, there is no server-side storage, automatic result delivery, HubSpot handoff, marketing/research consent collection or unique persisted results URL. A later production version needs that architecture and its ownership agreed. Do not put HubSpot credentials or private service keys in client JavaScript. A static client is deliberately sufficient for this initial test, not a claim of production readiness.

## Test records and timing

Downloads contain source/prototype version, pilot code, context, canonical answer IDs and wording, raw grades/unknowns, derived result, P1/area, optional feedback, timestamps and accumulated milliseconds per question. Context indexes are zero-based; raw grades are 1–5 or null.

Questionnaire timing begins at **Begin assessment** and ends when the result appears. A separate duration includes time since the introduction opened. Back navigation accumulates additional time on a question. Time includes pauses with that screen open; inspect participant notes before interpreting it as reading/decision time. Optional P1/debrief time is excluded. The facilitator should independently record total/session timing as appropriate.

Treat downloaded records as programme information and share them only through your agreed pilot channel. Feedback asks participants to avoid names/confidential client detail. JSON is a plain readable file, not encrypted storage.

## Verification

From the repository root, run `node --test tests/maturity-assessment-engine.test.mjs` to verify half-down boundaries, ceilings, complete/partial states, joint constraints, flags and bounds against independent enumeration of all 1,512 dimension patterns. Node is needed only for development checks, not to use or host the prototype.

Desktop and 390px-wide browser checks covered the full 20-question flow, required selection, back navigation, keyboard radios, ceiling/risk explanations, optional support, JSON download/reload and all-unknown results. No horizontal overflow, external page requests or JavaScript errors were observed. This is not a comprehensive accessibility audit or mobile-device study.

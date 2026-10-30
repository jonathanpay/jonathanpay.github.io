# London Forum workshop: setup and deployment

Owner steps. Nothing here has been done for you: no spreadsheet, script, deployment or sharing change exists yet, and the participant page and dashboard ship with the collector address **empty**, so submissions and reads stay off until you complete step 6.

## What gets built

| Piece | Where | Who can reach it |
|---|---|---|
| Participant assessment | GitHub Pages: `/workshops/london-forum/email-maturity-assessment/?session=<id>` | Anyone with the link (it is unlisted, not private) |
| Facilitator dashboard | GitHub Pages: `/workshops/london-forum/dashboard/?session=<id>` | The page is public; **the data is not**. The collector returns aggregates only to a request carrying the facilitator key |
| Collector | Its own Apps Script project, `workshops/london-forum/apps-script/Code.gs`, deployed as a web app | Anyone can POST a well-formed response; only the key opens aggregate reads |
| Responses | A **new** Google Sheet (owned by the account you choose) | You and operators you share it with. Never public |

The pilot assessment, its script (`pilots/email-maturity-assessment/apps-script`) and its sheet are not touched by any step below.

## Why the dashboard is protected the way it is

The dashboard page is static and public. What protects the data is the collector, which sits on Google's side:

1. The browser sends `{"action":"aggregate","session":"…","key":"…"}` in a POST body (never the address bar).
2. The script hashes the key and compares it with `FACILITATOR_KEY_HASH` in Script Properties. Wrong, missing or malformed key: `unauthorised`, no data. `doGet` never accepts a key and never returns aggregates.
3. If it matches, the script reads the sheet **inside Google**, computes counts and returns only those. Raw rows, response IDs, notes and timestamps never reach the browser.

This is the simplest genuine option on a personal Gmail account: a long random key (about 244 bits) checked server-side, with the sheet staying private. It is a shared secret, so treat it like a password: it is shown once, held in a password manager, and rotated after each event. A password typed into a page and compared *in the page* would not be security; here the comparison is in the script.

Stronger alternative, not built: serve the dashboard from Apps Script itself with *Execute as: user accessing the app* and allow-list facilitator Google accounts. That needs the facilitators to have sheet access and a Google consent screen, and it makes the dashboard non-GitHub-hosted. Say if you want it.

## Steps

### 1. Create the new spreadsheet

In the Google account that should own the workshop data, create a **new blank spreadsheet** named e.g. `HEA London Forum workshop responses`. Do not copy the pilot sheet. Leave sharing at *Restricted*. Share (Editor) only with operators who should see raw rows.

### 2. Add the collector script

In that new sheet: **Extensions → Apps Script**.

1. Replace the contents of `Code.gs` with `workshops/london-forum/apps-script/Code.gs`.
2. **Project Settings → Show "appsscript.json" manifest file in editor**, then replace it with `workshops/london-forum/apps-script/appsscript.json`. This limits the script to the Spreadsheets scope: it cannot send email, call other services or read Drive.
3. Run `initialise` (function dropdown → Run). Approve the spreadsheet permission when asked. It records the spreadsheet ID in Script Properties, creates the `Responses` and `Sessions` tabs, and **refuses to run on the pilot sheet**.
4. Run `newFacilitatorKey`. Open **Executions/Logs** and copy the key it prints. It is not stored anywhere and cannot be shown again. Save it in a password manager.
5. Run `checkConfiguration`. Expect the spreadsheet name and `Facilitator key: set`.

### 3. Define the sessions

Open the sheet's `Sessions` tab. `initialise` seeds two placeholder rows:

| Event ID | Session ID | Label | Environment | Status | Notes |
|---|---|---|---|---|---|
| london-forum-2026 | lf-rehearsal | London Forum workshop (rehearsal) | rehearsal | open | |
| london-forum-2026 | lf-live-1 | London Forum workshop | live | closed | |

- Session IDs: lower-case letters, digits and hyphens, 2–40 characters. They identify a session; they are not secret.
- `Environment` is `rehearsal` or `live`. It is stored on every response and used to keep the two apart.
- `Status` `open` accepts submissions; `closed` rejects them (the participant is told). Closing does not affect dashboard reads.
- Add a row per workshop session. **Dates are yours to add**: none has been assumed.
- Changes apply immediately; no redeploy.

### 4. Deploy the web app

**Deploy → New deployment → Web app**. *Execute as:* **Me**. *Who has access:* **Anyone**. Authorise, then copy the URL ending `/exec`. (The participants' browsers need to POST without a Google sign-in, which is why "Anyone" is needed. The URL is not a secret and is not an access control.)

Optional script properties (**Project Settings → Script properties**): `MIN_PROFILES` (default 5) and `MIN_CELL` (default 3). See the thresholds note in `RUNBOOK.md`.

### 5. Put the URL in the two public configs

Edit, commit and merge:

- `workshops/london-forum/email-maturity-assessment/config.js`: set `collectorUrl`. Check `eventId` equals the `Event ID` on your Sessions rows.
- `workshops/london-forum/dashboard/config.js`: set `collectorUrl` (same URL) and the `sessions` list.

Both pages refuse the pilot's collector URL, so pasting the wrong one leaves them switched off rather than writing to the pilot sheet. Do not commit the facilitator key or the sheet ID.

Also decide `privacyUrl` and `retentionNotice` in the participant `config.js` (see `PRIVACY-NOTICE-DRAFT.md`). They are empty because nothing about retention has been decided.

### 6. Smoke test (rehearsal session only)

1. Open `…/email-maturity-assessment/?session=lf-rehearsal`. It must show the *Rehearsal* tag. Complete it with made-up answers. Expect "saved to this workshop session".
2. Check the new sheet has one row, and the **pilot sheet has no new row**.
3. Open `…/dashboard/?session=lf-rehearsal`, choose the session, paste the key, Connect. Below five submissions you get the "submitted so far" screen; at five the breakdown appears.
4. Wrong key → "did not accept that facilitator key".
5. Run the rehearsal plan in `RUNBOOK.md`.

### 7. Rollback

- Stop submissions: set the session's `Status` to `closed` (instant), or empty `collectorUrl` and merge.
- Stop dashboard reads: run `newFacilitatorKey` and discard the key, or **Manage deployments → Archive** the deployment.
- Revert the code: revert the PR. The pilot assessment is unaffected either way.

## Credentials

- **Facilitator key:** rotate by running `newFacilitatorKey` again (the old key stops working immediately). Do so after the rehearsal and after the event, and whenever someone who held it no longer should.
- **Spreadsheet access:** managed in Google Sheets sharing. Nothing in the repository grants it.
- **Nothing secret is in Git.** The collector URL, session IDs and labels are public by design. The pilot sheet ID in `Code.gs` is already public in the pilot README and is used only as a refuse-list.

## Archiving a workshop without erasing others

Set the session `Closed`. To archive its rows: filter `Session` in the `Responses` tab, **File → Download** the filtered view or copy the rows to an archive spreadsheet, then (when your retention decision says so) delete just those rows. Do not delete the header row, the `Sessions` tab or other sessions' rows. There is no destructive reset in the product.

## Excluding a duplicate or junk response

In `Responses`, type anything (e.g. `Yes`) in the `Excluded` cell of that row. It leaves every count on the next refresh and survives later saves. Clear the cell to include it again.

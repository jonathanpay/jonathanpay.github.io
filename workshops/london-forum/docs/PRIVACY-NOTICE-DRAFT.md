# Participant notice: draft for Jon to confirm

Not legal advice and not checked against the HEA privacy policy. The words below describe only what the code does. Jon decides the retention period, the privacy link and whether Holistic Email Academy Ltd is the right controller to name. Nothing here invents a retention period.

## What the participant page says today (from `app.js`)

> **London Forum workshop** (Rehearsal · use made-up answers, shown for the rehearsal session only)
>
> When you finish, your answers, your calculated result and any optional note are saved privately by Holistic Email Academy against this workshop session. We do not ask for your name or email. The room sees only combined patterns for the whole session, never individual answers, references or notes. Answers about your programme can still be sensitive, so keep names and confidential client details out of the optional note. *[retention sentence from `retentionNotice`, if set]* *[Privacy policy link, if `privacyUrl` is set]* Closing or refreshing the tab clears your answers from this page.

If saving is off (no collector, no or unknown session, closed session) the page says so and that nothing is sent.

## What is actually stored

Per response, in the restricted workshop sheet: session and environment; a random response reference (a record key, not a private link); the three context answers; Q1–Q17 answers (1–5 or Unknown); the calculated result; the optional obstacle/area choice and whether it was skipped; the optional debrief note; per-question timings; start/finish times. **No name, email, company, job title or marketing consent is collected or sent.** The script has no mail permission.

## Choices for Jon

| Question | Current default |
|---|---|
| Retention period and deletion process | Not set. `retentionNotice` is empty |
| Privacy-policy link and whether it covers this | `privacyUrl` empty; the pilot's policy link is not reused until you confirm |
| Contact/email delivery | Off. If wanted later, add it to the *workshop* backend and test page/email parity |
| Wording "saved privately by Holistic Email Academy" | Confirm the controller |
| Whether to say the room view is "anonymous" | The page does **not** say this. The collection is pseudonymous (session + random reference) and small groups can be recognised |

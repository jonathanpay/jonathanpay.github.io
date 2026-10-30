# London Forum workshop: rehearsal and run-of-show runbook

Fits the one-hour script (`aggregate dashboard` at minutes 35–45). Times are the script's proposals, not measured.

## Before the event

- [ ] Setup steps 1–6 in `SETUP.md` done; the smoke test passed on the **rehearsal** session.
- [ ] Participant link and QR made for the **live** session only (`…/email-maturity-assessment/?session=lf-live-1`). Test the QR on a phone. The link is unlisted, not private.
- [ ] Live session `Status` is `closed` until you are ready, then `open`. Rehearsal rows never appear in the live session (separate session ID and environment).
- [ ] Facilitator key in a password manager. Paste it just before projecting, not on screen. It is never in the address.
- [ ] Participant notice wording confirmed (`PRIVACY-NOTICE-DRAFT.md`); `privacyUrl` and `retentionNotice` set if you want them shown.
- [ ] Projector: open the dashboard on the facilitator laptop, **Connect**, then press **H** to hide the controls before mirroring.
- [ ] A phone and a second browser profile available for the synthetic backup and the offline reflection route.

## Rehearsal plan (synthetic data only)

1. Use `lf-rehearsal`. Tell participants to answer with made-up details.
2. Submit at least 5, including: one answering "I don't know" throughout, one with two tied lowest areas, one partial. Make them across devices.
3. On the dashboard check against the sheet: submitted = rows not marked `Excluded`; each area row adds up to the submitted count; result-state counts add up; limiting-area bars may add up to more than the complete count (ties).
4. Mark one row `Excluded`; Refresh; the count drops by one.
5. Complete one response and, while it saves, switch the phone to airplane mode: the page must say it has not saved, keep the result, and say "saved" only after reconnecting.
6. Load: if you know the attendance use it; otherwise the planning assumption is 100 near-concurrent submissions. Note what the sheet and script do. **Not yet measured on Google's platform**: see "Limits".
7. Time a real person completing it (target 15–20 minutes; the one-hour agenda cannot absorb more than 2 minutes of slip).
8. Rotate the key (`newFacilitatorKey`) and discard the rehearsal key.

## On the day

| Minute | Action |
|---|---|
| Before 0 | Live session `open`. Dashboard connected to the **live** session, controls hidden, title shows **Live**. |
| 5–10 | Show participants the link/QR. Read the collection and display wording you have confirmed. |
| 10–30 | Participants complete. Do not project the dashboard. |
| ~30 | Keep an eye on the count in your own controls view (**H** shows them). Don't refresh repeatedly while the room is small. |
| 35 | Press **R** once. Check the denominator on screen. Press **F** to freeze while the room discusses. |
| 35–45 | Pick one or two patterns. Use the prompts: where do reported practices differ, where is visibility limited, what could explain it, what would you check first. |
| After | Set the live session `closed`. Rotate the key. |

If the dashboard fails or the room is under five, use **Synthetic example** (clearly labelled). If the assessment itself is unavailable, use the offline reflection route in the script; it produces no score.

## Small rooms and disclosure

- Fewer than **5** included assessments: the collector sends only the count. There is no breakdown in the data, so nothing is hidden behind the screen.
- From 5: any number below **3** in a distribution is pooled with other categories (shown as "pooled", with a footnote), and a single bar never describes fewer than 3 people. In the limiting-area view a count of 1–2 shows "under 3".
- The limiting-area and obstacle views appear only when the number of complete profiles (or obstacle answers) is itself published unpooled and at least 5.
- Both numbers are configurable server-side (`MIN_PROFILES`, `MIN_CELL`).

**Residual limits (say them honestly):** this reduces, and does not remove, the chance of picking out an individual. If two snapshots are taken one submission apart, the difference reveals that person's answers. Default operating rule: refresh deliberately, freeze for discussion, avoid refreshing in small steps while the room is small. People in the room may also recognise their own answers. Do not describe the room as anonymous because of this; the data are collected under session codes and kept in the workshop sheet.

## Limits (what is not proven here)

- No Google account, spreadsheet or deployment exists yet, so **nothing has run on Google's platform**. The tests run the collector logic against a simulated spreadsheet and a routed fake of the web-app URL.
- Apps Script quotas (simultaneous executions, daily runtime, lock waits) and the CORS/redirect behaviour of the real `/exec` URL must be confirmed in the rehearsal. The pilot uses the same POST-with-text/plain pattern, and the browser was fine with that, but check it on your deployment.
- Participant retry: up to four automatic retries (about 2, 5, 10 and 20 seconds), each request timing out at 30 seconds, with a visible "Try saving again". The script waits up to 30 seconds for the write lock and replies "busy" (retryable) beyond that. Writes are serialised, so a large simultaneous burst queues; rehearse with the real room size.
- 10-second refresh target: not measured. The dashboard shows the actual snapshot time.

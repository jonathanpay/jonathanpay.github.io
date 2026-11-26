/**
 * London Forum workshop: response collector and aggregate API.
 *
 * This is a SEPARATE Apps Script project from the pilot collector in
 * pilots/email-maturity-assessment/apps-script/. It must be deployed against
 * its own, new spreadsheet. See ../docs/SETUP.md.
 *
 * What it does
 *  - doPost, submission: validates a workshop record, recalculates the result
 *    from the answers (the browser's result is ignored), and writes one row per
 *    (session, response ID) to the workshop spreadsheet.
 *  - doPost, action "aggregate": returns session-level aggregate counts only,
 *    and only when the request carries the facilitator key.
 *  - doGet: public, non-sensitive status and session label/state only.
 *
 * What it deliberately cannot do
 *  - Send email (the manifest asks for no mail scope).
 *  - Use any spreadsheet other than the one named in the SPREADSHEET_ID script
 *    property, and never the pilot sheet (see PILOT_SHEET_ID).
 *  - Accept a destination, sheet or session definition from the browser.
 *
 * Script properties (Project Settings > Script properties; never in Git):
 *  SPREADSHEET_ID       set by initialise() or by hand. Required.
 *  FACILITATOR_KEY_HASH set by newFacilitatorKey(). Required for the dashboard.
 *  MIN_PROFILES         optional, default 5.
 *  MIN_CELL             optional, default 3.
 */

// ---- Settings ---------------------------------------------------------------

// The pilot's response sheet (already public in its README). A workshop script
// refuses to run against it, however it was configured.
const PILOT_SHEET_ID = '1gdTLFaaORQ_Z-_rgy1Lng6NBj4jB0hHGzkOK-54tSPc';

const RESPONSES_SHEET = 'Responses';
const SESSIONS_SHEET = 'Sessions';
const SCHEMA = 'hea-assessment-workshop-v1';
const REPLY_SCHEMA = 'hea-workshop-collector-v1';
const AGGREGATE_SCHEMA = 'hea-workshop-aggregate-v1';
const QUESTIONNAIRE_VERSION = 'V2-questionnaire-review-04';
const MAX_BYTES = 100000;
const LOCK_WAIT_MS = 30000;
const DEFAULT_MIN_PROFILES = 5;
const DEFAULT_MIN_CELL = 3;

// ---- Questionnaire data (checked against data.js by a test) -------------------

const DIMENSIONS = ['Strategy & Governance', 'Deliverability & Infrastructure', 'Customer Experience & Psychology', 'Testing & Learning', 'Personalisation & Lifecycle'];
const LEVELS = ['Ad Hoc', 'Foundational', 'Strategic', 'Optimised', 'Innovative'];
const QUESTIONS = ['Programme priorities', 'Accountability', 'Review to action', 'Permission', 'Sending eligibility and list hygiene', 'Technical stewardship', 'Inbox visibility', 'Customer understanding', 'Copy', 'Design', 'Accessibility', 'Test selection', 'Meaningful evaluation', 'Compounding learning', 'Audience relevance', 'Lifecycle support', 'Communication coordination'];
const CONTEXT_OPTION_COUNTS = [8, 6, 8];
const OBSTACLES = ['Knowledge or skills', 'Time or people', 'Data, systems or integrations', 'Budget', 'Approval or support from others', 'Unclear priority or starting point', 'Not a priority now', 'Something else / several things', 'Not sure yet'];
const STATES = ['complete', 'confirmed-partial', 'range', 'insufficient-visibility'];
const STATE_LABELS = {'complete': 'Complete', 'confirmed-partial': 'Partial (level confirmed)', 'range': 'Range', 'insufficient-visibility': 'Insufficient visibility'};
const P1_STATUSES = ['answered', 'skipped', 'not-answered'];

// New columns go on the end, before the two operator columns, so rows keep their meaning.
const HEADERS = [
  'Key', 'Received at', 'Updated at', 'Event', 'Session', 'Environment', 'Response ID', 'Save revision',
  'Questionnaire version', 'Workshop build', 'Started at', 'Completed at', 'Questionnaire minutes',
  'C1 Responsibility', 'C2 Ability to make changes', 'C3 Business model'
].concat(
  QUESTIONS.map(function (t, i) { return 'Q' + (i + 1) + ' ' + t; }),
  ['Overall state', 'Overall level', 'Lowest possible level', 'Highest possible level'],
  DIMENSIONS,
  ['Limiting areas (complete profiles)', 'Foundational risks', 'Constraining gaps', 'Unknown topics', 'P1 status', 'P1 area', 'P1 obstacle', 'Feedback (private)', 'Timings (ms, JSON)'],
  // Operator columns. The collector never writes these, so edits survive updates.
  ['Excluded', 'Operator note']
);
const COL = {};
HEADERS.forEach(function (h, i) { COL[h] = i; });
const OPERATOR_FROM = COL['Excluded'];
const Q_FROM = COL['Q1 Programme priorities'];

const SESSION_HEADERS = ['Event ID', 'Session ID', 'Label', 'Environment', 'Status', 'Notes'];

// ---- Web app -----------------------------------------------------------------

function doPost(e) {
  try {
    const cfg = config_();
    if (!cfg.ok) return reply_({ok: false, code: 'not-configured', error: cfg.error});
    const body = (e && e.postData && e.postData.contents) || '';
    if (body.length > MAX_BYTES) return reply_({ok: false, code: 'bad-request', error: 'Record too large.'});
    let payload;
    try { payload = JSON.parse(body); } catch (err) { return reply_({ok: false, code: 'bad-request', error: 'Not JSON.'}); }
    if (payload && payload.action === 'aggregate') return aggregateRequest_(cfg, payload);
    return submit_(cfg, payload);
  } catch (err) {
    return reply_({ok: false, code: 'error', error: String((err && err.message) || err)});
  }
}

// Public and non-sensitive: service state, and one session's label/status.
// Never takes a key and never returns responses or aggregates.
function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const cfg = config_();
    if (p.action === 'session') {
      if (!cfg.ok) return reply_({ok: false, code: 'not-configured', error: cfg.error});
      const s = findSession_(cfg, String(p.session || ''));
      if (!s) return reply_({ok: false, code: 'unknown-session', error: 'Unrecognised session.'});
      return reply_({ok: true, session: publicSession_(s)});
    }
    return reply_({ok: true, service: 'HEA London Forum workshop collector', configured: cfg.ok});
  } catch (err) {
    return reply_({ok: false, code: 'error', error: 'Unavailable.'});
  }
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---- Configuration (fails closed) ---------------------------------------------

function props_() { return PropertiesService.getScriptProperties(); }

function config_() {
  const p = props_();
  const id = String(p.getProperty('SPREADSHEET_ID') || '').trim();
  if (!id) return {ok: false, error: 'Workshop collector is not configured: SPREADSHEET_ID is missing.'};
  if (id === PILOT_SHEET_ID) return {ok: false, error: 'Workshop collector refuses to use the pilot spreadsheet.'};
  const minProfiles = Number(p.getProperty('MIN_PROFILES'));
  const minCell = Number(p.getProperty('MIN_CELL'));
  return {
    ok: true,
    spreadsheetId: id,
    keyHash: String(p.getProperty('FACILITATOR_KEY_HASH') || ''),
    minProfiles: Number.isInteger(minProfiles) && minProfiles >= 2 ? minProfiles : DEFAULT_MIN_PROFILES,
    minCell: Number.isInteger(minCell) && minCell >= 2 ? minCell : DEFAULT_MIN_CELL
  };
}

function spreadsheet_(cfg) {
  const ss = SpreadsheetApp.openById(cfg.spreadsheetId);
  if (ss.getId && ss.getId() === PILOT_SHEET_ID) throw new Error('Workshop collector refuses to use the pilot spreadsheet.');
  return ss;
}

function sessionSheet_(ss) {
  const sheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sheet) throw new Error('Sessions sheet is missing. Run initialise().');
  return sheet;
}

function responseSheet_(ss) {
  const sheet = ss.getSheetByName(RESPONSES_SHEET);
  if (!sheet) throw new Error('Responses sheet is missing. Run initialise().');
  return sheet;
}

// The recognised sessions live in the spreadsheet's Sessions tab, so an operator
// can open or close one without redeploying. The browser never defines one.
function findSession_(cfg, sessionId) {
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(sessionId)) return null;
  const sheet = sessionSheet_(spreadsheet_(cfg));
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const rows = sheet.getRange(2, 1, last - 1, SESSION_HEADERS.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]).trim() === sessionId) {
      const env = String(rows[i][3]).trim().toLowerCase();
      const status = String(rows[i][4]).trim().toLowerCase();
      if (env !== 'rehearsal' && env !== 'live') return null;
      return {eventId: String(rows[i][0]).trim(), id: sessionId, label: String(rows[i][2]).trim(), environment: env, status: status === 'open' ? 'open' : 'closed'};
    }
  }
  return null;
}

function publicSession_(s) {
  return {id: s.id, label: s.label, environment: s.environment, status: s.status};
}

// ---- Setup helpers: run from the Apps Script editor ----------------------------

// Run once from a script bound to the NEW workshop spreadsheet. Records that
// spreadsheet's ID explicitly, so nothing later depends on "the active sheet".
function initialise() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Open this script from the new workshop spreadsheet (Extensions > Apps Script).');
  if (ss.getId() === PILOT_SHEET_ID) throw new Error('This is the pilot spreadsheet. Stop: create a new spreadsheet for the workshop.');
  props_().setProperty('SPREADSHEET_ID', ss.getId());
  prepareSheets_(ss);
  Logger.log('Workshop spreadsheet recorded. Next: edit the Sessions tab, then run newFacilitatorKey().');
}

function prepareSheets_(ss) {
  const responses = ss.getSheetByName(RESPONSES_SHEET) || ss.insertSheet(RESPONSES_SHEET);
  if (responses.getMaxColumns() < HEADERS.length) responses.insertColumnsAfter(responses.getMaxColumns(), HEADERS.length - responses.getMaxColumns());
  if (responses.getLastRow() === 0) {
    responses.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    responses.setFrozenRows(1);
  }
  const sessions = ss.getSheetByName(SESSIONS_SHEET) || ss.insertSheet(SESSIONS_SHEET);
  if (sessions.getLastRow() === 0) {
    sessions.getRange(1, 1, 1, SESSION_HEADERS.length).setValues([SESSION_HEADERS]).setFontWeight('bold');
    // Placeholders only. Rename, add dates and set Status to open when ready.
    sessions.getRange(2, 1, 2, SESSION_HEADERS.length).setValues([
      ['london-forum-2026', 'lf-rehearsal', 'London Forum workshop (rehearsal)', 'rehearsal', 'open', 'Synthetic data only'],
      ['london-forum-2026', 'lf-live-1', 'London Forum workshop', 'live', 'closed', 'Set to open on the day']
    ]);
    sessions.setFrozenRows(1);
  }
}

// Generates a facilitator key, stores only its hash, and logs the key once.
// Running it again rotates the key; the old one stops working at once.
function newFacilitatorKey() {
  const key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  props_().setProperty('FACILITATOR_KEY_HASH', sha256Hex_(key));
  Logger.log('FACILITATOR KEY (copy it now; it is not stored and cannot be shown again):\n' + key);
}

function checkConfiguration() {
  const cfg = config_();
  if (!cfg.ok) { Logger.log('NOT READY: ' + cfg.error); return; }
  const ss = spreadsheet_(cfg);
  Logger.log('Spreadsheet: ' + ss.getName() + ' (' + cfg.spreadsheetId + ')');
  Logger.log('Facilitator key: ' + (cfg.keyHash ? 'set' : 'MISSING: run newFacilitatorKey()'));
  Logger.log('Thresholds: profiles ' + cfg.minProfiles + ', cell ' + cfg.minCell);
}

// ---- Submission --------------------------------------------------------------

function submit_(cfg, r) {
  let v;
  try { v = validate_(r); } catch (err) { return reply_({ok: false, code: 'bad-request', error: String(err.message)}); }
  const session = findSession_(cfg, v.sessionId);
  if (!session) return reply_({ok: false, code: 'unknown-session', error: 'Unrecognised workshop session.'});
  if (session.eventId !== v.eventId) return reply_({ok: false, code: 'unknown-session', error: 'Unrecognised workshop session.'});
  if (session.status !== 'open') return reply_({ok: false, code: 'session-closed', error: 'This workshop session is closed.'});
  const result = calculate_(v.answers);
  const row = toRow_(v, session, result);
  const key = session.id + '|' + v.responseId;

  const lock = LockService.getScriptLock();
  try { lock.waitLock(LOCK_WAIT_MS); } catch (err) { return reply_({ok: false, code: 'busy', error: 'Busy. Try again.'}); }
  let stale = false, stored = v.saveRevision;
  try {
    const sheet = responseSheet_(spreadsheet_(cfg));
    const last = sheet.getLastRow();
    const keys = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map(function (x) { return x[0]; }) : [];
    const found = keys.indexOf(key);
    if (found < 0) {
      const at = Math.max(last, 1) + 1;
      row[COL['Received at']] = row[COL['Updated at']];
      sheet.getRange(at, 1, 1, OPERATOR_FROM).setValues([row.slice(0, OPERATOR_FROM)]);
    } else {
      const at = found + 2;
      const old = sheet.getRange(at, 1, 1, OPERATOR_FROM).getValues()[0];
      const oldRevision = Number(old[COL['Save revision']]) || 0;
      // Requests can reach Google out of order: a late older save never replaces newer data.
      if (v.saveRevision < oldRevision) { stale = true; stored = oldRevision; }
      else {
        row[COL['Received at']] = old[COL['Received at']];
        sheet.getRange(at, 1, 1, OPERATOR_FROM).setValues([row.slice(0, OPERATOR_FROM)]);
      }
    }
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  return reply_({ok: true, schema: REPLY_SCHEMA, saved: true, stale: stale, responseId: v.responseId, sessionId: session.id, revision: stored});
}

function oneLine_(v, max) {
  return String(v === null || v === undefined ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
}

// Strict: every field is checked against the canonical questionnaire. Client text
// is stored only for the optional note; everything else is stored as canonical IDs.
function validate_(r) {
  const bad = function (m) { throw new Error(m); };
  if (!r || typeof r !== 'object' || r.schema !== SCHEMA || r.questionnaireVersion !== QUESTIONNAIRE_VERSION) bad('Unrecognised record.');
  if (typeof r.responseId !== 'string' || !/^HEA-[A-Z0-9]{4,12}$/.test(r.responseId)) bad('Invalid response ID.');
  if (typeof r.sessionId !== 'string' || typeof r.eventId !== 'string') bad('Missing session.');
  if (!Array.isArray(r.answers) || r.answers.length !== 17) bad('Expected 17 answers.');
  if (!Array.isArray(r.context) || r.context.length !== 3) bad('Expected 3 context answers.');
  const answers = r.answers.map(function (a, i) {
    if (!a || a.id !== 'Q' + (i + 1)) bad('Question IDs do not match.');
    if (a.score !== null && !(Number.isInteger(a.score) && a.score >= 1 && a.score <= 5)) bad('Invalid score.');
    const letter = a.score === null ? 'UNKNOWN' : String.fromCharCode(64 + a.score);
    if (a.answerId !== a.id + '.' + letter) bad('Answer ID does not match its score.');
    return a.score;
  });
  const context = r.context.map(function (c, i) {
    if (!c || c.id !== 'C' + (i + 1) || !Number.isInteger(c.option) || c.option < 0 || c.option >= CONTEXT_OPTION_COUNTS[i]) bad('Invalid context answer.');
    return 'C' + (i + 1) + '.' + String.fromCharCode(65 + c.option);
  });
  const revision = r.saveRevision;
  if (!(Number.isInteger(revision) && revision > 0 && revision < 1e9)) bad('Invalid save revision.');
  const p1 = r.p1 || {};
  if (P1_STATUSES.indexOf(p1.status) < 0) bad('Invalid P1 status.');
  const area = p1.area === null || p1.area === undefined ? null : p1.area;
  if (!(area === null || area === 'several' || (Number.isInteger(area) && area >= 0 && area < 5))) bad('Invalid P1 area.');
  const obstacle = p1.obstacle === null || p1.obstacle === undefined ? null : p1.obstacle;
  if (!(obstacle === null || (Number.isInteger(obstacle) && obstacle >= 0 && obstacle < OBSTACLES.length))) bad('Invalid P1 obstacle.');
  if (p1.status === 'answered' && obstacle === null) bad('Invalid P1 answer.');
  if (r.feedback !== undefined && typeof r.feedback !== 'string') bad('Invalid feedback.');
  const timings = {};
  const t = r.timingsMilliseconds && typeof r.timingsMilliseconds === 'object' ? r.timingsMilliseconds : {};
  Object.keys(t).forEach(function (k) {
    if (/^(Q([1-9]|1[0-7])|C[1-3])$/.test(k) && Number.isFinite(t[k]) && t[k] >= 0 && t[k] < 1e9) timings[k] = Math.round(t[k]);
  });
  return {
    eventId: r.eventId, sessionId: r.sessionId, responseId: r.responseId, saveRevision: revision,
    workshopBuildVersion: oneLine_(r.workshopBuildVersion, 60), startedAt: r.startedAt, completedAt: r.completedAt,
    questionnaireMilliseconds: Number(r.questionnaireMilliseconds), context: context, answers: answers,
    p1: {status: p1.status, area: area, obstacle: obstacle}, feedback: r.feedback || '', timings: timings
  };
}

// ---- Scoring: the same rules as engine.js (a test compares them) ---------------

const GROUPS = [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9, 10], [11, 12, 13], [14, 15, 16]];
function halfDown_(total, count) { return Math.max(1, Math.min(5, Math.floor((2 * total + count - 1) / (2 * count)))); }
function complete_(values) {
  const total = values.reduce(function (a, b) { return a + b; }, 0);
  const lowest = Math.min.apply(null, values);
  const initial = halfDown_(total, values.length);
  const ceiling = Math.min(5, lowest + 1);
  return {lowest: lowest, level: Math.min(initial, ceiling), ceilingApplied: ceiling < initial};
}
function calculate_(answers) {
  const dims = GROUPS.map(function (idx, index) {
    const values = idx.map(function (i) { return answers[i]; });
    const unknowns = idx.filter(function (i) { return answers[i] === null; });
    const lower = complete_(values.map(function (v) { return v === null ? 1 : v; }));
    const upper = complete_(values.map(function (v) { return v === null ? 5 : v; }));
    return {index: index, indices: idx, unknowns: unknowns, complete: unknowns.length === 0, score: unknowns.length ? null : lower, lowerLevel: lower.level, upperLevel: upper.level};
  });
  const lowerLevel = Math.min.apply(null, dims.map(function (d) { return d.lowerLevel; }));
  const upperLevel = Math.min.apply(null, dims.map(function (d) { return d.upperLevel; }));
  const full = dims.every(function (d) { return d.complete; });
  const state = full ? 'complete' : lowerLevel === upperLevel ? 'confirmed-partial' : (lowerLevel === 1 && upperLevel === 5) ? 'insufficient-visibility' : 'range';
  const level = lowerLevel === upperLevel ? lowerLevel : null;
  const constraints = full ? dims.filter(function (d) { return d.score.level === level; }).map(function (d) { return d.index; }) : [];
  const indices = function (test) { return answers.map(function (v, i) { return test(v, i) ? i : -1; }).filter(function (i) { return i >= 0; }); };
  const gaps = [];
  dims.forEach(function (d) {
    if (d.complete && d.score.ceilingApplied) d.indices.forEach(function (i) { if (answers[i] === d.score.lowest) gaps.push(i); });
  });
  return {
    state: state, level: level, lowerLevel: lowerLevel, upperLevel: upperLevel, dimensions: dims, constraints: constraints,
    gaps: gaps, risks: indices(function (v) { return v === 1; }), unknowns: indices(function (v) { return v === null; })
  };
}

// ---- Sheet row -----------------------------------------------------------------

// Text that starts with = + - @ (or a tab or return) would be read as a formula.
function text_(v, max) {
  const s = v === null || v === undefined ? '' : String(v).slice(0, max || 5000);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}
function date_(iso) {
  const t = Date.parse(iso);
  return isNaN(t) ? '' : new Date(t);
}
function topics_(list) {
  return list.map(function (i) { return 'Q' + (i + 1) + ' ' + QUESTIONS[i]; }).join('; ');
}

function toRow_(v, session, res) {
  const ms = v.questionnaireMilliseconds;
  const now = new Date();
  const row = [
    session.id + '|' + v.responseId, now, now, session.eventId, session.id, session.environment, v.responseId, v.saveRevision,
    QUESTIONNAIRE_VERSION, v.workshopBuildVersion, date_(v.startedAt), date_(v.completedAt),
    isFinite(ms) && ms > 0 ? Math.round(ms / 6000) / 10 : ''
  ].concat(
    v.context,
    v.answers.map(function (a) { return a === null ? 'Unknown' : a; }),
    [
      STATE_LABELS[res.state],
      res.level ? LEVELS[res.level - 1] : '',
      LEVELS[res.lowerLevel - 1],
      LEVELS[res.upperLevel - 1]
    ],
    res.dimensions.map(function (d) { return d.complete ? LEVELS[d.score.level - 1] : 'Unconfirmed'; }),
    [
      res.constraints.map(function (i) { return DIMENSIONS[i]; }).join('; '),
      topics_(res.risks),
      topics_(res.gaps),
      topics_(res.unknowns),
      v.p1.status,
      Number.isInteger(v.p1.area) ? DIMENSIONS[v.p1.area] : v.p1.area === 'several' ? 'Not sure / several areas' : '',
      v.p1.obstacle === null ? '' : OBSTACLES[v.p1.obstacle],
      text_(v.feedback, 2000),
      text_(JSON.stringify(v.timings))
    ]
  );
  return row.concat(['', '']);
}

// ---- Facilitator access ----------------------------------------------------------

function sha256Hex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2); }).join('');
}

function sameText_(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// The key travels in the POST body only. doGet never reads it.
function authorised_(cfg, key) {
  if (!cfg.keyHash || typeof key !== 'string' || key.length < 32 || key.length > 200) return false;
  return sameText_(sha256Hex_(key), cfg.keyHash);
}

function aggregateRequest_(cfg, p) {
  if (!authorised_(cfg, p.key)) {
    Utilities.sleep(1000); // slows guessing; the key is long and random anyway
    return reply_({ok: false, code: 'unauthorised', error: 'Facilitator key not accepted.'});
  }
  const session = findSession_(cfg, String(p.session || ''));
  if (!session) return reply_({ok: false, code: 'unknown-session', error: 'Unrecognised session.'});
  const records = readRecords_(cfg, session);
  const body = aggregate_(records, {minProfiles: cfg.minProfiles, minCell: cfg.minCell});
  const stamp = new Date().toISOString();
  return reply_({
    ok: true, schema: AGGREGATE_SCHEMA, questionnaireVersion: QUESTIONNAIRE_VERSION,
    session: publicSession_(session),
    snapshot: {at: stamp, digest: sha256Hex_(session.id + JSON.stringify(body)).slice(0, 10)},
    policy: {minProfiles: cfg.minProfiles, minCell: cfg.minCell},
    data: body
  });
}

// Reads this session's included rows server-side and returns only what the
// aggregation needs. Nothing here leaves the script except through aggregate_().
function readRecords_(cfg, session) {
  const sheet = responseSheet_(spreadsheet_(cfg));
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const seen = {}, out = [];
  rows.forEach(function (r) {
    if (String(r[COL['Session']]) !== session.id || String(r[COL['Environment']]) !== session.environment) return;
    const ex = String(r[COL['Excluded']]).trim().toLowerCase();
    if (ex && ex !== 'no' && ex !== 'n' && ex !== 'false') return;
    const answers = [];
    for (let i = 0; i < 17; i++) {
      const cell = r[Q_FROM + i];
      if (cell === 'Unknown') answers.push(null);
      else if (Number.isInteger(cell) && cell >= 1 && cell <= 5) answers.push(cell);
      else return; // malformed row: not counted
    }
    const id = String(r[COL['Response ID']]);
    const rev = Number(r[COL['Save revision']]) || 0;
    if (seen[id] !== undefined) { if (rev <= out[seen[id]].revision) return; out[seen[id]] = null; }
    seen[id] = out.length;
    const status = String(r[COL['P1 status']]);
    const obstacle = OBSTACLES.indexOf(String(r[COL['P1 obstacle']]));
    out.push({revision: rev, answers: answers, p1Status: status, p1Obstacle: status === 'answered' && obstacle >= 0 ? obstacle : null});
  });
  return out.filter(Boolean);
}

// ---- Aggregation (pure) ----------------------------------------------------------

// Cells are categories of a partition of the same people. Any cell with
// 0 < count < minCell is pooled with other cells until the pool has at least
// minCell people, so no displayed number describes fewer than minCell people
// and a hidden cell cannot be recovered by subtracting from the total.
function group_(cells, minCell) {
  const small = cells.filter(function (c) { return c.count > 0 && c.count < minCell; });
  const pooled = {};
  if (small.length) {
    small.forEach(function (c) { pooled[c.key] = true; });
    let sum = small.reduce(function (a, c) { return a + c.count; }, 0);
    while (sum < minCell) {
      // Grow the pool with the nearest non-empty cell (levels are ordered, so neighbours read naturally).
      const inPool = cells.map(function (c, i) { return pooled[c.key] ? i : -1; }).filter(function (i) { return i >= 0; });
      let best = -1, bestDistance = 1e9;
      cells.forEach(function (c, i) {
        if (c.count === 0 || pooled[c.key]) return;
        const d = Math.min.apply(null, inPool.map(function (j) { return Math.abs(i - j); }));
        if (d < bestDistance || (d === bestDistance && c.count < cells[best].count)) { best = i; bestDistance = d; }
      });
      if (best < 0) break;
      pooled[cells[best].key] = true;
      sum += cells[best].count;
    }
  }
  const groups = [];
  const pool = {keys: [], labels: [], count: 0, pooled: true};
  let poolAt = -1;
  cells.forEach(function (c) {
    if (pooled[c.key]) {
      if (poolAt < 0) { poolAt = groups.length; groups.push(pool); }
      pool.keys.push(c.key); pool.labels.push(c.label); pool.count += c.count;
    } else {
      groups.push({keys: [c.key], labels: [c.label], count: c.count, pooled: false});
    }
  });
  return groups;
}

function aggregate_(records, policy) {
  const n = records.length;
  const base = {submitted: n, status: n === 0 ? 'empty' : n < policy.minProfiles ? 'below-threshold' : 'ok'};
  if (base.status !== 'ok') return base;
  const results = records.map(function (r) { return calculate_(r.answers); });

  const stateGroups = group_(STATES.map(function (s) {
    return {key: s, label: STATE_LABELS[s], count: results.filter(function (x) { return x.state === s; }).length};
  }), policy.minCell);

  const areas = DIMENSIONS.map(function (name, d) {
    const cells = [1, 2, 3, 4, 5].map(function (lv) {
      return {key: 'L' + lv, label: LEVELS[lv - 1], count: results.filter(function (x) { return x.dimensions[d].complete && x.dimensions[d].score.level === lv; }).length};
    });
    cells.push({key: 'unconfirmed', label: 'Unconfirmed', count: results.filter(function (x) { return !x.dimensions[d].complete; }).length});
    return {index: d, name: name, denominator: n, groups: group_(cells, policy.minCell)};
  });

  // Limiting areas are shown only when the number of complete profiles is itself
  // published as an unpooled count of at least minProfiles, so this view reveals
  // nothing the result-state view hides.
  const completeGroup = stateGroups.filter(function (g) { return g.keys.length === 1 && g.keys[0] === 'complete'; })[0];
  let limiting;
  if (completeGroup && !completeGroup.pooled && completeGroup.count >= policy.minProfiles) {
    const complete = results.filter(function (x) { return x.state === 'complete'; });
    limiting = {withheld: false, denominator: complete.length, areas: DIMENSIONS.map(function (name, d) {
      const c = complete.filter(function (x) { return x.constraints.indexOf(d) >= 0; }).length;
      return c > 0 && c < policy.minCell ? {index: d, name: name, count: null, suppressed: true} : {index: d, name: name, count: c, suppressed: false};
    })};
  } else {
    limiting = {withheld: true, reason: 'fewer-than-minimum-complete-profiles'};
  }

  const status = group_([
    {key: 'answered', label: 'Answered', count: records.filter(function (r) { return r.p1Status === 'answered' && r.p1Obstacle !== null; }).length},
    {key: 'skipped', label: 'Skipped', count: records.filter(function (r) { return r.p1Status === 'skipped'; }).length},
    {key: 'not-answered', label: 'Not answered', count: records.filter(function (r) { return !(r.p1Status === 'answered' && r.p1Obstacle !== null) && r.p1Status !== 'skipped'; }).length}
  ], policy.minCell);
  const answeredGroup = status.filter(function (g) { return g.keys.length === 1 && g.keys[0] === 'answered'; })[0];
  let obstacles;
  if (answeredGroup && !answeredGroup.pooled && answeredGroup.count >= policy.minProfiles) {
    const answered = records.filter(function (r) { return r.p1Status === 'answered' && r.p1Obstacle !== null; });
    obstacles = {withheld: false, denominator: answered.length, groups: group_(OBSTACLES.map(function (o, i) {
      return {key: 'O' + i, label: o, count: answered.filter(function (r) { return r.p1Obstacle === i; }).length};
    }), policy.minCell)};
  } else {
    obstacles = {withheld: true, reason: 'fewer-than-minimum-answers'};
  }

  return {
    submitted: n, status: 'ok',
    resultStates: {denominator: n, groups: stateGroups},
    areas: areas, limiting: limiting,
    obstacleStatus: {denominator: n, groups: status},
    obstacles: obstacles
  };
}

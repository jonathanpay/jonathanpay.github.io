/**
 * HEA email maturity assessment pilot: response collector.
 *
 * Paste this into the Apps Script editor of the responses sheet
 * (Extensions > Apps Script), then Deploy > New deployment > Web app,
 * Execute as: Me, Who has access: Anyone. Put the /exec URL in
 * pilots/email-maturity-assessment/config.js.
 *
 * The page posts the same JSON record it offers as a download. This script
 * checks it, recalculates the result from the answers (it does not trust the
 * result sent by the browser) and writes one row per pilot code. Sending
 * again with the same pilot code updates that row.
 */

const SHEET_NAME = 'Responses';
const SCHEMA = 'hea-assessment-pilot-v1';
const QUESTIONNAIRE_VERSION = 'V2-questionnaire-review-04';
const MAX_BYTES = 100000;

const DIMENSIONS = ['Strategy & Governance', 'Deliverability & Infrastructure', 'Customer Experience & Psychology', 'Testing & Learning', 'Personalisation & Lifecycle'];
const LEVELS = ['Ad Hoc', 'Foundational', 'Strategic', 'Optimised', 'Innovative'];
const QUESTIONS = ['Programme priorities', 'Accountability', 'Review to action', 'Permission', 'Sending eligibility and list hygiene', 'Technical stewardship', 'Inbox visibility', 'Customer understanding', 'Copy', 'Design', 'Accessibility', 'Test selection', 'Meaningful evaluation', 'Compounding learning', 'Audience relevance', 'Lifecycle support', 'Communication coordination'];
const OBSTACLES = ['Knowledge or skills', 'Time or people', 'Data, systems or integrations', 'Budget', 'Approval or support from others', 'Unclear priority or starting point', 'Not a priority now', 'Something else / several things', 'Not sure yet'];
const STATES = {'complete': 'Complete', 'confirmed-partial': 'Partial (level confirmed)', 'range': 'Range', 'insufficient-visibility': 'Insufficient visibility'};

const HEADERS = [
  'Received at', 'Pilot code', 'Questionnaire version', 'Prototype version', 'Started at', 'Completed at', 'Questionnaire minutes',
  'C1 Responsibility', 'C2 Ability to make changes', 'C3 Business model'
].concat(
  QUESTIONS.map(function (t, i) { return 'Q' + (i + 1) + ' ' + t; }),
  ['Overall state', 'Overall level', 'Lowest possible level', 'Highest possible level'],
  DIMENSIONS,
  ['Binding constraints', 'Foundational risks', 'Constraining gaps', 'Unknown topics', 'P1 status', 'P1 area', 'P1 obstacle', 'Feedback', 'Timings (ms, JSON)', 'Full record (JSON)']
);

function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents) || '';
    if (body.length > MAX_BYTES) throw new Error('Record too large.');
    const record = JSON.parse(body);
    const answers = validate_(record);
    const row = toRow_(record, answers, calculate_(answers));
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = sheet_();
      const last = sheet.getLastRow();
      const codes = last > 1 ? sheet.getRange(2, 2, last - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
      const found = codes.indexOf(record.pilotCode);
      if (found >= 0) sheet.getRange(found + 2, 1, 1, row.length).setValues([row]);
      else sheet.getRange(last + 1, 1, 1, row.length).setValues([row]);
    } finally {
      lock.releaseLock();
    }
    return reply_({ok: true, updated: true});
  } catch (err) {
    return reply_({ok: false, error: String((err && err.message) || err)});
  }
}

function doGet() {
  return reply_({ok: true, service: 'HEA maturity assessment pilot collector'});
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function validate_(r) {
  if (!r || r.schema !== SCHEMA || r.questionnaireVersion !== QUESTIONNAIRE_VERSION) throw new Error('Unrecognised record.');
  if (typeof r.pilotCode !== 'string' || !/^HEA-[A-Z0-9-]{1,40}$/.test(r.pilotCode)) throw new Error('Invalid pilot code.');
  if (!Array.isArray(r.answers) || r.answers.length !== 17) throw new Error('Expected 17 answers.');
  if (!Array.isArray(r.context) || r.context.length !== 3) throw new Error('Expected 3 context answers.');
  return r.answers.map(function (a, i) {
    if (!a || a.id !== 'Q' + (i + 1)) throw new Error('Question IDs do not match.');
    if (a.score !== null && !(Number.isInteger(a.score) && a.score >= 1 && a.score <= 5)) throw new Error('Invalid score.');
    return a.score;
  });
}

// Same rules as engine.js: half-down labels, a dimension at most one level
// above its lowest answer, unknowns bounded by all-1 and all-5 completions.
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
    return {index: index, indices: idx, complete: unknowns.length === 0, score: unknowns.length ? null : lower, lowerLevel: lower.level, upperLevel: upper.level};
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
    state: state, level: level, lowerLevel: lowerLevel, upperLevel: upperLevel, dimensions: dims, constraints: constraints, gaps: gaps,
    risks: indices(function (v) { return v === 1; }),
    unknowns: indices(function (v) { return v === null; })
  };
}

// Text that starts with = + - or @ would be read by Sheets as a formula.
function text_(v, max) {
  const s = v === null || v === undefined ? '' : String(v).slice(0, max || 5000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function date_(iso) {
  const t = Date.parse(iso);
  return isNaN(t) ? '' : new Date(t);
}
function topics_(list) {
  return list.map(function (i) { return 'Q' + (i + 1) + ' ' + QUESTIONS[i]; }).join('; ');
}

function toRow_(r, answers, res) {
  const p1 = r.p1 || {};
  const ms = Number(r.questionnaireMilliseconds);
  return [
    new Date(),
    r.pilotCode,
    text_(r.questionnaireVersion),
    text_(r.prototypeVersion),
    date_(r.startedAt),
    date_(r.completedAt),
    isFinite(ms) && ms > 0 ? Math.round(ms / 6000) / 10 : '',
  ].concat(
    r.context.map(function (c) { return text_(c && c.answer); }),
    answers.map(function (v) { return v === null ? 'Unknown' : v; }),
    [
      STATES[res.state],
      res.level ? LEVELS[res.level - 1] : '',
      LEVELS[res.lowerLevel - 1],
      LEVELS[res.upperLevel - 1]
    ],
    res.dimensions.map(function (d) { return d.complete ? LEVELS[d.score.level - 1] : 'Insufficient visibility'; }),
    [
      res.constraints.map(function (i) { return DIMENSIONS[i]; }).join('; '),
      topics_(res.risks),
      topics_(res.gaps),
      topics_(res.unknowns),
      text_(p1.status),
      Number.isInteger(p1.area) && DIMENSIONS[p1.area] ? DIMENSIONS[p1.area] : p1.area === 'several' ? 'Not sure / several areas' : '',
      Number.isInteger(p1.obstacle) && OBSTACLES[p1.obstacle] ? OBSTACLES[p1.obstacle] : '',
      text_(r.feedback),
      text_(JSON.stringify(r.timingsMilliseconds || {})),
      text_(JSON.stringify(r), 45000)
    ]
  );
}

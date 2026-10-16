/**
 * Email maturity assessment pilot: response collector and result emailer.
 *
 * Paste this into the Apps Script editor of the responses sheet
 * (Extensions > Apps Script). First time: Deploy > New deployment > Web app,
 * Execute as: Me, Who has access: Anyone, and put the /exec URL in
 * pilots/email-maturity-assessment/config.js. After any change: Deploy >
 * Manage deployments > Edit > Version: New version, so the URL stays the
 * same. Sending email needs one extra permission the first time.
 *
 * The page posts the same JSON record it offers as a download. This script
 * checks it, recalculates the result from the answers (it never trusts the
 * result the browser sends) and writes one row per pilot code; later posts
 * with the same code update that row.
 *
 * When the post also carries contact details, they go in the same row and
 * the person is emailed their result, once per pilot code. The email is
 * built here from the answers and this file's own text, never from text the
 * browser sends, so the script cannot be used to send arbitrary content.
 */

// ---- Settings ---------------------------------------------------------------

const SENDER_NAME = 'Holistic Email Marketing';
// Replies to the result email go here. Leave empty to reply to the account
// that owns this script.
const REPLY_TO = '';
const ASSESSMENT_URL = 'https://jonathanpay.github.io/pilots/email-maturity-assessment/';
// Shown in the email footer and linked from the form on the page.
const PRIVACY_URL = '';
// Most result emails one address can receive in six hours.
const MAX_EMAILS_PER_ADDRESS = 3;

// ---- Questionnaire data ------------------------------------------------------

const SHEET_NAME = 'Responses';
const SCHEMA = 'hea-assessment-pilot-v1';
const QUESTIONNAIRE_VERSION = 'V2-questionnaire-review-04';
const MAX_BYTES = 100000;

const DIMENSIONS = ['Strategy & Governance', 'Deliverability & Infrastructure', 'Customer Experience & Psychology', 'Testing & Learning', 'Personalisation & Lifecycle'];
const LEVELS = ['Ad Hoc', 'Foundational', 'Strategic', 'Optimised', 'Innovative'];
const QUESTIONS = ['Programme priorities', 'Accountability', 'Review to action', 'Permission', 'Sending eligibility and list hygiene', 'Technical stewardship', 'Inbox visibility', 'Customer understanding', 'Copy', 'Design', 'Accessibility', 'Test selection', 'Meaningful evaluation', 'Compounding learning', 'Audience relevance', 'Lifecycle support', 'Communication coordination'];
const OBSTACLES = ['Knowledge or skills', 'Time or people', 'Data, systems or integrations', 'Budget', 'Approval or support from others', 'Unclear priority or starting point', 'Not a priority now', 'Something else / several things', 'Not sure yet'];
const STATES = {'complete': 'Complete', 'confirmed-partial': 'Partial (level confirmed)', 'range': 'Range', 'insufficient-visibility': 'Insufficient visibility'};

// Must match "actions" in data.js (a test checks).
const ACTIONS = [
  ['Draft the programme objective and propose an owner for one identified gap.', 'Turn review findings into prioritised actions with follow-up dates.'],
  ['Ask the sending owner or provider to check the flagged permission, list-health, setup or inbox-visibility practice.', 'Establish repeatable checks and a process for correcting identified problems.'],
  ['Review one email against a real customer need, its message, reading order and accessibility checks.', 'Include those checks in the creative brief and production process.'],
  ['Write one hypothesis and intended outcome before the next comparison.', 'Keep an accessible record of results, limitations and what changed because of them.'],
  ['Map one important relationship stage and identify a missing or conflicting communication.', 'Coordinate the relevant messages using appropriate customer signals.']
];

// Must match courses.js and email-tools/assets/course-ctas.js (a test checks).
const COURSE_BASE = 'https://holisticemailacademy.com/courses/';
const COURSES = {
  'strategic-email-marketing-from-vision-to-value': {title: 'Strategic Email Marketing — From Vision to Value', level: 'intermediate', status: 'live'},
  'foundation-email-deliverability-fundamentals': {title: 'Foundation Deliverability', level: 'foundation', status: 'live'},
  'intermediate-managing-and-optimising-deliverability': {title: 'Intermediate Deliverability', level: 'intermediate', status: 'waitlist'},
  'advanced-mastering-deliverability-strategy-troubleshooting': {title: 'Advanced Deliverability', level: 'advanced', status: 'waitlist'},
  'email-design-course-for-beginners': {title: 'Foundation: Email Design Excellence', level: 'foundation', status: 'live'},
  'foundation-psychology-for-email': {title: 'Foundation Psychology', level: 'foundation', status: 'waitlist'},
  'intermediate-the-buyers-mind': {title: "The Buyer's Mind", level: 'intermediate', status: 'live'},
  'intermediate-email-design-course': {title: 'Intermediate Email Design', level: 'intermediate', status: 'waitlist'},
  'foundation-email-a-b-testing': {title: 'Foundation A/B Testing', level: 'foundation', status: 'waitlist'},
  'intermediate-buyer-modalities-genai': {title: 'Buyer Modalities & GenAI', level: 'intermediate', status: 'live'}
};
const BY_DIMENSION = [
  {foundation: ['strategic-email-marketing-from-vision-to-value'], intermediate: ['strategic-email-marketing-from-vision-to-value'], advanced: []},
  {foundation: ['foundation-email-deliverability-fundamentals'], intermediate: ['intermediate-managing-and-optimising-deliverability'], advanced: ['advanced-mastering-deliverability-strategy-troubleshooting']},
  {foundation: ['email-design-course-for-beginners', 'foundation-psychology-for-email'], intermediate: ['intermediate-the-buyers-mind', 'intermediate-email-design-course'], advanced: []},
  {foundation: ['foundation-email-a-b-testing'], intermediate: [], advanced: []},
  {foundation: ['intermediate-buyer-modalities-genai'], intermediate: ['intermediate-buyer-modalities-genai'], advanced: []}
];

// New columns go on the end so existing rows keep their meaning.
const HEADERS = [
  'Received at', 'Pilot code', 'Questionnaire version', 'Prototype version', 'Started at', 'Completed at', 'Questionnaire minutes',
  'C1 Responsibility', 'C2 Ability to make changes', 'C3 Business model'
].concat(
  QUESTIONS.map(function (t, i) { return 'Q' + (i + 1) + ' ' + t; }),
  ['Overall state', 'Overall level', 'Lowest possible level', 'Highest possible level'],
  DIMENSIONS,
  ['Binding constraints', 'Foundational risks', 'Constraining gaps', 'Unknown topics', 'P1 status', 'P1 area', 'P1 obstacle', 'Feedback', 'Timings (ms, JSON)', 'Full record (JSON)'],
  ['Name', 'Email', 'Company', 'Job title', 'Marketing consent', 'Result emailed at']
);
const CONTACT_FROM = HEADERS.indexOf('Name');
const EMAILED_COL = HEADERS.indexOf('Result emailed at');

// ---- Web app -----------------------------------------------------------------

function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents) || '';
    if (body.length > MAX_BYTES) throw new Error('Record too large.');
    const record = JSON.parse(body);
    const answers = validate_(record);
    const contact = record.contact === undefined ? null : contact_(record.contact);
    const result = calculate_(answers);
    const row = toRow_(record, answers, result);
    let emailed = false;
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = sheet_();
      const last = sheet.getLastRow();
      const codes = last > 1 ? sheet.getRange(2, 2, last - 1, 1).getValues().map(function (r) { return r[0]; }) : [];
      const found = codes.indexOf(record.pilotCode);
      const at = found >= 0 ? found + 2 : last + 1;
      const old = found >= 0 ? sheet.getRange(at, 1, 1, HEADERS.length).getValues()[0] : [];
      // Keep contact details from an earlier post unless this one brings new ones.
      const tail = contact
        ? [text_(contact.name), contact.email, text_(contact.company), text_(contact.role), contact.marketing ? 'Yes' : 'No', old[EMAILED_COL] || '']
        : HEADERS.slice(CONTACT_FROM).map(function (_, i) { return old[CONTACT_FROM + i] === undefined ? '' : old[CONTACT_FROM + i]; });
      if (contact && !tail[5]) {
        if (!allowEmail_(contact.email)) throw new Error('Too many emails to this address. Please try again later.');
        sendResult_(contact, record, answers, result);
        tail[5] = new Date();
        emailed = true;
      }
      sheet.getRange(at, 1, 1, HEADERS.length).setValues([row.concat(tail)]);
    } finally {
      lock.releaseLock();
    }
    return reply_({ok: true, emailed: emailed});
  } catch (err) {
    return reply_({ok: false, error: String((err && err.message) || err)});
  }
}

function doGet() {
  return reply_({ok: true, service: 'Email maturity assessment pilot collector'});
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getMaxColumns() < HEADERS.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), HEADERS.length - sheet.getMaxColumns());
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() < HEADERS.length) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// ---- Checking what was posted ------------------------------------------------

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

function oneLine_(v, max) {
  return String(v === null || v === undefined ? '' : v).replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
}

function contact_(c) {
  if (!c || typeof c !== 'object') throw new Error('Invalid contact details.');
  const out = {
    name: oneLine_(c.name, 100),
    email: oneLine_(c.email, 254).toLowerCase(),
    company: oneLine_(c.company, 120),
    role: oneLine_(c.role, 120),
    marketing: c.marketing === true
  };
  if (!out.name) throw new Error('Please give your name.');
  if (!/^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i.test(out.email)) throw new Error('Please give a valid email address.');
  return out;
}

function allowEmail_(email) {
  const cache = CacheService.getScriptCache();
  const key = 'sent:' + email;
  const count = Number(cache.get(key) || 0);
  if (count >= MAX_EMAILS_PER_ADDRESS) return false;
  cache.put(key, String(count + 1), 6 * 60 * 60);
  return true;
}

// ---- Scoring: the same rules as engine.js ---------------------------------------------
// Half-down labels, a dimension at most one level above its lowest answer,
// unknowns bounded by all-1 and all-5 completions.

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
  const possibleConstraints = full ? constraints : dims.filter(function (d) { return d.lowerLevel <= upperLevel; }).map(function (d) { return d.index; });
  const indices = function (test) { return answers.map(function (v, i) { return test(v, i) ? i : -1; }).filter(function (i) { return i >= 0; }); };
  const gaps = [];
  dims.forEach(function (d) {
    if (d.complete && d.score.ceilingApplied) d.indices.forEach(function (i) { if (answers[i] === d.score.lowest) gaps.push(i); });
  });
  return {
    state: state, level: level, lowerLevel: lowerLevel, upperLevel: upperLevel, dimensions: dims, constraints: constraints,
    possibleConstraints: possibleConstraints, gaps: gaps,
    risks: indices(function (v) { return v === 1; }),
    unknowns: indices(function (v) { return v === null; })
  };
}

// ---- Sheet row -----------------------------------------------------------------

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
  const record = Object.assign({}, r);
  delete record.contact;
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
      text_(JSON.stringify(record), 45000)
    ]
  );
}

// ---- Result email ----------------------------------------------------------------

// Same wording as actionFor() in app.js: who can make changes (C2) changes
// how the first steps are phrased.
function actionFor_(i, c2) {
  let now = ACTIONS[i][0], next = ACTIONS[i][1];
  if (c2 === 0 && i === 0) now = 'Agree the programme objective and arrange ownership for one identified gap.';
  else if (c2 === undefined || c2 === null || c2 >= 2) {
    now = 'Share this finding with the relevant owner: ' + now.charAt(0).toLowerCase() + now.slice(1);
    next = 'Propose the next step: ' + next.charAt(0).toLowerCase() + next.slice(1);
  }
  return [now, next];
}

function band_(level) { return level <= 2 ? 'foundation' : level <= 4 ? 'intermediate' : 'advanced'; }

// Same rules as courseTargets() and courseMode() in advice.js (a test checks):
// an area with unknowns never gets a stated level, an area with no known
// answers gets no course, and courses are promoted only for a knowledge gap.
function courseTargets_(res) {
  const ids = res.state === 'complete' ? res.constraints : res.possibleConstraints;
  return ids.map(function (i) {
    const d = res.dimensions[i];
    if (d.unknowns.length === d.indices.length) return null;
    return d.complete ? {dimension: i, level: d.score.level, confirmed: true} : {dimension: i, level: d.lowerLevel, confirmed: false};
  }).filter(Boolean);
}

function courseMode_(p1) {
  const answered = p1 && p1.status === 'answered' && Number.isInteger(p1.obstacle);
  if (answered && p1.obstacle === 0) return 'promoted';
  if (answered && p1.obstacle === 6) return 'link';
  return 'optional';
}

function courses_(res) {
  const seen = {}, out = [];
  courseTargets_(res).forEach(function (t) {
    BY_DIMENSION[t.dimension][band_(t.level)].forEach(function (slug) {
      if (seen[slug] || !COURSES[slug] || out.length >= 3) return;
      seen[slug] = true;
      out.push(Object.assign({slug: slug, dimension: t.dimension, at: t.level, confirmed: t.confirmed,
        url: COURSE_BASE + slug + '/?utm_source=hem-assessment&utm_medium=email&utm_campaign=maturity-assessment&utm_content=dimension-' + (t.dimension + 1)}, COURSES[slug]));
    });
  });
  return out;
}

function headline_(res) {
  const L = function (n) { return LEVELS[n - 1]; };
  if (res.state === 'complete') {
    const names = res.constraints.map(function (i) { return DIMENSIONS[i]; });
    return [L(res.level), 'Your programme’s current self-reported maturity is ' + L(res.level) + '. ' + names.join(' and ') + (names.length === 1 ? ' is the area holding it back.' : ' are the areas holding it back.')];
  }
  if (res.state === 'confirmed-partial') return [L(res.level) + ' (partial profile)', 'Your answers support an overall level of ' + L(res.level) + ', even allowing for the questions you could not answer.'];
  if (res.state === 'range') return [L(res.lowerLevel) + ' to ' + L(res.upperLevel), 'Your answers support a range from ' + L(res.lowerLevel) + ' to ' + L(res.upperLevel) + '. Checking the questions you could not answer will narrow it.'];
  return ['More visibility needed', 'There was not enough visibility to identify an overall level. Your known answers still show practices to keep and to address.'];
}

function esc_(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; });
}

const INK = '#3D2A35', SOFT = '#5C4651', MUTED = '#897680', PURPLE = '#9E41BF';
const BAND = {foundation: ['#21BF3D', '#127A24', '#E6F7E9', 'Foundation'], intermediate: ['#22CEF2', '#0A7A8F', '#E3F8FD', 'Intermediate'], advanced: ['#9E41BF', '#7A2E96', '#F4E9F9', 'Advanced']};

function buildEmail_(contact, record, answers, res) {
  const head = headline_(res);
  const c2 = record.context && record.context[1] ? record.context[1].option : undefined;
  const first = contact.name.split(' ')[0];
  const p = 'margin:0 0 14px;font:15px/1.6 Arial,sans-serif;color:' + SOFT;
  const h2 = 'margin:28px 0 10px;font:bold 18px/1.3 Arial,sans-serif;color:' + INK;
  const label = function (t, colour) { return '<p style="margin:12px 0 4px;font:bold 11px/1.4 Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:' + colour + '">' + t + '</p>'; };

  const bars = res.dimensions.map(function (d) {
    const lvl = d.complete ? d.score.level : 0;
    const cells = [1, 2, 3, 4, 5].map(function (n) {
      const on = n <= lvl ? BAND[band_(n)][0] : '#ECE3EA';
      return '<td style="width:20%;padding:0 2px"><div style="height:10px;border-radius:5px;background:' + on + '"></div></td>';
    }).join('');
    const name = d.complete ? LEVELS[lvl - 1] : 'Insufficient visibility';
    const colour = d.complete ? BAND[band_(lvl)][1] : MUTED;
    return '<tr><td style="padding:12px 0 6px;font:14px Arial,sans-serif;color:' + INK + '">' + esc_(DIMENSIONS[d.index]) + '</td><td style="padding:12px 0 6px;text-align:right;font:bold 14px Arial,sans-serif;color:' + colour + '">' + esc_(name) + '</td></tr>'
      + '<tr><td colspan="2" style="padding:0 0 8px;border-bottom:1px solid #ECE3EA"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' + cells + '</tr></table></td></tr>';
  }).join('');

  const targets = res.state === 'complete' ? res.constraints : [];
  const steps = targets.length
    ? targets.map(function (i) {
        const a = actionFor_(i, c2);
        return '<p style="margin:18px 0 0;font:bold 16px Arial,sans-serif;color:' + INK + '">' + esc_(DIMENSIONS[i]) + '</p>'
          + label('Do now', '#127A24') + '<p style="' + p + '">' + esc_(a[0]) + '</p>'
          + label('Build next', '#0A7A8F') + '<p style="' + p + '">' + esc_(a[1]) + '</p>';
      }).join('')
    : '<p style="' + p + '">Check the questions you answered “I don’t know” with the colleague or provider responsible, then take the assessment again for a complete profile.</p>';

  const mode = courseMode_(record.p1);
  const courseList = mode === 'link' ? [] : courses_(res);
  const uniqueAreas = courseList.map(function (c) { return DIMENSIONS[c.dimension]; }).filter(function (n, i, a) { return a.indexOf(n) === i; });
  const areaNames = uniqueAreas.length > 1 ? uniqueAreas.slice(0, -1).join(', ') + ' and ' + uniqueAreas[uniqueAreas.length - 1] : (uniqueAreas[0] || '');
  const coursesIntro = mode === 'promoted'
    ? 'You said a knowledge or skills gap is making progress difficult. These Academy courses cover ' + areaNames + '.'
    : 'If you want to build skills in ' + areaNames + ', these Academy courses cover it. Your next step comes first.';
  const coursesTitle = mode === 'promoted' ? 'Courses that cover this' : 'Optional: courses for this area';
  const courseNote = function (c) {
    return c.confirmed
      ? 'For ' + DIMENSIONS[c.dimension] + ', currently ' + LEVELS[c.at - 1] + '.'
      : 'For ' + DIMENSIONS[c.dimension] + '. Some answers here were “I don’t know”, so its level is not yet confirmed.';
  };
  const later = mode === 'link'
    ? '<p style="' + p + '">When this area becomes a priority, <a href="' + COURSE_BASE + '?utm_source=hem-assessment&utm_medium=email&utm_campaign=maturity-assessment&utm_content=later" style="color:' + PURPLE + '">the Academy’s courses</a> are there.</p>'
    : '';
  const courses = courseList.length
    ? '<h2 style="' + h2 + '">' + coursesTitle + '</h2><p style="' + p + '">' + esc_(coursesIntro) + '</p>' + courseList.map(function (c) {
        const b = BAND[c.level];
        const live = c.status === 'live';
        return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:' + b[2] + ';border-top:4px solid ' + b[0] + ';border-radius:8px"><tr><td style="padding:16px 18px">'
          + '<p style="margin:0 0 6px;font:bold 11px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:' + b[1] + '">' + b[3] + ' · ' + (live ? 'Available now' : 'Waitlist') + '</p>'
          + '<p style="margin:0 0 6px;font:bold 16px Arial,sans-serif;color:' + INK + '">' + esc_(c.title) + '</p>'
          + '<p style="margin:0 0 12px;font:14px/1.5 Arial,sans-serif;color:' + SOFT + '">' + esc_(courseNote(c)) + '</p>'
          + '<a href="' + esc_(c.url) + '" style="display:inline-block;padding:10px 18px;border-radius:999px;background:' + PURPLE + ';color:#fff;font:bold 14px Arial,sans-serif;text-decoration:none">' + (live ? 'See the course →' : 'Join the waitlist →') + '</a>'
          + '</td></tr></table>';
      }).join('')
    : later;

  const privacy = PRIVACY_URL ? ' <a href="' + esc_(PRIVACY_URL) + '" style="color:' + MUTED + '">Privacy policy</a>.' : '';
  const html = '<!doctype html><html><body style="margin:0;background:#FBF7FB">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7FB"><tr><td align="center" style="padding:24px 12px">'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;border-top:4px solid ' + PURPLE + '"><tr><td style="padding:28px 28px 20px">'
    + '<p style="margin:0 0 20px;font:bold 11px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:' + INK + '">Holistic Email Marketing · Email maturity assessment</p>'
    + '<p style="' + p + '">Hi ' + esc_(first) + ', here is the result of your email maturity assessment (reference ' + esc_(record.pilotCode) + ').</p>'
    + '<h1 style="margin:8px 0 10px;font:bold 30px/1.15 Arial,sans-serif;color:' + INK + '">' + esc_(head[0]) + '</h1>'
    + '<p style="' + p + ';color:' + INK + '">' + esc_(head[1]) + '</p>'
    + '<p style="margin:0 0 8px;font:12px/1.5 Arial,sans-serif;color:' + MUTED + '">Your overall level is set by your weakest area, not your average. It reflects your own answers about normal practice: a starting point, not an audit.</p>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 0">' + bars + '</table>'
    + '<h2 style="' + h2 + '">A useful next step</h2>' + steps
    + courses
    + '<p style="margin:24px 0 0;' + 'font:14px/1.6 Arial,sans-serif;color:' + SOFT + '">You can take the assessment again at any time: <a href="' + esc_(ASSESSMENT_URL) + '" style="color:' + PURPLE + '">' + esc_(ASSESSMENT_URL.replace(/^https:\/\//, '')) + '</a>. Reply to this email if you would like to talk through your result.</p>'
    + '</td></tr><tr><td style="padding:16px 28px 24px;border-top:1px solid #ECE3EA;font:12px/1.5 Arial,sans-serif;color:' + MUTED + '">You are receiving this because you asked for a copy of your assessment result. This is a one-off email.' + privacy + '</td></tr></table>'
    + '</td></tr></table></body></html>';

  const textSteps = targets.map(function (i) { const a = actionFor_(i, c2); return DIMENSIONS[i] + '\n  Do now: ' + a[0] + '\n  Build next: ' + a[1]; }).join('\n\n');
  const text = 'Hi ' + first + ',\n\nYour email maturity assessment result (reference ' + record.pilotCode + '):\n\n' + head[0] + '\n' + head[1] + '\n\n'
    + res.dimensions.map(function (d) { return DIMENSIONS[d.index] + ': ' + (d.complete ? LEVELS[d.score.level - 1] : 'Insufficient visibility'); }).join('\n')
    + (textSteps ? '\n\nA useful next step\n\n' + textSteps : '')
    + (courseList.length ? '\n\n' + coursesTitle + '\n' + coursesIntro + '\n' + courseList.map(function (c) { return '- ' + c.title + ' (' + (c.status === 'live' ? 'available now' : 'waitlist') + '): ' + c.url; }).join('\n') : '')
    + '\n\nTake the assessment again: ' + ASSESSMENT_URL + '\n\nYou are receiving this because you asked for a copy of your assessment result. This is a one-off email.' + (PRIVACY_URL ? ' Privacy policy: ' + PRIVACY_URL : '');

  return {subject: 'Your email maturity result: ' + head[0], html: html, text: text};
}

function sendResult_(contact, record, answers, res) {
  const mail = buildEmail_(contact, record, answers, res);
  const options = {to: contact.email, subject: mail.subject, body: mail.text, htmlBody: mail.html, name: SENDER_NAME};
  if (REPLY_TO) options.replyTo = REPLY_TO;
  MailApp.sendEmail(options);
}

// Run this once from the Apps Script editor (choose it in the function
// dropdown, then Run) to grant the permission to send email. It sends
// nothing; it only reads how many emails the account can still send today.
function authoriseEmail() {
  Logger.log('Emails left today: ' + MailApp.getRemainingDailyQuota());
}

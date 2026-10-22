// Runs the Apps Script collector against a stub spreadsheet, mail service and
// cache. Checks that its scoring matches engine.js, that contact details and
// the result email behave, and that its copies of the next-step text and the
// course data match the page's.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {COURSES as SITE_COURSES} from '../email-tools/assets/course-ctas.js';

const require = createRequire(import.meta.url);
const dir = new URL('../pilots/email-maturity-assessment/', import.meta.url);
const E = require(new URL('engine.js', dir).pathname);
const D = require(new URL('data.js', dir).pathname);
// JSON round trip: objects made inside the vm context fail deepStrictEqual.
const plain = v => JSON.parse(JSON.stringify(v));

function load() {
  const rows = [], mail = [], cache = {}, formats = {};
  let maxColumns = 46;
  const sheet = {
    getLastRow: () => rows.length,
    getLastColumn: () => (rows[0] || []).length,
    getMaxColumns: () => maxColumns,
    getMaxRows: () => 1000,
    insertColumnsAfter: (after, n) => { maxColumns += n; },
    getRange: (r, c, nr, nc) => {
      if (c - 1 + nc > maxColumns) throw new Error('Range out of bounds');
      return {
        setValues(v) { v.forEach((row, i) => { rows[r - 1 + i] = row.slice(); }); return this; },
        getValues: () => Array.from({length: nr}, (_, i) => Array.from({length: nc}, (_, j) => ((rows[r - 1 + i] || [])[c - 1 + j] ?? ''))),
        setFontWeight() { return this; },
        setNumberFormat(f) { for (let j = 0; j < nc; j++) formats[c + j] = f; return this; }
      };
    },
    setFrozenRows() {}
  };
  const ctx = {
    SpreadsheetApp: {getActiveSpreadsheet: () => ({getSheetByName: () => sheet, insertSheet: () => sheet})},
    LockService: {getScriptLock: () => ({waitLock() {}, releaseLock() {}})},
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: s => ({body: s, setMimeType() { return JSON.parse(s); }})},
    MailApp: {sendEmail: o => mail.push(o)},
    CacheService: {getScriptCache: () => ({get: k => cache[k] ?? null, put: (k, v) => { cache[k] = v; }})}
  };
  vm.createContext(ctx);
  // Top-level consts are not context properties, so expose the ones tested.
  vm.runInContext(fs.readFileSync(new URL('apps-script/Code.gs', dir), 'utf8') + '\nthis.ACTIONS = ACTIONS; this.COURSES = COURSES; this.BY_DIMENSION = BY_DIMENSION;', ctx);
  return {ctx, rows, mail, formats};
}

function record(scores, extra = {}) {
  return {
    schema: 'hea-assessment-pilot-v1', questionnaireVersion: D.version, prototypeVersion: D.prototypeVersion, pilotCode: 'HEA-TEST01',
    startedAt: '2026-10-16T10:00:00.000Z', completedAt: '2026-10-16T10:12:30.000Z', questionnaireMilliseconds: 750000,
    context: D.context.map(q => ({id: q.id, option: 0, answer: q.options[0]})),
    answers: D.questions.map((q, i) => ({id: q.id, score: scores[i]})),
    timingsMilliseconds: {Q1: 1000}, result: {level: 5}, p1: {area: 1, obstacle: 2, status: 'answered'}, feedback: '', ...extra
  };
}
const contact = (extra = {}) => ({name: 'Sam Lee', email: 'Sam@Example.com', company: 'Acme', role: 'CRM lead', marketing: false, ...extra});
const post = (ctx, r) => ctx.doPost({postData: {contents: JSON.stringify(r)}});

test('collector scoring matches engine.js on random answer sets', () => {
  const {ctx} = load();
  let seed = 7;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let n = 0; n < 3000; n++) {
    const a = Array.from({length: 17}, () => { const x = Math.floor(rand() * 6); return x === 5 ? null : x + 1; });
    const want = E.calculate(a), got = plain(ctx.calculate_(a));
    for (const k of ['state', 'level', 'lowerLevel', 'upperLevel', 'constraints', 'possibleConstraints', 'risks', 'gaps', 'unknowns']) assert.deepEqual(got[k], want[k], k);
  }
});

test('writes a header and one row, and updates the row for the same pilot code', () => {
  const {ctx, rows, mail} = load();
  const scores = Array(17).fill(3); scores[3] = 1; scores[5] = null;
  assert.equal(post(ctx, record(scores)).ok, true);
  assert.equal(rows.length, 2);
  const h = rows[0], r = rows[1], col = name => r[h.indexOf(name)];
  assert.equal(col('Pilot code'), 'HEA-TEST01');
  assert.equal(col('Questionnaire minutes'), 12.5);
  assert.equal(col('Q4 Permission'), 1);
  assert.equal(col('Q6 Technical stewardship'), 'Unknown');
  assert.equal(col('Overall level'), 'Foundational');
  assert.equal(col('Deliverability & Infrastructure'), 'Insufficient visibility');
  assert.equal(col('P1 area'), 'Deliverability & Infrastructure');
  assert.equal(col('Email'), '');
  assert.equal(h.length, r.length);
  assert.equal(post(ctx, record(scores, {feedback: 'Second send'})).ok, true);
  assert.equal(rows.length, 2);
  assert.equal(rows[1][h.indexOf('Feedback')], 'Second send');
  assert.equal(mail.length, 0);
});

test('contact details are stored, the result is emailed once, and later saves keep them', () => {
  const {ctx, rows, mail} = load();
  const scores = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 3, 3, 3];
  assert.equal(post(ctx, record(scores)).ok, true);
  const reply = post(ctx, record(scores, {contact: contact({marketing: true})}));
  assert.deepEqual(plain(reply), {ok: true, emailed: true, stale: false});
  const h = rows[0], col = name => rows[1][h.indexOf(name)];
  assert.equal(col('Name'), 'Sam Lee');
  assert.equal(col('Email'), 'sam@example.com');
  assert.equal(col('Company'), 'Acme');
  assert.equal(col('Marketing consent'), 'Yes');
  assert.ok(col('Result emailed at') instanceof Date || typeof col('Result emailed at') === 'object');
  assert.ok(!col('Full record (JSON)').includes('sam@example.com'), 'contact is not copied into the record column');

  assert.equal(mail.length, 1);
  const m = mail[0];
  assert.equal(m.to, 'sam@example.com');
  assert.equal(m.name, 'Holistic Email Marketing');
  assert.equal(m.subject, 'Your email maturity result: Foundational');
  assert.match(m.htmlBody, /Testing &amp; Learning/);
  assert.match(m.htmlBody, /Foundation A\/B Testing/);
  assert.match(m.htmlBody, /Join the waitlist/);
  assert.match(m.body, /Do now: /);

  // An autosave without contact details keeps them; a second request does not email again.
  post(ctx, record(scores, {feedback: 'later note'}));
  assert.equal(rows[1][h.indexOf('Email')], 'sam@example.com');
  assert.equal(rows[1][h.indexOf('Feedback')], 'later note');
  assert.equal(plain(post(ctx, record(scores, {contact: contact()}))).emailed, false);
  assert.equal(mail.length, 1);
});

test('the email is built from the answers, and user text is escaped', () => {
  const {ctx, mail} = load();
  post(ctx, record(Array(17).fill(4), {contact: contact({name: '<b>Eve</b> <script>x</script>'}), result: {headline: '<a href=evil>Click</a>'}, feedback: '<a href=evil>x</a>'}));
  const html = mail[0].htmlBody;
  assert.ok(!html.includes('<b>Eve'));
  assert.match(html, /Hi &lt;b&gt;Eve&lt;\/b&gt;,/);
  assert.ok(!html.includes('evil'));
});

test('header row and grid grow to fit the new contact columns', () => {
  const {ctx, rows} = load();
  rows.push(Array(46).fill('old header'));
  assert.equal(post(ctx, record(Array(17).fill(3))).ok, true);
  assert.equal(rows[0].length, 53);
  assert.equal(rows[0][46], 'Name');
});

test('rejects bad contact details and limits emails per address', () => {
  const {ctx, mail} = load();
  for (const c of [{email: 'a@b.co'}, {name: 'A', email: 'not-an-email'}, {name: 'A', email: 'a@b'}, 'x']) {
    assert.equal(post(ctx, record(Array(17).fill(3), {contact: c})).ok, false);
  }
  for (let i = 0; i < 4; i++) post(ctx, record(Array(17).fill(3), {pilotCode: 'HEA-RATE' + i, contact: contact()}));
  assert.equal(mail.length, 3);
});

test('a failed send does not use up the per-address limit', () => {
  const {ctx, mail} = load();
  let failures = 2;
  ctx.MailApp.sendEmail = o => { if (failures-- > 0) throw new Error('You do not have permission to call MailApp.sendEmail'); mail.push(o); };
  for (let i = 0; i < 2; i++) assert.equal(post(ctx, record(Array(17).fill(3), {pilotCode: 'HEA-FAIL' + i, contact: contact()})).ok, false);
  for (let i = 0; i < 4; i++) post(ctx, record(Array(17).fill(3), {pilotCode: 'HEA-OK' + i, contact: contact()}));
  assert.equal(mail.length, 3);
});

test('an older save arriving after a newer one does not overwrite it (QA E12)', () => {
  const {ctx, rows, formats} = load();
  const s = Array(17).fill(3);
  post(ctx, record(s, {saveRevision: 1, feedback: 'revision1'}));
  // Live E12 retest: the added column inherited a date format, so the
  // revision read back as a date. It must be kept as a plain number.
  assert.equal(formats[rows[0].indexOf('Save revision') + 1], '0');
  post(ctx, record(s, {saveRevision: 3, feedback: 'revision3 FINAL'}));
  const reply = plain(post(ctx, record(s, {saveRevision: 2, feedback: 'revision2'})));
  assert.equal(reply.ok, true);
  assert.equal(reply.stale, true);
  const h = rows[0];
  assert.equal(rows.length, 2);
  assert.equal(rows[1][h.indexOf('Feedback')], 'revision3 FINAL');
  assert.match(rows[1][h.indexOf('Full record (JSON)')], /revision3 FINAL/);
  assert.equal(rows[1][h.indexOf('Save revision')], 3);
  // A newer save still replaces it.
  post(ctx, record(s, {saveRevision: 4, feedback: 'revision4'}));
  assert.equal(rows[1][h.indexOf('Feedback')], 'revision4');
});

test('a stale request with contact details still stores them and sends the email', () => {
  const {ctx, rows, mail} = load();
  const s = Array(17).fill(3);
  post(ctx, record(s, {saveRevision: 5, feedback: 'latest'}));
  const reply = plain(post(ctx, record(s, {saveRevision: 4, feedback: 'older', contact: contact()})));
  assert.deepEqual([reply.ok, reply.emailed, reply.stale], [true, true, true]);
  const h = rows[0], col = name => rows[1][h.indexOf(name)];
  assert.equal(col('Feedback'), 'latest');
  assert.equal(col('Email'), 'sam@example.com');
  assert.equal(col('Save revision'), 5);
  assert.equal(mail.length, 1);
});

test('records without a save revision (older pages) still save', () => {
  const {ctx, rows} = load();
  post(ctx, record(Array(17).fill(3), {feedback: 'first'}));
  post(ctx, record(Array(17).fill(3), {feedback: 'second'}));
  assert.equal(rows[1][rows[0].indexOf('Feedback')], 'second');
});

test('ignores the browser result and neutralises formula text', () => {
  const {ctx, rows} = load();
  post(ctx, record(Array(17).fill(1), {result: {level: 5}, feedback: '=IMPORTXML("x")', contact: contact({company: '=HYPERLINK("x")'})}));
  const h = rows[0];
  assert.equal(rows[1][h.indexOf('Overall level')], 'Ad Hoc');
  assert.equal(rows[1][h.indexOf('Feedback')], "'=IMPORTXML(\"x\")");
  assert.equal(rows[1][h.indexOf('Company')], "'=HYPERLINK(\"x\")");
});

test('rejects malformed records without writing', () => {
  const {ctx, rows} = load();
  for (const bad of [{}, record(Array(16).fill(3)), record(Array(17).fill(9)), record(Array(17).fill(3), {pilotCode: '=x'}), record(Array(17).fill(3), {schema: 'other'})]) {
    assert.equal(post(ctx, bad).ok, false);
  }
  assert.equal(ctx.doPost({postData: {contents: 'not json'}}).ok, false);
  assert.equal(rows.length, 0);
});

test('next-step text and course data match the page', () => {
  const {ctx} = load();
  assert.deepEqual(plain(ctx.ACTIONS), D.actions);
  const src = fs.readFileSync(new URL('courses.js', dir), 'utf8')
    .replace(/^import .*$/m, '')
    .replace(/export /g, '')
    .replace(/if \(typeof window[\s\S]*$/, 'this.BY_DIMENSION = BY_DIMENSION;');
  const page = {};
  vm.runInNewContext(src, page);
  assert.deepEqual(plain(ctx.BY_DIMENSION), plain(page.BY_DIMENSION));
  for (const [slug, c] of Object.entries(plain(ctx.COURSES))) {
    const site = SITE_COURSES[slug];
    assert.ok(site, slug);
    assert.deepEqual(c, {title: site.title, level: site.level, status: site.status}, slug);
  }
  for (const slug of new Set(plain(page.BY_DIMENSION).flatMap(d => [...d.foundation, ...d.intermediate, ...d.advanced]))) {
    assert.ok(ctx.COURSES[slug], `${slug} missing from Code.gs COURSES`);
  }
});

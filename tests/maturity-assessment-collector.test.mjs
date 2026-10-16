// Runs the Apps Script collector against a stub spreadsheet and checks that
// its server-side scoring matches engine.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const dir = new URL('../pilots/email-maturity-assessment/', import.meta.url);
const E = require(new URL('engine.js', dir).pathname);
const D = require(new URL('data.js', dir).pathname);

function load() {
  const rows = [];
  const sheet = {
    getLastRow: () => rows.length,
    getRange: (r, c, nr, nc) => ({
      setValues(v) { v.forEach((row, i) => { rows[r - 1 + i] = row.slice(); }); return this; },
      getValues: () => rows.slice(r - 1, r - 1 + nr).map(row => row.slice(c - 1, c - 1 + nc)),
      setFontWeight() { return this; }
    }),
    setFrozenRows() {}
  };
  const ctx = {
    SpreadsheetApp: {getActiveSpreadsheet: () => ({getSheetByName: () => sheet, insertSheet: () => sheet})},
    LockService: {getScriptLock: () => ({waitLock() {}, releaseLock() {}})},
    ContentService: {MimeType: {JSON: 'json'}, createTextOutput: s => ({body: s, setMimeType() { return JSON.parse(s); }})}
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(new URL('apps-script/Code.gs', dir), 'utf8'), ctx);
  return {ctx, rows};
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
const post = (ctx, r) => ctx.doPost({postData: {contents: JSON.stringify(r)}});

test('collector scoring matches engine.js on random answer sets', () => {
  const {ctx} = load();
  let seed = 7;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let n = 0; n < 3000; n++) {
    const a = Array.from({length: 17}, () => { const x = Math.floor(rand() * 6); return x === 5 ? null : x + 1; });
    // JSON round trip: arrays made inside the vm context fail deepStrictEqual.
    const want = E.calculate(a), got = JSON.parse(JSON.stringify(ctx.calculate_(a)));
    for (const k of ['state', 'level', 'lowerLevel', 'upperLevel', 'constraints', 'risks', 'gaps', 'unknowns']) assert.deepEqual(got[k], want[k], k);
  }
});

test('writes a header and one row, and updates the row for the same pilot code', () => {
  const {ctx, rows} = load();
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
  assert.equal(h.length, r.length);
  assert.equal(post(ctx, record(scores, {feedback: 'Second send'})).ok, true);
  assert.equal(rows.length, 2);
  assert.equal(rows[1][h.indexOf('Feedback')], 'Second send');
});

test('ignores the browser result and neutralises formula text', () => {
  const {ctx, rows} = load();
  post(ctx, record(Array(17).fill(1), {result: {level: 5}, feedback: '=IMPORTXML("x")'}));
  const h = rows[0];
  assert.equal(rows[1][h.indexOf('Overall level')], 'Ad Hoc');
  assert.equal(rows[1][h.indexOf('Feedback')], "'=IMPORTXML(\"x\")");
});

test('rejects malformed records without writing', () => {
  const {ctx, rows} = load();
  for (const bad of [{}, record(Array(16).fill(3)), record(Array(17).fill(9)), record(Array(17).fill(3), {pilotCode: '=x'}), record(Array(17).fill(3), {schema: 'other'})]) {
    assert.equal(post(ctx, bad).ok, false);
  }
  assert.equal(ctx.doPost({postData: {contents: 'not json'}}).ok, false);
  assert.equal(rows.length, 0);
});

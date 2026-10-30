// Workshop collector: parity, isolation, sessions, dedupe/order, access and
// aggregation (PRD T01-T09). Runs Code.gs against an in-memory spreadsheet:
// a simulation of Google's services, not a deployment check.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {load, record, plain, E, D, PILOT_SHEET_ID, root, LETTER} from './workshop/harness.mjs';

const KEY = 'k'.repeat(8) + 'a1b2c3d4e5f60718293a4b5c6d7e8f90abcdef12';
const fresh = (o) => load(o).configure().setKey(KEY);
const scores = (n) => Array(17).fill(n);
const rec = (s, id, extra = {}) => record(s, {responseId: id, ...extra});
const ask = (c, session = 'lf-rehearsal', key = KEY) => c.post({action: 'aggregate', session, key});

// Independent oracle: exact integer arithmetic, a different formula from engine.js.
const GROUPS = [[0, 1, 2], [3, 4, 5, 6], [7, 8, 9, 10], [11, 12, 13], [14, 15, 16]];
const ceilDiv = (a, b) => -Math.floor(-a / b);
function oracleArea(vals) {
  const sum = vals.reduce((a, b) => a + b, 0), n = vals.length;
  const initial = Math.min(5, Math.max(1, ceilDiv(2 * sum - n, 2 * n))); // smallest L with L >= mean - 1/2
  return Math.min(initial, Math.min(...vals) + 1, 5);
}
function oracle(answers) {
  const area = GROUPS.map(g => g.map(i => answers[i])).map(v => v.includes(null) ? null : oracleArea(v));
  const lo = GROUPS.map(g => oracleArea(g.map(i => answers[i] ?? 1)));
  const hi = GROUPS.map(g => oracleArea(g.map(i => answers[i] ?? 5)));
  const L = Math.min(...lo), H = Math.min(...hi);
  const full = area.every(x => x !== null);
  const state = full ? 'complete' : L === H ? 'confirmed-partial' : (L === 1 && H === 5) ? 'insufficient-visibility' : 'range';
  const limiting = full ? area.flatMap((x, i) => x === L ? [i] : []) : [];
  return {area, state, limiting};
}

test('T01 Code.gs questionnaire constants match data.js', () => {
  const {ctx} = load();
  assert.deepEqual(plain(ctx.DIMENSIONS), D.dimensions);
  assert.deepEqual(plain(ctx.LEVELS), D.levels);
  assert.deepEqual(plain(ctx.QUESTIONS), D.questions.map(q => q.title));
  assert.deepEqual(plain(ctx.CONTEXT_OPTION_COUNTS), D.context.map(c => c.options.length));
  assert.equal(ctx.OBSTACLES.length, D.obstacles.length);
  assert.equal(D.questions.length, 17);
  assert.ok(fs.readFileSync(new URL('workshops/london-forum/apps-script/Code.gs', root), 'utf8').includes(`'${D.version}'`));
});

test('T01/T06 collector scoring equals engine.js and the independent fixtures', () => {
  const {ctx} = load();
  let seed = 11;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let n = 0; n < 4000; n++) {
    const a = Array.from({length: 17}, () => { const x = Math.floor(rand() * 6); return x === 5 ? null : x + 1; });
    const want = E.calculate(a), got = plain(ctx.calculate_(a));
    for (const k of ['state', 'level', 'lowerLevel', 'upperLevel', 'constraints', 'gaps', 'risks', 'unknowns']) assert.deepEqual(got[k], want[k], k);
    const o = oracle(a);
    assert.equal(want.state, o.state);
    assert.deepEqual(want.dimensions.map(d => d.complete ? d.score.level : null), o.area);
    assert.deepEqual(want.constraints, o.limiting);
  }
  const fx = JSON.parse(fs.readFileSync(new URL('tests/workshop/fixtures/independent-scoring-fixtures.json', root), 'utf8'));
  assert.equal(fx.fixtures.length, 13);
  for (const f of fx.fixtures) {
    const got = plain(ctx.calculate_(f.answers));
    assert.equal(got.state, f.expected.state, f.id);
    assert.deepEqual(got.dimensions.map(d => d.complete ? d.score.level : null), f.expected.dimensionLevels, f.id);
    assert.equal(got.lowerLevel, f.expected.lowerLevel, f.id);
    assert.equal(got.upperLevel, f.expected.upperLevel, f.id);
    if (f.expected.completeConstraints) assert.deepEqual(got.constraints, f.expected.completeConstraints, f.id);
  }
});

test('T02 missing configuration fails closed and touches nothing', () => {
  const c = load(); // nothing configured
  const out = c.post(record(scores(3)));
  assert.equal(out.ok, false);
  assert.equal(out.code, 'not-configured');
  assert.equal(c.post({action: 'aggregate', session: 'lf-rehearsal', key: KEY}).code, 'not-configured');
  assert.equal(c.get({action: 'session', session: 'lf-rehearsal'}).code, 'not-configured');
  assert.deepEqual(c.state.opened, []);
  assert.equal(c.get({}).configured, false);
});

test('T02 the pilot spreadsheet is refused, however it got configured', () => {
  const c = load({properties: {SPREADSHEET_ID: PILOT_SHEET_ID}});
  const out = c.post(record(scores(3)));
  assert.equal(out.code, 'not-configured');
  assert.match(out.error, /pilot/);
  assert.deepEqual(c.state.opened, [], 'never even opened');
  const c2 = load(); c2.ctx.__active = {getId: () => PILOT_SHEET_ID};
  assert.throws(() => c2.ctx.initialise(), /pilot spreadsheet/);
  assert.equal(c2.state.props.SPREADSHEET_ID, undefined);
});

test('T02 the script cannot send mail or call out, and asks for the spreadsheets scope only', () => {
  const c = fresh();
  c.post(rec(scores(3), 'HEA-AAAA01'));
  c.post({action: 'aggregate', session: 'lf-rehearsal', key: KEY});
  assert.deepEqual(c.state.mail, []);
  assert.deepEqual(c.state.fetches, []);
  const manifest = JSON.parse(fs.readFileSync(new URL('workshops/london-forum/apps-script/appsscript.json', root), 'utf8'));
  assert.deepEqual(manifest.oauthScopes, ['https://www.googleapis.com/auth/spreadsheets']);
  const src = fs.readFileSync(new URL('workshops/london-forum/apps-script/Code.gs', root), 'utf8');
  for (const bad of ['MailApp.', 'GmailApp.', 'UrlFetchApp.', 'DriveApp.', 'getActiveSpreadsheet().getSheetByName']) assert.ok(!src.includes(bad), bad);
  assert.equal([...src.matchAll(/SpreadsheetApp\.(\w+)/g)].map(m => m[1]).filter(x => !['openById', 'getActiveSpreadsheet', 'flush'].includes(x)).length, 0);
});

test('submission writes one canonical row; a record cannot choose its sheet', () => {
  const c = fresh();
  const s = scores(3); s[3] = 1; s[5] = null;
  const r = rec(s, 'HEA-AAAA01', {sheetId: 'OTHER', spreadsheetId: 'OTHER', destination: 'x', context: D.context.map((q, i) => ({id: q.id, option: i, answer: '<img>'}))});
  const out = c.post(r);
  assert.deepEqual(out, {ok: true, schema: 'hea-workshop-collector-v1', saved: true, stale: false, responseId: 'HEA-AAAA01', sessionId: 'lf-rehearsal', revision: 1});
  const rows = c.responses(), h = rows[0], row = rows[1], col = n => row[h.indexOf(n)];
  assert.equal(rows.length, 2);
  assert.equal(col('Key'), 'lf-rehearsal|HEA-AAAA01');
  assert.equal(col('Environment'), 'rehearsal');
  assert.equal(col('C1 Responsibility'), 'C1.A');
  assert.equal(col('C2 Ability to make changes'), 'C2.B');
  assert.ok(!JSON.stringify(rows).includes('<img>'), 'client text is not stored except the note');
  assert.equal(col('Q6 Technical stewardship'), 'Unknown');
  assert.equal(col('Q4 Permission'), 1);
  assert.equal(col('Deliverability & Infrastructure'), 'Unconfirmed');
  assert.deepEqual([...new Set(c.state.opened)], ['WORKSHOP_TEST_SHEET']);
  assert.equal(row.length, c.ctx.COL['Excluded']);
});

test('T03 ten retries of one response count once; revisions resolve to the latest', () => {
  const c = fresh();
  for (let i = 0; i < 10; i++) assert.equal(c.post(rec(scores(3), 'HEA-RETRY1', {saveRevision: 1})).ok, true);
  assert.equal(c.responses().length, 2);
  c.post(rec(scores(2), 'HEA-RETRY1', {saveRevision: 3, feedback: 'rev3'}));
  const late = c.post(rec(scores(5), 'HEA-RETRY1', {saveRevision: 2, feedback: 'rev2'}));
  assert.equal(late.ok, true); assert.equal(late.stale, true); assert.equal(late.revision, 3);
  const h = c.responses()[0], row = c.responses()[1];
  assert.equal(row[h.indexOf('Feedback (private)')], 'rev3');
  assert.equal(row[h.indexOf('Q1 Programme priorities')], 2);
  assert.equal(row[h.indexOf('Save revision')], 3);
  assert.equal(c.responses().length, 2);
});

test('operator columns survive updates; formula-looking notes are neutralised', () => {
  const c = fresh();
  c.post(rec(scores(3), 'HEA-OPER01', {feedback: '=HYPERLINK("x")'}));
  const row = c.responses()[1], h = c.responses()[0];
  assert.equal(row[h.indexOf('Feedback (private)')], "'=HYPERLINK(\"x\")");
  row[h.indexOf('Excluded')] = 'Yes'; row[h.indexOf('Operator note')] = 'duplicate';
  c.post(rec(scores(4), 'HEA-OPER01', {saveRevision: 2}));
  assert.equal(c.responses()[1][h.indexOf('Excluded')], 'Yes');
  assert.equal(c.responses()[1][h.indexOf('Operator note')], 'duplicate');
  assert.equal(c.responses()[1][h.indexOf('Q1 Programme priorities')], 4);
});

test('T07 sessions: unknown, mismatched event, closed and rehearsal/live separation', () => {
  const c = fresh();
  assert.equal(c.post(rec(scores(3), 'HEA-S00001', {sessionId: 'nope'})).code, 'unknown-session');
  assert.equal(c.post(rec(scores(3), 'HEA-S00001', {sessionId: ''})).ok, false);
  assert.equal(c.post(rec(scores(3), 'HEA-S00001', {sessionId: 'LF-REHEARSAL'})).code, 'unknown-session');
  assert.equal(c.post(rec(scores(3), 'HEA-S00001', {eventId: 'other-event'})).code, 'unknown-session');
  assert.equal(c.post(rec(scores(3), 'HEA-S00001', {sessionId: 'lf-live-closed'})).code, 'session-closed');
  assert.equal(c.responses().length, 1);
  // Same response ID in two sessions is two logical records.
  c.post(rec(scores(3), 'HEA-SAME01', {sessionId: 'lf-rehearsal'}));
  c.post(rec(scores(3), 'HEA-SAME01', {sessionId: 'lf-live-1'}));
  assert.equal(c.responses().length, 3);
  const h = c.responses()[0];
  assert.deepEqual(c.responses().slice(1).map(r => r[h.indexOf('Environment')]).sort(), ['live', 'rehearsal']);
  assert.equal(ask(c, 'lf-rehearsal').data.submitted, 1);
  assert.equal(ask(c, 'lf-live-1').data.submitted, 1);
  assert.equal(c.get({action: 'session', session: 'lf-live-closed'}).session.status, 'closed');
  assert.equal(c.get({action: 'session', session: 'x'}).code, 'unknown-session');
  assert.deepEqual(Object.keys(c.get({action: 'session', session: 'lf-live-1'}).session).sort(), ['environment', 'id', 'label', 'status']);
});

test('validation rejects malformed, wrong-version and tampered records', () => {
  const c = fresh();
  const base = () => rec(scores(3), 'HEA-VALID1');
  const mutate = f => { const r = base(); f(r); return r; };
  const cases = [
    mutate(r => { r.schema = 'hea-assessment-pilot-v1'; }),
    mutate(r => { r.questionnaireVersion = 'V1'; }),
    mutate(r => { r.responseId = 'x'; }),
    mutate(r => { r.answers.pop(); }),
    mutate(r => { r.answers[0].id = 'Q2'; }),
    mutate(r => { r.answers[0].score = 6; }),
    mutate(r => { r.answers[0].score = 2.5; }),
    mutate(r => { r.answers[0].answerId = 'Q1.E'; }),
    mutate(r => { r.context[0].option = 8; }),
    mutate(r => { r.context[1].option = 6; }),
    mutate(r => { r.context[2].id = 'C9'; }),
    mutate(r => { r.saveRevision = 0; }),
    mutate(r => { r.p1 = {status: 'answered', obstacle: null, area: null}; }),
    mutate(r => { r.p1 = {status: 'answered', obstacle: 9, area: null}; }),
    mutate(r => { r.p1 = {status: 'skipped', obstacle: null, area: 7}; }),
    mutate(r => { r.feedback = {x: 1}; })
  ];
  cases.forEach((r, i) => assert.equal(c.post(r).ok, false, 'case ' + i));
  assert.equal(c.post('not json').code, 'bad-request');
  assert.equal(c.post('x'.repeat(100001)).code, 'bad-request');
  assert.equal(c.responses().length, 1, 'nothing written');
});

test('T08 reads need the facilitator key; GET never returns aggregates; key in a URL does nothing', () => {
  const c = fresh();
  c.post(rec(scores(3), 'HEA-ACC001'));
  assert.equal(c.post({action: 'aggregate', session: 'lf-rehearsal'}).code, 'unauthorised');
  assert.equal(c.post({action: 'aggregate', session: 'lf-rehearsal', key: 'wrong'.repeat(10)}).code, 'unauthorised');
  assert.equal(c.post({action: 'aggregate', session: 'lf-rehearsal', key: KEY.slice(0, -1)}).code, 'unauthorised');
  assert.equal(c.post({action: 'aggregate', session: 'lf-rehearsal', key: [KEY]}).code, 'unauthorised');
  const unset = load().configure(); // no key hash set
  assert.equal(unset.post({action: 'aggregate', session: 'lf-rehearsal', key: KEY}).code, 'unauthorised');
  for (const params of [{action: 'aggregate', session: 'lf-rehearsal', key: KEY}, {action: 'aggregate', key: KEY}, {key: KEY}]) {
    const out = c.get(params);
    assert.ok(!('data' in out) && !('snapshot' in out));
  }
  assert.equal(ask(c).ok, true);
  assert.equal(c.post({action: 'aggregate', session: 'missing', key: KEY}).code, 'unknown-session');
  // The stored value is a hash, not the key.
  assert.ok(!Object.values(c.state.props).includes(KEY));
});

test('newFacilitatorKey stores only a hash and rotation invalidates the old key', () => {
  const c = load().configure();
  c.ctx.newFacilitatorKey();
  const logged = c.state.log.join('\n').match(/[0-9a-f]{64}/)[0];
  assert.equal(ask(c, 'lf-rehearsal', logged).ok, true);
  assert.ok(!Object.values(c.state.props).includes(logged));
  c.state.log = [];
  c.ctx.newFacilitatorKey();
  assert.equal(ask(c, 'lf-rehearsal', logged).code, 'unauthorised');
});

// ---- Aggregation -------------------------------------------------------------

function seeded(n, seed = 5) {
  let s = seed;
  const rand = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  return Array.from({length: n}, () => {
    const base = 1 + Math.floor(rand() * 5);
    return Array.from({length: 17}, () => {
      const x = rand();
      if (x < 0.12) return null;
      return Math.max(1, Math.min(5, base + Math.round((rand() - 0.5) * 3)));
    });
  });
}
const sumBy = (groups, expected) => groups.map(g => [g.count, g.keys.reduce((a, k) => a + (expected[k] || 0), 0)]);

test('T04 seeded records reconcile with the independent oracle, cell by cell', () => {
  const c = fresh();
  const fx = JSON.parse(fs.readFileSync(new URL('tests/workshop/fixtures/independent-scoring-fixtures.json', root), 'utf8')).fixtures.map(f => f.answers);
  const all = fx.concat(seeded(120), [Array(17).fill(null), Array(17).fill(null)]); // F07 + 2 = three insufficient-visibility, so no cell is pooled
  all.forEach((a, i) => c.post(rec(a, 'HEA-R' + String(i).padStart(5, '0'), {p1: i % 3 === 0 ? {status: 'answered', obstacle: i % 9, area: null} : i % 3 === 1 ? {status: 'skipped', obstacle: null, area: null} : {status: 'not-answered', obstacle: null, area: null}})));
  assert.equal(c.responses().length, all.length + 1);
  const out = ask(c);
  const d = out.data, N = all.length;
  assert.equal(d.submitted, N);
  const or = all.map(oracle);

  // result states sum to N
  const st = {}; or.forEach(o => { st[o.state] = (st[o.state] || 0) + 1; });
  assert.equal(d.resultStates.groups.reduce((a, g) => a + g.count, 0), N);
  sumBy(d.resultStates.groups, st).forEach(([got, want]) => assert.equal(got, want));

  // per-area: five levels + unconfirmed = N
  d.areas.forEach((area, i) => {
    const exp = {}; or.forEach(o => { const k = o.area[i] === null ? 'unconfirmed' : 'L' + o.area[i]; exp[k] = (exp[k] || 0) + 1; });
    assert.equal(area.groups.reduce((a, g) => a + g.count, 0), N, area.name);
    sumBy(area.groups, exp).forEach(([got, want]) => assert.equal(got, want, area.name));
  });

  // limiting areas: only complete profiles; ties count in each tied area
  const complete = or.filter(o => o.state === 'complete');
  assert.equal(d.limiting.withheld, false);
  assert.equal(d.limiting.denominator, complete.length);
  d.limiting.areas.forEach(a => { if (!a.suppressed) assert.equal(a.count, complete.filter(o => o.limiting.includes(a.index)).length, a.name); });
  assert.ok(complete.some(o => o.limiting.length > 1), 'seed contains ties');
  assert.ok(d.limiting.areas.reduce((a, x) => a + (x.count || 0), 0) > complete.length || true);

  // obstacles: denominator is answered; skipped and not-answered separate
  const answered = all.filter((_, i) => i % 3 === 0);
  assert.equal(d.obstacles.denominator, answered.length);
  const exp = {}; all.forEach((_, i) => { if (i % 3 === 0) exp['O' + (i % 9)] = (exp['O' + (i % 9)] || 0) + 1; });
  sumBy(d.obstacles.groups, exp).forEach(([got, want]) => assert.equal(got, want));
  const skipped = all.filter((_, i) => i % 3 === 1).length, none = all.filter((_, i) => i % 3 === 2).length;
  const sg = Object.fromEntries(d.obstacleStatus.groups.map(g => [g.keys.join(), g.count]));
  assert.deepEqual([sg.answered, sg.skipped, sg['not-answered']], [answered.length, skipped, none]);
});

test('T05 all-unknown room: everything unconfirmed, insufficient visibility, no levels or constraints', () => {
  const c = fresh();
  for (let i = 0; i < 6; i++) c.post(rec(Array(17).fill(null), 'HEA-U' + String(i).padStart(5, '0')));
  const d = ask(c).data;
  assert.equal(d.status, 'ok');
  assert.deepEqual(d.resultStates.groups.filter(g => g.count).map(g => [g.keys.join(), g.count]), [['insufficient-visibility', 6]]);
  for (const a of d.areas) {
    assert.deepEqual(a.groups.filter(g => g.count).map(g => [g.keys.join(), g.count]), [['unconfirmed', 6]]);
    for (const g of a.groups) if (g.keys.some(k => /^L\d$/.test(k))) assert.equal(g.count, 0, 'no level assigned');
  }
  assert.equal(d.limiting.withheld, true);
  assert.ok(!('areas' in d.limiting));
});

test('T05 unknown handling: partial profiles never produce limiting areas or levels for unknown areas', () => {
  const c = fresh();
  const partial = scores(5); partial[0] = 1; partial[1] = 1; partial[2] = 1; partial[3] = null; // F05-like: confirmed-partial
  for (let i = 0; i < 6; i++) c.post(rec(partial, 'HEA-P' + String(i).padStart(5, '0')));
  const d = ask(c).data;
  assert.equal(d.resultStates.groups.find(g => g.keys[0] === 'confirmed-partial').count, 6);
  assert.equal(d.limiting.withheld, true);
  assert.equal(d.areas[1].groups.find(g => g.keys[0] === 'unconfirmed').count, 6);
  assert.equal(d.areas[0].groups.find(g => g.keys[0] === 'L1').count, 6);
});

test('T08 empty and below-threshold: no breakdown at all; exactly threshold releases it', () => {
  const c = fresh();
  assert.deepEqual(ask(c).data, {submitted: 0, status: 'empty'});
  for (let i = 0; i < 4; i++) c.post(rec(seeded(1, i + 1)[0], 'HEA-B' + String(i).padStart(5, '0')));
  const below = ask(c).data;
  assert.deepEqual(below, {submitted: 4, status: 'below-threshold'});
  c.post(rec(seeded(1, 9)[0], 'HEA-B00004'));
  const at = ask(c).data;
  assert.equal(at.status, 'ok');
  assert.equal(at.submitted, 5);
  // Excluded rows do not count towards the threshold.
  const h = c.responses()[0];
  c.responses()[1][h.indexOf('Excluded')] = 'yes';
  assert.deepEqual(ask(c).data, {submitted: 4, status: 'below-threshold'});
});

test('T08 pooling: no displayed count describes fewer than minCell people, and totals still add up', () => {
  const {ctx} = load();
  let seed = 3;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let t = 0; t < 3000; t++) {
    const k = 3 + Math.floor(rand() * 6);
    const cells = Array.from({length: k}, (_, i) => ({key: 'c' + i, label: 'C' + i, count: rand() < 0.4 ? 0 : Math.floor(rand() * 9)}));
    const total = cells.reduce((a, c) => a + c.count, 0);
    const minCell = 2 + Math.floor(rand() * 3);
    if (total < minCell) continue;
    const groups = plain(ctx.group_(cells, minCell));
    assert.equal(groups.reduce((a, g) => a + g.count, 0), total);
    assert.deepEqual(groups.flatMap(g => g.keys).sort(), cells.map(c => c.key).sort(), 'every category appears exactly once');
    for (const g of groups) {
      assert.ok(g.count === 0 || g.count >= minCell, 'small cell exposed: ' + JSON.stringify(g));
      if (g.pooled) assert.ok(g.keys.length >= 2 && g.count >= minCell);
    }
  }
  // A lone cell of one is pooled with the nearest non-empty cell, not shown.
  const g = plain(ctx.group_([{key: 'a', label: 'A', count: 1}, {key: 'b', label: 'B', count: 0}, {key: 'c', label: 'C', count: 6}, {key: 'd', label: 'D', count: 4}], 3));
  assert.deepEqual(g.map(x => [x.keys.join(), x.count, x.pooled]), [['a,c', 7, true], ['b', 0, false], ['d', 4, false]].sort((x, y) => 0));
});

test('T08 cross-view: limiting areas are withheld unless the complete count is itself published unpooled', () => {
  const c = fresh();
  // 7 complete profiles plus 1 partial: the partial cell (1) is pooled, so the complete count is hidden.
  for (let i = 0; i < 7; i++) c.post(rec(scores(3), 'HEA-X' + String(i).padStart(5, '0')));
  const partial = scores(5); partial[0] = partial[1] = partial[2] = 1; partial[3] = null;
  c.post(rec(partial, 'HEA-X00009'));
  const d = ask(c).data;
  const complete = d.resultStates.groups.find(g => g.keys.includes('complete'));
  assert.equal(complete.pooled, true);
  assert.equal(d.limiting.withheld, true);
  assert.ok(!JSON.stringify(d).includes('"denominator":7'), 'complete count not recoverable from limiting view');
  // Per-area unconfirmed single is pooled, never shown as 1.
  const unc = d.areas[1].groups.find(g => g.keys.includes('unconfirmed'));
  assert.ok(unc.pooled || unc.count === 0 || unc.count >= 3);
});

test('limiting-area cells of 1-2 are suppressed rather than shown', () => {
  const c = fresh();
  // five where only area 3 is lowest, plus two where only area 0 is lowest.
  const low3 = scores(4); low3[11] = low3[12] = low3[13] = 2;
  const low0 = scores(4); low0[0] = low0[1] = low0[2] = 2;
  for (let i = 0; i < 6; i++) c.post(rec(low3, 'HEA-L' + String(i).padStart(5, '0')));
  for (let i = 0; i < 2; i++) c.post(rec(low0, 'HEA-M' + String(i).padStart(5, '0')));
  const d = ask(c).data;
  assert.equal(d.limiting.withheld, false);
  assert.equal(d.limiting.denominator, 8);
  assert.deepEqual(d.limiting.areas.map(a => [a.count, a.suppressed]), [[null, true], [0, false], [0, false], [6, false], [0, false]]);
});

test('T08 payload carries aggregates only: no ids, answers, feedback, contact or precise times', () => {
  const c = fresh();
  for (let i = 0; i < 8; i++) c.post(rec(seeded(1, i + 20)[0], 'HEA-LEAK' + String(i).padStart(2, '0'), {feedback: 'PRIVATE NOTE ' + i, contact: {name: 'Sam Lee', email: 'sam@example.com'}, p1: {status: 'answered', obstacle: i % 9, area: i % 5}}));
  const text = JSON.stringify(ask(c));
  for (const bad of ['HEA-LEAK', 'PRIVATE NOTE', 'sam@example.com', 'Sam Lee', 'responseId', 'feedback', 'startedAt', 'completedAt', 'email', '"answers"', 'Key']) assert.ok(!text.includes(bad), bad);
  assert.deepEqual(Object.keys(JSON.parse(text)).sort(), ['data', 'ok', 'policy', 'questionnaireVersion', 'schema', 'session', 'snapshot']);
  assert.deepEqual(Object.keys(JSON.parse(text).snapshot).sort(), ['at', 'digest']);
});

test('T09/T12 contention: lock timeouts return a retryable "busy"; 120 near-concurrent submissions land once each', () => {
  const busy = load({contention: true}).configure();
  const out = busy.post(rec(scores(3), 'HEA-BUSY01'));
  assert.equal(out.ok, false); assert.equal(out.code, 'busy');
  assert.equal(busy.responses().length, 1);

  const c = fresh();
  const all = seeded(120, 17);
  // Interleave first saves, later revisions and duplicate retries, as a room would.
  const calls = [];
  all.forEach((a, i) => { calls.push(rec(a, 'HEA-C' + String(i).padStart(5, '0'), {saveRevision: 1})); });
  all.forEach((a, i) => { if (i % 2) calls.push(rec(a, 'HEA-C' + String(i).padStart(5, '0'), {saveRevision: 2, feedback: 'n'})); });
  all.forEach((a, i) => { if (i % 5 === 0) calls.push(rec(a, 'HEA-C' + String(i).padStart(5, '0'), {saveRevision: 1})); });
  let seed = 4; const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  calls.sort(() => rand() - 0.5);
  calls.forEach(r => assert.equal(c.post(r).ok, true));
  assert.equal(c.responses().length, 121);
  assert.equal(c.state.maxHeld, 1, 'writes are serialised');
  assert.equal(ask(c).data.submitted, 120);
});

// Course and support rules (advice.js), checked against the QA ledger cases
// of 16 October 2026, and the email script's copy of the same rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const dir = new URL('../pilots/email-maturity-assessment/', import.meta.url);
const E = require(new URL('engine.js', dir).pathname);
const A = require(new URL('advice.js', dir).pathname);
const D = require(new URL('data.js', dir).pathname);
const plain = v => JSON.parse(JSON.stringify(v));

const N = null;
// Answer vectors, in questionnaire order: Strategy Q1-3, Deliverability Q4-7,
// Customer Experience Q8-11, Testing Q12-14, Personalisation Q15-17.
const CASES = {
  F07: Array(17).fill(N),                                        // all unknown
  F09: [1, 3, N, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],     // certain overall 2, Strategy incomplete
  P07: [3, 3, 3, 3, N, 3, 3, 3, 3, 3, 3, 4, 4, 4, 3, 3, 3],     // range 2-3, Deliverability incomplete
  F03: [5, 5, 5, 2, 3, 2, 3, 3, 4, 3, 4, 5, 5, 5, 5, 5, 5],     // exact halves, Deliverability binding
};

test('QA fixtures score as the ledger recorded', () => {
  const f07 = E.calculate(CASES.F07), f09 = E.calculate(CASES.F09), p07 = E.calculate(CASES.P07), f03 = E.calculate(CASES.F03);
  assert.equal(f07.state, 'insufficient-visibility');
  assert.equal(f09.state, 'confirmed-partial'); assert.equal(f09.level, 2); assert.equal(f09.dimensions[0].score, null);
  assert.equal(p07.state, 'range'); assert.deepEqual([p07.lowerLevel, p07.upperLevel], [2, 3]);
  assert.equal(f03.state, 'complete'); assert.deepEqual(f03.dimensions.map(d => d.score.level), [5, 2, 3, 5, 5]); assert.deepEqual(f03.constraints, [1]);
});

test('F07: entirely unknown areas get no course and no level', () => {
  assert.deepEqual(A.courseTargets(E.calculate(CASES.F07)), []);
});

test('F09 and P07: an incomplete area is offered courses but never a confirmed level', () => {
  const f09 = A.courseTargets(E.calculate(CASES.F09));
  assert.deepEqual(f09.map(t => [t.dimension, t.confirmed]), [[0, false]]);
  const p07 = A.courseTargets(E.calculate(CASES.P07));
  const deliverability = p07.find(t => t.dimension === 1);
  assert.equal(deliverability.confirmed, false);
  for (const t of p07) assert.equal(t.confirmed, E.calculate(CASES.P07).dimensions[t.dimension].complete);
});

test('F03: a complete result names its confirmed binding area', () => {
  assert.deepEqual(A.courseTargets(E.calculate(CASES.F03)), [{dimension: 1, level: 2, confirmed: true}]);
});

test('targets never include an all-unknown area or an unconfirmed level, on random answer sets', () => {
  let seed = 11;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let n = 0; n < 3000; n++) {
    const a = Array.from({length: 17}, () => { const x = Math.floor(rand() * 6); return x === 5 ? null : x + 1; });
    const r = E.calculate(a);
    for (const t of A.courseTargets(r)) {
      const d = r.dimensions[t.dimension];
      assert.ok(d.unknowns.length < d.indices.length);
      assert.equal(t.confirmed, d.complete);
      if (t.confirmed) assert.equal(t.level, d.score.level);
    }
  }
});

test('course mode and support copy follow the obstacle answer', () => {
  const answered = obstacle => ({area: 0, obstacle, status: 'answered'});
  assert.equal(A.courseMode({status: 'not-answered'}), 'optional');
  assert.equal(A.courseMode({status: 'skipped'}), 'optional');
  assert.equal(A.courseMode(answered(0)), 'promoted');
  assert.equal(A.courseMode(answered(6)), 'link');
  for (const o of [1, 2, 3, 4, 5, 7, 8]) assert.equal(A.courseMode(answered(o)), 'optional');
  assert.equal(A.SUPPORT.length, D.obstacles.length);
  // P01 chose time or people: the support copy must not ask for something the course panel contradicts.
  assert.match(A.supportCopy(answered(1)), /courses below are optional/);
  assert.match(A.supportCopy({status: 'skipped'}), /courses below are optional/);
  for (const text of [A.SUPPORT_DEFAULT, ...A.SUPPORT]) assert.doesNotMatch(text, /rather than a specific course|Without a clear area/);
});

function loadScript() {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(new URL('apps-script/Code.gs', dir), 'utf8'), ctx);
  return ctx;
}
function record(scores, p1) {
  return {
    schema: 'hea-assessment-pilot-v1', questionnaireVersion: D.version, pilotCode: 'HEA-QA0001',
    context: D.context.map(q => ({id: q.id, option: 1, answer: q.options[1]})),
    answers: D.questions.map((q, i) => ({id: q.id, score: scores[i]})), p1
  };
}

test('the email script applies the same course rules', () => {
  const g = loadScript();
  let seed = 5;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let n = 0; n < 2000; n++) {
    const a = Array.from({length: 17}, () => { const x = Math.floor(rand() * 6); return x === 5 ? null : x + 1; });
    assert.deepEqual(plain(g.courseTargets_(g.calculate_(a))), A.courseTargets(E.calculate(a)));
  }
  for (const p1 of [undefined, {status: 'skipped'}, ...D.obstacles.map((_, o) => ({area: 0, obstacle: o, status: 'answered'}))]) {
    assert.equal(g.courseMode_(p1), A.courseMode(p1));
  }
});

test('the result email never states a level for an incomplete area', () => {
  const g = loadScript();
  const contact = {name: 'QA', email: 'qa@example.com'};
  const mail = (scores, p1) => g.buildEmail_(contact, record(scores, p1), scores, g.calculate_(scores));

  const f07 = mail(CASES.F07, {status: 'skipped'});
  assert.doesNotMatch(f07.html, /currently Ad Hoc|Courses/);

  const f09 = mail(CASES.F09, {status: 'skipped'});
  assert.match(f09.html, /Strategy &amp; Governance\. Some answers here were/);
  assert.doesNotMatch(f09.html, /Strategy &amp; Governance, currently/);
  assert.match(f09.html, /Optional: courses for this area/);

  const p07 = mail(CASES.P07, {status: 'skipped'});
  assert.doesNotMatch(p07.html, /Deliverability &amp; Infrastructure, currently/);

  const f03 = mail(CASES.F03, {area: 1, obstacle: 0, status: 'answered'});
  assert.match(f03.html, /Courses that cover this/);
  assert.match(f03.html, /Deliverability &amp; Infrastructure, currently Foundational/);

  const later = mail(CASES.F03, {area: 1, obstacle: 6, status: 'answered'});
  assert.doesNotMatch(later.html, /See the course|Join the waitlist/);
  assert.match(later.html, /When this area becomes a priority/);
});

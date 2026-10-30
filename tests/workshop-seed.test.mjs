// The rehearsal seeder produces records the collector accepts, covers every result state, ties and every
// obstacle, is re-runnable without duplicates, and its "expected" summary matches the collector's aggregate.
import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from './workshop/harness.mjs';
import {buildRecords, expected} from '../workshops/london-forum/tools/seed-rehearsal.mjs';

const KEY = 'q'.repeat(8) + 'a1b2c3d4e5f60718293a4b5c6d7e8f90abcdef12';

test('seed records are accepted, idempotent, and reconcile with the dashboard aggregate', () => {
  const c = load().configure().setKey(KEY);
  const items = buildRecords({count: 40});
  for (const {record} of items) assert.equal(c.post(record).saved, true, record.responseId);
  assert.equal(c.responses().length, 41);
  for (const {record} of items) c.post(record); // second run: same rows
  assert.equal(c.responses().length, 41);

  const exp = expected(items);
  for (const s of ['complete', 'confirmed-partial', 'range', 'insufficient-visibility']) assert.ok(exp.states[s] > 0, s);
  assert.ok(exp.limiting.reduce((a, b) => a + b, 0) > exp.complete, 'includes ties');
  const obstacles = new Set(items.filter(x => x.record.p1.status === 'answered').map(x => x.record.p1.obstacle));
  assert.equal(obstacles.size, 9);
  assert.ok(items.some(x => x.record.p1.status === 'skipped') && items.some(x => x.record.p1.status === 'not-answered'));

  const d = c.post({action: 'aggregate', session: 'lf-rehearsal', key: KEY}).data;
  assert.equal(d.submitted, 40);
  const stateCount = Object.fromEntries(d.resultStates.groups.flatMap(g => g.keys.map(k => [k, g.pooled ? null : g.count])));
  for (const [k, n] of Object.entries(exp.states)) if (stateCount[k] !== null) assert.equal(stateCount[k], n, k);
  d.areas.forEach((a, i) => a.groups.filter(g => !g.pooled).forEach(g => assert.equal(g.count, exp.areas[i][g.labels[0]] || 0, a.name + ' ' + g.labels[0])));
  assert.equal(d.limiting.denominator, exp.complete);
});

test('a different batch adds rows; bad batch letters are refused', () => {
  const c = load().configure().setKey(KEY);
  buildRecords({count: 5, batch: 'A'}).forEach(({record}) => c.post(record));
  buildRecords({count: 5, batch: 'B'}).forEach(({record}) => c.post(record));
  assert.equal(c.responses().length, 11);
  assert.throws(() => buildRecords({batch: 'ab'}), /single capital letter/);
});

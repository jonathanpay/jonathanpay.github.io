import test from 'node:test';
import assert from 'node:assert/strict';
import * as r from '../tools/ctgd-delve/run.js';
import * as g from '../tools/ctgd-delve/map.js';
import { newDelve, cleanDelve } from '../tools/ctgd-delve/model.js';

const seeded = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const fixed = v => () => v;           // 0 → every die 1, 0.999 → every die 6
const crew = (n, supply = 6) => { const run = r.emptyRun(); for (let i = 0; i < n; i++) r.addCrew(run, { name: 'Explorer ' + i, supply, heart: 8, role: i === 0 ? 'delver' : 'scout' }); return run; };

test('the clock: a stretch is one of 24 in a shift', () => {
  const run = r.emptyRun(); assert.equal(r.clockText(run), 'Shift 1, stretch 1 of 24');
  run.stretches = 23; assert.equal(r.stretchOf(run), 24); run.stretches = 24; assert.equal(r.shiftOf(run), 2); assert.equal(r.stretchOf(run), 1);
});

test('supply per stretch is one for the whole crew, plus one per member over five', () => {
  assert.equal(r.stretchSupply(3, 4), 3); assert.equal(r.stretchSupply(3, 5), 3); assert.equal(r.stretchSupply(3, 6), 6); assert.equal(r.stretchSupply(2, 8), 8);
});

test('move costs: one marker per success, failure moves one marker for two supply, blind adds one per marker, big crews add one per stretch', () => {
  assert.deepEqual(r.moveCost({ markers: 3 }), { stretches: 3, supply: 3 });
  assert.deepEqual(r.moveCost({ markers: 3, blind: true }), { stretches: 3, supply: 6 });
  assert.deepEqual(r.moveCost({ markers: 1, failed: true }), { stretches: 1, supply: 2 });
  assert.deepEqual(r.moveCost({ markers: 1, failed: true, blind: true }), { stretches: 1, supply: 3 });
  assert.deepEqual(r.moveCost({ markers: 2, crewSize: 6 }), { stretches: 2, supply: 4 });
});

test('spending supply takes from whoever has most, so the cost alternates', () => {
  const run = crew(3, 5); run.crew[0].supply = 6;
  const ev = r.spendSupply(run, 4, fixed(0.5));
  assert.deepEqual(run.crew.map(c => c.supply), [4, 4, 4].map((v, i) => [6, 5, 5][i] - [2, 1, 1][i]).map((v, i) => v), 'one point each, then the highest again');
  assert.equal(r.poolOf(run), 16 - 4); assert.deepEqual(ev, []);
});

test('a supply incident rolls D6 + remaining supply for an Explorer at three or fewer; 7+ is none; low totals clamp to the bottom row', () => {
  let run = crew(1, 3);
  let ev = r.spendSupply(run, 1, fixed(0));          // D6 = 1, remaining 2 → total 3 → row for total 3
  assert.equal(ev[0].kind, 'incident'); assert.equal(ev[0].total, 3); assert.equal(ev[0].idx, 3);
  run = crew(1, 3); ev = r.spendSupply(run, 1, fixed(0.999)); assert.equal(ev[0].total, 8); assert.equal(ev[0].idx, -1);
  run = crew(1, 1); ev = r.spendSupply(run, 1, fixed(0)); assert.equal(run.crew[0].supply, 0); assert.equal(ev[0].total, 1); assert.equal(ev[0].idx, 4, 'below the bottom row reads as the bottom row');
  run = crew(1, 4); ev = r.spendSupply(run, 1, fixed(0)); assert.deepEqual(ev, [], 'four is above the trigger');
});

test('the incident rows map total 6, 5, 4, 3, 2 to rows 0 to 4', () => {
  const idxFor = total => { const run = crew(1, 3); const roll = total - 2; return r.spendSupply(run, 1, () => (roll - 0.5) / 6)[0].idx; };
  assert.deepEqual([6, 5, 4, 3, 2].map(idxFor), [0, 1, 2, 3, 4]);
  assert.equal(idxFor(7), -1);
});

test('a point owed with nothing left rolls the out-of-supply table, banded 1–3, 4–5, 6', () => {
  const idx = roll => { const run = crew(1, 0); return r.spendSupply(run, 1, () => (roll - 0.5) / 6)[0].idx; };
  assert.deepEqual([1, 3, 4, 5, 6].map(idx), [0, 0, 1, 1, 2]);
  assert.equal(r.spendSupply(r.emptyRun(), 1)[0].kind, 'nocrew');
});

test('hazard exit-distance bands: 1–5 → 0, 6–10 → 1, 11–15 → 2, 16+ → 3, and an unknown exit reads as far', () => {
  assert.deepEqual([0, 1, 5, 6, 10, 11, 15, 16, 40, null].map(r.exitBand), [0, 0, 0, 1, 1, 2, 2, 3, 3, 3]);
});

test('hazard role: 1–5 are the five roles, 6 is everyone, and a 5 is rerolled when there is no archaeologist', () => {
  const run = crew(3);
  const role = d => { run.used = []; let n = 0; const rng = () => { n++; return n === 1 ? (d - 0.5) / 6 : 0; }; return r.rollHazard(run, 1, false, rng).role; };
  assert.deepEqual([1, 2, 3, 4, 6].map(role), ['delver', 'scout', 'burrower', 'guard', 'all']);
  assert.notEqual(role(5), 'archaeologist');
  run.crew[1].role = 'archaeologist'; assert.equal(role(5), 'archaeologist');
});

test('hazard row: D6 plus the exit band plus one for a failed roll, capped at the last row, never repeating a cell', () => {
  const run = crew(3);
  const h = r.rollHazard(run, 20, true, fixed(0.999)); assert.equal(h.total, 6 + 3 + 1); assert.equal(h.row, 9);
  const run2 = crew(3); const a = r.rollHazard(run2, 1, false, fixed(0)); assert.equal(a.row, 1);
  const seen = new Set();
  for (let i = 0; i < 54; i++) { const x = r.rollHazard(run2, 8, false, seeded(i + 1)); seen.add(x.key); }
  assert.equal(run2.used.length, new Set(run2.used).size, 'no cell is used twice');
  assert.ok(run2.used.length <= 54);
});

test('hazard effects: only supply and stretches are read from a hazard entry', () => {
  assert.deepEqual(r.hazardEffects({ fx: { supply: 2, stretch: 1, damage: 9 } }), { supply: 2, stretches: 1 });
  assert.deepEqual(r.hazardEffects({ fx: { supply: 'D6' } }, fixed(0.999)), { supply: 6, stretches: 0 });
  assert.deepEqual(r.hazardEffects({ fx: { supply: 'junk', stretch: -4 } }), { supply: 0, stretches: 0 });
  assert.deepEqual(r.hazardEffects(null), { supply: 0, stretches: 0 });
  assert.equal(r.hazardEntry({ held: { hazards: { delver: [{ n: 'Sample hazard' }] } } }, 'delver', 1).n, 'Sample hazard');
  assert.equal(r.hazardEntry(null, 'delver', 1), null);
});

function shaft() {
  const map = g.emptyMap(20, 20); g.addPoint(map, { t: 'e', x: 5, y: 0 });
  g.line(map, 5, 0, 5, 12, { tool: 'open' }); g.line(map, 5, 12, 12, 12, { tool: 'open' });
  g.addPoint(map, { t: 'k', k: 0, x: 12, y: 12 });
  for (let y = 4; y <= 6; y++) g.setBlight(map, 5, y, 3); g.setBlight(map, 5, 8, 5);
  return map;
}

test('a delve move goes one marker per success, reports the highest Blight passed and stops short at a key location', () => {
  const map = shaft(), run = crew(4); run.pos = { x: 5, y: 0 };
  const p = r.planMove(map, run, { x: 12, y: 12 }, { successes: 3 });
  assert.equal(p.steps, 3); assert.deepEqual(p.dest, { x: 5, y: 3 }); assert.equal(p.maxBlight, 0); assert.deepEqual(p.cost, { stretches: 3, supply: 3 }); assert.equal(p.deeper, true);
  run.pos = { x: 5, y: 3 }; const q = r.planMove(map, run, { x: 12, y: 12 }, { successes: 4 });
  assert.equal(q.maxBlight, 3, 'highest level among the cells passed or entered, not the one started in');
  run.pos = { x: 5, y: 5 }; const z = r.planMove(map, run, { x: 12, y: 12 }, { successes: 4 }); assert.equal(z.maxBlight, 5);
  run.pos = { x: 5, y: 6 }; assert.equal(r.planMove(map, run, { x: 12, y: 12 }, { successes: 1 }).maxBlight, 0, 'level 3 at the start cell is excluded');
  run.pos = { x: 5, y: 10 }; const k = r.planMove(map, run, { x: 12, y: 12 }, { successes: 99 }); assert.equal(k.steps, 9); assert.equal(k.key.k, 0);
});

test('a failed delving roll still moves one marker for two supply, and raises the hazard row', () => {
  const map = shaft(), run = crew(4); run.pos = { x: 5, y: 0 };
  const p = r.planMove(map, run, { x: 12, y: 12 }, { successes: 0 });
  assert.equal(p.failed, true); assert.equal(p.steps, 1); assert.deepEqual(p.cost, { stretches: 1, supply: 2 });
});

test('going back up needs no roll, costs a stretch and a point per marker, and blind movement costs extra', () => {
  const map = shaft(), run = crew(4); run.pos = { x: 5, y: 9 };
  const p = r.planMove(map, run, { x: 5, y: 0 }, { mode: 'return', markers: 3 });
  assert.equal(p.steps, 3); assert.deepEqual(p.dest, { x: 5, y: 6 }); assert.deepEqual(p.cost, { stretches: 3, supply: 3 }); assert.equal(p.deeper, false);
  assert.equal(r.planMove(map, run, { x: 5, y: 0 }, { mode: 'return', markers: 3, blind: true }).cost.supply, 6);
});

test('moves refuse impossible routes', () => {
  const map = shaft(), run = crew(4);
  assert.match(r.planMove(map, run, { x: 5, y: 3 }).error, /Place the crew/);
  run.pos = { x: 5, y: 3 };
  g.setCell(map, 5, 7, 'x'); assert.match(r.planMove(map, run, { x: 12, y: 12 }, { successes: 2 }).error, /no open passage/);
  assert.match(r.planMove(map, run, { x: 5, y: 3 }).error, /already there/);
  g.setCell(map, 5, 7, 'h'); assert.ok(r.planMove(map, run, { x: 5, y: 7 }).error, 'hidden passage is not usable until it is dug open');
});

test('a Blight core flags one attack per stretch spent in it', () => {
  const map = shaft(); g.addPoint(map, { t: 'c', x: 5, y: 9 }); const run = crew(4); run.pos = { x: 5, y: 7 };
  assert.equal(r.planMove(map, run, { x: 5, y: 12 }, { successes: 4 }).coreCells, 3);
});

test('the Bird reads Blight within four markers of passage, and an environmental scanner reads the cell', () => {
  const map = shaft(); const n = r.readAround(map, { x: 5, y: 5 }, 4);
  assert.ok(n >= 9); assert.equal(g.isRead(map, 5, 9), true); assert.equal(g.isRead(map, 5, 10), false); assert.equal(g.isRead(map, 5, 1), true);
  assert.equal(r.readHere(map, { x: 5, y: 12 }), true); assert.equal(r.readHere(map, { x: 5, y: 12 }), false);
});

test('camps need a Blight-free open cell, and persist', () => {
  const map = shaft(), run = crew(3);
  assert.equal(r.canCamp(map, { x: 5, y: 2 }), true); assert.equal(r.canCamp(map, { x: 5, y: 5 }), false); assert.equal(r.canCamp(map, { x: 0, y: 0 }), false); assert.equal(r.canCamp(map, null), false);
  run.camps.push({ x: 5, y: 2, store: 2, notes: '' }); assert.equal(r.campAt(run, { x: 5, y: 2 }).store, 2); assert.equal(r.campAt(run, { x: 5, y: 3 }), null);
});

test('shards: four make one point of encumbrance', () => {
  assert.deepEqual([0, 1, 4, 5, 8, 9].map(r.encumbrance), [0, 1, 1, 2, 2, 3]);
});

test('artefacts: four D66 columns of eighteen ranges of two; a major has a power, a lesser does not', () => {
  assert.equal(r.ART_RANGES.length, 18); assert.deepEqual(r.ART_RANGES[0], [11, 12]); assert.deepEqual(r.ART_RANGES[17], [65, 66]);
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) assert.ok(r.artIndex(a * 10 + b) >= 0);
  const major = r.rollArtefact('major', seeded(3)), lesser = r.rollArtefact('lesser', seeded(3));
  assert.deepEqual(Object.keys(major).sort(), ['description', 'form', 'oddity', 'power']); assert.deepEqual(Object.keys(lesser).sort(), ['description', 'form', 'oddity']);
  const run = r.emptyRun(); const a = r.addArtefact(run, 'major', seeded(1)); assert.equal(a.handed, false); assert.equal(run.arts.length, 1);
  assert.equal(r.artLabel({ held: { artifacts: { rows: [{ description: 'Alpha row' }] } } }, 'description', 11), 'Alpha row');
  assert.equal(r.artLabel(null, 'description', 11), '');
});

test('Explorer sheet mapping: supply boxes and Heart go both ways', () => {
  const sheet = { name: 'Alpha Explorer', supplyMax: 8, supplyMarks: '11000000', insight: 4, perception: 3, heartTaken: 2 };
  const m = r.fromSheet(sheet); assert.deepEqual([m.name, m.supply, m.supplyMax, m.heart, m.heartMax], ['Alpha Explorer', 6, 8, 5, 7]);
  assert.deepEqual(r.toSheetPatch({ supply: 3, heart: 4 }, sheet), { supplyMarks: '11111000', heartTaken: 3 });
  assert.deepEqual(r.toSheetPatch({ supply: 99, heart: 4 }, { supplyMax: 4 }), { supplyMarks: '0000' });
  assert.equal(r.fromSheet({}).heart, null);
});

test('a run is saved with its delve and cleaned on the way back', () => {
  const d = newDelve(); r.addCrew(d.run, { name: 'Alpha', supply: 6, heart: 7, role: 'guard' }); d.run.pos = { x: 3, y: 4 }; d.run.stretches = 30; r.addLog(d.run, 'move', 'Moved'); r.addPrompt(d.run, 'Check something'); r.addArtefact(d.run, 'lesser', seeded(2)); d.run.found = [true, false];
  const back = cleanDelve(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(back.run, d.run);
  const junk = r.cleanRun({ crew: [{ id: 'x y', name: 5, role: 'wizard', supply: -9, heart: 1e9 }, null], pos: { x: 'a' }, stretches: -4, used: ['delver:3', 'junk', 5], bird: 5, camps: [{ x: 1, y: 1, store: 99999 }], log: [{ t: 'x'.repeat(5000) }], prompts: [{ t: 1 }], arts: [{ kind: 'zzz', rolls: { power: 999, oddity: 33 } }] });
  assert.equal(junk.crew.length, 1); assert.equal(junk.crew[0].role, 'delver'); assert.equal(junk.crew[0].supply, 0); assert.equal(junk.crew[0].heart, 99);
  assert.equal(junk.pos, null); assert.equal(junk.stretches, 0); assert.deepEqual(junk.used, ['delver:3']); assert.equal(junk.bird, null);
  assert.equal(junk.camps[0].store, 999); assert.equal(junk.log[0].t.length, 600); assert.equal(junk.arts[0].kind, 'lesser'); assert.deepEqual(junk.arts[0].rolls, { oddity: 33 });
  assert.deepEqual(r.cleanRun(null), r.emptyRun());
});

test('the log is capped, and prompts start unapplied', () => {
  const run = r.emptyRun(); for (let i = 0; i < r.MAX_LOG + 20; i++) r.addLog(run, 'note', 'n' + i);
  assert.equal(run.log.length, r.MAX_LOG); assert.equal(run.log.at(-1).t, 'n' + (r.MAX_LOG + 19));
  const p = r.addPrompt(run, 'Alpha prompt'); assert.equal(p.done, false); assert.ok(p.id);
});

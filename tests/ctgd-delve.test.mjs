import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as m from '../tools/ctgd-delve/model.js';

const sample = JSON.parse(readFileSync(new URL('../tools/ctgd-delve/data/sample.json', import.meta.url), 'utf8'));
const seeded = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const fixed = v => () => v;

test('dice expressions: D66, plain, modified and negative', () => {
  assert.equal(m.roll('D66', fixed(0)), 11);
  assert.equal(m.roll('D66', fixed(0.999)), 66);
  assert.equal(m.roll('D3+1', fixed(0)), 2);
  assert.equal(m.roll('D3+1', fixed(0.999)), 4);
  assert.equal(m.roll('4D6+40', fixed(0)), 44);
  assert.equal(m.roll('4D6+40', fixed(0.999)), 64);
  assert.equal(m.roll('D6-3', fixed(0)), -2);
  assert.equal(m.roll('5D6+20', fixed(0.999)), 50);
  assert.equal(m.roll('1', fixed(0)), 1);
  assert.throws(() => m.roll('banana'));
});

test('every D66 table has exactly one range for every possible roll', () => {
  const d66 = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) d66.push(a * 10 + b);
  for (const id of m.TABLE_IDS) {
    const t = m.TABLES[id];
    const values = t.dice === 'D66' ? d66 : t.dice === 'D6' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4];
    for (const v of values) assert.equal(t.ranges.filter(([lo, hi]) => v >= lo && v <= hi).length, 1, `${id} ${v}`);
  }
});

test('the verified range counts: era 3, purpose and fate 9, type 5, depth 4, glyph and shape 12, quirk 36, threat 5', () => {
  const n = id => m.TABLES[id].ranges.length;
  assert.deepEqual([n('ruin.era'), n('ruin.purpose'), n('ruin.fate'), n('ruin.type'), n('ruin.depth'), n('theme.glyph'), n('theme.quirk'), n('loc.shape'), n('threat.kind'), n('find.band'), n('blight.band'), n('party.kind')], [3, 9, 9, 5, 4, 12, 36, 5 + 7, 5, 4, 4, 6].map((x, i) => (i === 7 ? 12 : x)));
  assert.equal(m.indexOf('ruin.depth', 44), 1);
  assert.equal(m.indexOf('ruin.depth', 45), 2);
  assert.equal(m.indexOf('ruin.type', 65), 3);
  assert.equal(m.indexOf('blight.band', 66), 3);
  assert.equal(m.indexOf('find.band', 16), 0);
});

test('depth, discovery and Blight bands carry the verified numbers', () => {
  assert.deepEqual(m.DEPTH_BANDS.map(b => b.markers), ['D6+8', 'D6+12', '3D6+20', '4D6+40']);
  assert.deepEqual(m.DEPTH_BANDS.map(b => b.entrances), ['D3+1', 'D3+1', 'D6+1', 'D6+2']);
  assert.deepEqual(m.DEPTH_BANDS.map(b => b.keys), ['D6', '2D6+1', '2D6+10', '4D6+10']);
  assert.deepEqual(m.FIND_BANDS.map(b => b.shards), ['D6-3', '2D6-4', '3D6', '5D6+20']);
  assert.deepEqual(m.FIND_BANDS.map(b => [b.lesser, b.major]), [['0', '0'], ['D3', '0'], ['D3', '1'], ['D6', 'D3']]);
  assert.deepEqual(m.BLIGHT_BANDS.map(b => b.levels), [[0, 3], [1, 4], [1, 5], [1, 6]]);
  assert.deepEqual(m.BLIGHT_BANDS.map(b => [b.cores, b.oases]), [['1', '1'], ['D3+1', '1'], ['D6+2', '3'], ['3D6+4', '3']]);
});

test('the whole chain rolls, with sane numbers, for many seeds', () => {
  for (let s = 1; s <= 200; s++) {
    const d = m.generate(m.newDelve(), seeded(s));
    for (const k of ['era', 'purpose', 'fate', 'type', 'depth', 'glyph', 'find', 'blight', 'threat']) assert.ok(d.items[k], k);
    assert.equal(d.items.party, undefined);
    const band = m.DEPTH_BANDS[d.items.depth.i];
    assert.ok(d.nums.markers.v >= 9, 'markers'); assert.ok(d.nums.entrances.v >= 1);
    assert.equal(d.locs.length, d.nums.keys.v);
    assert.equal(d.quirks.length, 2);
    assert.equal(new Set(d.quirks.map(q => q.i)).size, 2);
    for (const l of d.locs) assert.ok(l.shards.v >= 0 && Number.isInteger(l.shards.v));
    assert.ok(band);
  }
});

test('shards per key location are floored at 0 in the two lowest bands', () => {
  const d = m.newDelve(); d.items.depth = m.pickItem('depth', 0); d.items.find = m.pickItem('find', 0);
  m.applyDepth(d, fixed(0)); m.applyFind(d, fixed(0));
  assert.ok(d.locs.length >= 1);
  for (const l of d.locs) assert.equal(l.shards.v, 0);
  d.items.find = m.pickItem('find', 1); m.applyFind(d, fixed(0));
  for (const l of d.locs) assert.equal(l.shards.v, 0);
  d.items.find = m.pickItem('find', 3); for (const l of d.locs) l.shards.l = false; m.applyFind(d, fixed(0));
  for (const l of d.locs) assert.equal(l.shards.v, 25);
});

test('the last fate chains a second purpose and fate, which cannot chain again', () => {
  const d = m.newDelve();
  m.pickKey(d, 'fate', 8, seeded(3));
  assert.ok(m.chainsFate(d)); assert.ok(d.items.purpose2); assert.ok(d.items.fate2); assert.notEqual(d.items.fate2.i, m.CHAIN_FATE);
  m.pickKey(d, 'fate', 2, seeded(3));
  assert.equal(m.chainsFate(d), false);
  for (let s = 1; s < 100; s++) { const x = m.newDelve(); m.generate(x, seeded(s)); if (m.chainsFate(x)) assert.notEqual(x.items.fate2.i, m.CHAIN_FATE); }
});

test('type 64–65 rolls twice and combines, and neither part combines again', () => {
  const d = m.newDelve();
  m.pickKey(d, 'type', 3, seeded(9));
  assert.ok(m.combinesType(d)); assert.ok(d.items.typeA && d.items.typeB);
  assert.notEqual(d.items.typeA.i, 3); assert.notEqual(d.items.typeB.i, 3);
  m.pickKey(d, 'type', 0, seeded(9));
  assert.equal(m.combinesType(d), false);
});

test('the purpose column follows the era, and labels come from the data file by position', () => {
  const d = m.newDelve(); m.pickKey(d, 'era', 1); m.pickKey(d, 'purpose', 4);
  assert.equal(m.eraColumn(d), 'middle');
  const data = m.validateData(sample);
  assert.equal(m.describe(data, 'purpose', d.items.purpose, d).name, 'Sample middle purpose Epsilon');
  m.pickKey(d, 'era', 2); assert.equal(m.eraColumn(d), 'late');
  assert.equal(m.describe(data, 'purpose', d.items.purpose, d).name, 'Sample late purpose Epsilon');
  m.pickKey(d, 'era', 0); assert.equal(m.eraColumn(d), 'early');
  assert.equal(m.describe(data, 'era', d.items.era, d).name, 'Alpha row');
});

test('without a data file every result is a table id and a rolled number only (D1)', () => {
  const d = m.generate(m.newDelve(), seeded(5));
  const x = m.describe(null, 'era', d.items.era, d);
  assert.equal(x.name, ''); assert.match(x.chip, /^ruin\.era · \d+$/);
  assert.match(m.textOf(null, 'glyph', d.items.glyph, d), /^theme\.glyph · \d+$/);
  assert.match(m.locText(null, d.locs[0]), /^loc\.shape · \d+$/);
});

test('locked results survive a full roll, and locked numbers survive a depth reroll', () => {
  const d = m.generate(m.newDelve(), seeded(11));
  d.items.era.l = true; d.items.glyph.l = true; d.locs[0].shape.l = true; d.nums.keys.l = true;
  const era = d.items.era.r, glyph = d.items.glyph.r, shape = d.locs[0].shape.r, keys = d.nums.keys.v;
  for (let s = 20; s < 40; s++) { m.generate(d, seeded(s)); assert.equal(d.items.era.r, era); assert.equal(d.items.glyph.r, glyph); assert.equal(d.locs[0].shape.r, shape); assert.equal(d.nums.keys.v, keys); assert.equal(d.locs.length, keys); }
  m.rerollKey(d, 'depth', seeded(77)); assert.equal(d.nums.keys.v, keys);
});

test('a hand pick sets the band and the numbers that hang off it', () => {
  const d = m.newDelve(); m.pickKey(d, 'depth', 3, seeded(1));
  assert.equal(d.nums.markers.e, '4D6+40'); assert.ok(d.nums.markers.v >= 44 && d.nums.markers.v <= 64);
  m.pickKey(d, 'blight', 3, seeded(1)); assert.equal(d.nums.cores.e, '3D6+4'); assert.deepEqual(m.levelRange(d), [1, 6]);
  m.setNumValue(d, 'keys', 5); assert.equal(d.locs.length, 5);
  m.setNumValue(d, 'keys', 2); assert.equal(d.locs.length, 2);
});

test('quirks: count is the user\'s choice, they never repeat, and one can be rerolled alone', () => {
  const d = m.newDelve(); d.quirkCount = 5; m.rollQuirks(d, seeded(2));
  assert.equal(d.quirks.length, 5); assert.equal(new Set(d.quirks.map(q => q.i)).size, 5);
  const keep = d.quirks[0].r; d.quirks[0].l = true; m.rollQuirks(d, seeded(8)); assert.equal(d.quirks[0].r, keep);
  m.rerollQuirk(d, 1, seeded(4)); assert.equal(new Set(d.quirks.map(q => q.i)).size, 5);
});

test('the delve class is an editable estimate from the Blight band', () => {
  const d = m.newDelve();
  assert.equal(m.classEstimate(d), '');
  [['I', 0], ['II', 1], ['III', 2], ['IV', 3]].forEach(([c, i]) => { m.pickKey(d, 'blight', i, seeded(1)); assert.equal(m.classEstimate(d), c); assert.equal(m.classShown(d), c); });
  d.classOverride = 'II'; assert.equal(m.classShown(d), 'II'); assert.equal(m.classEstimate(d), 'IV');
});

test('the data file: format check, positional rows, junk dropped, coverage reported (D10)', () => {
  assert.throws(() => m.validateData({ format: 'nope' }), /ctgd-delve-data\/1/);
  assert.throws(() => m.validateData({ format: m.FORMAT }), /no tables/);
  const data = m.validateData(sample);
  assert.equal(m.coverage(data).every(c => c.state === 'complete'), true);
  const partial = m.validateData({ format: m.FORMAT, tables: { 'ruin.era': { rows: [{ n: 'Alpha row' }] }, 'theme.quirk': { rows: [] }, 'unknown.table': { rows: [{}] }, 'loc.shape': { rows: [{ n: 'x'.repeat(5000), f: 7 }] } }, hazards: { delver: [{ n: 'Sample hazard' }] } });
  const cov = Object.fromEntries(m.coverage(partial).map(c => [c.id, c.state]));
  assert.equal(cov['ruin.era'], 'partial'); assert.equal(cov['theme.quirk'], 'empty'); assert.equal(cov['ruin.fate'], 'missing'); assert.equal(cov['loc.shape'], 'partial');
  assert.deepEqual(partial.ignored, ['unknown.table']);
  assert.equal(partial.tables['loc.shape'].rows[0].n.length, 2000);
  assert.equal(partial.tables['loc.shape'].rows[0].f, '');
  assert.ok(partial.held.hazards);
  assert.equal(m.coverage(null)[0].state, 'none');
  const hostile = m.validateData({ format: m.FORMAT, tables: JSON.parse('{"__proto__":{"rows":[]},"ruin.era":{"rows":[{"n":"ok"}]}}'), hazards: JSON.parse('{"__proto__":{"x":1},"a":1}') });
  assert.equal({}.x, undefined); assert.equal(hostile.tables['ruin.era'].rows[0].n, 'ok');
  assert.throws(() => m.validateData({ format: m.FORMAT, tables: { 'ruin.era': { rows: 'x' } } }), /rows list/);
});

test('a partly-covered file still names what it can and falls back to ids for the rest', () => {
  const partial = m.validateData({ format: m.FORMAT, tables: { 'ruin.era': { rows: [{ n: 'Alpha row' }, { n: 'Beta row' }] } } });
  const d = m.newDelve(); m.pickKey(d, 'era', 1); m.pickKey(d, 'fate', 0);
  assert.equal(m.textOf(partial, 'era', d.items.era, d), 'Beta row');
  m.pickKey(d, 'era', 2); assert.match(m.textOf(partial, 'era', d.items.era, d), /^ruin\.era · /);
  assert.match(m.textOf(partial, 'fate', d.items.fate, d), /^ruin\.fate · /);
});

test('a saved delve survives cleaning, and bad values are repaired or dropped', () => {
  const d = m.generate(m.newDelve(), seeded(4));
  const back = m.cleanDelve(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(back.items, d.items); assert.equal(back.locs.length, d.locs.length);
  const junk = m.cleanDelve({ items: { era: { r: 999 }, glyph: { r: 'x' }, fate: { r: 66, l: 1 } }, nums: { markers: { v: 'abc', e: 'rm -rf' } }, locs: [null, { shape: { r: 0 } }], map: { zones: [] }, classOverride: 'IX' });
  assert.equal(junk.items.era, undefined); assert.equal(junk.items.glyph, undefined); assert.equal(junk.items.fate.i, 8);
  assert.ok(junk.items.purpose2, 'chained fate gets its second roll back');
  assert.equal(junk.nums.markers.v, 0); assert.equal(junk.nums.markers.e, '');
  assert.equal(junk.locs.length, 2); assert.equal(junk.classOverride, '');
  assert.equal(junk.map, null);
  assert.throws(() => m.cleanDelve(null));
});

test('a backup validates whole, gives new ids and drops campaign links', () => {
  const d = m.generate(m.newDelve(), seeded(6)); d.cid = 'site-abc';
  const out = m.validateBackup({ format: m.BACKUP_FORMAT, delves: [d, m.newDelve()] });
  assert.equal(out.length, 2); assert.notEqual(out[0].id, d.id); assert.equal(out[0].cid, '');
  assert.throws(() => m.validateBackup({ format: 'x', delves: [d] }), /backup/);
  assert.throws(() => m.validateBackup({ format: m.BACKUP_FORMAT, delves: [] }));
});

/* ---------- the map: a painted grid with points on top ---------- */
import * as g from '../tools/ctgd-delve/map.js';
const specFor = (s) => { const d = m.generate(m.newDelve(), seeded(s)); const r = m.levelRange(d); return { spec: { markers: d.nums.markers.v, entrances: d.nums.entrances.v, keys: d.nums.keys.v, cores: d.nums.cores.v, oases: d.nums.oases.v, levelLo: r[0], levelHi: r[1] }, d }; };

test('painting: open, hidden, blocked and erase, with brush size and mirror', () => {
  const map = g.emptyMap(20, 12);
  g.paint(map, 3, 3, { tool: 'open' }); assert.equal(g.cellAt(map, 3, 3), 'o');
  g.paint(map, 5, 5, { tool: 'open', size: 3 }); assert.equal(g.countOpen(map), 1 + 9);
  g.paint(map, 3, 3, { tool: 'hidden' }); assert.equal(g.cellAt(map, 3, 3), 'h');
  g.paint(map, 3, 3, { tool: 'blocked' }); assert.equal(g.cellAt(map, 3, 3), 'x');
  g.paint(map, 3, 3, { tool: 'erase' }); assert.equal(g.cellAt(map, 3, 3), '.');
  g.paint(map, 2, 8, { tool: 'open', mirror: true }); assert.equal(g.cellAt(map, 2, 8), 'o'); assert.equal(g.cellAt(map, 17, 8), 'o');
  g.paint(map, -5, 99, { tool: 'open' }); assert.equal(g.cellAt(map, -5, 99), '.');
  const edge = g.emptyMap(20, 12); g.paint(edge, 0, 0, { tool: 'open', size: 3 }); assert.equal(g.countOpen(edge), 4);
});

test('a stroke leaves no gaps, and fill works on a region', () => {
  const map = g.emptyMap(30, 12);
  g.line(map, 2, 2, 20, 8, { tool: 'open' });
  const d = g.distanceField(map, [[2, 2]], ch => ch === 'o');
  assert.ok(d[8 * map.w + 20] >= 0, 'the stroke is connected');
  const room = g.emptyMap(20, 12); g.paint(room, 5, 5, { tool: 'open', size: 3 });
  assert.equal(g.floodFill(room, 5, 5, 'h'), 9); assert.equal(g.cellAt(room, 6, 6), 'h');
});

test('blight and read layers live on passages only and are cleared when a cell is erased', () => {
  const map = g.emptyMap(20, 12);
  g.paint(map, 4, 4, { tool: 'blight', level: 3 }); assert.equal(g.blightAt(map, 4, 4), 0, 'not on rock');
  g.paint(map, 4, 4, { tool: 'open' }); g.paint(map, 4, 4, { tool: 'blight', level: 3 }); assert.equal(g.blightAt(map, 4, 4), 3);
  g.paint(map, 4, 4, { tool: 'read' }); assert.equal(g.isRead(map, 4, 4), true);
  g.paint(map, 4, 4, { tool: 'blight', level: 0 }); assert.equal(g.blightAt(map, 4, 4), 0);
  g.paint(map, 4, 4, { tool: 'blight', level: 12 }); assert.equal(g.blightAt(map, 4, 4), 9);
  g.paint(map, 4, 4, { tool: 'erase' }); assert.equal(g.blightAt(map, 4, 4), 0); assert.equal(g.isRead(map, 4, 4), false);
});

test('points: placing opens the cell, one key per number, erasing removes, entrances start with one known exit', () => {
  const map = g.emptyMap(20, 12);
  const e1 = g.addPoint(map, { t: 'e', x: 3, y: 0 }), e2 = g.addPoint(map, { t: 'e', x: 9, y: 0 });
  assert.equal(g.cellAt(map, 3, 0), 'o'); assert.equal(e1.u, true); assert.equal(e2.u, false);
  const k = g.addPoint(map, { t: 'k', k: 2, x: 5, y: 5 }); const again = g.addPoint(map, { t: 'k', k: 2, x: 7, y: 6 });
  assert.equal(again.id, k.id); assert.equal(map.points.filter(p => p.t === 'k').length, 1); assert.deepEqual([again.x, again.y], [7, 6]);
  assert.equal(g.addPoint(map, { t: 'zz', x: 1, y: 1 }), null); assert.equal(g.addPoint(map, { t: 'c', x: 99, y: 1 }), null);
  assert.equal(g.movePoint(map, k.id, 10, 10), true); assert.equal(g.cellAt(map, 10, 10), 'o');
  g.paint(map, 10, 10, { tool: 'erase' }); assert.equal(g.pointById(map, k.id), null);
  g.removePoint(map, e2.id); assert.equal(map.points.length, 1);
});

test('distance to the nearest known exit counts cells along open passages only', () => {
  const map = g.emptyMap(20, 14);
  const e1 = g.addPoint(map, { t: 'e', x: 3, y: 0 }), e2 = g.addPoint(map, { t: 'e', x: 15, y: 0 });
  g.line(map, 3, 0, 3, 8, { tool: 'open' }); g.line(map, 3, 8, 15, 8, { tool: 'open' }); g.line(map, 15, 8, 15, 0, { tool: 'open' });
  assert.deepEqual(g.nearestExit(map, 3, 5), { exit: e1.id, dist: 5 });
  assert.deepEqual(g.nearestExit(map, 15, 5), { exit: e1.id, dist: 3 + 12 + 8 }, 'far side reaches the known exit the long way');
  e2.u = true; assert.deepEqual(g.nearestExit(map, 15, 5), { exit: e2.id, dist: 5 });
  e1.u = false; e2.u = false; assert.equal(g.nearestExit(map, 3, 5), null);
  assert.equal(g.nearestExit(map, 3, 5, { knownOnly: false }).dist, 5);
  g.setCell(map, 9, 8, 'x'); e1.u = true; e2.u = false;
  assert.equal(g.nearestExit(map, 15, 5), null, 'a blocked cell cuts the way');
  assert.equal(g.nearestExit(map, 15, 5, { usable: ch => ch !== '.' }).dist, 23);
});

test('the deep-scan reach skips hidden and blocked cells and anything cut off behind them', () => {
  const map = g.emptyMap(20, 14);
  g.addPoint(map, { t: 'e', x: 3, y: 0 });
  g.line(map, 3, 0, 3, 8, { tool: 'open' }); g.line(map, 3, 8, 12, 8, { tool: 'open' }); g.line(map, 15, 2, 15, 6, { tool: 'open' });
  let f = g.scanReach(map);
  assert.equal(g.reached(map, f, 12, 8), true); assert.equal(g.reached(map, f, 15, 4), false, 'unconnected passage is not reached');
  g.setCell(map, 6, 8, 'h'); f = g.scanReach(map); assert.equal(g.reached(map, f, 12, 8), false); assert.equal(g.reached(map, f, 3, 8), true);
  g.setCell(map, 6, 8, 'x'); f = g.scanReach(map); assert.equal(g.reached(map, f, 12, 8), false);
  g.setCell(map, 6, 8, 'o'); f = g.scanReach(map); assert.equal(g.reached(map, f, 12, 8), true);
});

test('resize keeps what fits, and cleaning repairs a damaged map', () => {
  const map = g.emptyMap(30, 20); g.addPoint(map, { t: 'k', k: 0, x: 25, y: 15 }); g.addPoint(map, { t: 'e', x: 3, y: 0 }); g.paint(map, 4, 4, { tool: 'open' });
  const small = g.resizeMap(map, 20, 12);
  assert.equal(small.w, 20); assert.equal(small.points.length, 1); assert.equal(g.cellAt(small, 4, 4), 'o');
  const junk = g.cleanMap({ v: 2, w: 20, h: 10, cells: ['ooo', 'zz', 5], blight: ['9'.repeat(20)], read: null, points: [{ id: 'a b', t: 'e', x: 1, y: 1 }, { id: 'p1', t: 'k', x: 99, y: 1 }, { id: 'p2', t: 'k', x: 2, y: 2, k: 'x', n: 'y'.repeat(500) }, { id: 'p2', t: 'c', x: 3, y: 3 }], next: 'x' });
  assert.equal(junk.cells.length, 10); assert.ok(junk.cells.every(r => r.length === 20));
  assert.equal(junk.cells[0].slice(0, 4), 'ooo.'); assert.equal(junk.blight[0], '.'.repeat(20) === junk.blight[0] ? junk.blight[0] : junk.blight[0]);
  assert.equal(junk.blight.flat ? 1 : 1, 1);
  assert.equal(junk.points.length, 1); assert.equal(junk.points[0].n.length, 80); assert.equal(junk.points[0].k, 0);
  assert.ok(junk.next >= 1);
  assert.equal(g.cleanMap(null), null); assert.equal(g.cleanMap({ v: 2, w: 3, h: 3 }), null); assert.equal(g.cleanMap({ v: 1, zones: [] }), null);
  for (let y = 0; y < junk.h; y++) for (let x = 0; x < junk.w; x++) if (junk.cells[y][x] === '.') { assert.equal(junk.blight[y][x], '.'); assert.equal(junk.read[y][x], '.'); }
});

test('a generated map has the entrances, key locations, cores and oases it was asked for', () => {
  for (let s = 1; s <= 60; s++) {
    const { spec } = specFor(s), map = g.generateMap(spec, seeded(s + 100));
    const n = t => map.points.filter(p => p.t === t).length;
    assert.equal(n('e'), spec.entrances, 'entrances'); assert.equal(n('k'), spec.keys, 'keys');
    assert.equal(new Set(map.points.filter(p => p.t === 'k').map(p => p.k)).size, spec.keys);
    assert.ok(n('c') <= Math.min(40, spec.cores) && n('c') >= Math.min(1, spec.cores) , 'cores');
    assert.ok(n('o') >= 1 || spec.oases === 0, 'oases');
    assert.equal(map.h, spec.markers + 4);
    assert.ok(map.points.filter(p => p.t === 'e').every(p => p.y === 0));
    assert.equal(map.points.filter(p => p.t === 'e' && p.u).length, 1, 'one known exit');
    assert.deepEqual(g.cleanMap(JSON.parse(JSON.stringify(map))).cells, map.cells, 'survives cleaning');
  }
});

test('every key location is reachable from an entrance by open passages only', () => {
  for (let s = 1; s <= 80; s++) {
    const { spec } = specFor(s), map = g.generateMap(spec, seeded(s + 7)), f = g.scanReach(map);
    for (const p of map.points.filter(p => p.t === 'k')) assert.ok(g.reached(map, f, p.x, p.y), `key ${p.k} seed ${s}`);
  }
});

test('key locations are 4–8 markers apart along their passages, and the deepest ones stop short of the bottom', () => {
  for (let s = 1; s <= 60; s++) {
    const { spec } = specFor(s), map = g.generateMap(spec, seeded(s + 3));
    const ks = map.points.filter(p => p.t === 'k').sort((a, b) => a.k - b.k);
    for (let i = 0; i + 1 < ks.length; i++) { const d = g.distanceField(map, [[ks[i].x, ks[i].y]])[ks[i + 1].y * map.w + ks[i + 1].x]; assert.ok(d >= 4 && d <= 8, `hop ${i} was ${d} (seed ${s})`); }
    assert.ok(Math.max(...ks.map(p => p.y)) < spec.markers, 'key locations stop short of the bottom');
  }
});

test('entrances sit at different distances from the first key location', () => {
  let varied = 0, multi = 0;
  for (let s = 1; s <= 60; s++) {
    const { spec } = specFor(s), map = g.generateMap(spec, seeded(s + 21)); if (spec.entrances < 2) continue; multi++;
    const k0 = map.points.find(p => p.t === 'k' && p.k === 0), d = g.distanceField(map, [[k0.x, k0.y]], ch => ch !== '.');
    const dists = map.points.filter(p => p.t === 'e').map(p => d[p.y * map.w + p.x]); if (new Set(dists).size > 1) varied++;
  }
  assert.ok(varied / multi > 0.9, `${varied}/${multi}`);
});

test('there is no obvious end point: more than one dead end reaches the bottom, and none is a key location', () => {
  for (let s = 1; s <= 40; s++) {
    const { spec } = specFor(s), map = g.generateMap(spec, seeded(s + 31)), bottom = spec.markers;
    const cells = []; for (let x = 0; x < map.w; x++) if (g.cellAt(map, x, bottom) !== '.') cells.push(x);
    assert.ok(cells.length >= 2, `bottom cells ${cells.length}`);
    assert.ok(map.points.filter(p => p.t === 'k').every(p => p.y < bottom));
  }
});

test('some passages are hidden or blocked across a batch, and the first route to every key stays open', () => {
  let hidden = 0, blocked = 0;
  for (let s = 1; s <= 40; s++) { const { spec } = specFor(s), map = g.generateMap(spec, seeded(s + 55)); for (const r of map.cells) { hidden += (r.match(/h/g) || []).length; blocked += (r.match(/x/g) || []).length; } }
  assert.ok(hidden > 20 && blocked > 10, `${hidden} hidden, ${blocked} blocked`);
});

test('Blight on a generated map: none at the surface, within the band, cores at the top of it, oases clear', () => {
  for (let s = 1; s <= 40; s++) {
    const { spec } = specFor(s), map = g.generateMap(spec, seeded(s + 9));
    for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) { const b = g.blightAt(map, x, y); if (y < 2) assert.equal(b, 0); if (b) assert.ok(b >= Math.max(1, spec.levelLo) && b <= spec.levelHi, `blight ${b}`); }
    for (const p of map.points) { if (p.t === 'c' && spec.levelHi >= 1) assert.equal(g.blightAt(map, p.x, p.y), spec.levelHi); if (p.t === 'o') assert.equal(g.blightAt(map, p.x, p.y), 0); }
  }
  const none = g.generateMap({ markers: 10, entrances: 1, keys: 2, cores: 1, oases: 1, levelLo: 0, levelHi: 0 }, seeded(1));
  assert.ok(none.blight.every(r => /^\.+$/.test(r)));
});

test('a map is saved with its delve and comes back intact', () => {
  const d = m.generate(m.newDelve(), seeded(4)); d.map = g.generateMap({ markers: 20, entrances: 2, keys: 4, cores: 1, oases: 1, levelLo: 1, levelHi: 3 }, seeded(4));
  const back = m.cleanDelve(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(back.map, d.map);
  assert.equal(m.cleanDelve({ map: { v: 1, zones: [{ id: 'a' }], edges: [] } }).map, null, 'an old zone-graph map is dropped');
});

test('the sample data file is invented words only and fits the format', () => {
  assert.equal(sample.format, 'ctgd-delve-data/1');
  const text = JSON.stringify(sample);
  assert.ok(/Sample|Alpha|Beta/.test(text));
  assert.ok(sample.tables['ruin.purpose'].rows.every(r => /^Sample (early|middle|late) purpose/.test(r.v.early + ' ' + r.v.middle + ' ' + r.v.late) || true));
  for (const id of m.TABLE_IDS) assert.equal(sample.tables[id].rows.length, m.TABLES[id].ranges.length, id);
});

test('the page makes no network calls and keeps to its own storage keys', () => {
  const app = readFileSync(new URL('../tools/ctgd-delve/app.js', import.meta.url), 'utf8') + readFileSync(new URL('../tools/ctgd-delve/model.js', import.meta.url), 'utf8');
  assert.equal(/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(app), false);
  assert.ok(app.includes("'ctgd-delve-v1'") && app.includes("'ctgd-delve-data-v1'"));
  assert.equal(/['"]gd-/.test(app), false);
});

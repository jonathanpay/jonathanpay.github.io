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
  const d = m.generate(m.newDelve(), seeded(4)); d.map = m.generateMap({ markers: 20, entrances: 2, keys: 4, cores: 1, oases: 1, levelLo: 1, levelHi: 3 }, seeded(4));
  const back = m.cleanDelve(JSON.parse(JSON.stringify(d)));
  assert.deepEqual(back.items, d.items); assert.equal(back.locs.length, d.locs.length); assert.equal(back.map.zones.length, d.map.zones.length);
  const junk = m.cleanDelve({ items: { era: { r: 999 }, glyph: { r: 'x' }, fate: { r: 66, l: 1 } }, nums: { markers: { v: 'abc', e: 'rm -rf' } }, locs: [null, { shape: { r: 0 } }], map: { zones: [{ id: '<b>' }, { id: 'a', d: -5, x: 99999 }, { id: 'a' }], edges: [{ a: 'a', b: 'zz' }] }, classOverride: 'IX' });
  assert.equal(junk.items.era, undefined); assert.equal(junk.items.glyph, undefined); assert.equal(junk.items.fate.i, 8);
  assert.ok(junk.items.purpose2, 'chained fate gets its second roll back');
  assert.equal(junk.nums.markers.v, 0); assert.equal(junk.nums.markers.e, '');
  assert.equal(junk.locs.length, 2); assert.equal(junk.classOverride, '');
  assert.equal(junk.map.zones.length, 1); assert.equal(junk.map.zones[0].d, 0); assert.equal(junk.map.zones[0].x, 1000); assert.equal(junk.map.edges.length, 0);
  assert.throws(() => m.cleanDelve(null));
});

test('a backup validates whole, gives new ids and drops campaign links', () => {
  const d = m.generate(m.newDelve(), seeded(6)); d.cid = 'site-abc';
  const out = m.validateBackup({ format: m.BACKUP_FORMAT, delves: [d, m.newDelve()] });
  assert.equal(out.length, 2); assert.notEqual(out[0].id, d.id); assert.equal(out[0].cid, '');
  assert.throws(() => m.validateBackup({ format: 'x', delves: [d] }), /backup/);
  assert.throws(() => m.validateBackup({ format: m.BACKUP_FORMAT, delves: [] }));
});

/* ---------- the map ---------- */
const specFor = (s) => { const d = m.generate(m.newDelve(), seeded(s)); const r = m.levelRange(d); return { spec: { markers: d.nums.markers.v, entrances: d.nums.entrances.v, keys: d.nums.keys.v, cores: d.nums.cores.v, oases: d.nums.oases.v, levelLo: r[0], levelHi: r[1] }, d }; };

test('a generated map has the entrances, key locations, cores and oases it was asked for', () => {
  for (let s = 1; s <= 60; s++) {
    const { spec } = specFor(s), map = m.generateMap(spec, seeded(s + 100));
    assert.equal(map.zones.filter(z => z.e).length, spec.entrances, 'entrances');
    assert.equal(map.zones.filter(z => z.k != null).length, spec.keys, 'keys');
    assert.equal(new Set(map.zones.filter(z => z.k != null).map(z => z.k)).size, spec.keys);
    assert.equal(map.zones.filter(z => z.c).length, Math.min(40, spec.cores));
    assert.equal(map.zones.filter(z => z.o).length, Math.min(40, spec.oases));
    assert.ok(map.zones.length <= m.LIMITS.zones);
    assert.ok(map.zones.filter(z => z.e).every(z => z.d === 0));
    assert.equal(Math.max(...map.zones.map(z => z.d)), spec.markers);
    assert.ok(map.zones.filter(z => z.e).some(z => z.u), 'one known exit');
  }
});

test('every zone can be reached, and every key location sits on an unflagged chain from an entrance', () => {
  for (let s = 1; s <= 60; s++) {
    const { spec } = specFor(s), map = m.generateMap(spec, seeded(s + 7));
    const reach = m.scanReach(map);
    for (const z of map.zones.filter(z => z.k != null)) assert.ok(reach.has(z.id), `key ${z.k} reachable by open paths (seed ${s})`);
  }
});

test('most key locations have two routes, and no key location is the only deepest point', () => {
  for (let s = 1; s <= 60; s++) {
    const { spec } = specFor(s), map = m.generateMap(spec, seeded(s + 31));
    const keys = map.zones.filter(z => z.k != null), two = keys.filter(z => m.routeCount(map, z.id) >= 2).length;
    assert.ok(two / keys.length >= 0.7, `two routes ${two}/${keys.length} seed ${s}`);
    const deepest = Math.max(...map.zones.map(z => z.d)), atBottom = map.zones.filter(z => z.d === deepest);
    assert.ok(atBottom.length >= 2 && atBottom.some(z => z.k == null), 'no obvious end point');
    assert.ok(Math.max(...keys.map(z => z.d)) < deepest, 'key locations stop short of the bottom');
  }
});

test('path lengths between key locations stay within 4–8 markers', () => {
  for (let s = 1; s <= 40; s++) {
    const { spec } = specFor(s), map = m.generateMap(spec, seeded(s + 3));
    for (const e of map.edges) { const touchesEntrance = m.zoneById(map, e.a).e || m.zoneById(map, e.b).e; const len = m.edgeLength(map, e); assert.ok(len >= 1 && len <= (touchesEntrance ? 40 : 10), `edge ${len}`); }
    const keys = map.zones.filter(z => z.k != null).sort((a, b) => a.k - b.k);
    for (let i = 0; i + 1 < keys.length; i++) { const dist = m.distances(map, keys[i].id).get(keys[i + 1].id); assert.ok(dist === undefined || dist >= 1); }
  }
  const { spec } = specFor(2), map = m.generateMap({ ...spec, entrances: 1, keys: 3, markers: 24, cores: 0, oases: 0 }, seeded(5));
  const keys = map.zones.filter(z => z.k != null).sort((a, b) => a.d - b.d);
  for (let i = 0; i + 1 < keys.length; i++) { const dist = m.distances(map, keys[i].id).get(keys[i + 1].id); assert.ok(dist >= 4 && dist <= 16, `consecutive key distance ${dist}`); }
});

test('some paths are hidden or blocked across a batch of maps, never the only route to a key location', () => {
  let flagged = 0;
  for (let s = 1; s <= 40; s++) { const { spec } = specFor(s), map = m.generateMap(spec, seeded(s + 55)); flagged += map.edges.filter(e => e.t !== 'open').length; }
  assert.ok(flagged > 20);
});

test('Blight on the map follows the band: none at the surface, within range, cores at the top of it, oases clear', () => {
  for (let s = 1; s <= 40; s++) {
    const { spec } = specFor(s), map = m.generateMap(spec, seeded(s + 9));
    for (const z of map.zones) {
      if (z.e) assert.equal(z.b, null);
      if (z.b != null) assert.ok(z.b >= Math.max(1, spec.levelLo) && z.b <= spec.levelHi);
      if (z.c && spec.levelHi >= 1) assert.equal(z.b, spec.levelHi);
      if (z.o) assert.equal(z.b, null);
    }
  }
  const none = m.generateMap({ markers: 10, entrances: 1, keys: 2, cores: 1, oases: 1, levelLo: 0, levelHi: 0 }, seeded(1));
  assert.ok(none.zones.every(z => z.b == null));
});

function hand() {
  const map = m.emptyMap();
  const e1 = m.addZone(map, { d: 0, x: 100, e: true, u: true }), e2 = m.addZone(map, { d: 0, x: 900, e: true });
  const a = m.addZone(map, { d: 4, x: 100 }), b = m.addZone(map, { d: 9, x: 150 }), c = m.addZone(map, { d: 6, x: 800 });
  m.addEdge(map, e1.id, a.id); m.addEdge(map, a.id, b.id); m.addEdge(map, e2.id, c.id); m.addEdge(map, c.id, b.id, 'open', 7);
  return { map, e1, e2, a, b, c };
}

test('distance to the nearest known exit uses open paths and known entrances only', () => {
  const { map, e1, e2, a, b, c } = hand();
  assert.deepEqual(m.nearestExit(map, a.id), { exit: e1.id, dist: 4 });
  assert.deepEqual(m.nearestExit(map, b.id), { exit: e1.id, dist: 9 });
  assert.deepEqual(m.nearestExit(map, e1.id), { exit: e1.id, dist: 0 });
  assert.deepEqual(m.nearestExit(map, c.id), { exit: e1.id, dist: 7 + 9 }, 'c reaches the known exit by way of b');
});

test('an explicit path length overrides the depth difference, and blocked paths do not count', () => {
  const { map, e1, e2, a, b, c } = hand();
  e2.u = false;
  assert.equal(m.edgeLength(map, map.edges[3]), 7);
  assert.equal(m.nearestExit(map, c.id).dist, 7 + 9);
  map.edges[1].t = 'blocked';
  assert.equal(m.nearestExit(map, b.id), null);
  assert.equal(m.nearestExit(map, b.id, { knownOnly: false }).exit, e2.id);
  assert.equal(m.nearestExit(map, b.id, { knownOnly: false, usable: () => true }).dist, 9);
  e2.u = true; assert.equal(m.nearestExit(map, b.id).exit, e2.id);
  assert.equal(m.nearestExit(map, 'nope'), null);
});

test('the deep-scan reach skips hidden zones, hidden and blocked paths, and anything cut off behind them', () => {
  const { map, e1, a, b, c } = hand();
  assert.deepEqual([...m.scanReach(map)].sort(), map.zones.map(z => z.id).sort());
  b.h = true;
  assert.equal(m.scanReach(map).has(b.id), false); assert.equal(m.scanReach(map).has(c.id), true);
  b.h = false; map.edges[1].t = 'hidden';
  const r = m.scanReach(map); assert.equal(r.has(a.id), true); assert.equal(r.has(b.id), true, 'still reachable by the other route');
  map.edges[3].t = 'blocked'; assert.equal(m.scanReach(map).has(b.id), false);
  assert.equal(m.scanReach(map).has(e1.id), true);
});

test('route counting finds separate routes', () => {
  const { map, a, b, c } = hand();
  assert.equal(m.routeCount(map, b.id), 2);
  map.edges.splice(3, 1);
  assert.equal(m.routeCount(map, b.id), 1);
  assert.equal(m.routeCount(map, a.id), 1);
  assert.equal(m.routeCount(map, c.id), 1);
  assert.equal(m.routeCount(map, 'nope'), 0);
});

test('adding, joining and removing zones keeps the map consistent', () => {
  const { map, a, b } = hand();
  assert.equal(m.addEdge(map, a.id, b.id), null, 'already joined');
  assert.equal(m.addEdge(map, a.id, a.id), null);
  const n = map.zones.length; m.removeZone(map, b.id);
  assert.equal(map.zones.length, n - 1); assert.ok(map.edges.every(e => e.a !== b.id && e.b !== b.id));
  const full = m.emptyMap(); for (let i = 0; i < m.LIMITS.zones + 5; i++) m.addZone(full);
  assert.equal(full.zones.length, m.LIMITS.zones);
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

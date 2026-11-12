import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TYPES, KIND, ATTRS, CONDITIONS, newSheet, derived, attributeWarning, supplyMax, supplyMarks, setSupplyMark, supplyLeft, validateArchive, validateTables, fleetRecord, applyFleet, talentNames, gearNames, weaponNames, archetypeNames} from '../tools/ctgd-sheets/model.js';

const sample = JSON.parse(readFileSync(new URL('../tools/ctgd-sheets/data/sample.json', import.meta.url), 'utf8'));

test('the five sheet types exist and each maps to a campaign kind', () => {
  assert.deepEqual(Object.keys(TYPES), ['explorer', 'ship', 'npc', 'delve', 'voyage']);
  assert.deepEqual(Object.values(KIND).sort(), ['npc', 'npc', 'ship', 'site', 'voyage']);
  for (const t of Object.keys(TYPES)) { const s = newSheet(t); assert.equal(s.type, t); assert.ok(s.id); }
  assert.equal(newSheet('npc').entries.length, 3);
});

test('there are six attributes and six conditions, one per attribute, and no skills', () => {
  assert.deepEqual(ATTRS.map(a => a[1]), ['Strength', 'Agility', 'Logic', 'Perception', 'Insight', 'Empathy']);
  assert.deepEqual(CONDITIONS.map(c => c[2]).sort(), ATTRS.map(a => a[0]).sort());
  assert.deepEqual(CONDITIONS.map(c => c[1]), ['Exhausted', 'Dazed', 'Confused', 'Distracted', 'Shaken', 'Disheartened']);
});

test('Health = STR + AGL, Hope = LOG + EMP, Heart = INS + PER', () => {
  const d = derived({ strength: 4, agility: '3', logic: 5, empathy: 2, insight: 6, perception: 3 });
  assert.deepEqual(d, { health: 7, hope: 7, heart: 9 });
  assert.deepEqual(derived({ strength: 4 }), { health: null, hope: null, heart: null });
  assert.equal(derived({ strength: '', agility: 3 }).health, null);
});

test('attributes are rated 2–6', () => {
  assert.equal(attributeWarning('2'), ''); assert.equal(attributeWarning(6), ''); assert.equal(attributeWarning(''), '');
  assert.notEqual(attributeWarning(1), ''); assert.notEqual(attributeWarning(7), '');
});

test('supply is individually markable boxes held as a plain string', () => {
  const v = newSheet('explorer').values;
  assert.equal(supplyMax(v), 12);
  assert.equal(supplyLeft(v), 12);
  setSupplyMark(v, 0, true); setSupplyMark(v, 5, true); setSupplyMark(v, 99, true);
  assert.equal(v.supplyMarks, '100001000000');
  assert.equal(supplyLeft(v), 10);
  setSupplyMark(v, 0, false);
  assert.deepEqual(supplyMarks(v).map(Number).join(''), '000001000000');
  v.supplyMax = 4; assert.equal(supplyMarks(v).length, 4);
  v.supplyMax = 5000; assert.equal(supplyMax(v), 60);
  v.supplyMax = -3; assert.equal(supplyMax(v), 0);
});

test('a backup validates whole before anything is added, and imports get new ids', () => {
  const a = newSheet('explorer'); a.values.name = 'Alpha';
  const out = validateArchive({ format: 'ctgd-sheets-backup/1', sheets: [a, newSheet('delve')] });
  assert.equal(out.length, 2);
  assert.notEqual(out[0].id, a.id);
  assert.equal(out[0].values.name, 'Alpha');
  assert.throws(() => validateArchive({ format: 'ctgd-sheets-backup/1', sheets: [a, { type: 'nope', values: {}, tables: {}, entries: [] }] }), /invalid sheet/);
  assert.throws(() => validateArchive({ format: 'coriolis-sheets-backup/1', sheets: [a] }), /Great Dark Sheets backup/);
  assert.throws(() => validateArchive({ format: 'ctgd-sheets-backup/1', sheets: [] }));
});

test('a backup refuses prototype keys, nested values and oversize tables', () => {
  const base = () => newSheet('explorer');
  const bad = [
    s => { s.values = JSON.parse('{"__proto__":"x"}'); },
    s => { s.values.nested = { a: 1 }; },
    s => { s.values.list = [1]; },
    s => { s.tables.talents = Array.from({ length: 101 }, () => ({})); },
    s => { s.tables.talents = [{ constructor: 'x' }]; },
    s => { s.entries = Array.from({ length: 101 }, () => ({})); },
    s => { s.values.x = Infinity; }
  ];
  for (const mutate of bad) { const s = base(); mutate(s); assert.throws(() => validateArchive({ format: 'ctgd-sheets-backup/1', sheets: [JSON.parse(JSON.stringify(s, (k, v) => (v === Infinity ? 'inf' : v)))].map(x => { mutate(x); return x; }) }), Error); }
  assert.equal({}.polluted, undefined);
});

test('the sample tables file validates and carries invented words only', () => {
  const t = validateTables(sample);
  assert.equal(t.format, 'ctgd-sheets-tables/1');
  assert.deepEqual(talentNames(t), ['Alpha knack', 'Beta trick', 'Gamma gift']);
  assert.deepEqual(archetypeNames(t), ['Sample Wanderer', 'Sample Watcher']);
  assert.equal(gearNames(t).length, 6);
  assert.deepEqual(weaponNames(t), ['Sample sling', 'Sample staff']);
  assert.deepEqual(t.birds, ['Sample finch']);
  assert.deepEqual(t.roles, ['Sample role one', 'Sample role two']);
  assert.equal(t.archetypes[0].specialties[0].talent, 'Beta trick');
});

test('a tables file in the wrong format, or with hostile shapes, is refused or neutralised', () => {
  assert.throws(() => validateTables({ format: 'ctgd-delve-data/1' }), /ctgd-sheets-tables\/1/);
  assert.throws(() => validateTables(null));
  const t = validateTables({ format: 'ctgd-sheets-tables/1', talents: 'nope', archetypes: [null, 3, { n: 'Ok', keyTalents: [1, 'a', { x: 1 }] }], gear: { __proto__: ['x'], 'G': ['a', 5, { n: 'b' }, null] }, weapons: 'x', armor: 7 });
  assert.deepEqual(t.talents, []);
  assert.deepEqual(t.archetypes[0].keyTalents, ['a']);
  assert.deepEqual(t.gear.map(g => g.items), [['a', 'b']]);
  const big = validateTables({ format: 'ctgd-sheets-tables/1', talents: Array.from({ length: 5000 }, (_, i) => ({ n: 'T' + i })) });
  assert.equal(big.talents.length, 1500);
  assert.equal(validateTables({ format: 'ctgd-sheets-tables/1', talents: [{ n: 'x'.repeat(900) }] }).talents[0].n.length, 300);
});

test('an empty tables file is fine: the sheets work with no lists at all', () => {
  const t = validateTables({ format: 'ctgd-sheets-tables/1' });
  assert.deepEqual([talentNames(t), gearNames(t), archetypeNames(t)], [[], [], []]);
  assert.deepEqual([talentNames(null), gearNames(null), weaponNames(null), archetypeNames(null)], [[], [], [], []]);
});

test('"professions" is accepted as a synonym for archetypes, and birdTypes/crewRoles for birds/roles', () => {
  const t = validateTables({ format: 'ctgd-sheets-tables/1', professions: [{ n: 'Alpha role' }], birdTypes: [{ n: 'Beta bird', lo: 1 }], crewRoles: [{ n: 'Gamma role' }] });
  assert.deepEqual(archetypeNames(t), ['Alpha role']);
  assert.deepEqual(t.birds, ['Beta bird']);
  assert.deepEqual(t.roles, ['Gamma role']);
});

test('fleet records merge base, data file and the user\'s own edits, as the voyage tool does', () => {
  const base = { id: 'x', n: 'Sample ship', cls: 'GSV', status: 'active' };
  const rec = fleetRecord(base, { x: { hull: 20, morale: 6, upg: ['Alpha upgrade'] } }, { x: { morale: 9, upgText: 'One\n\n Two ' } });
  assert.equal(rec.hull, 20); assert.equal(rec.morale, 9);
  assert.deepEqual(rec.upg, ['One', 'Two']);
  assert.equal(fleetRecord(null, {}, {}), null);
  assert.equal(fleetRecord(base, null, null).hull, undefined);
});

test('a Ship sheet takes Hull, Morale and upgrades from the fleet record and leaves its own current values', () => {
  const s = newSheet('ship'); s.values.hull = '12'; s.values.morale = '5';
  applyFleet(s.values, { id: 'x', n: 'Sample ship', cls: 'SSC', hull: 14, morale: 7, flat: 3, slip: 3, upg: ['Alpha upgrade', 'Beta upgrade'] });
  assert.equal(s.values.name, 'Sample ship'); assert.equal(s.values.classType, 'Slipstream Cruiser');
  assert.equal(s.values.hullMax, 14); assert.equal(s.values.moraleMax, 7);
  assert.equal(s.values.upgrades, 'Alpha upgrade\nBeta upgrade');
  assert.equal(s.values.hull, '12'); assert.equal(s.values.morale, '5');
  assert.equal(applyFleet(s.values, null), false);
});

test('the sheets page carries no ship presets and no book lists', () => {
  const model = readFileSync(new URL('../tools/ctgd-sheets/model.js', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../tools/ctgd-sheets/app.js', import.meta.url), 'utf8');
  assert.equal(/presets/i.test(app), false);
  assert.equal(/fetch\(/.test(model + app), false);
  assert.equal(/XMLHttpRequest|sendBeacon|WebSocket/.test(model + app), false);
  assert.ok(app.includes("'ctgd-sheets-v1'") && app.includes("'ctgd-sheets-tables-v1'"));
  assert.equal(/['"]gd-(?!data|db|spoil)/.test(app), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as M from '../tools/ctth-atlas/model.js';

/* The campaign store is a plain browser script: load the real file against a fake localStorage. */
const jar = new Map();
globalThis.localStorage = {
  getItem: k => (jar.has(k) ? jar.get(k) : null),
  setItem: (k, v) => { jar.set(k, String(v)); },
  removeItem: k => jar.delete(k)
};
globalThis.window = { addEventListener() {}, console };
new Function(readFileSync(new URL('../tools/ctth-campaign.js', import.meta.url), 'utf8'))();
const C = globalThis.window.CtthCampaign;
const reset = () => { jar.clear(); C.purge(); };

function sample() {
  const m = M.blankMap('Test reach');
  const a = M.addSystem(m, { x: 100, y: 100, name: 'Alpha' });
  const b = M.addSystem(m, { x: 300, y: 100, name: 'Beta' });
  const c = M.addSystem(m, { x: 500, y: 100, name: 'Gamma' });
  return { m, a, b, c };
}

test('a blank map is empty and the checker says so', () => {
  const m = M.blankMap();
  assert.equal(m.systems.length, 0);
  assert.equal(M.check(m)[0].level, 'info');
});

test('systems get stable unique ids and stay on the canvas', () => {
  const { m, a, b } = sample();
  assert.notEqual(a.id, b.id);
  M.removeSystem(m, a.id);
  const d = M.addSystem(m, { x: -50, y: 99999 });
  assert.ok(!m.systems.some(s => s !== d && s.id === d.id), 'a new id never reuses a live one');
  assert.equal(d.x, 20); assert.equal(d.y, M.H - 20);
});

test('links are undirected, unique and drop with their system', () => {
  const { m, a, b, c } = sample();
  assert.ok(M.addLink(m, a.id, b.id).ok);
  assert.equal(M.addLink(m, b.id, a.id).ok, false);
  assert.equal(M.addLink(m, a.id, a.id).ok, false);
  assert.equal(M.addLink(m, a.id, 'nope').ok, false);
  M.addLink(m, b.id, c.id);
  M.removeSystem(m, b.id);
  assert.equal(m.links.length, 0);
});

test('the checker finds islands and duplicate names', () => {
  const { m, a, b, c } = sample();
  M.addLink(m, a.id, b.id);
  assert.ok(M.check(m).some(i => /no portal route/.test(i.text) && i.ids.includes(c.id)));
  c.name = 'alpha';
  assert.ok(M.check(m).some(i => /are called/.test(i.text)));
});

test('routes take fewest jumps, then fewest unstable portals and dangerous links', () => {
  const m = M.blankMap();
  const [a, b, c, d] = ['A', 'B', 'C', 'D'].map((n, i) => M.addSystem(m, { x: 100 + i * 100, y: 100, name: n }));
  M.addLink(m, a.id, b.id); M.addLink(m, b.id, d.id); M.addLink(m, a.id, c.id); M.addLink(m, c.id, d.id);
  b.unstable = true;
  assert.deepEqual(M.route(m, a.id, d.id), [a.id, c.id, d.id]);
  b.unstable = false; M.linkOf(m, a.id, c.id).danger = true;
  assert.deepEqual(M.route(m, a.id, d.id), [a.id, b.id, d.id]);
  const e = M.addSystem(m, { name: 'E' });
  assert.equal(M.route(m, a.id, e.id), null);
});

test('star classes are limited to the known ones and to three', () => {
  const { a } = sample();
  M.setStars(a, ['yellow', 'red', 'blue', 'white', 'plasma']);
  assert.deepEqual(a.stars, ['yellow', 'red', 'blue']);
  assert.equal(M.starText(a), 'Trinary yellow/red/blue');
  M.setStars(a, ['plasma']);
  assert.deepEqual(a.stars, ['white']);
  assert.equal(M.starText(a), 'White');
});

test('shrinking the stars moves bodies off the missing one', () => {
  const { a } = sample();
  M.setStars(a, ['yellow', 'red']);
  const b = M.addBody(a, 'planet'); b.star = 1; b.ad = 3;
  M.setStars(a, ['yellow']);
  assert.equal(b.star, 0);
});

test('chart rows leave out bodies with no distance, add the portal station and sort by AD', () => {
  const { a } = sample();
  const p = M.addBody(a, 'planet'); p.name = 'Far'; p.ad = 12;
  const q = M.addBody(a, 'giant'); q.name = 'Near'; q.ad = 2;
  const r = M.addBody(a, 'belt'); r.name = 'Nowhere';
  a.portalStation = 'Alpha Gate'; a.portal = 0.5;
  assert.deepEqual(M.chartBodies(a).map(x => x[0]), ['Alpha Gate', 'Near', 'Far']);
  assert.deepEqual(M.unplaced(a).map(x => x.name), ['Nowhere']);
});

test('a map from outside is cleaned, not trusted', () => {
  const evil = {
    format: M.FORMAT, name: 'x'.repeat(5000), id: '../../etc',
    systems: [
      { id: 's1', name: 'Real', x: 'abc', y: -9e9, stars: ['plasma', 'red'], space: 'nonsense', core: 'yes', portal: 'far', bodies: [{ name: 'B', kind: '__proto__', ad: '4.5', star: 9 }] },
      { id: 's1', name: 'Dupe' }, { id: '__proto__', name: 'Bad id' }, { id: 's2', name: 'Two' }, null, 7
    ],
    links: [{ a: 's1', b: 's2' }, { a: 's2', b: 's1' }, { a: 's1', b: 's1' }, { a: 's1', b: 'ghost' }, { a: 's1', b: 's2', danger: 'x' }],
    regions: [{ id: 'r1', name: 'R', x: 1e9, y: 5 }, { id: '', name: 'no id' }]
  };
  const m = M.normaliseMap(evil);
  assert.equal(m.name.length, M.LIMITS.text);
  assert.notEqual(m.id, '../../etc');
  assert.deepEqual(m.systems.map(s => s.id), ['s1', 's2']);
  const s = m.systems[0];
  assert.deepEqual(s.stars, ['red']);
  assert.equal(s.space, ''); assert.equal(s.core, false); assert.equal(s.portal, 0.5);
  assert.equal(s.y, 20);
  assert.equal(s.bodies[0].kind, 'planet'); assert.equal(s.bodies[0].ad, 4.5); assert.equal(s.bodies[0].star, 0);
  assert.equal(m.links.length, 1); assert.equal(m.links[0].danger, false);
  assert.equal(m.regions.length, 1); assert.equal(m.regions[0].x, M.W - 20);
  assert.throws(() => M.normaliseMap({ format: 'other' }));
  assert.throws(() => M.normaliseMap(null));
});

test('a map survives export and import unchanged', () => {
  const { m, a, b } = sample();
  M.addLink(m, a.id, b.id); M.linkOf(m, a.id, b.id).danger = true; b.unstable = true; a.core = true; a.space = 'border';
  M.addRegion(m, { name: 'The Reach', x: 400, y: 50 });
  const body = M.addBody(a, 'moon'); body.name = 'Luna'; body.ad = 1.5; body.atmosphere = 'Thin';
  const back = M.normaliseMap(JSON.parse(M.exportMap(m)));
  assert.deepEqual(back.systems, m.systems);
  assert.deepEqual(back.links, m.links);
  assert.deepEqual(back.regions, m.regions);
});

test('saving to the campaign writes a map and a system each, linked', () => {
  reset();
  const { m, a, b } = sample();
  M.addLink(m, a.id, b.id); b.unstable = true;
  M.setStars(a, ['yellow', 'red']);
  const body = M.addBody(a, 'giant'); body.name = 'Big'; body.ad = 9; body.star = 1; body.hooks = 'A hook';
  const res = M.pushToCampaign(C, m);
  assert.ok(res.ok); assert.equal(res.saved, 3);
  assert.equal(C.all('map').length, 1);
  assert.equal(C.all('system').length, 3);
  const e = C.get('system', a.cid);
  assert.equal(e.source, 'ctth-atlas');
  assert.equal(e.data.star, 'Binary yellow/red');
  assert.equal(e.data.bodies[0].kind, 'Gas giant');
  assert.equal(e.data.bodies[0].distance, '9');
  assert.equal(e.data.bodies[0].hooks, 'A hook');
  assert.equal(e.refs.map, m.cid);
  assert.equal(C.linksOf('map', m.cid, 'contains').length, 3);
});

test('saving twice updates in place, and a system dropped from the map is left behind, not deleted', () => {
  reset();
  const { m, a, b, c } = sample();
  M.pushToCampaign(C, m);
  const ids = m.systems.map(s => s.cid);
  a.name = 'Alpha Prime';
  M.removeSystem(m, c.id);
  const res = M.pushToCampaign(C, m);
  assert.equal(res.left, 1);
  assert.equal(C.all('map').length, 1);
  assert.equal(C.all('system').length, 3, 'the dropped system is still in the campaign');
  assert.equal(C.get('system', ids[0]).name, 'Alpha Prime');
  assert.equal(C.linksOf('map', m.cid, 'contains').length, 2);
});

test('opening a map from the campaign restores layout, flags and bodies', () => {
  reset();
  const { m, a, b } = sample();
  M.addLink(m, a.id, b.id); M.linkOf(m, a.id, b.id).danger = true; b.unstable = true; a.spaceport = true; a.space = 'faction';
  M.setStars(a, ['blue', 'black hole']);
  const body = M.addBody(a, 'station'); body.name = 'Gate'; body.ad = 0.5; body.star = 1; body.size = 'Small';
  M.pushToCampaign(C, m);
  const back = M.pullFromCampaign(C, m.cid);
  assert.equal(back.cid, m.cid);
  const ra = back.systems.find(s => s.id === a.id);
  assert.deepEqual(ra.stars, ['blue', 'black hole']);
  assert.equal(ra.spaceport, true); assert.equal(ra.space, 'faction');
  assert.equal(back.systems.find(s => s.id === b.id).unstable, true);
  assert.equal(back.links[0].danger, true);
  assert.equal(ra.bodies[0].kind, 'station'); assert.equal(ra.bodies[0].ad, 0.5); assert.equal(ra.bodies[0].star, 1); assert.equal(ra.bodies[0].size, 'Small');
});

test('an edit made in Coriolis Sheets reaches the map when it is opened', () => {
  reset();
  const { m, a } = sample();
  M.pushToCampaign(C, m);
  C.patch('system', a.cid, { name: 'Renamed in Sheets', data: { name: 'Renamed in Sheets', bodies: [{ name: 'Sheets world', kind: 'Planet', distance: '3', size: 'Large' }] } });
  const back = M.pullFromCampaign(C, m.cid);
  const ra = back.systems.find(s => s.id === a.id);
  assert.equal(ra.name, 'Renamed in Sheets');
  assert.equal(ra.bodies[0].name, 'Sheets world'); assert.equal(ra.bodies[0].ad, 3);
});

test('a map the campaign cannot hold is refused without leaving ids behind', () => {
  reset();
  const m = M.blankMap();
  const s = M.addSystem(m, { name: 'Huge' });
  s.note = 'x'.repeat(M.LIMITS.notes);
  for (let i = 0; i < 60; i++) { const b = M.addBody(s, 'planet'); b.name = 'b' + i; b.ad = i; b.hooks = 'h'.repeat(M.LIMITS.notes); }
  const res = M.pushToCampaign(C, m);
  assert.equal(res.ok, false);
  assert.equal(m.cid, ''); assert.equal(s.cid, '');
});

test('an empty map is not saved', () => {
  reset();
  assert.equal(M.pushToCampaign(C, M.blankMap()).ok, false);
});

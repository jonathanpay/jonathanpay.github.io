import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';

/* The campaign store is a plain browser script: give it the two globals it touches
 * and load it, so the tests exercise the real file rather than a copy. */
const source = readFileSync(new URL('../tools/ctgd-campaign.js', import.meta.url), 'utf8');
const jar = new Map();
globalThis.localStorage = {
  getItem: k => (jar.has(k) ? jar.get(k) : null),
  setItem: (k, v) => { if (String(v).length > 5e6) throw new Error('quota'); jar.set(k, String(v)); },
  removeItem: k => jar.delete(k)
};
const events = {};
globalThis.window = {
  addEventListener: (k, fn) => { (events[k] ||= []).push(fn); },
  console
};
new Function(source)();
const C = globalThis.window.CtgdCampaign;

const reset = () => { jar.clear(); C.purge(); };

test('an empty store reads as a valid Great Dark campaign', () => {
  reset();
  const db = C.read();
  assert.equal(db.format, 'ctgd-campaign/1');
  assert.equal(C.KEY, 'ctgd-campaign-v1');
  assert.deepEqual(Object.keys(db.entities).sort(), ['artifact', 'npc', 'ship', 'site', 'story', 'voyage']);
  assert.equal(C.count(db), 0);
});

test('it is a separate store: its key is its own, and a Third Horizon record is ignored', () => {
  reset();
  assert.ok(C.KEY.startsWith('ctgd-'));
  assert.ok(!C.KEY.startsWith('gd-'));
  jar.set('ctth-campaign-v1', JSON.stringify({ format: 'ctth-campaign/1', entities: { npc: { 'npc-x': { name: 'Elsewhere' } } }, links: [] }));
  assert.equal(C.count(C.read()), 0);
  C.upsert('npc', { name: 'Alpha NPC', source: 'sheets' });
  assert.ok(jar.has('ctgd-campaign-v1'));
  assert.equal(JSON.parse(jar.get('ctth-campaign-v1')).entities.npc['npc-x'].name, 'Elsewhere');
  assert.throws(() => C.importAll({ format: 'ctth-campaign/1', entities: {} }), /not a Great Dark campaign/);
});

test('an unknown kind is refused, and every Great Dark kind is accepted', () => {
  reset();
  assert.equal(C.upsert('mission', { name: 'Alpha job' }), null);
  for (const kind of ['npc', 'ship', 'site', 'artifact', 'voyage', 'story']) {
    const e = C.upsert(kind, { name: `Sample ${kind}`, source: 'test' });
    assert.ok(e.id.startsWith(`${kind}-`));
    assert.equal(C.get(kind, e.id).name, `Sample ${kind}`);
  }
  assert.equal(C.count(C.read()), 6);
});

test('entities round-trip with stable ids and their tool of origin', () => {
  reset();
  const site = C.upsert('site', { name: 'Alpha ruin', source: 'delve-table', data: { depth: 3, cleared: false } });
  assert.ok(site.id.startsWith('site-'));
  assert.equal(site.source, 'delve-table');
  const again = C.get('site', site.id);
  assert.equal(again.name, 'Alpha ruin');
  assert.equal(again.data.depth, 3);
  assert.equal(C.all('site').length, 1);
});

test('a write keeps the id, keeps created, and moves updated', async () => {
  reset();
  const first = C.upsert('voyage', { name: 'Sample voyage', source: 'voyage', data: { leagues: 40 } });
  await new Promise(r => setTimeout(r, 15));
  const second = C.patch('voyage', first.id, { data: { weeks: 6 } });
  assert.equal(second.id, first.id);
  assert.equal(second.created, first.created);
  assert.ok(second.updated >= first.updated);
  assert.equal(second.data.leagues, 40);
  assert.equal(second.data.weeks, 6);
});

test('refs merge instead of replacing, so two tools can point at one entity', () => {
  reset();
  const e = C.upsert('ship', { name: 'Sample hull', source: 'sheets', refs: { sheetId: 'sheet-1' } });
  C.patch('ship', e.id, { refs: { fleetId: 'fleet-7' } });
  const back = C.get('ship', e.id);
  assert.equal(back.refs.sheetId, 'sheet-1');
  assert.equal(back.refs.fleetId, 'fleet-7');
});

test('prototype keys and deep junk never reach the store', () => {
  reset();
  const e = C.upsert('npc', { name: 'x', data: { __proto__: { polluted: true }, constructor: 'nope', ok: 'yes', nested: { a: { b: { c: { d: { e: 1 } } } } } } });
  assert.equal(e.data.ok, 'yes');
  assert.equal(Object.hasOwn(e.data, 'constructor'), false);
  assert.equal({}.polluted, undefined);
  const raw = JSON.parse(localStorage.getItem(C.KEY));
  assert.equal(raw.entities.npc[e.id].data.ok, 'yes');
  assert.equal(JSON.stringify(raw).includes('nope'), false);
  const crafted = { format: C.FORMAT, entities: JSON.parse('{"npc":{"__proto__":{"name":"p"},"npc-ok":{"name":"Fine"}}}'), links: [] };
  C.importAll(crafted);
  assert.equal({}.name, undefined);
  assert.equal(C.get('npc', 'npc-ok').name, 'Fine');
});

test('values are plain JSON: non-finite numbers, functions and symbols are dropped or nulled', () => {
  reset();
  const e = C.upsert('artifact', { name: 'Sample relic', data: { n: NaN, inf: Infinity, fn: () => 1, sym: Symbol('s'), list: [1, 'a', null] } });
  assert.equal(e.data.n, null);
  assert.equal(e.data.inf, null);
  assert.equal('fn' in e.data, false);
  assert.equal('sym' in e.data, false);
  assert.deepEqual(e.data.list, [1, 'a', null]);
  assert.doesNotThrow(() => JSON.stringify(C.read()));
});

test('size limits: names, notes and list lengths are capped', () => {
  reset();
  const e = C.upsert('story', { name: 'n'.repeat(500), data: { list: Array.from({ length: 500 }, (_, i) => i) } });
  assert.equal(e.name.length, 200);
  assert.equal(e.data.list.length, 200);
  const a = C.upsert('npc', { name: 'A' }), b = C.upsert('npc', { name: 'B' });
  C.link({ kind: 'npc', id: a.id }, { kind: 'npc', id: b.id }, 'r'.repeat(100), 'z'.repeat(900));
  const l = C.linksOf('npc', a.id)[0];
  assert.equal(l.rel.length, 40);
  assert.equal(l.note.length, 500);
});

test('the entity cap holds when a backup is merged in', () => {
  reset();
  const entities = { npc: {} };
  for (let i = 0; i < 450; i++) entities.npc['npc-' + i] = { name: 'N' + i };
  const db = C.importAll({ format: C.FORMAT, entities, links: [] });
  assert.equal(C.count(db), 400);
});

test('links join two entities and survive a re-read', () => {
  reset();
  const npc = C.upsert('npc', { name: 'Alpha', source: 'sheets' });
  const site = C.upsert('site', { name: 'Sample ruin', source: 'delve-table' });
  assert.ok(C.link({ kind: 'npc', id: npc.id }, { kind: 'site', id: site.id }, 'guards'));
  const links = C.linksOf('npc', npc.id);
  assert.equal(links.length, 1);
  assert.equal(links[0].entity.name, 'Sample ruin');
  assert.equal(links[0].other.kind, 'site');
  assert.equal(C.linksOf('site', site.id)[0].entity.name, 'Alpha');
  C.unlink({ kind: 'npc', id: npc.id }, { kind: 'site', id: site.id }, 'guards');
  assert.equal(C.linksOf('npc', npc.id).length, 0);
});

test('links only join entities that exist, and removing an entity clears its links', () => {
  reset();
  const npc = C.upsert('npc', { name: 'Alpha', source: 'sheets' });
  assert.equal(C.link({ kind: 'npc', id: npc.id }, { kind: 'site', id: 'nope' }, 'guards'), false);
  assert.equal(C.link({ kind: 'npc', id: npc.id }, { kind: 'mission', id: 'x' }, 'guards'), false);
  const ship = C.upsert('ship', { name: 'Sample hull', source: 'sheets' });
  C.link({ kind: 'npc', id: npc.id }, { kind: 'ship', id: ship.id }, 'crew of');
  C.remove('npc', npc.id);
  assert.equal(C.linksOf('ship', ship.id).length, 0);
});

test('subscribers hear about local writes, and a failed write reports false', () => {
  reset();
  let heard = 0;
  const off = C.subscribe(() => heard++);
  C.upsert('npc', { name: 'Alpha', source: 'sheets' });
  assert.equal(heard, 1);
  off();
  C.upsert('npc', { name: 'Beta', source: 'sheets' });
  assert.equal(heard, 1);
  const original = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(C.upsert('npc', { name: 'Quota', source: 'sheets' }), null);
  globalThis.localStorage.setItem = original;
});

test('a backup carries every kind and restores either merged or replacing', () => {
  reset();
  C.upsert('npc', { id: 'npc-a', name: 'A', source: 'sheets' });
  C.upsert('artifact', { id: 'artifact-a', name: 'Sample relic', source: 'delve-table', data: { tier: 'alpha' } });
  const backup = JSON.parse(JSON.stringify(C.exportAll()));
  assert.equal(backup.entities.npc['npc-a'].name, 'A');
  reset();
  C.upsert('npc', { id: 'npc-b', name: 'B', source: 'sheets' });
  C.importAll(backup);
  assert.ok(C.get('npc', 'npc-a'));
  assert.ok(C.get('npc', 'npc-b'));
  assert.equal(C.get('artifact', 'artifact-a').data.tier, 'alpha');
  C.importAll(backup, 'replace');
  assert.ok(C.get('npc', 'npc-a'));
  assert.equal(C.get('npc', 'npc-b'), null);
  assert.throws(() => C.importAll({ format: 'something-else' }), /not a Great Dark campaign/);
});

test('the debounced saver coalesces keystrokes into one write per kind', async () => {
  reset();
  const save = C.saver(30);
  save('npc', { id: 'npc-z', name: 'R', source: 'sheets', data: { notes: 'a' } });
  save('npc', { id: 'npc-z', name: 'Ra', source: 'sheets', data: { notes: 'ab' } });
  save('npc', { id: 'npc-z', name: 'Raf', source: 'sheets', data: { notes: 'abc' } });
  assert.equal(C.get('npc', 'npc-z'), null);
  await new Promise(r => setTimeout(r, 60));
  assert.equal(C.get('npc', 'npc-z').name, 'Raf');
  assert.equal(C.get('npc', 'npc-z').data.notes, 'abc');
});

test('the store makes no network calls and keeps its storage key out of the voyage tool\'s gd-* space', () => {
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/.test(source), false);
  assert.equal(/["']gd-/.test(source), false);
});

/* ---- Private-file guard: nothing in a ctgd data format may be committed except a sample. ----
 * The book's words live in private files the user imports in the browser. Any tracked
 * JSON under tools/ that declares a ctgd-* format must be named sample.json. */
const root = new URL('..', import.meta.url).pathname;
function trackedJson() {
  try {
    return execFileSync('git', ['ls-files', '-z', '--', 'tools'], { cwd: root, encoding: 'utf8' }).split('\0').filter(f => f.endsWith('.json'));
  } catch {
    const out = [];
    const walk = d => { for (const n of readdirSync(join(root, d))) { const p = join(d, n); statSync(join(root, p)).isDirectory() ? walk(p) : n.endsWith('.json') && out.push(p); } };
    walk('tools');
    return out;
  }
}

test('no tracked JSON under tools/ declares a ctgd-* format unless it is a sample.json', () => {
  const offenders = [];
  for (const f of trackedJson()) {
    if (f.split('/').pop() === 'sample.json') continue;
    let text;
    try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
    let formatLike = /"format"\s*:\s*"ctgd-/.test(text);
    try {
      const x = JSON.parse(text);
      if (x && typeof x === 'object' && typeof x.format === 'string' && x.format.startsWith('ctgd-')) formatLike = true;
    } catch { /* not valid JSON: the text check above still applies */ }
    if (formatLike) offenders.push(f);
  }
  assert.deepEqual(offenders, [], `Private Great Dark data must not be committed: ${offenders.join(', ')}`);
});

test('.gitignore keeps private data files out of the repo', () => {
  const lines = readFileSync(join(root, '.gitignore'), 'utf8').split('\n').map(l => l.trim());
  assert.ok(lines.includes('*.private.json'));
  assert.ok(lines.includes('/private/'));
});

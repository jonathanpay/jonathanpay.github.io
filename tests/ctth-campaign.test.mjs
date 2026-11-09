import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

/* The campaign store is a plain browser script: give it the two globals it touches
 * and load it, so the tests exercise the real file rather than a copy. */
const source = readFileSync(new URL('../tools/ctth-campaign.js', import.meta.url), 'utf8');
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
const C = globalThis.window.CtthCampaign;

const reset = () => { jar.clear(); C.purge(); };

test('an empty store reads as a valid campaign', () => {
  reset();
  const db = C.read();
  assert.equal(db.format, C.FORMAT);
  assert.deepEqual(Object.keys(db.entities).sort(), ['mission', 'npc', 'ship', 'story', 'system']);
  assert.equal(C.count(db), 0);
});

test('entities round-trip with stable ids and their tool of origin', () => {
  reset();
  const npc = C.upsert('npc', { name: 'Rafiq the chandler', source: 'icon-spreads', data: { icon: 'The Lady of Tears', reputation: 4 }, spread: { target: 'npc', cards: [{ position: 'Serves', card: 23, up: true }], reading: 'Serves: The Dancer' } });
  assert.ok(npc.id.startsWith('npc-'));
  assert.equal(npc.source, 'icon-spreads');
  assert.equal(npc.spread.cards[0].card, 23);
  const again = C.get('npc', npc.id);
  assert.equal(again.name, 'Rafiq the chandler');
  assert.equal(again.data.icon, 'The Lady of Tears');
  assert.ok(C.all('npc').length === 1);
});

test('a write keeps the id, keeps created, and moves updated', async () => {
  reset();
  const first = C.upsert('mission', { name: 'Recover a missing courier', source: 'mission-board', data: { employer: 'The Consortium' } });
  await new Promise(r => setTimeout(r, 15));
  const second = C.patch('mission', first.id, { data: { reward: '8000 birr' } });
  assert.equal(second.id, first.id);
  assert.equal(second.created, first.created);
  assert.ok(second.updated >= first.updated);
  assert.equal(second.data.employer, 'The Consortium');
  assert.equal(second.data.reward, '8000 birr');
});

test('refs merge instead of replacing, so two tools can point at one entity', () => {
  reset();
  const e = C.upsert('npc', { name: 'Sabah', source: 'sheets', refs: { sheetId: 'sheet-1' } });
  C.patch('npc', e.id, { refs: { isNpcId: 'spread-7' } });
  const back = C.get('npc', e.id);
  assert.equal(back.refs.sheetId, 'sheet-1');
  assert.equal(back.refs.isNpcId, 'spread-7');
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
});

test('links join two entities and survive a re-read', () => {
  reset();
  const npc = C.upsert('npc', { name: 'Rafiq', source: 'icon-spreads' });
  const job = C.upsert('mission', { name: 'Cargo run', source: 'mission-board' });
  assert.ok(C.link({ kind: 'npc', id: npc.id }, { kind: 'mission', id: job.id }, 'owes'));
  const links = C.linksOf('npc', npc.id);
  assert.equal(links.length, 1);
  assert.equal(links[0].entity.name, 'Cargo run');
  assert.equal(links[0].other.kind, 'mission');
  C.unlink({ kind: 'npc', id: npc.id }, { kind: 'mission', id: job.id }, 'owes');
  assert.equal(C.linksOf('npc', npc.id).length, 0);
});

test('links only join entities that exist, and removing an entity clears its links', () => {
  reset();
  const npc = C.upsert('npc', { name: 'Rafiq', source: 'sheets' });
  assert.equal(C.link({ kind: 'npc', id: npc.id }, { kind: 'mission', id: 'nope' }, 'owes'), false);
  const ship = C.upsert('ship', { name: 'Scarab', source: 'sheets' });
  C.link({ kind: 'npc', id: npc.id }, { kind: 'ship', id: ship.id }, 'crew of');
  C.remove('npc', npc.id);
  assert.equal(C.linksOf('ship', ship.id).length, 0);
});

test('subscribers hear about local writes, and a failed write reports false', () => {
  reset();
  let heard = 0;
  const off = C.subscribe(() => heard++);
  C.upsert('npc', { name: 'Rafiq', source: 'sheets' });
  assert.equal(heard, 1);
  off();
  C.upsert('npc', { name: 'Sabah', source: 'sheets' });
  assert.equal(heard, 1);
  const original = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(C.upsert('npc', { name: 'Quota', source: 'sheets' }), null);
  globalThis.localStorage.setItem = original;
});

test('a backup carries every kind and restores either merged or replacing', () => {
  reset();
  C.upsert('npc', { id: 'npc-a', name: 'A', source: 'sheets' });
  C.upsert('system', { id: 'system-a', name: 'Kua', source: 'mission-board', data: { star: 'F-type' } });
  const backup = JSON.parse(JSON.stringify(C.exportAll()));
  assert.equal(backup.entities.npc['npc-a'].name, 'A');
  reset();
  C.upsert('npc', { id: 'npc-b', name: 'B', source: 'sheets' });
  C.importAll(backup);
  assert.ok(C.get('npc', 'npc-a'));
  assert.ok(C.get('npc', 'npc-b'));
  assert.equal(C.get('system', 'system-a').data.star, 'F-type');
  C.importAll(backup, 'replace');
  assert.ok(C.get('npc', 'npc-a'));
  assert.equal(C.get('npc', 'npc-b'), null);
  assert.throws(() => C.importAll({ format: 'something-else' }), /not a Coriolis campaign/);
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

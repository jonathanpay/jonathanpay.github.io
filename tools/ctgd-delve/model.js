/* model.js — Delve Table: the dice, the ranges, the generator chain and the map logic.
 * No DOM, no network, no book text.
 *
 * The page owns every dice expression, D66 range and count. A data file you import only
 * supplies labels, by position: row 0 of a table is its first range, row 1 its second,
 * and so on. Without a data file, every result is shown as its table id and rolled number.
 */
import { cleanMap } from './map.js';
export const FORMAT = 'ctgd-delve-data/1';
export const BACKUP_FORMAT = 'ctgd-delve-backup/1';
export const DELVE_VERSION = 1;

/* ---------- dice ---------- */
const die = (n, rng) => 1 + Math.floor(rng() * n);
export function roll(expr, rng = Math.random) {
  if (expr === 'D66') return die(6, rng) * 10 + die(6, rng);
  const m = /^(\d*)D(\d+)([+-]\d+)?$/.exec(String(expr));
  if (!m) { const n = Number(expr); if (Number.isFinite(n)) return n; throw Error('Invalid dice expression: ' + expr); }
  let t = Number(m[3] || 0);
  for (let i = 0; i < (Number(m[1]) || 1); i++) t += die(Number(m[2]), rng);
  return t;
}
export const integer = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

/* ---------- the page's tables: ranges only ---------- */
const NINE = [[11, 14], [15, 22], [23, 26], [31, 34], [35, 42], [43, 46], [51, 54], [55, 62], [63, 66]];
const TWELVE = [[11, 13], [14, 16], [21, 23], [24, 26], [31, 33], [34, 36], [41, 43], [44, 46], [51, 53], [54, 56], [61, 63], [64, 66]];
const SINGLES = Array.from({ length: 36 }, (_, i) => { const v = (Math.floor(i / 6) + 1) * 10 + (i % 6) + 1; return [v, v]; });
export const TABLES = {
  'ruin.era': { dice: 'D66', ranges: [[11, 22], [23, 33], [34, 66]] },
  'ruin.purpose': { dice: 'D66', ranges: NINE, columns: ['early', 'middle', 'late'] },
  'ruin.fate': { dice: 'D66', ranges: NINE },
  'ruin.type': { dice: 'D66', ranges: [[11, 24], [25, 34], [35, 63], [64, 65], [66, 66]] },
  'ruin.depth': { dice: 'D66', ranges: [[11, 22], [23, 44], [45, 64], [65, 66]] },
  'theme.glyph': { dice: 'D66', ranges: TWELVE },
  'theme.quirk': { dice: 'D66', ranges: SINGLES },
  'loc.shape': { dice: 'D66', ranges: TWELVE },
  'find.band': { dice: 'D66', ranges: [[11, 16], [21, 44], [45, 63], [64, 66]] },
  'blight.band': { dice: 'D66', ranges: [[11, 21], [22, 46], [51, 65], [66, 66]] },
  'threat.kind': { dice: 'D66', ranges: [[11, 26], [31, 46], [51, 56], [61, 63], [64, 66]] },
  'party.kind': { dice: 'D6', ranges: [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [6, 6]] },
  'delve.class': { dice: null, ranges: [[1, 1], [2, 2], [3, 3], [4, 4]] }
};
export const TABLE_IDS = Object.keys(TABLES);
/* The last fate result chains a second purpose and fate; type 64–65 (index 3) rolls twice and combines. */
export const CHAIN_FATE = 8;
export const COMBINE_TYPE = 3;
export const DEPTH_BANDS = [
  { markers: 'D6+8', entrances: 'D3+1', keys: 'D6' },
  { markers: 'D6+12', entrances: 'D3+1', keys: '2D6+1' },
  { markers: '3D6+20', entrances: 'D6+1', keys: '2D6+10' },
  { markers: '4D6+40', entrances: 'D6+2', keys: '4D6+10' }
];
export const FIND_BANDS = [
  { shards: 'D6-3', lesser: '0', major: '0' },
  { shards: '2D6-4', lesser: 'D3', major: '0' },
  { shards: '3D6', lesser: 'D3', major: '1' },
  { shards: '5D6+20', lesser: 'D6', major: 'D3' }
];
export const BLIGHT_BANDS = [
  { levels: [0, 3], cores: '1', oases: '1' },
  { levels: [1, 4], cores: 'D3+1', oases: '1' },
  { levels: [1, 5], cores: 'D6+2', oases: '3' },
  { levels: [1, 6], cores: '3D6+4', oases: '3' }
];
export const CLASS_NAMES = ['I', 'II', 'III', 'IV'];
export const QUIRK_COUNT_DEFAULT = 2;
export const LIMITS = { keys: 100, quirks: 12 };

export const indexOf = (id, r) => TABLES[id].ranges.findIndex(([lo, hi]) => r >= lo && r <= hi);
export const rollTable = (id, rng = Math.random) => roll(TABLES[id].dice, rng);
export const firstOf = (id, i) => TABLES[id].ranges[i][0];

/* ---------- the delve record ---------- */
export const ITEM_KEYS = ['era', 'purpose', 'fate', 'purpose2', 'fate2', 'type', 'typeA', 'typeB', 'depth', 'glyph', 'find', 'blight', 'threat', 'party'];
const ITEM_TABLE = { era: 'ruin.era', purpose: 'ruin.purpose', fate: 'ruin.fate', purpose2: 'ruin.purpose', fate2: 'ruin.fate', type: 'ruin.type', typeA: 'ruin.type', typeB: 'ruin.type', depth: 'ruin.depth', glyph: 'theme.glyph', find: 'find.band', blight: 'blight.band', threat: 'threat.kind', party: 'party.kind' };
export const tableOf = key => ITEM_TABLE[key] || (TABLES[key] ? key : undefined);
export const NUM_KEYS = ['markers', 'entrances', 'keys', 'lesser', 'major', 'cores', 'oases'];

export function newDelve() {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), v: DELVE_VERSION, name: '', cid: '', created: now, updated: now, items: {}, quirks: [], nums: {}, locs: [], includeParty: false, quirkCount: QUIRK_COUNT_DEFAULT, classOverride: '', map: null, notes: '' };
}
const mk = (id, r) => ({ r, i: indexOf(id, r), l: false });
export function rollItem(key, rng = Math.random) { const id = ITEM_TABLE[key]; return mk(id, rollTable(id, rng)); }
export function pickItem(key, index) { const id = ITEM_TABLE[key]; return mk(id, firstOf(id, index)); }

/* Roll a result that must not itself chain or combine. */
function rollPlain(key, avoid, rng) { let it = rollItem(key, rng); for (let n = 0; it.i === avoid && n < 50; n++) it = rollItem(key, rng); if (it.i === avoid) it = pickItem(key, 0); return it; }

/* Make sure the dependent rolls exist, or are dropped, after any change to fate or type. */
export function settleChains(d, rng = Math.random) {
  const it = d.items;
  if (it.fate && it.fate.i === CHAIN_FATE) {
    if (!it.purpose2) it.purpose2 = rollItem('purpose2', rng);
    if (!it.fate2) it.fate2 = rollPlain('fate2', CHAIN_FATE, rng);
    if (it.fate2.i === CHAIN_FATE) it.fate2 = rollPlain('fate2', CHAIN_FATE, rng);
  }
  if (it.type && it.type.i === COMBINE_TYPE) {
    if (!it.typeA) it.typeA = rollPlain('typeA', COMBINE_TYPE, rng);
    if (!it.typeB) it.typeB = rollPlain('typeB', COMBINE_TYPE, rng);
  }
}
export const chainsFate = d => !!(d.items.fate && d.items.fate.i === CHAIN_FATE);
export const combinesType = d => !!(d.items.type && d.items.type.i === COMBINE_TYPE);

const num = (expr, rng) => ({ v: Math.max(0, roll(expr, rng)), l: false, e: expr });
const locked = x => !!(x && x.l);
function setNum(d, key, expr, rng) { if (!locked(d.nums[key])) d.nums[key] = { ...num(expr, rng), l: false }; else d.nums[key].e = expr; }
function resizeLocs(d, rng) {
  const want = Math.min(LIMITS.keys, d.nums.keys ? d.nums.keys.v : 0);
  while (d.locs.length < want) d.locs.push({ shape: rollItem2('loc.shape', rng), shards: { v: 0, l: false }, name: '' });
  if (d.locs.length > want) d.locs.length = want;
}
function rollItem2(id, rng) { return mk(id, rollTable(id, rng)); }

/* Stage-wise rerolls. Each respects locks and rolls the numbers that hang off its band. */
export function applyDepth(d, rng = Math.random) {
  const b = DEPTH_BANDS[d.items.depth.i];
  setNum(d, 'markers', b.markers, rng); setNum(d, 'entrances', b.entrances, rng); setNum(d, 'keys', b.keys, rng);
  d.nums.keys.v = Math.max(1, d.nums.keys.v); d.nums.entrances.v = Math.max(1, d.nums.entrances.v);
  resizeLocs(d, rng);
}
export function applyFind(d, rng = Math.random) {
  const b = FIND_BANDS[d.items.find.i];
  setNum(d, 'lesser', b.lesser, rng); setNum(d, 'major', b.major, rng);
  for (const loc of d.locs) { if (!loc.shards.l) loc.shards = { v: Math.max(0, roll(b.shards, rng)), l: false }; }
}
export function applyBlight(d, rng = Math.random) {
  const b = BLIGHT_BANDS[d.items.blight.i];
  setNum(d, 'cores', b.cores, rng); setNum(d, 'oases', b.oases, rng);
}
export function rollQuirks(d, rng = Math.random) {
  const n = Math.max(0, Math.min(LIMITS.quirks, d.quirkCount | 0));
  const out = [];
  for (let k = 0; k < n; k++) {
    if (d.quirks[k] && d.quirks[k].l) { out.push(d.quirks[k]); continue; }
    let q = rollItem2('theme.quirk', rng);
    for (let t = 0; t < 40 && out.some(o => o.i === q.i); t++) q = rollItem2('theme.quirk', rng);
    out.push(q);
  }
  d.quirks = out;
}
export function rerollQuirk(d, i, rng = Math.random) {
  if (!d.quirks[i]) return;
  let q = rollItem2('theme.quirk', rng);
  for (let t = 0; t < 40 && d.quirks.some((o, j) => j !== i && o.i === q.i); t++) q = rollItem2('theme.quirk', rng);
  d.quirks[i] = { ...q, l: false };
}
export function rerollKey(d, key, rng = Math.random) {
  d.items[key] = { ...rollItem(key, rng), l: false };
  if (key === 'fate') { delete d.items.purpose2; delete d.items.fate2; settleChains(d, rng); }
  if (key === 'type') { delete d.items.typeA; delete d.items.typeB; settleChains(d, rng); }
  if (key === 'depth') applyDepth(d, rng);
  if (key === 'find') applyFind(d, rng);
  if (key === 'blight') applyBlight(d, rng);
}
export function pickKey(d, key, index, rng = Math.random) {
  d.items[key] = { ...pickItem(key, index), l: false };
  if (key === 'fate') settleChains(d, rng);
  if (key === 'type') settleChains(d, rng);
  if (key === 'depth') applyDepth(d, rng);
  if (key === 'find') applyFind(d, rng);
  if (key === 'blight') applyBlight(d, rng);
}
/* Re-roll a counted number from its band's expression. */
export function rerollNum(d, key, rng = Math.random) {
  const e = d.nums[key] && d.nums[key].e; if (!e) return;
  d.nums[key] = { ...num(e, rng), l: false };
  if (key === 'keys') { d.nums.keys.v = Math.max(1, d.nums.keys.v); resizeLocs(d, rng); }
  if (key === 'entrances') d.nums.entrances.v = Math.max(1, d.nums.entrances.v);
}
export function setNumValue(d, key, v, rng = Math.random) {
  const n = Math.max(0, Math.min(key === 'keys' ? LIMITS.keys : 9999, Math.trunc(Number(v) || 0)));
  d.nums[key] = { ...(d.nums[key] || { e: '' }), v: n };
  if (key === 'keys') { resizeLocs(d, rng); }
}
export function rerollLoc(d, i, rng = Math.random) { if (d.locs[i]) d.locs[i].shape = rollItem2('loc.shape', rng); }
export function rerollShards(d, i, rng = Math.random) { const b = FIND_BANDS[d.items.find ? d.items.find.i : 0]; if (d.locs[i]) d.locs[i].shards = { v: Math.max(0, roll(b.shards, rng)), l: false }; }

/* Roll the whole chain in order, keeping anything locked. */
export function generate(d, rng = Math.random) {
  const keep = k => locked(d.items[k]);
  const roll1 = k => { if (!keep(k)) d.items[k] = { ...rollItem(k, rng), l: false }; };
  roll1('era'); roll1('purpose'); roll1('fate');
  if (!keep('fate')) { delete d.items.purpose2; delete d.items.fate2; }
  roll1('type');
  if (!keep('type')) { delete d.items.typeA; delete d.items.typeB; }
  settleChains(d, rng);
  roll1('depth'); applyDepth(d, rng);
  roll1('glyph'); rollQuirks(d, rng);
  for (let i = 0; i < d.locs.length; i++) if (!d.locs[i].shape.l) d.locs[i].shape = rollItem2('loc.shape', rng);
  roll1('find'); applyFind(d, rng);
  roll1('blight'); applyBlight(d, rng);
  roll1('threat');
  if (d.includeParty) roll1('party');
  return d;
}

/* The derived delve class: an estimate from the Blight band. The book gives no numeric rule. */
export const classIndex = d => (d.items.blight ? d.items.blight.i : -1);
export const classEstimate = d => { const i = classIndex(d); return i < 0 ? '' : CLASS_NAMES[i]; };
export const classShown = d => d.classOverride || classEstimate(d);
export const levelRange = d => (d.items.blight ? BLIGHT_BANDS[d.items.blight.i].levels : null);

/* ---------- labels from the data file, by position ---------- */
export function rowFor(data, id, i) { return (data && data.tables && data.tables[id] && data.tables[id].rows[i]) || null; }
export const eraColumn = d => (d.items.era ? TABLES['ruin.purpose'].columns[d.items.era.i] : 'early');
export function describe(data, key, item, d) {
  const id = ITEM_TABLE[key] || key;
  if (!item) return null;
  const row = rowFor(data, id, item.i);
  const chip = `${id} · ${item.r}`;
  if (!row) return { id, chip, name: '', detail: '', row: null };
  if (id === 'ruin.purpose') { const col = eraColumn(d); return { id, chip: `${chip} (${col})`, name: (row.v && row.v[col]) || '', detail: row.d || '', row }; }
  return { id, chip, name: row.n || '', detail: row.d || row.f || '', row };
}
export function describeIndexed(data, id, item) {
  const row = rowFor(data, id, item.i);
  return { id, chip: `${id} · ${item.r}`, name: row ? row.n || '' : '', detail: row ? row.f || row.d || '' : '', row };
}
export function textOf(data, key, item, d) {
  const x = describe(data, key, item, d); if (!x) return '';
  return x.name || x.chip;
}
export function locText(data, loc) { const x = describeIndexed(data, 'loc.shape', loc.shape); return x.name ? (x.detail ? `${x.name} · ${x.detail}` : x.name) : x.chip; }

/* ---------- the data file ---------- */
const S = (x, n = 2000) => (typeof x === 'string' ? x.slice(0, n) : '');
const BAD = ['__proto__', 'constructor', 'prototype'];
function cleanAny(x, depth = 0) {
  if (depth > 6) return null;
  if (typeof x === 'string') return x.slice(0, 3000);
  if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  if (typeof x === 'boolean' || x == null) return x;
  if (Array.isArray(x)) return x.slice(0, 400).map(v => cleanAny(v, depth + 1));
  if (typeof x === 'object') { const o = {}; for (const [k, v] of Object.entries(x).slice(0, 80)) { if (BAD.includes(k) || !/^[a-zA-Z_][a-zA-Z0-9_.-]*$/.test(k)) continue; o[k] = cleanAny(v, depth + 1); } return o; }
  return null;
}
export const HELD_KEYS = ['hazards', 'supplyIncidents', 'outOfSupply', 'artifacts'];
export function validateData(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x) || x.format !== FORMAT) throw Error('Choose a Delve Table data file (format ctgd-delve-data/1).');
  if (!x.tables || typeof x.tables !== 'object' || Array.isArray(x.tables)) throw Error('That data file has no tables section.');
  const tables = {}, ignored = [];
  for (const [id, t] of Object.entries(x.tables)) {
    if (BAD.includes(id)) continue;
    if (!TABLES[id]) { ignored.push(id.slice(0, 60)); continue; }
    if (!t || typeof t !== 'object' || !Array.isArray(t.rows)) throw Error(`Table ${id} needs a rows list.`);
    if (t.rows.length > 200) throw Error(`Table ${id} has too many rows.`);
    tables[id] = {
      rows: t.rows.map(r => {
        if (!r || typeof r !== 'object') return {};
        const out = { n: S(r.n), d: S(r.d), f: S(r.f) };
        if (r.v && typeof r.v === 'object') { out.v = {}; for (const c of ['early', 'middle', 'late']) out.v[c] = S(r.v[c]); }
        return out;
      })
    };
  }
  const held = {};
  for (const k of HELD_KEYS) if (x[k] != null) held[k] = cleanAny(x[k]);
  return { format: FORMAT, name: S(x.name, 120) || 'Imported data', tables, held, ignored: ignored.slice(0, 40) };
}
/* Which tables does a data file leave out, or only part cover? (D10) */
export function coverage(data) {
  return TABLE_IDS.map(id => {
    const need = TABLES[id].ranges.length, rows = data && data.tables[id] ? data.tables[id].rows : null, have = rows ? rows.length : 0;
    let named = 0;
    if (rows) rows.forEach(r => { if (r && (r.n || (r.v && (r.v.early || r.v.middle || r.v.late)))) named++; });
    const state = !data ? 'none' : !rows ? 'missing' : named === 0 ? 'empty' : have < need || named < need ? 'partial' : 'complete';
    return { id, need, have, named, state };
  });
}

/* ---------- cleaning a saved delve (storage, backup, import) ---------- */
const int = (x, lo, hi, dflt) => { const n = Math.trunc(Number(x)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : dflt; };
function cleanItem(id, x) {
  if (!x || typeof x !== 'object') return null;
  const r = Number(x.r);
  if (!Number.isInteger(r) || r < TABLES[id].ranges[0][0] || r > TABLES[id].ranges.at(-1)[1]) return null;
  const i = indexOf(id, r);
  return i < 0 ? null : { r, i, l: !!x.l };
}
const cleanNum = x => (x && typeof x === 'object' ? { v: int(x.v, 0, 9999, 0), l: !!x.l, e: /^(\d*D\d+([+-]\d+)?|\d+)$/.test(String(x.e)) ? String(x.e) : '' } : null);
export function cleanDelve(x) {
  if (!x || typeof x !== 'object') throw Error('Invalid delve.');
  const d = newDelve();
  d.id = typeof x.id === 'string' && /^[a-zA-Z0-9-]{8,60}$/.test(x.id) ? x.id : d.id;
  d.name = S(x.name, 200); d.cid = S(x.cid, 60); d.notes = S(x.notes, 20000);
  if (typeof x.created === 'string') d.created = x.created.slice(0, 40);
  if (typeof x.updated === 'string') d.updated = x.updated.slice(0, 40);
  for (const k of ITEM_KEYS) { const it = x.items && cleanItem(ITEM_TABLE[k], x.items[k]); if (it) d.items[k] = it; }
  d.quirks = (Array.isArray(x.quirks) ? x.quirks.slice(0, LIMITS.quirks) : []).map(q => cleanItem('theme.quirk', q)).filter(Boolean);
  for (const k of NUM_KEYS) { const n = x.nums && cleanNum(x.nums[k]); if (n) d.nums[k] = n; }
  d.locs = (Array.isArray(x.locs) ? x.locs.slice(0, LIMITS.keys) : []).map(l => ({ shape: cleanItem('loc.shape', l && l.shape) || mk('loc.shape', 11), shards: { v: int(l && l.shards && l.shards.v, 0, 9999, 0), l: !!(l && l.shards && l.shards.l) }, name: S(l && l.name, 120) }));
  d.includeParty = !!x.includeParty; d.quirkCount = int(x.quirkCount, 0, LIMITS.quirks, QUIRK_COUNT_DEFAULT);
  d.classOverride = CLASS_NAMES.includes(x.classOverride) ? x.classOverride : '';
  d.map = cleanMap(x.map);
  settleChains(d);
  return d;
}
export function validateBackup(x) {
  if (!x || x.format !== BACKUP_FORMAT || !Array.isArray(x.delves) || !x.delves.length || x.delves.length > 200) throw Error('Choose a Delve Table backup or exported delve.');
  return x.delves.map(d => { const c = cleanDelve(d); c.id = crypto.randomUUID(); c.cid = ''; return c; });
}

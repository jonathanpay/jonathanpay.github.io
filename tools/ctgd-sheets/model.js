/* model.js — Great Dark Sheets: field layouts, derived values, validation. No DOM, no network.
 *
 * The page carries layout and arithmetic only: the six attribute labels, the six condition
 * labels, Health / Hope / Heart from the attributes, and the supply boxes. Talent, gear and
 * archetype lists come from a data file you import (format ctgd-sheets-tables/1), kept in
 * this browser. Ship stats and upgrades are read from the voyage tool's fleet record.
 */
export const TYPES = { explorer: 'Explorer', ship: 'Ship', npc: 'NPC', delve: 'Delve', voyage: 'Voyage log' };
export const FORMAT = 'ctgd-sheets-backup/1';
export const TABLES_FORMAT = 'ctgd-sheets-tables/1';
/* Campaign kind for each sheet type. Explorers and NPCs are both "npc"; data.sheet tells them apart. */
export const KIND = { explorer: 'npc', npc: 'npc', ship: 'ship', delve: 'site', voyage: 'voyage' };
export const ATTR_MIN = 2;
export const ATTR_MAX = 6;
export const DEFAULT_SUPPLY = 12;
export const MAX_SUPPLY = 60;

const f = (key, label = key, type = 'text') => [key, label, type];
export const ATTRS = [['strength', 'Strength'], ['agility', 'Agility'], ['logic', 'Logic'], ['perception', 'Perception'], ['insight', 'Insight'], ['empathy', 'Empathy']];
/* One condition per attribute. */
export const CONDITIONS = [['exhausted', 'Exhausted', 'strength'], ['dazed', 'Dazed', 'agility'], ['confused', 'Confused', 'logic'], ['distracted', 'Distracted', 'perception'], ['shaken', 'Shaken', 'insight'], ['disheartened', 'Disheartened', 'empathy']];
/* Health = STR + AGL, Hope = LOG + EMP, Heart = INS + PER. */
export const DERIVED = [['health', 'Health', 'strength', 'agility'], ['hope', 'Hope', 'logic', 'empathy'], ['heart', 'Heart', 'insight', 'perception']];
export const SHIP_CLASSES = ['Greatship', 'Slipstream Cruiser', 'Shuttle', 'Other'];

export const explorerIdentity = [f('name', 'Name'), f('archetype', 'Archetype'), f('specialty', 'Specialty'), f('role', 'Crew role'), f('keyAttribute', 'Key attribute', ATTRS.map(a => a[1])), f('appearance', 'Appearance', 'area')];
export const attributeFields = ATTRS.map(([k, l]) => f(k, l, 'number'));
export const explorerState = [f('healthTaken', 'Health taken', 'number'), f('hopeTaken', 'Hope taken', 'number'), f('heartTaken', 'Heart taken', 'number'), f('despair', 'Despair', 'number'), f('blight', 'Blight', 'number')];
export const suitFields = [f('suit', 'Delving suit'), f('suitBlight', 'Blight protection', 'number'), f('suitNotes', 'Suit notes', 'area')];
export const birdFields = [f('birdName', 'Name'), f('birdType', 'Type'), f('birdHealth', 'Health', 'number'), f('birdEnergy', 'Energy', 'number'), f('birdNotes', 'Notes', 'area')];
export const explorerTables = {
  talents: { title: 'Talents', cols: [f('name', 'Talent'), f('level', 'Level (0–3)', 'number'), f('notes', 'Notes')], rows: 8, list: 'talents' },
  weapons: { title: 'Weapons', cols: [f('name', 'Weapon'), f('bonus', 'Bonus'), f('damage', 'Damage'), f('crit', 'Crit'), f('range', 'Range'), f('notes', 'Notes')], rows: 3, list: 'weapons' },
  gear: { title: 'Gear', cols: [f('item', 'Item'), f('qty', 'Qty', 'number'), f('notes', 'Notes')], rows: 10, list: 'gear' }
};
export const shipIdentity = [f('name', 'Name'), f('classType', 'Class', SHIP_CLASSES), f('captain', 'Captain'), f('crewType', 'Crew type'), f('route', 'Route')];
export const shipState = [f('hull', 'Hull now', 'number'), f('morale', 'Morale now', 'number')];
export const shipStats = [f('hullMax', 'Hull', 'number'), f('moraleMax', 'Morale', 'number'), f('flat', 'Flat space speed', 'number'), f('slip', 'Slipstream speed', 'number')];
export const shipTables = {
  crew: { title: 'Crew', cols: [f('position', 'Position'), f('name', 'Name'), f('notes', 'Notes')], rows: 6 },
  cargo: { title: 'Cargo and supplies', cols: [f('item', 'Item'), f('qty', 'Qty', 'number'), f('notes', 'Notes')], rows: 6 }
};
export const npcFields = [f('name', 'Name'), f('archetype', 'Archetype'), f('concept', 'Concept'), ...ATTRS.map(([k, l]) => f(k, l, 'number')), f('healthTaken', 'Health taken', 'number'), f('appearance', 'Appearance', 'area'), f('talents', 'Talents', 'area'), f('gear', 'Gear', 'area'), f('notes', 'Notes', 'area')];
export const delveIdentity = [f('name', 'Delve name'), f('era', 'Era'), f('purpose', 'Purpose'), f('fate', 'Fate'), f('siteType', 'Type'), f('depthBand', 'Depth band'), f('markers', 'Markers'), f('entrances', 'Entrances'), f('glyph', 'Glyph'), f('quirks', 'Quirks', 'area')];
export const delveDangers = [f('infestation', 'Blight infestation'), f('cores', 'Cores'), f('oases', 'Oases'), f('threat', 'Threat'), f('otherParty', 'Other party'), f('delveClass', 'Class'), f('notes', 'Notes', 'area')];
export const delveTables = {
  locations: { title: 'Key locations', cols: [f('name', 'Location'), f('shape', 'Shape'), f('func', 'Function'), f('shards', 'Shards', 'number'), f('notes', 'Notes')], rows: 6 },
  log: { title: 'Supply and hazard log', cols: [f('stretch', 'Stretch'), f('supply', 'Supply used', 'number'), f('hazard', 'Hazard'), f('result', 'Result'), f('applied', 'Applied', 'check')], rows: 12 },
  finds: { title: 'Finds', cols: [f('name', 'Artefact'), f('oddity', 'Oddity'), f('understanding', 'Understanding'), f('held', 'Held by'), f('handed', 'Handed over', 'check')], rows: 4 }
};
export const voyageIdentity = [f('name', 'Voyage'), f('ship', 'Ship'), f('from', 'From'), f('to', 'To'), f('speed', 'Slipstream speed', 'number'), f('notes', 'Notes', 'area')];
export const voyageTables = {
  weeks: { title: 'Week by week', cols: [f('week', 'Week'), f('where', 'Where'), f('leagues', 'Leagues', 'number'), f('hazard', 'Hazard'), f('event', 'Event'), f('duty', 'Duty'), f('hull', 'Hull', 'number'), f('morale', 'Morale', 'number'), f('notes', 'Notes')], rows: 12 }
};

export const TABLE_SETS = { explorer: explorerTables, ship: shipTables, delve: delveTables, voyage: voyageTables };

export function newSheet(type) {
  const values = {};
  if (type === 'explorer') { values.supplyMax = DEFAULT_SUPPLY; values.supplyMarks = ''; }
  const tables = {};
  for (const [k, t] of Object.entries(TABLE_SETS[type] || {})) tables[k] = Array.from({ length: t.rows }, () => ({}));
  if (type === 'ship') tables.crew = ['Pilot', 'Engineer', 'Captain', 'Gunner', 'Medic', 'Scout'].map(position => ({ position }));
  if (type === 'voyage') tables.weeks = tables.weeks.map((_, i) => ({ week: String(i + 1) }));
  const entries = type === 'npc' ? Array.from({ length: 3 }, () => ({})) : [];
  return { id: crypto.randomUUID(), type, values, tables, entries, updated: new Date().toISOString() };
}

/* ---------- arithmetic ---------- */
const num = v => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
export function derived(values) {
  const out = {};
  for (const [key, , a, b] of DERIVED) { const x = num(values[a]), y = num(values[b]); out[key] = x == null || y == null ? null : x + y; }
  return out;
}
export const attributeWarning = v => { const n = num(v); return n != null && (n < ATTR_MIN || n > ATTR_MAX) ? `Attributes run ${ATTR_MIN}–${ATTR_MAX}.` : ''; };

/* Supply: a count of boxes and a string of 0/1 marks, one per box. Plain strings, so it survives the campaign. */
export function supplyMax(values) { const n = Math.trunc(num(values.supplyMax) ?? DEFAULT_SUPPLY); return Math.min(MAX_SUPPLY, Math.max(0, n)); }
export function supplyMarks(values) { const max = supplyMax(values), s = String(values.supplyMarks || ''); return Array.from({ length: max }, (_, i) => s[i] === '1'); }
export function setSupplyMark(values, index, on) { const m = supplyMarks(values); if (index < 0 || index >= m.length) return; m[index] = !!on; values.supplyMarks = m.map(x => (x ? '1' : '0')).join(''); }
export const supplyLeft = values => supplyMarks(values).filter(x => !x).length;

/* ---------- validation ---------- */
const scalar = x => typeof x === 'string' || typeof x === 'boolean' || (typeof x === 'number' && Number.isFinite(x));
const KEY = /^[a-zA-Z][a-zA-Z0-9]*$/;
const BAD = ['constructor', 'prototype', '__proto__'];
const record = x => x && typeof x === 'object' && !Array.isArray(x) && Object.entries(x).every(([k, v]) => KEY.test(k) && !BAD.includes(k) && scalar(v) && (typeof v !== 'string' || v.length <= 20000));
export function validateArchive(x) {
  if (!x || x.format !== FORMAT || !Array.isArray(x.sheets) || !x.sheets.length || x.sheets.length > 500) throw Error('Choose a Great Dark Sheets backup or exported sheet.');
  return x.sheets.map(s => {
    if (!s || !Object.hasOwn(TYPES, s.type) || !record(s.values) || !s.tables || typeof s.tables !== 'object' || Array.isArray(s.tables) || !Array.isArray(s.entries) || s.entries.length > 100 || !s.entries.every(record)) throw Error('The backup contains an invalid sheet.');
    for (const [k, rows] of Object.entries(s.tables)) if (!KEY.test(k) || BAD.includes(k) || !Array.isArray(rows) || rows.length > 100 || !rows.every(record)) throw Error('Invalid sheet table.');
    return { ...newSheet(s.type), values: structuredClone(s.values), tables: structuredClone(s.tables), entries: structuredClone(s.entries) };
  });
}

/* ---------- the tables data file (ctgd-sheets-tables/1) ----------
 * Names only. Whatever else a file carries is dropped. Anything that is not a plain string
 * list is ignored rather than trusted, and every list is capped.
 *   talents     [{ n, levels?, type? }]
 *   archetypes  [{ n, key?, keyTalents?, equipment?, specialties?: [{ n, talent? }] }]   ("professions" is accepted as a synonym)
 *   gear        [{ group, items: [string] }]  or  { group: [string | { n }] }
 *   weapons     { group: [{ n }] }            (listed as gear groups named "Weapons · group")
 *   armor       [{ n }]                       (listed as the gear group "Armour")
 *   birds       [{ n }]   ("birdTypes" is accepted)
 *   roles       [string | { n }]   ("crewRoles" is accepted)
 */
const MAX_LIST = 1500, MAX_STR = 300;
const str = (x, n = MAX_STR) => (typeof x === 'string' ? x.slice(0, n) : '');
const strings = (x, cap = 50) => (Array.isArray(x) ? x.filter(v => typeof v === 'string').slice(0, cap).map(v => v.slice(0, MAX_STR)) : []);
const names = x => (Array.isArray(x) ? x.map(v => (typeof v === 'string' ? v : v && typeof v === 'object' ? v.n : '')).filter(v => typeof v === 'string' && v).slice(0, MAX_LIST).map(v => v.slice(0, MAX_STR)) : []);
export const EMPTY_TABLES = { format: TABLES_FORMAT, name: '', talents: [], archetypes: [], gear: [], birds: [], roles: [] };
export function validateTables(x) {
  if (!x || typeof x !== 'object' || Array.isArray(x) || x.format !== TABLES_FORMAT) throw Error('Choose a Great Dark Sheets tables file (format ctgd-sheets-tables/1).');
  const talents = (Array.isArray(x.talents) ? x.talents : []).filter(t => t && typeof t === 'object' && str(t.n)).slice(0, MAX_LIST).map(t => ({ n: str(t.n), levels: str(String(t.levels ?? ''), 40), type: str(t.type, 60) }));
  const archetypes = (Array.isArray(x.archetypes) ? x.archetypes : Array.isArray(x.professions) ? x.professions : []).filter(a => a && typeof a === 'object' && str(a.n)).slice(0, 200).map(a => ({
    n: str(a.n), key: str(a.key, 40), keyTalents: strings(a.keyTalents), equipment: strings(a.equipment),
    specialties: (Array.isArray(a.specialties) ? a.specialties : []).filter(s => s && typeof s === 'object' && str(s.n)).slice(0, 50).map(s => ({ n: str(s.n), talent: str(s.talent) }))
  }));
  const gear = [];
  const groups = x.gear;
  if (Array.isArray(groups)) groups.forEach(g => { if (g && typeof g === 'object' && str(g.group)) gear.push({ group: str(g.group, 80), items: names(g.items) }); });
  else if (groups && typeof groups === 'object') for (const [k, v] of Object.entries(groups)) { if (!BAD.includes(k)) gear.push({ group: k.slice(0, 80), items: names(v) }); }
  if (x.weapons && typeof x.weapons === 'object' && !Array.isArray(x.weapons)) for (const [k, v] of Object.entries(x.weapons)) { if (!BAD.includes(k)) gear.push({ group: ('Weapons · ' + k).slice(0, 80), items: names(v), weapons: true }); }
  if (Array.isArray(x.armor)) gear.push({ group: 'Armour', items: names(x.armor) });
  return {
    format: TABLES_FORMAT, name: str(x.name, 120) || 'Imported tables', talents, archetypes,
    gear: gear.filter(g => g.items.length).slice(0, 60),
    birds: names(x.birds || x.birdTypes), roles: names(x.roles || x.crewRoles)
  };
}
export const talentNames = t => (t ? t.talents.map(x => x.n) : []);
export const weaponNames = t => (t ? t.gear.filter(g => g.weapons).flatMap(g => g.items) : []);
export const gearNames = t => (t ? t.gear.flatMap(g => g.items) : []);
export const archetypeNames = t => (t ? t.archetypes.map(a => a.n) : []);

/* ---------- the voyage tool's fleet record ----------
 * Same merge the voyage tool does: the named ship, then the data file's fleet section
 * (gd-data), then the user's own edits (gd-db, collection "fleet"). Read only. */
export function fleetRecord(base, dataFleet, overrides) {
  if (!base) return null;
  const rec = { ...base, ...((dataFleet && typeof dataFleet[base.id] === 'object' && dataFleet[base.id]) || {}) };
  const o = (overrides && typeof overrides[base.id] === 'object' && overrides[base.id]) || {};
  Object.assign(rec, o);
  if (typeof o.upgText === 'string') rec.upg = o.upgText.split('\n').map(s => s.trim()).filter(Boolean);
  return rec;
}
/* Copy a fleet record onto a Ship sheet's linked fields. Current Hull and Morale are the table's own and are left alone. */
export function applyFleet(values, rec) {
  if (!rec) return false;
  const set = (k, v) => { if (v != null && v !== '') values[k] = typeof v === 'number' || typeof v === 'string' ? v : String(v); };
  set('name', rec.n);
  set('classType', rec.cls === 'GSV' ? 'Greatship' : rec.cls === 'SSC' ? 'Slipstream Cruiser' : '');
  set('hullMax', rec.hull); set('moraleMax', rec.morale); set('flat', rec.flat); set('slip', rec.slip);
  set('crewType', rec.crew); set('captain', rec.captain); set('route', rec.route);
  values.upgrades = (Array.isArray(rec.upg) ? rec.upg : []).filter(x => typeof x === 'string').join('\n').slice(0, 20000);
  return true;
}
export const LINKED_SHIP_KEYS = ['name', 'classType', 'hullMax', 'moraleMax', 'flat', 'slip', 'crewType', 'captain', 'route', 'upgrades'];

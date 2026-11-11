import {
  TYPES, KIND, ATTRS, CONDITIONS, DERIVED, ATTR_MIN, ATTR_MAX, MAX_SUPPLY, TABLE_SETS,
  explorerIdentity, attributeFields, explorerState, suitFields, birdFields, shipIdentity, shipState, shipStats,
  npcFields, delveIdentity, delveDangers, voyageIdentity, LINKED_SHIP_KEYS,
  newSheet, derived, attributeWarning, supplyMax, supplyMarks, setSupplyMark, supplyLeft,
  validateArchive, validateTables, talentNames, weaponNames, gearNames, archetypeNames, fleetRecord, applyFleet, FORMAT, TABLES_FORMAT
} from './model.js';

const $ = s => document.querySelector(s);
const KEY = 'ctgd-sheets-v1', DATAKEY = 'ctgd-sheets-tables-v1';
const el = (tag, attrs = {}, ...children) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'text') n.textContent = v;
    else if (k === 'class') n.className = v;
    else if (v === true) n.setAttribute(k, '');
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  n.append(...children.flat().filter(x => x != null));
  return n;
};

let sheets = [], active, type = 'explorer', tables = null, startupError = '', loadFailed = false, saveWarning = '';

/* ---------- saved archive ---------- */
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved) {
    const checked = validateArchive({ format: FORMAT, sheets: saved.sheets });
    sheets = checked.map((s, i) => ({ ...s, id: typeof saved.sheets[i].id === 'string' ? saved.sheets[i].id : s.id }));
    active = saved.active;
    if (saved.type && Object.hasOwn(TYPES, saved.type)) type = saved.type;
  }
} catch {
  startupError = 'The saved archive could not be read. Export your current work before reloading; the original browser data has been left untouched.';
  loadFailed = true;
}
if (!sheets.length) sheets = [newSheet('explorer')];
if (!sheets.some(s => s.id === active)) active = sheets[0].id;
const current = () => sheets.find(s => s.id === active);
const title = s => s.values.name || `Untitled ${TYPES[s.type].toLowerCase()}`;

function status(s) { $('#save-status').textContent = [s, saveWarning].filter(Boolean).join(' '); }
function persist() {
  if (loadFailed) { status(startupError); return; }
  try { localStorage.setItem(KEY, JSON.stringify({ sheets, active, type })); saveWarning = ''; status('Saved in this browser.'); }
  catch { saveWarning = 'Changes are not saved: browser storage is unavailable or full. Export a backup now.'; status(''); }
}
function touch() { current().updated = new Date().toISOString(); persist(); updateLibrary(); pushSheet(); }
function updateLibrary() {
  const l = $('#library');
  l.replaceChildren(...sheets.filter(s => s.type === type).map(s => el('option', { value: s.id, text: title(s) })));
  l.value = active;
}
function switchType(t) {
  type = t;
  let s = sheets.find(x => x.type === t);
  if (!s) { s = newSheet(t); sheets.push(s); }
  active = s.id; persist(); render();
}

/* ---------- the fleet, read from the voyage tool (same browser, read only) ---------- */
const SPHERE = window.CtgdSphere || null;
function readJson(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } }
function fleetList() {
  if (!SPHERE || !Array.isArray(SPHERE.FLEET)) return [];
  const dataFleet = (readJson('gd-data') || {}).fleet, overrides = (readJson('gd-db') || {}).fleet;
  let spoil = false; try { spoil = localStorage.getItem('gd-spoil') === '1'; } catch { /* storage blocked */ }
  return SPHERE.FLEET.filter(b => !b.sp || spoil).map(b => fleetRecord(b, dataFleet, overrides)).filter(Boolean);
}
const fleetById = id => fleetList().find(r => r.id === id) || null;

/* ---------- controls ---------- */
const printMark = on => (on ? '☒' : '☐');
function control(obj, field, scope = 'sheet', opts = {}) {
  const [key, label, kind] = field, choices = Array.isArray(kind) ? kind : null;
  const input = choices ? el('select') : kind === 'area' ? el('textarea', { rows: 3 }) : el('input', { type: kind === 'number' ? 'number' : kind === 'check' ? 'checkbox' : 'text' });
  input.id = `${scope}-${key}`; input.setAttribute('aria-label', label);
  if (kind === 'number') { input.step = 'any'; if (opts.min != null) input.min = opts.min; if (opts.max != null) input.max = opts.max; }
  if (opts.list) input.setAttribute('list', opts.list);
  if (opts.readOnly) { if (choices) input.disabled = true; else input.readOnly = true; }
  if (choices) input.append(el('option', { value: '', text: '—' }), ...choices.map(v => el('option', { value: v, text: v })));
  if (kind === 'check') input.checked = !!obj[key]; else input.value = obj[key] ?? '';
  const shown = () => (kind === 'check' ? printMark(obj[key]) : String(obj[key] ?? ''));
  const mirror = el('span', { class: 'print-value', text: shown() });
  const warn = el('span', { class: 'warn no-print', role: 'status' });
  input.addEventListener('input', () => {
    obj[key] = kind === 'check' ? input.checked : input.value;
    mirror.textContent = shown();
    if (kind === 'area') grow(input);
    if (opts.attr) warn.textContent = attributeWarning(input.value);
    touch(); updateDerived();
    if (key === 'name' && scope === 'sheet') $('#sheet-heading').textContent = title(current());
  });
  if (opts.attr) warn.textContent = attributeWarning(obj[key]);
  return el('label', { class: 'field' + (kind === 'area' ? ' long' : '') + (kind === 'check' ? ' checkfield' : '') }, el('span', { text: label }), input, mirror, opts.attr ? warn : null);
}
function grow(input) { input.style.height = 'auto'; input.style.height = input.scrollHeight + 'px'; }
function section(heading, fields, obj = current().values, o = {}) {
  const { wide, scope = 'sheet', opts = () => ({}) } = o;
  return el('section', { class: 'section' + (wide ? ' wide' : '') }, el('h3', { text: heading }), el('div', { class: 'fields' }, fields.map(f => control(obj, f, scope, opts(f)))));
}

/* A table of rows. Rows are plain records; each column is a field. */
function table(key, def) {
  const s = current();
  if (!s.tables[key]) s.tables[key] = Array.from({ length: def.rows }, () => ({}));
  const entries = s.tables[key];
  const listFor = col => (def.list && col === def.cols[0][0] ? 'dl-' + def.list : null);
  const sec = el('section', { class: 'section wide table-section' }, el('h3', { text: def.title }));
  const tb = el('tbody');
  const draw = () => tb.replaceChildren(...entries.map((row, i) => {
    const tr = el('tr');
    for (const col of def.cols) {
      const c = control(row, col, `${key}-${i}`, { list: listFor(col[0]) });
      tr.append(el('td', {}, c.querySelector('input,textarea,select'), c.querySelector('.print-value')));
    }
    tr.append(el('td', { class: 'no-print' }, el('button', { class: 'mini', text: '×', 'aria-label': `Remove ${def.title.toLowerCase()} row ${i + 1}`, onclick: () => { entries.splice(i, 1); touch(); draw(); } })));
    return tr;
  }));
  draw();
  sec.append(
    el('div', { class: 'table-scroll' }, el('table', {}, el('thead', {}, el('tr', {}, def.cols.map(c => el('th', { scope: 'col', text: c[1] })), el('th', { class: 'no-print' }))), tb)),
    el('button', { class: 'mini actions no-print', text: 'Add row', onclick: () => { if (entries.length >= 100) return status('Maximum 100 rows per table.'); entries.push({}); touch(); draw(); } })
  );
  return sec;
}

/* ---------- derived values and supply ---------- */
const derivedBoxes = new Set();
function derivedPanel(obj) {
  const n = el('div', { class: 'derived', 'data-derived': '' });
  n._values = obj; derivedBoxes.add(n);
  return n;
}
function updateDerived() {
  document.querySelectorAll('[data-derived]').forEach(n => {
    const d = derived(n._values);
    n.replaceChildren(...DERIVED.map(([k, label]) => el('span', {}, `${label} maximum: `, el('b', { text: d[k] == null ? '—' : String(d[k]) }))));
  });
  document.querySelectorAll('[data-supply-left]').forEach(n => { n.textContent = String(supplyLeft(current().values)); });
}
function supplySection() {
  const v = current().values;
  const boxes = el('div', { class: 'supply-boxes', role: 'group', 'aria-label': 'Supply boxes' });
  const draw = () => {
    boxes.replaceChildren(...supplyMarks(v).map((on, i) => el('button', {
      type: 'button', class: 'sbox', 'aria-pressed': String(on), 'aria-label': `Supply ${i + 1}: ${on ? 'used' : 'free'}`, text: printMark(on),
      onclick: () => { setSupplyMark(v, i, !supplyMarks(v)[i]); touch(); draw(); updateDerived(); }
    })));
  };
  draw();
  const max = control(v, ['supplyMax', 'Supply boxes', 'number'], 'sheet', { min: 0, max: MAX_SUPPLY });
  max.querySelector('input').addEventListener('input', draw);
  return el('section', { class: 'section wide supply' }, el('h3', { text: 'Supply' }), el('div', { class: 'fields' }, max, el('div', { class: 'field' }, el('span', { text: 'Left' }), el('b', { class: 'data', 'data-supply-left': '' }))), boxes,
    el('p', { class: 'note', text: 'Mark a box when a point of supply is used. Four points weigh as much as one regular item.' }),
    el('button', { class: 'mini actions no-print', text: 'Clear all marks', onclick: () => { v.supplyMarks = ''; touch(); draw(); updateDerived(); } }));
}

/* ---------- sheet types ---------- */
const attrOpts = () => ({ min: ATTR_MIN, max: ATTR_MAX, attr: true });
function archetypeNote(archetype) {
  const a = tables && tables.archetypes.find(x => x.n.toLowerCase() === String(archetype || '').trim().toLowerCase());
  if (!a) return null;
  const bits = [a.keyTalents.length ? 'Key talents: ' + a.keyTalents.join(', ') : '', a.specialties.length ? 'Specialties: ' + a.specialties.map(s => s.n + (s.talent ? ` (${s.talent})` : '')).join(', ') : '', a.equipment.length ? 'Starting kit: ' + a.equipment.join(', ') : ''].filter(Boolean);
  return el('p', { class: 'note no-print archetype-note', text: bits.join(' · ') });
}
function explorer(grid) {
  const v = current().values;
  const id = section('Explorer', explorerIdentity, v, { wide: true, opts: f => (f[0] === 'archetype' ? { list: 'dl-archetypes' } : f[0] === 'role' ? { list: 'dl-roles' } : {}) });
  id.querySelector('#sheet-archetype').addEventListener('change', () => { if (tables) render(); });
  const note = archetypeNote(v.archetype);
  if (note) id.append(note);
  const attrs = section('Attributes', attributeFields, v, { opts: attrOpts });
  attrs.append(derivedPanel(v));
  grid.append(id, attrs,
    section('Taken', explorerState, v),
    el('section', { class: 'section' }, el('h3', { text: 'Conditions' }), el('div', { class: 'fields' }, CONDITIONS.map(([k, label, attr]) => control(v, [k, `${label} (${ATTRS.find(a => a[0] === attr)[1].slice(0, 3)})`, 'check'])))),
    supplySection(),
    table('talents', TABLE_SETS.explorer.talents), table('weapons', TABLE_SETS.explorer.weapons), table('gear', TABLE_SETS.explorer.gear),
    section('Delving suit', suitFields, v), section('Bird', birdFields, v, { opts: f => (f[0] === 'birdType' ? { list: 'dl-birds' } : {}) }),
    section('Notes', [['notes', 'Notes', 'area']], v, { wide: true }));
  updateDerived();
}
function ship(grid) {
  const s = current(), v = s.values, fleet = fleetList(), linked = v.fleetId && fleetById(v.fleetId);
  if (linked) applyFleet(v, linked);
  const sel = el('select', { id: 'fleet-pick', 'aria-label': 'Ship from the voyage tool fleet' }, el('option', { value: '', text: SPHERE ? 'Not linked (fill in by hand)' : 'The sphere file did not load' }),
    ...fleet.map(r => el('option', { value: r.id, text: `${r.n}${r.hull ? '' : ' (no stats)'}` })));
  sel.value = linked ? v.fleetId : '';
  sel.addEventListener('change', () => {
    if (!sel.value) { delete v.fleetId; touch(); render(); status('Unlinked. The fields are yours to edit.'); return; }
    v.fleetId = sel.value; applyFleet(v, fleetById(sel.value)); touch(); render(); status('Hull, Morale and upgrades now follow the voyage tool’s fleet record.');
  });
  grid.append(el('section', { class: 'section wide no-print fleet-link' }, el('h3', { text: 'Fleet record' }),
    el('label', { class: 'field' }, el('span', { text: 'Take stats from the voyage tool' }), sel),
    el('p', { class: 'note', text: linked ? 'Linked: name, class, Hull, Morale, speeds, captain, route and upgrades come from the Fleet tab (including your own edits and data file there) and refresh whenever this sheet opens. Current Hull and Morale are kept here. Unlink to edit them by hand.' : 'Pick a Greatship or Slipstream Cruiser to read its stats. Nothing is copied from the voyage tool until you do, and the sheet works without it.' })));
  const ro = k => (linked && LINKED_SHIP_KEYS.includes(k) ? { readOnly: true } : {});
  grid.append(section('Ship', shipIdentity, v, { wide: true, opts: f => ro(f[0]) }),
    section('Stats', shipStats, v, { opts: f => ro(f[0]) }), section('Now', shipState, v),
    section('Upgrades and features', [['upgrades', 'One per line', 'area']], v, { wide: true, opts: f => ro(f[0]) }),
    table('crew', TABLE_SETS.ship.crew), table('cargo', TABLE_SETS.ship.cargo),
    section('Notes', [['notes', 'Notes', 'area']], v, { wide: true }));
}
function npcEntries(grid) {
  const s = current();
  grid.append(section('Cast of characters', [['name', 'Collection name'], ['notes', 'Notes', 'area']], s.values, { wide: true }));
  s.entries.forEach((obj, i) => {
    const sec = section(`NPC ${String(i + 1).padStart(2, '0')}`, npcFields, obj, { scope: `entry${i}`, opts: f => (f[0] === 'archetype' ? { list: 'dl-archetypes' } : ATTRS.some(a => a[0] === f[0]) ? attrOpts() : {}) });
    sec.classList.add('repeat-card');
    sec.append(derivedPanel(obj));
    if (obj.cid && CAMPAIGN) {
      const e = CAMPAIGN.get('npc', obj.cid);
      sec.append(el('div', { class: 'campaign-link no-print' }, el('span', { class: 'campaign-chip', text: 'Campaign' }), el('span', { class: 'campaign-name', text: (e && e.name) || 'shared' }),
        el('button', { class: 'mini', text: 'Unlink', onclick: () => { delete obj.cid; touch(); render(); status('Unlinked here. The campaign keeps its own copy.'); } })));
    }
    sec.append(el('button', { class: 'mini actions no-print', text: 'Remove NPC', onclick: () => { s.entries.splice(i, 1); touch(); render(); } }));
    grid.append(sec);
  });
  grid.append(el('button', { class: 'btn no-print', text: 'Add NPC', onclick: () => { if (s.entries.length >= 100) return status('Maximum 100 entries per sheet.'); s.entries.push({}); touch(); render(); } }));
  updateDerived();
}
function delve(grid) {
  const v = current().values;
  grid.append(section('The delve', delveIdentity, v, { wide: true }), section('Dangers', delveDangers, v, { wide: true }),
    table('locations', TABLE_SETS.delve.locations), table('log', TABLE_SETS.delve.log), table('finds', TABLE_SETS.delve.finds),
    section('Map notes', [['map', 'Hand-drawn map area: describe it or leave room to draw', 'area']], v, { wide: true }));
}
function voyage(grid) {
  const v = current().values;
  grid.append(section('Voyage', voyageIdentity, v, { wide: true, opts: f => (f[0] === 'ship' ? { list: 'dl-ships' } : {}) }), table('weeks', TABLE_SETS.voyage.weeks));
}

/* ---------- datalists from the tables file and the fleet ---------- */
function fillLists() {
  const mk = (id, items) => { let d = document.getElementById(id); if (!d) { d = el('datalist', { id }); document.body.append(d); } d.replaceChildren(...[...new Set(items)].slice(0, 1500).map(v => el('option', { value: v }))); };
  mk('dl-talents', talentNames(tables)); mk('dl-weapons', weaponNames(tables)); mk('dl-gear', gearNames(tables));
  mk('dl-archetypes', archetypeNames(tables)); mk('dl-birds', tables ? tables.birds : []); mk('dl-roles', tables ? tables.roles : []);
  mk('dl-ships', fleetList().map(r => r.n));
}
function updateDataStatus() {
  $('#data-status').textContent = tables
    ? `${tables.name} · ${tables.talents.length} talents · ${tables.archetypes.length} archetypes · ${gearNames(tables).length} gear entries. Kept in this browser only.`
    : 'No tables file loaded. Every sheet works without one; talent, gear and archetype fields are free text.';
  $('#clear-tables').disabled = !tables;
}

/* ---------- the campaign ---------- */
const CAMPAIGN = window.CtgdCampaign || null;
const seen = new Map();
const isRepeat = () => type === 'npc';
const kind = () => KIND[type];
const TABLES_OF = { explorer: ['talents', 'weapons', 'gear'], ship: ['crew', 'cargo'], delve: ['locations', 'log', 'finds'], voyage: ['weeks'] };
const skipKeys = new Set(['cid', 'updated', 'fleetId']);
function flat(obj) { const out = {}; for (const [k, v] of Object.entries(obj)) if (!skipKeys.has(k) && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) out[k] = v; return out; }
function entityFor(obj, sheetType = type) {
  const data = { ...flat(obj), sheet: sheetType };
  const sheet = current();
  if (!isRepeat()) for (const k of TABLES_OF[sheetType] || []) data[k] = structuredClone((sheet.tables[k] || []).filter(r => Object.values(r).some(x => x !== '' && x != null)));
  if (obj.fleetId) data.fleetId = obj.fleetId;
  return { id: obj.cid, name: obj.name || undefined, source: 'sheets', data, refs: { sheetId: sheet.id } };
}
function pushObj(obj) { if (!CAMPAIGN || !obj || !obj.cid) return; const e = CAMPAIGN.upsert(kind(), entityFor(obj)); if (e) seen.set(e.id, e.updated); }
function pushSheet() { if (!CAMPAIGN) return; if (isRepeat()) current().entries.forEach(o => o.cid && pushObj(o)); else if (current().values.cid) pushObj(current().values); }
const blank = obj => !Object.entries(obj).some(([k, v]) => k !== 'cid' && v !== '' && v != null);
function shareSheet() {
  if (!CAMPAIGN) return status('The campaign store did not load. Reload the page and try again.');
  const s = current(); let n = 0, one = '';
  if (isRepeat()) s.entries.forEach(o => { if (blank(o)) return; if (!o.cid) o.cid = CAMPAIGN.makeId('npc'); pushObj(o); n++; one = o.name || ''; });
  else { if (!s.values.cid) s.values.cid = CAMPAIGN.makeId(kind()); pushObj(s.values); n = 1; one = title(s); }
  touch(); render();
  status(n ? `Shared ${n === 1 ? `“${one}”` : `${n} entries from “${title(s)}”`} with the campaign.` : 'Give the sheet a name first. There is nothing to share yet.');
}
function matchesHere(e) { return kind() !== 'npc' || (e.data && e.data.sheet === 'npc' ? type === 'npc' : type === 'explorer'); }
function fromEntity(e) {
  const o = { cid: e.id };
  for (const [k, v] of Object.entries(e.data || {})) if (k !== 'sheet' && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) o[k] = v;
  if (!o.name && e.name) o.name = e.name;
  if (typeof e.data.fleetId === 'string') o.fleetId = e.data.fleetId;
  return o;
}
function applyTables(sheet, e) { for (const k of TABLES_OF[sheet.type] || []) if (Array.isArray(e.data[k])) sheet.tables[k] = structuredClone(e.data[k]); }
function importEntity(id) {
  if (!CAMPAIGN) return status('The campaign store did not load. Reload the page and try again.');
  const e = CAMPAIGN.get(kind(), id);
  if (!e) return status('That entry is no longer in the campaign.');
  const s = current();
  if (isRepeat()) {
    const o = fromEntity(e), spot = s.entries.find(blank);
    if (spot) Object.assign(spot, o); else { if (s.entries.length >= 100) return status('Maximum 100 entries per sheet.'); s.entries.push(o); }
  } else {
    const next = newSheet(type); next.values = { ...next.values, ...fromEntity(e) }; applyTables(next, e);
    sheets.push(next); active = next.id;
  }
  persist(); render(); status(`Imported “${e.name || 'the entry'}” from the campaign. It stays linked.`);
}
function receive(db) {
  if (!CAMPAIGN) return;
  let dirty = null;
  for (const [id, e] of Object.entries((db.entities && db.entities[kind()]) || {})) {
    if (e.writer === CAMPAIGN.WRITER || seen.get(id) === e.updated) continue;
    seen.set(id, e.updated);
    if (!matchesHere(e)) continue;
    const list = isRepeat() ? current().entries : current().values.cid ? [current().values] : [];
    const obj = list.find(o => o.cid === id);
    if (!obj) continue;
    let changed = false;
    for (const [k, v] of Object.entries(e.data || {})) { if (k === 'sheet' || (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean')) continue; if (obj[k] !== v) { obj[k] = v; changed = true; } }
    if (!isRepeat()) for (const k of TABLES_OF[type] || []) if (Array.isArray(e.data[k]) && JSON.stringify(current().tables[k] || []) !== JSON.stringify(e.data[k]) && e.data[k].length) { current().tables[k] = structuredClone(e.data[k]); changed = true; }
    if (changed) dirty = e;
  }
  if (dirty) { current().updated = new Date().toISOString(); persist(); render(); status(`Updated from the campaign: ${dirty.name || 'a linked entry'}.`); }
}
function updateCampaign() {
  const box = $('#campaign');
  if (!CAMPAIGN) { box.hidden = true; return; }
  box.hidden = false;
  const linked = isRepeat() ? current().entries.filter(o => o.cid) : current().values.cid ? [current().values] : [];
  const here = CAMPAIGN.all(kind()).filter(matchesHere), pool = here.filter(e => !linked.some(o => o.cid === e.id));
  $('#campaign-pick').replaceChildren(el('option', { value: '', text: pool.length ? `${here.length} in the campaign` : 'Nothing shared yet' }), ...pool.map(e => el('option', { value: e.id, text: `${e.name || 'Unnamed'} · ${e.source}` })));
  $('#campaign-pick').disabled = !pool.length; $('#campaign-import').disabled = !pool.length; $('#campaign-unlink').disabled = !linked.length;
  $('#campaign-share').textContent = linked.length ? 'Update the campaign' : isRepeat() ? 'Share these entries' : 'Share this sheet';
  const total = CAMPAIGN.count(CAMPAIGN.read());
  $('#campaign-status').textContent = linked.length ? `${linked.length} linked here · ${total} in the campaign.` : total ? `Nothing from this sheet is shared yet · ${total} in the campaign.` : 'The campaign is empty. Share a sheet to start it.';
}

/* ---------- render ---------- */
function render() {
  const s = current(); type = s.type; derivedBoxes.clear();
  $('#types').replaceChildren(...Object.entries(TYPES).map(([t, name]) => el('button', { class: 'btn quiet', 'aria-current': String(t === type), text: name, onclick: () => switchType(t) })));
  updateLibrary();
  const grid = el('div', { class: 'sheet-grid' }), ed = $('#editor');
  ed.dataset.sheetType = type;
  ed.replaceChildren(el('div', { class: 'sheet-title' }, el('div', {}, el('div', { class: 'eyebrow', text: 'Coriolis · The Great Dark' }), el('h2', { id: 'sheet-heading', text: title(s) })), el('div', { class: 'seal', 'aria-hidden': 'true' }, el('span', { text: '✦' }))), grid);
  ({ explorer, ship, npc: npcEntries, delve, voyage })[type](grid);
  updateDerived(); updateDataStatus(); updateCampaign(); fillLists();
  requestAnimationFrame(() => document.querySelectorAll('textarea').forEach(grow));
}

/* ---------- files ---------- */
function download(name, x) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(x, null, 2)], { type: 'application/json' })), a = el('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const backup = list => ({ format: FORMAT, saved: new Date().toISOString(), sheets: list });
function readFile(callback) {
  const input = $('#file'); input.value = '';
  input.onchange = async () => {
    const f = input.files[0]; if (!f) return;
    if (f.size > 5 * 1024 * 1024) return status('Choose a JSON file smaller than 5 MB.');
    try { callback(JSON.parse(await f.text())); } catch (e) { status(e.message || 'Could not read that JSON file.'); }
  };
  input.click();
}
$('#new').onclick = () => { const s = newSheet(type); sheets.push(s); active = s.id; persist(); render(); };
$('#duplicate').onclick = () => { const s = structuredClone(current()); s.id = crypto.randomUUID(); delete s.values.cid; s.entries.forEach(o => delete o.cid); s.values.name = title(s) + ' (copy)'; sheets.push(s); active = s.id; persist(); render(); };
$('#library').onchange = e => { active = e.target.value; persist(); render(); };
$('#export').onclick = () => download('ctgd-sheet.json', backup([current()]));
$('#backup').onclick = () => download('ctgd-archive.json', backup(sheets));
$('#restore').onclick = () => readFile(x => {
  const imported = validateArchive(x);
  if (sheets.length + imported.length > 500) throw Error('Maximum 500 sheets per archive.');
  imported.forEach(s => { delete s.values.cid; s.entries.forEach(o => delete o.cid); });
  sheets.push(...imported); active = imported[0].id; type = imported[0].type; persist(); render(); status(`Imported ${imported.length} sheet${imported.length === 1 ? '' : 's'}. Existing sheets kept.`);
});
$('#delete').onclick = () => $('#confirm').showModal();
$('#confirm').addEventListener('close', () => {
  if ($('#confirm').returnValue !== 'delete') return;
  sheets = sheets.filter(s => s.id !== active);
  let next = sheets.find(s => s.type === type);
  if (!next) { next = newSheet(type); sheets.push(next); }
  active = next.id; persist(); render();
});
$('#print').onclick = () => { document.querySelectorAll('textarea').forEach(grow); window.print(); };
$('#import-tables').onclick = () => readFile(x => {
  const next = validateTables(x);
  try { localStorage.setItem(DATAKEY, JSON.stringify(next)); } catch { throw Error('Could not save the tables. Browser storage is unavailable or full.'); }
  tables = next; render(); status('Tables imported in this browser. Nothing was uploaded.');
});
$('#clear-tables').onclick = () => { try { localStorage.removeItem(DATAKEY); } catch { /* storage blocked */ } tables = null; render(); status('Tables removed from this browser.'); };
$('#template').onclick = () => download('ctgd-sheets-tables-template.json', { format: TABLES_FORMAT, name: 'My tables', talents: [{ n: 'Sample talent', levels: '0-3', type: 'general' }], archetypes: [{ n: 'Sample archetype', key: '', keyTalents: ['Sample talent'], equipment: ['Sample item'], specialties: [{ n: 'Sample specialty', talent: 'Sample talent' }] }], gear: { 'Sample group': ['Sample item'] }, weapons: { 'Sample kind': [{ n: 'Sample weapon' }] }, armor: [{ n: 'Sample armour' }], birds: [{ n: 'Sample bird' }], roles: ['Sample role'] });


try { const t = localStorage.getItem(DATAKEY); if (t) tables = validateTables(JSON.parse(t)); } catch { tables = null; }
if (CAMPAIGN) {
  $('#campaign-share').onclick = shareSheet;
  $('#campaign-import').onclick = () => { const id = $('#campaign-pick').value; if (!id) return status('Choose something from the campaign first.'); importEntity(id); };
  $('#campaign-unlink').onclick = () => {
    const linked = isRepeat() ? current().entries.filter(o => o.cid) : current().values.cid ? [current().values] : [];
    if (!linked.length) return status('Nothing on this sheet is linked to the campaign.');
    linked.forEach(o => delete o.cid); touch(); render(); status('Unlinked here. The campaign keeps its own copies.');
  };
  $('#campaign-backup').onclick = () => download('ctgd-campaign.json', CAMPAIGN.exportAll());
  CAMPAIGN.subscribe(receive);
}
render();
if (startupError) status(startupError); else persist();
if (CAMPAIGN) receive(CAMPAIGN.read());

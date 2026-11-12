import {
  TABLES, TABLE_IDS, DEPTH_BANDS, FIND_BANDS, BLIGHT_BANDS, CLASS_NAMES, LIMITS, BACKUP_FORMAT, FORMAT,
  newDelve, cleanDelve, validateData, validateBackup, coverage, generate, rerollKey, pickKey, rerollNum, setNumValue, rerollLoc, rerollShards, rollQuirks, rerollQuirk, rollItem,
  chainsFate, combinesType, describe, describeIndexed, textOf, eraColumn, rowFor, classEstimate, classShown, levelRange, HELD_KEYS,
  pickItem, tableOf, locText
} from './model.js';
import { MAP_LIMITS, DEFAULT_W, generateMap, emptyMap, resizeMap, cloneMap, paint, line, addPoint, movePoint, removePoint, pointAt, pointById, nearestExit, scanReach, blightAt, isRead, setRead } from './map.js';

const $ = s => document.querySelector(s);
const KEY = 'ctgd-delve-v1', DATAKEY = 'ctgd-delve-data-v1';
const el = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (k === 'text') n.textContent = v;
    else if (k === 'class') n.className = v;
    else if (v === true) n.setAttribute(k, '');
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  n.append(...kids.flat().filter(x => x != null));
  return n;
};
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, text) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text != null) n.textContent = text; return n; };

let delves = [], active, tab = 'ruin', data = null, startupError = '', loadFailed = false, saveWarning = '';
let view = 'gm', dataMsg = '';
const TABS = ['ruin', 'map', 'data'];

/* ---------- storage ---------- */
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved) { delves = (saved.delves || []).map(cleanDelve); active = saved.active; if (TABS.includes(saved.tab)) tab = saved.tab; }
} catch { startupError = 'The saved delves could not be read. Export your current work before reloading; the original browser data has been left untouched.'; loadFailed = true; }
try { const t = localStorage.getItem(DATAKEY); if (t) data = validateData(JSON.parse(t)); } catch { data = null; }
if (!delves.length) delves = [newDelve()];
if (!delves.some(d => d.id === active)) active = delves[0].id;
const cur = () => delves.find(d => d.id === active);
const title = d => d.name || 'Untitled delve';

const status = s => { $('#save-status').textContent = [s, saveWarning].filter(Boolean).join(' '); };
function persist() {
  if (loadFailed) { status(startupError); return; }
  try { localStorage.setItem(KEY, JSON.stringify({ delves, active, tab })); saveWarning = ''; status('Saved in this browser.'); }
  catch { saveWarning = 'Changes are not saved: browser storage is unavailable or full. Export a backup now.'; status(''); }
}
function touch() { cur().updated = new Date().toISOString(); persist(); updateLibrary(); }
function updateLibrary() {
  const l = $('#library');
  l.replaceChildren(...delves.map(d => el('option', { value: d.id, text: title(d) })));
  l.value = active; $('#delve-name').value = cur().name;
}

/* ---------- labels ---------- */
const optLabel = (key, i, d) => {
  const id = tableOf(key), [lo, hi] = TABLES[id].ranges[i], row = rowFor(data, id, i);
  const name = row ? (id === 'ruin.purpose' ? (row.v && row.v[eraColumn(d)]) : row.n) : '';
  return `${lo === hi ? lo : lo + '–' + hi}${name ? ' · ' + name.slice(0, 40) : ''}`;
};
function valueCell(x) {
  return el('div', { class: 'v' }, x.name ? el('div', { class: 'name', text: x.name }) : null, x.detail ? el('div', { class: 'detail', text: x.detail }) : null, el('span', { class: 'chip' + (x.name ? '' : ' hot'), text: x.chip }));
}
function lockBox(item, onChange) {
  const c = el('input', { type: 'checkbox', 'aria-label': 'Lock' }); c.checked = !!item.l;
  c.addEventListener('change', () => { item.l = c.checked; touch(); if (onChange) onChange(); });
  return el('label', { class: 'lock' }, c, 'Lock');
}
function pickBox(key, onPick, item, d) {
  const sel = el('select', { class: 'pick', 'aria-label': 'Pick by hand' }, el('option', { value: '', text: 'Pick…' }), ...TABLES[tableOf(key)].ranges.map((_, i) => el('option', { value: i, text: optLabel(key, i, d) })));
  sel.addEventListener('change', () => { if (sel.value !== '') onPick(Number(sel.value)); });
  return sel;
}

/* ---------- the Ruin tab ---------- */
function itemRow(d, label, key, nested = false) {
  const it = d.items[key];
  const row = el('div', { class: 'item' + (nested ? ' nested' : '') }, el('div', { class: 'k', text: label }));
  if (!it) { row.append(el('div', { class: 'v hint', text: 'Not rolled yet.' }), el('div', { class: 'ctl' }, el('button', { class: 'mini', text: 'Roll', onclick: () => { rerollKey(d, key); touch(); renderRuin(); } }))); return row; }
  row.append(valueCell(describe(data, key, it, d)), el('div', { class: 'ctl' },
    el('button', { class: 'mini', text: 'Reroll', 'aria-label': `Reroll ${label}`, onclick: () => { if (it.l) return status(`${label} is locked. Unlock it to reroll.`); rerollKey(d, key); touch(); renderRuin(); } }),
    pickBox(key, i => { pickKey(d, key, i); touch(); renderRuin(); }, it, d), lockBox(it)));
  return row;
}
function numRow(d, label, key, expr, nested = true) {
  const n = d.nums[key];
  const row = el('div', { class: 'item' + (nested ? ' nested' : '') }, el('div', { class: 'k', text: label }));
  if (!n) { row.append(el('div', { class: 'v hint', text: 'Set by the band above.' }), el('div', { class: 'ctl' })); return row; }
  const input = el('input', { type: 'number', class: 'numin', min: 0, 'aria-label': label }); input.value = n.v;
  input.addEventListener('change', () => { setNumValue(d, key, input.value); touch(); renderRuin(); });
  row.append(el('div', { class: 'v' }, input, ' ', el('span', { class: 'chip', text: n.e || expr || '' })),
    el('div', { class: 'ctl' }, n.e ? el('button', { class: 'mini', text: 'Reroll', 'aria-label': `Reroll ${label}`, onclick: () => { if (n.l) return status(`${label} is locked.`); rerollNum(d, key); touch(); renderRuin(); } }) : null, lockBox(n)));
  return row;
}
function stage(heading, ...rows) { return el('section', { class: 'stage' }, el('h3', { text: heading }), ...rows.flat()); }

function renderRuin() {
  const d = cur(), box = $('#view-ruin');
  const bar = el('div', { class: 'bar' },
    el('button', { class: 'btn primary', text: d.items.era ? 'Roll everything unlocked' : 'Roll a ruin', onclick: () => { generate(d); touch(); renderRuin(); } }),
    data ? null : el('span', { class: 'hint', text: 'No data file: results show table ids and rolled numbers. Import one on the Data tab to name them.' }));
  const bg = stage('1 · Background', itemRow(d, 'Era', 'era'), itemRow(d, 'Purpose', 'purpose'), itemRow(d, 'Fate', 'fate'),
    chainsFate(d) ? [el('p', { class: 'hint', text: 'This fate chains a second purpose and fate.' }), itemRow(d, 'Purpose (2nd)', 'purpose2', true), itemRow(d, 'Fate (2nd)', 'fate2', true)] : null);
  const st = stage('2 · Structure', itemRow(d, 'Type', 'type'),
    combinesType(d) ? [el('p', { class: 'hint', text: 'This type rolls twice and combines the two results.' }), itemRow(d, 'Type (first)', 'typeA', true), itemRow(d, 'Type (second)', 'typeB', true)] : null,
    itemRow(d, 'Depth band', 'depth'),
    d.items.depth ? [numRow(d, 'Markers deep', 'markers'), numRow(d, 'Entrances', 'entrances'), numRow(d, 'Key locations', 'keys')] : null);
  const th = stage('3 · Theme', itemRow(d, 'Glyph', 'glyph'), quirkRows(d));
  const kl = stage('4 · Key locations', locRows(d));
  const di = stage('5 · Discoveries', itemRow(d, 'Discovery band', 'find'), d.items.find ? [numRow(d, 'Lesser artefacts', 'lesser'), numRow(d, 'Major artefacts', 'major'), el('p', { class: 'hint', text: 'Shards for each key location are in stage 4.' })] : null);
  const tr = stage('6 · Threats', itemRow(d, 'Blight infestation', 'blight'), blightRows(d), itemRow(d, 'Threat', 'threat'), partyRows(d), classRow(d));
  const notes = el('label', { class: 'field wide', style: 'margin-top:14px' }, el('span', { text: 'Notes' }), el('textarea', { rows: 3, 'aria-label': 'Delve notes', oninput: e => { d.notes = e.target.value; touch(); } }));
  notes.querySelector('textarea').value = d.notes;
  box.replaceChildren(bar, el('div', { class: 'stages' }, bg, st, th, kl, di, tr), notes);
  updateCampaign();
}
function quirkRows(d) {
  const cnt = el('input', { type: 'number', class: 'numin', min: 0, max: LIMITS.quirks, 'aria-label': 'Number of quirks' }); cnt.value = d.quirkCount;
  cnt.addEventListener('change', () => { d.quirkCount = Math.max(0, Math.min(LIMITS.quirks, Math.trunc(Number(cnt.value) || 0))); rollQuirks(d); touch(); renderRuin(); });
  const head = el('div', { class: 'item' }, el('div', { class: 'k', text: 'Quirks' }), el('div', { class: 'v' }, cnt, ' ', el('span', { class: 'hint', text: 'how many to roll (your choice; not fixed by the rules summary)' })), el('div', { class: 'ctl' }, el('button', { class: 'mini', text: 'Roll quirks', onclick: () => { rollQuirks(d); touch(); renderRuin(); } })));
  const rows = d.quirks.map((q, i) => {
    const x = describeIndexed(data, 'theme.quirk', q);
    return el('div', { class: 'item nested' }, el('div', { class: 'k', text: `Quirk ${i + 1}` }), valueCell(x), el('div', { class: 'ctl' },
      el('button', { class: 'mini', text: 'Reroll', 'aria-label': `Reroll quirk ${i + 1}`, onclick: () => { if (q.l) return status('That quirk is locked.'); rerollQuirk(d, i); touch(); renderRuin(); } }),
      el('select', { class: 'pick', 'aria-label': 'Pick by hand', onchange: e => { if (e.target.value === '') return; const k = Number(e.target.value); d.quirks[i] = { r: TABLES['theme.quirk'].ranges[k][0], i: k, l: false }; touch(); renderRuin(); } }, el('option', { value: '', text: 'Pick…' }), ...TABLES['theme.quirk'].ranges.map((r, k) => { const row = rowFor(data, 'theme.quirk', k); return el('option', { value: k, text: `${r[0]}${row && row.n ? ' · ' + row.n.slice(0, 36) : ''}` }); })),
      lockBox(q)));
  });
  return [head, ...rows];
}
function locRows(d) {
  if (!d.locs.length) return el('p', { class: 'hint', text: 'Roll a depth band to set how many key locations there are.' });
  return d.locs.map((loc, i) => {
    const x = describeIndexed(data, 'loc.shape', loc.shape);
    const shards = el('input', { type: 'number', class: 'numin', min: 0, 'aria-label': `Shards at key location ${i + 1}` }); shards.value = loc.shards.v;
    shards.addEventListener('change', () => { loc.shards.v = Math.max(0, Math.trunc(Number(shards.value) || 0)); touch(); });
    const nm = el('input', { type: 'text', 'aria-label': `Name of key location ${i + 1}`, placeholder: 'Your name for it (optional)' }); nm.value = loc.name;
    nm.addEventListener('input', () => { loc.name = nm.value; touch(); });
    const row = el('div', { class: 'item' }, el('div', { class: 'k', text: `Key location ${i + 1}` }),
      el('div', { class: 'v' }, valueCell(x), el('div', { class: 'row', style: 'margin-top:4px' }, nm), el('div', { class: 'row', style: 'margin-top:4px' }, el('span', { class: 'hint', text: 'Shards' }), shards, el('span', { class: 'chip', text: FIND_BANDS[d.items.find ? d.items.find.i : 0].shards }), el('button', { class: 'mini', text: 'Reroll shards', onclick: () => { if (loc.shards.l) return status('Those shards are locked.'); rerollShards(d, i); touch(); renderRuin(); } }), lockBox(loc.shards))),
      el('div', { class: 'ctl' }, el('button', { class: 'mini', text: 'Reroll', 'aria-label': `Reroll key location ${i + 1}`, onclick: () => { if (loc.shape.l) return status('That location is locked.'); rerollLoc(d, i); touch(); renderRuin(); } }),
        el('select', { class: 'pick', 'aria-label': 'Pick by hand', onchange: e => { if (e.target.value === '') return; loc.shape = { ...pickItem('loc.shape', Number(e.target.value)), l: false }; touch(); renderRuin(); } }, el('option', { value: '', text: 'Pick…' }), ...TABLES['loc.shape'].ranges.map((_, k) => el('option', { value: k, text: optLabel('loc.shape', k, d) }))), lockBox(loc.shape)));
    return row;
  });
}
function blightRows(d) {
  if (!d.items.blight) return null;
  const [lo, hi] = levelRange(d);
  return [el('div', { class: 'item nested' }, el('div', { class: 'k', text: 'Blight levels' }), el('div', { class: 'v', text: hi === 0 ? 'None' : `${lo === 0 ? 'none' : lo} up to ${hi}` }), el('div', { class: 'ctl' })), numRow(d, 'Blight cores', 'cores'), numRow(d, 'Blight oases', 'oases')];
}
function partyRows(d) {
  const inc = el('input', { type: 'checkbox', 'aria-label': 'Include another party' }); inc.checked = d.includeParty;
  inc.addEventListener('change', () => { d.includeParty = inc.checked; if (inc.checked && !d.items.party) d.items.party = rollItem('party'); touch(); renderRuin(); });
  return [el('div', { class: 'item' }, el('div', { class: 'k', text: 'Another party' }), el('div', { class: 'v' }, el('label', { class: 'lock' }, inc, 'Include one (optional)')), el('div', { class: 'ctl' })), d.includeParty ? itemRow(d, 'Party', 'party', true) : null];
}
function classRow(d) {
  const est = classEstimate(d), sel = el('select', { 'aria-label': 'Delve class' }, el('option', { value: '', text: est ? `Estimate: class ${est}` : 'Roll Blight first' }), ...CLASS_NAMES.map(c => el('option', { value: c, text: `Class ${c}` })));
  sel.value = d.classOverride; sel.addEventListener('change', () => { d.classOverride = sel.value; touch(); renderRuin(); });
  const x = d.items.blight ? describeIndexed(data, 'delve.class', { r: d.items.blight.i + 1, i: d.items.blight.i }) : null;
  return el('div', { class: 'item' }, el('div', { class: 'k', text: 'Delve class' }), el('div', { class: 'v' }, sel, x && x.name ? el('div', { class: 'detail', text: x.name + (x.detail ? ' · ' + x.detail : '') }) : null, el('p', { class: 'hint', text: 'An estimate only: the book gives no numeric rule for classes, so this maps the Blight band to I–IV. Change it to suit.' })), el('div', { class: 'ctl' }));
}

/* ---------- the Map tab: a painted grid, with the delve's points placed on it ---------- */
const CS = 16, ML = 44, MT = 40, BM = 26;
const AMBER = '#f0a020', BRIGHT = '#ffd36a', DIM = '#8a5a12', BLACK = '#0a0702';
const TOOLS = [['open', 'Dig'], ['hidden', 'Hidden'], ['blocked', 'Blocked'], ['erase', 'Erase'], ['blight', 'Blight'], ['read', 'Mark read'], ['unread', 'Unread']];
const POINT_TOOLS = [['select', 'Select'], ['e', 'Entrance'], ['k', 'Key location'], ['c', 'Core'], ['o', 'Oasis'], ['n', 'Note']];
let tool = 'open', brush = 1, mirror = false, level = 2, keyNo = 0, undo = [], hover = null, selPoint = null, regen = false, mapCanvas = null;
const colLabel = i => (i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(65 + (i - 26) % 26) + String.fromCharCode(97 + (i - 26) % 26));
const cellName = (x, y) => `${colLabel(x)}${y}`;
const cellsToChar = { open: 'o', hidden: 'h', blocked: 'x' };

function renderMap() {
  const d = cur(), box = $('#view-map');
  if (!d.map) {
    const ready = d.items.depth && d.items.blight && d.nums.markers;
    box.replaceChildren(el('div', { class: 'stage' }, el('h3', { text: 'Map' }), el('p', { text: 'Paint the structure of the delve on a grid, one cell to a marker, then place its entrances, key locations, Blight cores and oases on it.' }),
      el('div', { class: 'bar' }, el('button', { class: 'btn primary', text: 'Generate a structure from the ruin', disabled: !ready, onclick: () => placeMap() }), el('button', { class: 'btn quiet', text: 'Start with a blank grid', onclick: () => { d.map = emptyMap(DEFAULT_W, Math.max(MAP_LIMITS.hMin, (d.nums.markers ? d.nums.markers.v : 24) + 4)); undo = []; touch(); renderMap(); } })),
      ready ? null : el('p', { class: 'hint', text: 'Roll a depth band and a Blight infestation on the Ruin tab to generate one.' })));
    return;
  }
  const holder = el('div', { class: 'mapbox' + (view === 'scan' ? ' scan' : ''), id: 'mapbox' });
  mapCanvas = el('canvas', { id: 'mapcanvas', 'aria-label': view === 'scan' ? 'Deep-scan view of the delve map' : 'Delve map editor', role: 'img' });
  holder.append(mapCanvas);
  const side = el('div', { class: 'mapside', id: 'mapside' });
  box.replaceChildren(el('div', { class: 'mapview' }, holder, side));
  wireCanvas(mapCanvas); drawCanvas(); drawSide(side);
}
function placeMap() {
  const d = cur(), r = levelRange(d);
  d.map = generateMap({ markers: d.nums.markers.v, entrances: d.nums.entrances.v, keys: d.nums.keys.v, cores: d.nums.cores ? d.nums.cores.v : 0, oases: d.nums.oases ? d.nums.oases.v : 0, levelLo: r[0], levelHi: r[1] });
  undo = []; selPoint = null; regen = false; touch(); renderMap(); status('Structure generated from the ruin. Paint over it, move points, or generate again.');
}
function snapshot() { undo.push(cloneMap(cur().map)); if (undo.length > 40) undo.shift(); }

/* ----- drawing ----- */
function palette() {
  if (view === 'scan') return { scan: true, bg: BLACK, rock: BLACK, fill: 'rgba(240,160,32,.14)', edge: AMBER, edge2: BRIGHT, ink: BRIGHT, dim: DIM, grid: 'rgba(240,160,32,.28)', accent: AMBER, ok: '#c8e060', text: AMBER };
  const cs = getComputedStyle(document.body), v = n => cs.getPropertyValue(n).trim();
  return { scan: false, bg: v('--ground'), rock: v('--ground'), fill: v('--sheet'), edge: v('--line'), edge2: v('--ink'), ink: v('--ink'), dim: v('--muted'), grid: 'rgba(128,128,128,.16)', accent: v('--accent'), ok: v('--ok'), text: v('--muted') };
}
const hexPath = (c, x, y, r) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i + Math.PI / 6; const px = x + r * Math.cos(a), py = y + r * Math.sin(a); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); };
function drawCanvas() {
  const cv = mapCanvas; if (!cv || !cur().map) return;
  const m = cur().map, P = palette(), scan = P.scan, RM = scan ? 190 : 12;
  const W = ML + m.w * CS + RM, H = Math.max(MT + m.h * CS + BM, scan ? MT + 330 : 0), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.aspectRatio = `${W} / ${H}`;
  const c = cv.getContext('2d'); c.scale(dpr, dpr); c.lineJoin = 'round'; c.lineCap = 'round';
  const X = x => ML + x * CS, Y = y => MT + y * CS;
  const field = scan ? scanReach(m) : null;
  const seen = (x, y) => (scan ? reachedCell(m, field, x, y) && m.cells[y][x] === 'o' : inBoundsCell(m, x, y) && m.cells[y][x] !== '.');
  c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
  if (scan) { const g = c.createRadialGradient(W * 0.45, H * 0.45, 20, W * 0.45, H * 0.45, W * 0.8); g.addColorStop(0, 'rgba(70,40,5,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
  /* grid and labels */
  c.strokeStyle = P.grid; c.lineWidth = 1; c.beginPath();
  for (let x = 0; x <= m.w; x++) { if (scan && x % 4) continue; c.moveTo(X(x) + 0.5, MT - 6); c.lineTo(X(x) + 0.5, Y(m.h)); }
  for (let y = 0; y <= m.h; y++) { if (scan && y % 4) continue; c.moveTo(ML - 6, Y(y) + 0.5); c.lineTo(X(m.w), Y(y) + 0.5); }
  c.stroke();
  c.fillStyle = P.text; c.font = '11px "IBM Plex Mono", monospace'; c.textAlign = 'center';
  for (let x = 0; x < m.w; x++) c.fillText(colLabel(x), X(x) + CS / 2, MT - 12);
  c.textAlign = 'right'; for (let y = 0; y < m.h; y++) c.fillText(String(y), ML - 9, Y(y) + CS / 2 + 4);
  /* passage fills */
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const ch = m.cells[y][x]; if (ch === '.') continue;
    if (scan && !seen(x, y)) continue;
    c.fillStyle = P.fill; c.fillRect(X(x), Y(y), CS, CS);
    const b = blightAt(m, x, y);
    if (b && (!scan || isRead(m, x, y))) { c.fillStyle = scan ? `rgba(240,160,32,${0.05 + b * 0.05})` : P.accent; if (!scan) c.globalAlpha = 0.07 + b * 0.05; c.fillRect(X(x), Y(y), CS, CS); c.globalAlpha = 1; }
    if (!scan && ch === 'h') { c.strokeStyle = P.dim; c.lineWidth = 1; c.beginPath(); for (let k = -CS; k < CS; k += 5) { c.moveTo(X(x) + Math.max(0, k), Y(y) + Math.max(0, -k)); c.lineTo(X(x) + Math.min(CS, k + CS), Y(y) + Math.min(CS, CS - k)); } c.stroke(); }
    if (!scan && ch === 'x') { c.strokeStyle = P.accent; c.lineWidth = 2; c.beginPath(); c.moveTo(X(x) + 3, Y(y) + 3); c.lineTo(X(x) + CS - 3, Y(y) + CS - 3); c.moveTo(X(x) + CS - 3, Y(y) + 3); c.lineTo(X(x) + 3, Y(y) + CS - 3); c.stroke(); }
  }
  /* interference below what the scan reached */
  if (scan) drawInterference(c, m, field, X, Y, W);
  /* outlines round the passages */
  c.strokeStyle = P.edge; c.lineWidth = scan ? 2.5 : 2; if (scan) { c.shadowColor = AMBER; c.shadowBlur = 9; }
  c.beginPath();
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (!seen(x, y)) continue;
    if (!seen(x, y - 1) && y > 0) { c.moveTo(X(x), Y(y)); c.lineTo(X(x + 1), Y(y)); }
    if (!seen(x, y + 1)) { c.moveTo(X(x), Y(y + 1)); c.lineTo(X(x + 1), Y(y + 1)); }
    if (!seen(x - 1, y)) { c.moveTo(X(x), Y(y)); c.lineTo(X(x), Y(y + 1)); }
    if (!seen(x + 1, y)) { c.moveTo(X(x + 1), Y(y)); c.lineTo(X(x + 1), Y(y + 1)); }
  }
  c.stroke(); c.shadowBlur = 0;
  /* surface line */
  c.strokeStyle = P.edge2; c.lineWidth = 2; c.beginPath(); c.moveTo(ML - 6, Y(0)); c.lineTo(X(m.w), Y(0)); c.stroke();
  /* Blight badges, sparse along the passages */
  c.font = '600 9px "IBM Plex Mono", monospace'; c.textAlign = 'center';
  for (let y = 2; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const b = blightAt(m, x, y); if (!b || !seen(x, y) || (x * 3 + y * 5) % 7 || (scan && !isRead(m, x, y))) continue;
    hexPath(c, X(x) + CS / 2, Y(y) + CS / 2, 7.5); c.fillStyle = P.bg; c.fill(); c.strokeStyle = scan ? BRIGHT : P.accent; c.lineWidth = 1.6; c.stroke();
    c.fillStyle = scan ? BRIGHT : P.accent; c.fillText(String(b), X(x) + CS / 2, Y(y) + CS / 2 + 3.2);
  }
  /* points */
  c.textAlign = 'center';
  for (const p of m.points) {
    const cx = X(p.x) + CS / 2, cy = Y(p.y) + CS / 2, rd = isRead(m, p.x, p.y), sel = p.id === selPoint;
    if (scan && !reachedCell(m, field, p.x, p.y)) continue;
    if (scan && (p.t === 'c' || p.t === 'o' || p.t === 'n') && !rd && p.t !== 'n') continue;
    c.lineWidth = 2.5; c.strokeStyle = sel ? '#ffffff' : (scan ? BRIGHT : P.edge2);
    if (p.t === 'e') { c.fillStyle = scan ? 'rgba(240,160,32,.45)' : P.edge2; c.fillRect(cx - 7, cy - 4, 14, 8); c.strokeRect(cx - 7, cy - 4, 14, 8); c.beginPath(); c.moveTo(cx - 5, cy - 11); c.lineTo(cx, cy - 6); c.lineTo(cx + 5, cy - 11); c.stroke(); if (!scan && p.u) { c.fillStyle = P.ok; c.beginPath(); c.arc(cx + 11, cy - 8, 3, 0, 7); c.fill(); } }
    else if (p.t === 'k') { c.fillStyle = scan ? 'rgba(240,160,32,.3)' : P.accent; c.beginPath(); c.arc(cx, cy, 9, 0, 7); c.fill(); c.stroke(); c.fillStyle = scan ? BRIGHT : P.bg; c.font = '700 11px "IBM Plex Mono", monospace'; c.fillText(String(p.k + 1), cx, cy + 4); if (scan && !rd) { hexPath(c, cx + 18, cy, 8); c.strokeStyle = DIM; c.lineWidth = 1.5; c.stroke(); c.fillStyle = DIM; c.font = '700 10px "IBM Plex Mono", monospace'; c.fillText('?', cx + 18, cy + 3.5); } }
    else if (p.t === 'c') { hexPath(c, cx, cy, 10); c.fillStyle = scan ? 'rgba(240,160,32,.55)' : P.accent; c.fill(); c.stroke(); }
    else if (p.t === 'o') { c.strokeStyle = sel ? '#fff' : P.ok; c.setLineDash([4, 3]); c.beginPath(); c.arc(cx, cy, 10, 0, 7); c.stroke(); c.setLineDash([]); }
    else if (p.t === 'n') { c.fillStyle = P.ink; c.beginPath(); c.moveTo(cx, cy - 7); c.lineTo(cx + 6, cy); c.lineTo(cx, cy + 7); c.lineTo(cx - 6, cy); c.closePath(); c.fill(); if (sel) { c.stroke(); } }
    if (p.n) { c.fillStyle = scan ? BRIGHT : P.ink; c.font = '11px "IBM Plex Mono", monospace'; c.textAlign = 'left'; c.fillText(p.n, cx + 13, cy - 8); c.textAlign = 'center'; }
  }
  /* brush preview */
  if (!scan && hover && POINT_TOOLS.every(([k]) => k !== tool) && inBoundsCell(m, hover.x, hover.y)) {
    const r0 = -Math.floor((brush - 1) / 2); c.strokeStyle = P.accent; c.lineWidth = 1.5; c.setLineDash([3, 2]);
    for (const hx of mirror ? [hover.x, m.w - 1 - hover.x] : [hover.x]) c.strokeRect(X(hx + r0) + 0.5, Y(hover.y + r0) + 0.5, brush * CS - 1, brush * CS - 1);
    c.setLineDash([]);
  }
  if (scan) drawScanChrome(c, m, field, W, H, X, Y);
}
function drawInterference(c, m, field, X, Y, W) {
  let deepest = 0; for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.cells[y][x] === 'o' && reachedCell(m, field, x, y)) deepest = Math.max(deepest, y);
  let seed = 0; for (const ch of cur().id) seed = (seed * 31 + ch.charCodeAt(0)) % 2147483647; seed = seed || 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const y0 = Y(deepest + 2), y1 = Y(m.h);
  c.save();
  for (let i = 0; i < 90; i++) { const y = y0 + rnd() * Math.max(10, y1 - y0), x = X(0) + rnd() * m.w * CS, rx = 40 + rnd() * 170; c.globalAlpha = 0.1 + rnd() * 0.28; c.fillStyle = AMBER; c.filter = 'blur(5px)'; c.beginPath(); c.ellipse(x, y, rx, 1.5 + rnd() * 3.5, 0, 0, 7); c.fill(); }
  for (let i = 0; i < 50; i++) { const y = y0 + rnd() * Math.max(10, y1 - y0), x = X(0) + rnd() * m.w * CS; c.globalAlpha = 0.25 + rnd() * 0.5; c.fillStyle = BRIGHT; c.filter = 'blur(3px)'; c.beginPath(); c.arc(x, y, 1.5 + rnd() * 4, 0, 7); c.fill(); }
  c.restore();
}
function drawScanChrome(c, m, field, W, H, X, Y) {
  let reach = 0, deepest = 0, readN = 0, keys = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.cells[y][x] === 'o' && reachedCell(m, field, x, y)) { reach++; deepest = Math.max(deepest, y); if (isRead(m, x, y)) readN++; }
  keys = m.points.filter(p => p.t === 'k' && reachedCell(m, field, p.x, p.y)).length;
  const rx = X(m.w) + 22; c.textAlign = 'left'; c.fillStyle = AMBER;
  [['Deep scan', true], [`Passage: ${reach} markers`], [`Structure depth: ${deepest}`], [`Blight read: ${reach ? Math.round(100 * readN / reach) : 0}%`], [`Key locations: ${keys}`]].forEach(([t, head], i) => { c.font = (head ? '700 14px' : '13px') + ' "IBM Plex Mono", monospace'; c.fillStyle = head ? BRIGHT : AMBER; c.fillText(t, rx, H - 130 + i * 22); if (head) { c.fillRect(rx, H - 126, 80, 1.5); } });
  const dial = (cx, cy, r) => { c.strokeStyle = AMBER; c.lineWidth = 1.5; c.globalAlpha = 0.8; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke(); c.setLineDash([3, 4]); c.beginPath(); c.arc(cx, cy, r * 0.55, 0, 7); c.stroke(); c.setLineDash([]); c.beginPath(); c.moveTo(cx - r - 6, cy); c.lineTo(cx + r + 6, cy); c.moveTo(cx, cy - r - 6); c.lineTo(cx, cy + r + 6); c.stroke(); c.strokeStyle = BRIGHT; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r, Math.PI, Math.PI * 1.5); c.stroke(); c.globalAlpha = 1; };
  dial(rx + 40, MT + 50, 30); dial(rx + 40, MT + 140, 22);
  c.fillStyle = AMBER; for (let i = 0; i < 5; i++) { c.globalAlpha = 0.55; c.fillRect(rx + 4, MT + 200 + i * 12, 60 + ((i * 37) % 70), 6); } c.globalAlpha = 1;
  c.fillStyle = 'rgba(0,0,0,.38)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
  c.strokeStyle = DIM; c.lineWidth = 2; c.beginPath(); c.roundRect(4, 4, W - 8, H - 8, 14); c.stroke();
}
const reachedCell = (m, f, x, y) => inBoundsCell(m, x, y) && f[y * m.w + x] >= 0;
const inBoundsCell = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h;

/* ----- painting and points ----- */
function cellFrom(e, cv) { const r = cv.getBoundingClientRect(), m = cur().map, W = ML + m.w * CS + (view === 'scan' ? 190 : 12), H = Math.max(MT + m.h * CS + BM, view === 'scan' ? MT + 330 : 0); const px = (e.clientX - r.left) * (W / r.width), py = (e.clientY - r.top) * (H / r.height); return { x: Math.floor((px - ML) / CS), y: Math.floor((py - MT) / CS) }; }
function wireCanvas(cv) {
  const d = cur(); let stroke = null, dragPoint = null, raf = 0;
  const redraw = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; drawCanvas(); }); };
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', e => {
    if (view === 'scan') { const m = d.map, c0 = cellFrom(e, cv), p = pointAt(m, c0.x, c0.y); selPoint = p ? p.id : null; drawCanvas(); drawSide($('#mapside')); return; }
    const m = d.map, c0 = cellFrom(e, cv); if (!inBoundsCell(m, c0.x, c0.y)) return;
    try { cv.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    const right = e.button === 2;
    if (!right && (tool === 'select' || POINT_TOOLS.some(([k]) => k === tool))) {
      snapshot();
      if (tool === 'select') { const p = pointAt(m, c0.x, c0.y); selPoint = p ? p.id : null; dragPoint = p ? p.id : null; }
      else { const o = tool === 'k' ? { t: 'k', k: keyNo, x: c0.x, y: c0.y } : { t: tool, x: c0.x, y: c0.y }; const p = addPoint(m, o); if (p) selPoint = p.id; else status('No room for another point.'); touch(); }
      drawCanvas(); drawSide($('#mapside')); return;
    }
    snapshot(); const brushDef = { tool: right ? 'erase' : tool, size: brush, mirror, level };
    stroke = { last: c0, brushDef }; paint(m, c0.x, c0.y, brushDef); redraw();
  });
  cv.addEventListener('pointermove', e => {
    const m = d.map, c0 = cellFrom(e, cv);
    if (dragPoint) { if (inBoundsCell(m, c0.x, c0.y)) { movePoint(m, dragPoint, c0.x, c0.y); redraw(); } return; }
    if (stroke) { if (inBoundsCell(m, c0.x, c0.y)) { line(m, stroke.last.x, stroke.last.y, c0.x, c0.y, stroke.brushDef); stroke.last = c0; } redraw(); return; }
    if (!hover || hover.x !== c0.x || hover.y !== c0.y) { hover = c0; const r = $('#cellreadout'); if (r) r.textContent = inBoundsCell(m, c0.x, c0.y) ? `${cellName(c0.x, c0.y)} · ${c0.y} marker${c0.y === 1 ? '' : 's'} deep` : ''; redraw(); }
  });
  const end = () => { if (stroke || dragPoint) { touch(); drawSide($('#mapside')); } stroke = null; dragPoint = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', () => { hover = null; redraw(); });
}

/* ----- the side panel ----- */
function drawSide(side) {
  const d = cur(), m = d.map, scan = view === 'scan';
  const refresh = () => { touch(); drawCanvas(); drawSide(side); };
  const toggle = el('div', { class: 'seg', role: 'group', 'aria-label': 'Map view' },
    el('button', { 'aria-pressed': String(!scan), text: 'GM view', onclick: () => { view = 'gm'; renderMap(); } }),
    el('button', { 'aria-pressed': String(scan), text: 'Deep scan', onclick: () => { view = 'scan'; renderMap(); } }));
  const card = el('section', { class: 'card' }, el('h2', { text: 'Map' }), toggle,
    el('p', { class: 'hint', text: scan ? 'What a deep scan would show the players: passages joined to an entrance by open cells (hidden and blocked ones are missed). Blight levels, cores and oases show only where you have marked cells read.' : 'Paint the structure, then place points on it. Right-click erases. One cell is one marker; row 0 is the surface.' }),
    el('p', { class: 'data hint', id: 'cellreadout', text: '' }));
  const parts = [card];
  if (!scan) {
    const btn = (id, label, pressed, fn) => el('button', { class: 'tool', 'aria-pressed': String(pressed), text: label, onclick: fn });
    const seg = (items, cur2, set) => el('div', { class: 'seg' }, items.map(([v, l]) => el('button', { 'aria-pressed': String(v === cur2), text: l, onclick: () => { set(v); renderMapSide(); } })));
    const renderMapSide = () => drawSide(side);
    const chk = (label, val, set) => { const c = el('input', { type: 'checkbox' }); c.checked = val; c.addEventListener('change', () => { set(c.checked); }); return el('label', { class: 'check' }, c, label); };
    const keySel = el('select', { 'aria-label': 'Key location number' }, ...Array.from({ length: Math.max(1, d.locs.length) }, (_, i) => { const placed = m.points.some(p => p.t === 'k' && p.k === i); return el('option', { value: i, text: `Key location ${i + 1}${placed ? ' (placed)' : ''}` }); }));
    keySel.value = String(Math.min(keyNo, Math.max(0, d.locs.length - 1))); keySel.addEventListener('change', () => { keyNo = Number(keySel.value); });
    const lvl = el('select', { 'aria-label': 'Blight level to paint' }, ...[0, 1, 2, 3, 4, 5, 6].map(v => el('option', { value: v, text: v ? `Blight level ${v}` : 'Clear Blight' }))); lvl.value = String(level); lvl.addEventListener('change', () => { level = Number(lvl.value); });
    parts.push(el('section', { class: 'card' }, el('h2', { text: 'Paint' }), el('div', { class: 'tools' }, TOOLS.map(([k, l]) => btn(k, l, tool === k, () => { tool = k; renderMapSide(); }))),
      el('div', { class: 'row', style: 'margin-top:8px' }, el('span', { class: 'hint', text: 'Brush' }), seg([[1, '1'], [2, '2'], [3, '3'], [5, '5']], brush, v => { brush = v; }), chk('Mirror', mirror, v => { mirror = v; })),
      tool === 'blight' ? el('div', { style: 'margin-top:8px' }, lvl) : null,
      el('h3', { text: 'Points' }), el('div', { class: 'tools' }, POINT_TOOLS.map(([k, l]) => btn(k, l, tool === k, () => { tool = k; renderMapSide(); }))),
      tool === 'k' ? el('div', { style: 'margin-top:8px' }, keySel, el('p', { class: 'hint', text: d.locs[keyNo] ? `${locText(data, d.locs[keyNo])} · ${d.locs[keyNo].shards.v} shards` : 'Roll key locations on the Ruin tab to number them.' })) : null,
      el('div', { class: 'row actions' }, el('button', { class: 'mini', text: `Undo${undo.length ? ` (${undo.length})` : ''}`, disabled: !undo.length, onclick: () => { const s = undo.pop(); if (s) { d.map = s; refresh(); } } }),
        el('button', { class: 'mini', text: 'Blight: read all', onclick: () => { snapshot(); for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.cells[y][x] !== '.') setRead(m, x, y, true); refresh(); } }),
        el('button', { class: 'mini', text: 'Read none', onclick: () => { snapshot(); m.read = m.read.map(r => '.'.repeat(m.w)); refresh(); } }))));
    const wIn = el('input', { type: 'number', min: MAP_LIMITS.wMin, max: MAP_LIMITS.wMax, 'aria-label': 'Grid width' }); wIn.value = m.w;
    const hIn = el('input', { type: 'number', min: MAP_LIMITS.hMin, max: MAP_LIMITS.hMax, 'aria-label': 'Grid rows' }); hIn.value = m.h;
    parts.push(el('section', { class: 'card' }, el('h2', { text: 'Grid' }),
      el('div', { class: 'row' }, el('label', { class: 'field' }, el('span', { text: 'Columns' }), wIn), el('label', { class: 'field' }, el('span', { text: 'Rows' }), hIn)),
      el('div', { class: 'row actions' }, el('button', { class: 'mini', text: 'Resize', onclick: () => { snapshot(); d.map = resizeMap(m, Number(wIn.value), Number(hIn.value)); refresh(); renderMap(); } }),
        el('button', { class: 'mini', text: regen ? 'Click again to replace' : 'Generate from ruin', onclick: () => { if (!d.items.depth || !d.items.blight) return status('Roll the ruin first.'); if (!regen) { regen = true; return drawSide(side); } placeMap(); } }),
        el('button', { class: 'mini', text: 'Clear', onclick: () => { snapshot(); d.map = emptyMap(m.w, m.h); selPoint = null; refresh(); } })),
      el('p', { class: 'hint', text: 'Generating lays a structure out from the ruin’s depth, entrances, key locations, cores, oases and Blight band, then you paint over it.' })));
  }
  parts.push(el('section', { class: 'card' }, el('h2', { text: 'Export' }), el('div', { class: 'row actions' }, el('button', { class: 'mini', text: 'Save image (PNG)', onclick: exportPng }))));
  const p = selPoint && pointById(m, selPoint);
  if (p) parts.push(pointPanel(p, refresh)); else parts.push(el('section', { class: 'card' }, el('p', { class: 'hint', text: 'Use Select (or click a point in the deep-scan view) to see its details and its distance to the nearest known exit.' })));
  side.replaceChildren(...parts);
}
function exportPng() { if (!mapCanvas) return; mapCanvas.toBlob(b => { if (!b) return; const url = URL.createObjectURL(b), a = el('a', { href: url, download: `ctgd-delve-${view}.png` }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }); }
function pointPanel(p, refresh) {
  const d = cur(), m = d.map, names = { e: 'Entrance', k: `Key location ${p.k + 1}`, c: 'Blight core', o: 'Blight oasis', n: 'Note' };
  const near = nearestExit(m, p.x, p.y), any = nearestExit(m, p.x, p.y, { knownOnly: false });
  const nameIn = el('input', { type: 'text', 'aria-label': 'Point name' }); nameIn.value = p.n; nameIn.addEventListener('change', () => { p.n = nameIn.value.slice(0, 80); refresh(); });
  const kd = p.t === 'k' && d.locs[p.k] ? describeIndexed(data, 'loc.shape', d.locs[p.k].shape) : null;
  const known = (() => { const c = el('input', { type: 'checkbox' }); c.checked = p.u; c.addEventListener('change', () => { p.u = c.checked; refresh(); }); return el('label', { class: 'check' }, c, 'Known exit'); })();
  return el('section', { class: 'card' }, el('h2', { text: names[p.t] }),
    el('p', { class: 'data', 'aria-live': 'polite', text: `${cellName(p.x, p.y)} · ${p.y} markers deep. ${near ? `Nearest known exit: ${near.dist} marker${near.dist === 1 ? '' : 's'} by open passage.` : any ? `No known exit by open passage; the nearest entrance is ${any.dist} markers away.` : 'No entrance reaches it by passage.'}` }),
    kd ? el('p', { class: 'hint', text: `${kd.name || kd.chip}${kd.detail ? ' · ' + kd.detail : ''}${d.locs[p.k] ? ' · ' + d.locs[p.k].shards.v + ' shards' : ''}` }) : null,
    el('label', { class: 'field' }, el('span', { text: 'Name (optional)' }), nameIn), p.t === 'e' ? known : null,
    el('div', { class: 'row actions' }, el('button', { class: 'mini', text: 'Remove point', onclick: () => { snapshot(); removePoint(m, p.id); selPoint = null; refresh(); } }), el('button', { class: 'mini', text: 'Deselect', onclick: () => { selPoint = null; drawCanvas(); drawSide($('#mapside')); } })));
}

/* ---------- the Data tab ---------- */
function renderData() {
  const box = $('#view-data');
  const cov = coverage(data);
  const stateText = { complete: 'complete', partial: 'partial', missing: 'not in file', empty: 'no names', none: 'no file' };
  const held = data ? HELD_KEYS.filter(k => data.held && data.held[k] != null) : [];
  box.replaceChildren(el('div', { class: 'datagrid' },
    el('section', { class: 'card' }, el('h2', { text: 'Data file' }),
      el('p', { class: 'small', id: 'data-status', text: data ? `${data.name} · ${cov.filter(c => c.state === 'complete').length} of ${cov.length} tables complete.` : 'No data file loaded. The ruin and the map work without one; results show table ids and rolled numbers.' }),
      el('div', { class: 'row actions' }, el('button', { class: 'btn primary', id: 'import-data', text: 'Import data file', onclick: importData }), el('button', { class: 'btn quiet', id: 'remove-data', text: 'Remove', disabled: !data, onclick: removeData }), el('button', { class: 'btn quiet', text: 'Download template', onclick: template })),
      el('p', { class: 'note', text: 'Your data file is a JSON file in format ctgd-delve-data/1 that holds the wording for each table. It is stored in this browser’s localStorage, only on this device, and is never uploaded. The page decides every dice roll and range; the file only names the results, by row position.' }),
      dataMsg ? el('p', { class: 'status', role: 'status', text: dataMsg }) : null,
      data && data.ignored.length ? el('p', { class: 'note', text: `Ignored tables this page does not use: ${data.ignored.join(', ')}.` }) : null,
      held.length ? el('p', { class: 'note', text: `Also kept for the Descent and Camp tabs (not built yet): ${held.join(', ')}.` }) : null),
    el('section', { class: 'card' }, el('h2', { text: 'Backup' }),
      el('p', { class: 'small', text: `${delves.length} delve${delves.length === 1 ? '' : 's'} in this browser.` }),
      el('div', { class: 'row actions' }, el('button', { class: 'btn', id: 'backup-all', text: 'Back up all delves', onclick: () => download('ctgd-delves.json', backup(delves)) }), el('button', { class: 'btn quiet', id: 'restore', text: 'Restore a backup', onclick: restore })),
      el('p', { class: 'note', text: 'A backup holds your delves and their maps, not your data file. Restoring adds the delves to the ones you have and gives them new ids.' }))),
    el('section', { class: 'card', style: 'margin-top:14px' }, el('h2', { text: 'Tables' }),
      el('p', { class: 'small', text: 'Every table the Ruin and Map tabs use, and how much of it your file covers. Tables the file leaves out simply show ids and numbers.' }),
      el('div', { class: 'table-scroll' }, el('table', { class: 'cov' }, el('thead', {}, el('tr', {}, ...['Table', 'Rows needed', 'Rows in file', 'Named', 'State'].map(t => el('th', { scope: 'col', text: t })))),
        el('tbody', {}, cov.map(c => el('tr', {}, el('td', { text: c.id }), el('td', { text: String(c.need) }), el('td', { text: data ? String(c.have) : '–' }), el('td', { text: data ? String(c.named) : '–' }), el('td', { class: 'state ' + c.state, text: stateText[c.state] }))))))));
}
function readFile(cb) {
  const input = $('#file'); input.value = '';
  input.onchange = async () => { const f = input.files[0]; if (!f) return; if (f.size > 8 * 1024 * 1024) return setMsg('Choose a JSON file smaller than 8 MB.'); try { cb(JSON.parse(await f.text())); } catch (e) { setMsg(e.message || 'Could not read that JSON file.'); } };
  input.click();
}
function setMsg(m) { dataMsg = m; status(m); if (tab === 'data') renderData(); }
function importData() {
  readFile(x => {
    const next = validateData(x);
    try { localStorage.setItem(DATAKEY, JSON.stringify(next)); } catch { throw Error('Could not save the data file. Browser storage is unavailable or full.'); }
    data = next; dataMsg = 'Data file imported in this browser. Nothing was uploaded.'; renderAll();
  });
}
function removeData() { try { localStorage.removeItem(DATAKEY); } catch { /* storage blocked */ } data = null; dataMsg = 'Data file removed from this browser.'; renderAll(); }
function template() { download('ctgd-delve-data-template.json', { format: FORMAT, name: 'My tables', tables: Object.fromEntries(TABLE_IDS.map(id => [id, { rows: TABLES[id].ranges.map(() => (id === 'ruin.purpose' ? { v: { early: 'Sample early', middle: 'Sample middle', late: 'Sample late' } } : id === 'loc.shape' ? { n: 'Sample shape', f: 'Sample function' } : { n: 'Sample result', d: '' })) }])) }); }

/* ---------- files ---------- */
function download(name, x) { const url = URL.createObjectURL(new Blob([JSON.stringify(x, null, 2)], { type: 'application/json' })), a = el('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
const backup = list => ({ format: BACKUP_FORMAT, saved: new Date().toISOString(), delves: list });
function restore() {
  readFile(x => {
    const imported = validateBackup(x);
    if (delves.length + imported.length > 200) throw Error('Maximum 200 delves.');
    delves.push(...imported); active = imported[0].id; persist(); renderAll(); setMsg(`Restored ${imported.length} delve${imported.length === 1 ? '' : 's'}. Existing delves kept.`);
  });
}

/* ---------- the campaign ---------- */
const CAMPAIGN = window.CtgdCampaign || null;
function siteEntity(d) {
  const T = (k, it) => (it ? textOf(data, k, it, d) : '');
  const fate2 = chainsFate(d) ? ` → ${T('purpose2', d.items.purpose2)} / ${T('fate2', d.items.fate2)}` : '';
  const type = combinesType(d) ? `${T('typeA', d.items.typeA)} + ${T('typeB', d.items.typeB)}` : T('type', d.items.type);
  const out = {
    sheet: 'delve', delveId: d.id, name: title(d), era: T('era', d.items.era), purpose: T('purpose', d.items.purpose), fate: T('fate', d.items.fate) + fate2,
    siteType: type, depthBand: T('depth', d.items.depth), markers: d.nums.markers ? d.nums.markers.v : '', entrances: d.nums.entrances ? d.nums.entrances.v : '',
    glyph: T('glyph', d.items.glyph), quirks: d.quirks.map(q => describeIndexed(data, 'theme.quirk', q)).map(x => x.name || x.chip).join('; '),
    infestation: T('blight', d.items.blight), cores: d.nums.cores ? d.nums.cores.v : '', oases: d.nums.oases ? d.nums.oases.v : '',
    threat: T('threat', d.items.threat), otherParty: d.includeParty ? T('party', d.items.party) : '', delveClass: classShown(d) ? `${classShown(d)}${d.classOverride ? '' : ' (estimate)'}` : '',
    notes: d.notes.slice(0, 2000),
    locations: d.locs.slice(0, 100).map(l => { const x = describeIndexed(data, 'loc.shape', l.shape); return { name: l.name, shape: x.name || x.chip, func: x.detail, shards: l.shards.v }; })
  };
  if (d.map) {
    out.mapW = d.map.w; out.mapH = d.map.h; out.mapCells = d.map.cells; out.mapBlight = d.map.blight;
    out.mapPoints = d.map.points.slice(0, 200).map(p => ({ id: p.id, t: p.t, x: p.x, y: p.y, k: p.k == null ? -1 : p.k, n: p.n, u: p.u ? 1 : 0 }));
  }
  return { id: d.cid, name: title(d), source: 'delve', data: out, refs: { delveId: d.id } };
}
function updateCampaign() {
  const box = $('#campaign'); if (!CAMPAIGN) { box.hidden = true; return; }
  const d = cur(), linked = !!d.cid;
  $('#campaign-send').textContent = linked ? 'Update the campaign' : 'Send to the campaign';
  $('#campaign-unlink').disabled = !linked;
  const total = CAMPAIGN.count(CAMPAIGN.read());
  $('#campaign-status').textContent = linked ? `Linked as a site · ${total} in the campaign.` : `Not sent yet · ${total} in the campaign.`;
}
$('#campaign-send').onclick = () => {
  const d = cur();
  if (!CAMPAIGN) return status('The campaign store did not load. Reload the page and try again.');
  if (!d.items.era && !d.map) return status('Roll a ruin first. There is nothing to send yet.');
  if (!d.cid) d.cid = CAMPAIGN.makeId('site');
  const e = CAMPAIGN.upsert('site', siteEntity(d));
  if (!e) { delete d.cid; return status('The campaign could not save this delve (it may be too large).'); }
  touch(); updateCampaign(); status(`Sent “${title(d)}” to the campaign as a site.`);
};
$('#campaign-unlink').onclick = () => { const d = cur(); delete d.cid; d.cid = ''; touch(); updateCampaign(); status('Unlinked here. The campaign keeps its own copy.'); };

/* ---------- shell ---------- */
function renderAll() { updateLibrary(); showTab(tab, true); }
function showTab(t, quiet) {
  tab = t;
  TABS.forEach(x => { $('#view-' + x).hidden = x !== t; $('#tab-' + x).setAttribute('aria-selected', String(x === t)); });
  if (t === 'ruin') renderRuin(); if (t === 'map') renderMap(); if (t === 'data') renderData();
  if (!quiet) persist();
}
TABS.forEach(t => { $('#tab-' + t).addEventListener('click', () => showTab(t)); });
$('#tabs').addEventListener('keydown', e => { const i = TABS.indexOf(tab); if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]; showTab(n); $('#tab-' + n).focus(); } });
$('#new').onclick = () => { const d = newDelve(); delves.push(d); active = d.id; selPoint = null; undo = []; persist(); renderAll(); };
$('#duplicate').onclick = () => { const d = cleanDelve(JSON.parse(JSON.stringify(cur()))); d.id = crypto.randomUUID(); d.cid = ''; d.name = title(cur()) + ' (copy)'; delves.push(d); active = d.id; selPoint = null; undo = []; persist(); renderAll(); };
$('#library').onchange = e => { active = e.target.value; selPoint = null; undo = []; persist(); renderAll(); };
$('#delve-name').oninput = e => { cur().name = e.target.value; touch(); const o = $('#library').selectedOptions[0]; if (o) o.textContent = title(cur()); };
$('#export').onclick = () => download('ctgd-delve.json', backup([cur()]));
$('#delete').onclick = () => $('#confirm').showModal();
$('#confirm').addEventListener('close', () => {
  if ($('#confirm').returnValue !== 'delete') return;
  delves = delves.filter(d => d.id !== active); if (!delves.length) delves = [newDelve()];
  active = delves[0].id; selPoint = null; undo = []; persist(); renderAll();
});
const hashTab = location.hash.slice(1); if (TABS.includes(hashTab)) tab = hashTab;
renderAll();
if (startupError) status(startupError); else persist();

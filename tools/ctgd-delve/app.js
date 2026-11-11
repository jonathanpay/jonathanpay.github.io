import {
  TABLES, TABLE_IDS, DEPTH_BANDS, FIND_BANDS, BLIGHT_BANDS, CLASS_NAMES, LIMITS, BACKUP_FORMAT, FORMAT,
  newDelve, cleanDelve, validateData, validateBackup, coverage, generate, rerollKey, pickKey, rerollNum, setNumValue, rerollLoc, rerollShards, rollQuirks, rerollQuirk, rollItem,
  chainsFate, combinesType, describe, describeIndexed, textOf, eraColumn, rowFor, classEstimate, classShown, levelRange, HELD_KEYS,
  generateMap, addZone, addEdge, removeZone, zoneById, edgeLength, nearestExit, scanReach, emptyMap, pickItem, tableOf
} from './model.js';

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
let selected = null, view = 'gm', armed = '', dataMsg = '';
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

/* ---------- the Map tab ---------- */
const SC = 22, TOP = 44, W = 1000;
const zoneName = z => z.n || (z.e ? 'Entrance' : z.k != null ? `Key location ${z.k + 1}` : `Zone ${z.id}`);
function renderMap() {
  const d = cur(), box = $('#view-map');
  if (!d.map) {
    const ready = d.items.depth && d.items.blight && d.nums.markers;
    box.replaceChildren(el('div', { class: 'stage' }, el('h3', { text: 'Map' }), el('p', { text: ready ? 'The ruin is rolled but has no map yet.' : 'Roll a ruin first (depth band and Blight infestation), then place its map here.' }),
      el('div', { class: 'bar' }, el('button', { class: 'btn primary', text: 'Place the map from the ruin', disabled: !ready, onclick: () => placeMap() }), el('button', { class: 'btn quiet', text: 'Start with an empty map', onclick: () => { d.map = emptyMap(); touch(); renderMap(); } }))));
    return;
  }
  const map = d.map;
  if (selected && !zoneById(map, selected)) selected = null;
  const holder = el('div', { class: 'mapbox', id: 'mapbox' });
  const side = el('div', { class: 'mapside', id: 'mapside' });
  box.replaceChildren(el('div', { class: 'mapview' }, holder, side));
  drawSvg(holder); drawSide(side);
}
function placeMap() {
  const d = cur(), r = levelRange(d);
  d.map = generateMap({ markers: d.nums.markers.v, entrances: d.nums.entrances.v, keys: d.nums.keys.v, cores: d.nums.cores ? d.nums.cores.v : 0, oases: d.nums.oases ? d.nums.oases.v : 0, levelLo: r[0], levelHi: r[1] });
  selected = null; armed = ''; touch(); renderMap(); status('Map placed from the ruin. Drag, add, remove and edit zones freely.');
}
function visible(map) { return view === 'gm' ? null : scanReach(map); }
function drawSvg(holder) {
  const d = cur(), map = d.map, vis = visible(map), scan = view === 'scan';
  const maxD = Math.max(10, ...map.zones.map(z => z.d)), H = TOP + (maxD + 2) * SC + 24;
  const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': scan ? 'Deep-scan view of the delve map' : 'GM view of the delve map' });
  for (let m = 0; m <= maxD + 1; m += 5) { svg.append(sv('line', { x1: 0, x2: W, y1: TOP + m * SC, y2: TOP + m * SC, class: m === 0 ? 'm-surf' : 'm-grid' }), sv('text', { x: 6, y: TOP + m * SC - 3, class: 'm-label' }, m === 0 ? 'Surface' : `${m}`)); }
  const show = z => !vis || vis.has(z.id);
  const pos = z => [z.x, TOP + z.d * SC];
  for (const e of map.edges) {
    const a = zoneById(map, e.a), b = zoneById(map, e.b); if (!a || !b || !show(a) || !show(b)) continue;
    if (scan && e.t !== 'open') continue;
    const [x1, y1] = pos(a), [x2, y2] = pos(b);
    svg.append(sv('line', { x1, y1, x2, y2, class: 'm-edge ' + e.t }));
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    if (e.t === 'blocked') svg.append(sv('line', { x1: mx - 6, y1: my - 6, x2: mx + 6, y2: my + 6, class: 'm-x' }), sv('line', { x1: mx - 6, y1: my + 6, x2: mx + 6, y2: my - 6, class: 'm-x' }));
    if (!scan && selected && (e.a === selected || e.b === selected)) svg.append(sv('text', { x: mx + 8, y: my - 4, class: 'm-label' }, `${edgeLength(map, e)}`));
  }
  for (const z of map.zones) {
    if (!show(z)) continue;
    const [x, y] = pos(z), read = !scan || z.s, g = sv('g', { 'data-zone': z.id, tabindex: 0, role: 'button', 'aria-label': `${zoneName(z)}, depth ${z.d}` });
    g.append(sv('title', {}, `${zoneName(z)} · ${z.d} markers`));
    if (z.o && read) g.append(sv('circle', { cx: x, cy: y, r: 17, class: 'm-ring' }));
    const cls = 'm-zone' + (z.id === selected ? ' sel' : '') + (z.k != null ? ' m-key' : '') + (z.c && read ? ' m-core' : '') + (z.h ? ' m-hidden-zone' : '');
    g.append(z.e ? sv('rect', { x: x - 11, y: y - 11, width: 22, height: 22, class: cls }) : sv('circle', { cx: x, cy: y, r: 11, class: cls }));
    const showB = z.b != null && read;
    const inside = z.e ? 'E' : z.k != null ? String(z.k + 1) : showB ? String(z.b) : '';
    if (inside) g.append(sv('text', { x, y: y + 4, class: 'm-txt' + (z.c && read && z.k == null ? ' inv' : '') }, inside));
    if (z.k != null && showB) g.append(sv('text', { x, y: y + 25, class: 'm-note' }, `B${z.b}${z.c ? ' core' : ''}`));
    else if (z.c && read && z.k == null) g.append(sv('text', { x, y: y + 25, class: 'm-note' }, 'core'));
    if (z.n) g.append(sv('text', { x, y: y - 16, class: 'm-note' }, z.n));
    svg.append(g);
  }
  holder.replaceChildren(svg);
  wireDrag(svg);
}
function wireDrag(svg) {
  const d = cur(), map = d.map;
  let drag = null;
  const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; };
  svg.addEventListener('pointerdown', e => {
    const g = e.target.closest('[data-zone]'); if (!g) return;
    const id = g.getAttribute('data-zone');
    if (armed === 'link' && selected && selected !== id) { if (addEdge(map, selected, id)) { armed = ''; touch(); renderMap(); status('Path added.'); } else status('Those zones are already joined.'); return; }
    selected = id; drag = { id, moved: false };
    try { svg.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    drawSide($('#mapside')); drawSvg($('#mapbox'));
  });
  svg.addEventListener('pointermove', e => {
    if (!drag || view === 'scan') return;
    const z = zoneById(map, drag.id); if (!z) return;
    const p = toSvg(e), nx = Math.max(20, Math.min(W - 20, Math.round(p.x))), nd = Math.max(0, Math.round((p.y - TOP) / SC));
    if (nx !== z.x || nd !== z.d) { z.x = nx; z.d = nd; drag.moved = true; const holder = $('#mapbox'), top = holder.scrollTop; drawSvg(holder); holder.scrollTop = top; }
  });
  const end = () => { if (drag && drag.moved) { touch(); drawSide($('#mapside')); } drag = null; };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { const g = e.target.closest('[data-zone]'); if (g) { selected = g.getAttribute('data-zone'); drawSide($('#mapside')); drawSvg($('#mapbox')); } } });
}
function drawSide(side) {
  const d = cur(), map = d.map;
  const redraw = () => { touch(); drawSvg($('#mapbox')); drawSide(side); };
  const toggle = el('div', { class: 'seg', role: 'group', 'aria-label': 'Map view' },
    el('button', { 'aria-pressed': String(view === 'gm'), text: 'GM view', onclick: () => { view = 'gm'; renderMap(); } }),
    el('button', { 'aria-pressed': String(view === 'scan'), text: 'Deep scan', onclick: () => { view = 'scan'; armed = ''; renderMap(); } }));
  const tools = el('section', { class: 'card' }, el('h2', { text: 'Map' }), toggle,
    el('p', { class: 'hint', text: view === 'gm' ? 'Everything, as the GM sees it. Drag a zone to move it; depth snaps to whole markers.' : 'What a deep scan would show the players: only zones reachable by open paths from an entrance, and Blight levels, cores and oases only where you have marked them read.' }),
    el('div', { class: 'row actions' },
      el('button', { class: 'mini', text: armed === 'place' ? 'Click again to replace' : 'Place from ruin', onclick: () => { if (!d.items.depth || !d.items.blight) return status('Roll the ruin first.'); if (armed !== 'place') { armed = 'place'; return drawSide(side); } placeMap(); } }),
      el('button', { class: 'mini', text: 'Add zone', onclick: () => { const z = addZone(map, { d: Math.max(1, ...[selected ? zoneById(map, selected).d : 1]), x: 500 }); if (!z) return status('Zone limit reached.'); selected = z.id; redraw(); } }),
      el('button', { class: 'mini', text: 'Blight: read all', onclick: () => { map.zones.forEach(z => { z.s = true; }); redraw(); } }),
      el('button', { class: 'mini', text: 'Read none', onclick: () => { map.zones.forEach(z => { z.s = false; }); redraw(); } })),
    el('div', { class: 'legend' }, el('span', { text: 'Square: entrance' }), el('span', { text: 'Numbered: key location' }), el('span', { text: 'Filled: Blight core' }), el('span', { text: 'Ringed: oasis' }), el('span', { text: 'Dotted line: hidden path' }), el('span', { text: 'Crossed dashes: blocked path' })));
  const z = selected && zoneById(map, selected);
  side.replaceChildren(tools, z ? zonePanel(z, redraw) : el('section', { class: 'card' }, el('p', { class: 'hint', text: 'Select a zone to edit it, link it, and see how far it is from the nearest known exit.' })));
}
function zonePanel(z, redraw) {
  const d = cur(), map = d.map;
  const f = (label, input) => el('label', { class: 'field' }, el('span', { text: label }), input);
  const numIn = (v, set, o = {}) => { const i = el('input', { type: 'number', ...o }); i.value = v == null ? '' : v; i.addEventListener('change', () => { set(i.value); redraw(); }); return i; };
  const chk = (label, key, extra) => { const c = el('input', { type: 'checkbox' }); c.checked = !!z[key]; c.addEventListener('change', () => { z[key] = c.checked; if (extra) extra(c.checked); redraw(); }); return el('label', { class: 'check' }, c, label); };
  const nameIn = el('input', { type: 'text', 'aria-label': 'Zone name' }); nameIn.value = z.n; nameIn.addEventListener('change', () => { z.n = nameIn.value.slice(0, 80); redraw(); });
  const keySel = el('select', { 'aria-label': 'Key location number' }, el('option', { value: '', text: 'Not a key location' }), ...d.locs.map((_, i) => el('option', { value: i, text: `Key location ${i + 1}` })));
  keySel.value = z.k == null ? '' : z.k; keySel.addEventListener('change', () => { z.k = keySel.value === '' ? null : Number(keySel.value); redraw(); });
  const near = nearestExit(map, z.id), nearAll = nearestExit(map, z.id, { knownOnly: false });
  const other = map.zones.filter(o => o.id !== z.id && !map.edges.some(e => (e.a === z.id && e.b === o.id) || (e.b === z.id && e.a === o.id)));
  const linkSel = el('select', { 'aria-label': 'Join to zone' }, el('option', { value: '', text: 'Join to…' }), ...other.map(o => el('option', { value: o.id, text: `${zoneName(o)} · ${o.d}` })));
  const edges = map.edges.filter(e => e.a === z.id || e.b === z.id);
  const kd = z.k != null && d.locs[z.k] ? describeIndexed(data, 'loc.shape', d.locs[z.k].shape) : null;
  return el('section', { class: 'card' }, el('h2', { text: zoneName(z) }),
    el('p', { class: 'data', 'aria-live': 'polite', text: near ? `Nearest known exit: ${near.dist} marker${near.dist === 1 ? '' : 's'} (${zoneName(zoneById(map, near.exit))}).` : nearAll ? `No known exit by open paths; the nearest of any entrance is ${nearAll.dist} markers away. Mark an entrance as a known exit.` : 'No entrance can be reached by open paths.' }),
    f('Name (optional)', nameIn),
    el('div', { class: 'row' }, f('Depth (markers)', numIn(z.d, v => { z.d = Math.max(0, Math.min(200, Math.trunc(Number(v) || 0))); }, { min: 0 })), f('Blight level', numIn(z.b, v => { z.b = v === '' || Number(v) < 1 ? null : Math.min(99, Math.trunc(Number(v))); }, { min: 1 }))),
    f('Key location', keySel), kd ? el('p', { class: 'hint', text: `${kd.name || kd.chip}${kd.detail ? ' · ' + kd.detail : ''}${d.locs[z.k] ? ' · ' + d.locs[z.k].shards.v + ' shards' : ''}` }) : null,
    el('div', { class: 'stack', style: 'margin-top:6px' }, chk('Entrance', 'e'), z.e ? chk('Known exit', 'u') : null, chk('Blight core', 'c'), chk('Blight oasis', 'o'), chk('Hidden (a deep scan would miss it)', 'h'), chk('Blight level read', 's')),
    el('h3', { text: 'Paths' }),
    ...edges.map(e => {
      const o = zoneById(map, e.a === z.id ? e.b : e.a);
      const st = el('select', { 'aria-label': `Path to ${zoneName(o)}` }, ...['open', 'hidden', 'blocked'].map(t => el('option', { value: t, text: t }))); st.value = e.t; st.addEventListener('change', () => { e.t = st.value; redraw(); });
      const len = el('input', { type: 'number', min: 1, placeholder: String(Math.max(1, Math.abs(zoneById(map, e.a).d - zoneById(map, e.b).d))), 'aria-label': `Length to ${zoneName(o)} in markers`, style: 'width:64px' }); len.value = e.len || ''; len.addEventListener('change', () => { if (len.value === '') delete e.len; else e.len = Math.max(1, Math.trunc(Number(len.value) || 1)); redraw(); });
      return el('div', { class: 'row', style: 'margin:4px 0' }, el('span', { class: 'small', style: 'flex:1 1 90px', text: zoneName(o) }), st, len, el('button', { class: 'mini', text: '×', 'aria-label': `Remove path to ${zoneName(o)}`, onclick: () => { map.edges.splice(map.edges.indexOf(e), 1); redraw(); } }));
    }),
    el('div', { class: 'row actions' }, linkSel, el('button', { class: 'mini', text: 'Add path', onclick: () => { if (!linkSel.value) return; if (addEdge(map, z.id, linkSel.value)) redraw(); } })),
    el('div', { class: 'row actions' }, el('button', { class: 'mini', text: 'Remove zone', onclick: () => { removeZone(map, z.id); selected = null; redraw(); } }), el('button', { class: 'mini', text: 'Deselect', onclick: () => { selected = null; drawSvg($('#mapbox')); drawSide($('#mapside')); } })));
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
    out.zones = d.map.zones.slice(0, 200).map(z => ({ id: z.id, d: z.d, x: z.x, b: z.b == null ? 0 : z.b, k: z.k == null ? -1 : z.k, f: (z.e ? 'e' : '') + (z.u ? 'u' : '') + (z.c ? 'c' : '') + (z.o ? 'o' : '') + (z.h ? 'h' : '') + (z.s ? 's' : ''), n: z.n }));
    out.edges = d.map.edges.slice(0, 200).map(e => [e.a, e.b, e.t[0], e.len || 0]);
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
$('#new').onclick = () => { const d = newDelve(); delves.push(d); active = d.id; selected = null; persist(); renderAll(); };
$('#duplicate').onclick = () => { const d = cleanDelve(JSON.parse(JSON.stringify(cur()))); d.id = crypto.randomUUID(); d.cid = ''; d.name = title(cur()) + ' (copy)'; delves.push(d); active = d.id; selected = null; persist(); renderAll(); };
$('#library').onchange = e => { active = e.target.value; selected = null; persist(); renderAll(); };
$('#delve-name').oninput = e => { cur().name = e.target.value; touch(); const o = $('#library').selectedOptions[0]; if (o) o.textContent = title(cur()); };
$('#export').onclick = () => download('ctgd-delve.json', backup([cur()]));
$('#delete').onclick = () => $('#confirm').showModal();
$('#confirm').addEventListener('close', () => {
  if ($('#confirm').returnValue !== 'delete') return;
  delves = delves.filter(d => d.id !== active); if (!delves.length) delves = [newDelve()];
  active = delves[0].id; selected = null; persist(); renderAll();
});
const hashTab = location.hash.slice(1); if (TABS.includes(hashTab)) tab = hashTab;
renderAll();
if (startupError) status(startupError); else persist();

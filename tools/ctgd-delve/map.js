/* map.js — the delve map as a grid, painted cell by cell, with points placed on top.
 * No DOM, no network, no book text.
 *
 * Side view. One cell is one marker: row 0 is the surface and each row down is one marker deeper.
 * The structure is four layers of equal-sized text rows, one character per cell:
 *   cells   '.' rock   'o' open passage   'h' hidden passage   'x' blocked passage
 *   blight  '.' none   '1'–'9' Blight level
 *   read    '.' not read   'r' Blight read (by the Bird or a scanner)
 * Points sit on cells: entrance (e), key location (k, numbered like the ruin's list), Blight core (c),
 * Blight oasis (o) and a free note (n). Distances are counted in cells along open passages.
 */
export const MAP_LIMITS = { wMin: 16, wMax: 60, hMin: 8, hMax: 120, points: 300 };
export const DEFAULT_W = 40;
export const CELL = { ROCK: '.', OPEN: 'o', HIDDEN: 'h', BLOCKED: 'x' };
export const POINT_TYPES = ['e', 'k', 'c', 'o', 'n'];

const rint = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- the grid ---------- */
export function emptyMap(w = DEFAULT_W, h = 28) {
  w = clamp(Math.trunc(w) || DEFAULT_W, MAP_LIMITS.wMin, MAP_LIMITS.wMax); h = clamp(Math.trunc(h) || 28, MAP_LIMITS.hMin, MAP_LIMITS.hMax);
  const rows = () => Array.from({ length: h }, () => '.'.repeat(w));
  return { v: 2, w, h, cells: rows(), blight: rows(), read: rows(), points: [], next: 1 };
}
export const inBounds = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h;
export const cellAt = (m, x, y) => (inBounds(m, x, y) ? m.cells[y][x] : '.');
export const blightAt = (m, x, y) => (inBounds(m, x, y) && m.blight[y][x] !== '.' ? Number(m.blight[y][x]) : 0);
export const isRead = (m, x, y) => inBounds(m, x, y) && m.read[y][x] === 'r';
const put = (rows, x, y, ch) => { rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1); };
export function setCell(m, x, y, ch) { if (inBounds(m, x, y)) { put(m.cells, x, y, ch); if (ch === '.') { put(m.blight, x, y, '.'); put(m.read, x, y, '.'); } } }
export function setBlight(m, x, y, level) { if (inBounds(m, x, y) && m.cells[y][x] !== '.') put(m.blight, x, y, level >= 1 ? String(Math.min(9, Math.trunc(level))) : '.'); }
export function setRead(m, x, y, on) { if (inBounds(m, x, y)) put(m.read, x, y, on ? 'r' : '.'); }
export const isPassage = ch => ch === 'o' || ch === 'h' || ch === 'x';
export const countOpen = m => m.cells.reduce((n, r) => n + [...r].filter(c => c !== '.').length, 0);

/* Brushes. tool: open | hidden | blocked | erase | blight | read | unread. size is the side of a square brush. */
export function paint(m, x, y, { tool = 'open', size = 1, mirror = false, level = 1 } = {}) {
  const spots = [[x, y]]; if (mirror) spots.push([m.w - 1 - x, y]);
  const r0 = -Math.floor((size - 1) / 2), r1 = r0 + size - 1;
  for (const [cx, cy] of spots) for (let dy = r0; dy <= r1; dy++) for (let dx = r0; dx <= r1; dx++) {
    const px = cx + dx, py = cy + dy; if (!inBounds(m, px, py)) continue;
    if (tool === 'open') setCell(m, px, py, 'o');
    else if (tool === 'hidden') setCell(m, px, py, 'h');
    else if (tool === 'blocked') setCell(m, px, py, 'x');
    else if (tool === 'erase') { setCell(m, px, py, '.'); removePointAt(m, px, py); }
    else if (tool === 'blight') setBlight(m, px, py, level);
    else if (tool === 'read') setRead(m, px, py, true);
    else if (tool === 'unread') setRead(m, px, py, false);
  }
}
/* A stroke from one cell to the next, so a quick drag leaves no gaps. */
export function line(m, x0, y0, x1, y1, brush) {
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
  for (let n = 0; n < 500; n++) {
    paint(m, x0, y0, brush);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err, oy = y0; let moved = 0; if (e2 >= dy) { err += dy; x0 += sx; moved++; } if (e2 <= dx) { err += dx; y0 += sy; moved++; }
    if (moved === 2) paint(m, x0, oy, brush); /* keep the stroke joined on the diagonal */
  }
}
export function floodFill(m, x, y, ch) {
  if (!inBounds(m, x, y)) return 0;
  const from = m.cells[y][x]; if (from === ch) return 0;
  const stack = [[x, y]]; let n = 0;
  while (stack.length && n < 4000) { const [cx, cy] = stack.pop(); if (!inBounds(m, cx, cy) || m.cells[cy][cx] !== from) continue; setCell(m, cx, cy, ch); n++; stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]); }
  return n;
}
export function resizeMap(m, w, h) {
  const n = emptyMap(w, h);
  for (let y = 0; y < Math.min(m.h, n.h); y++) for (let x = 0; x < Math.min(m.w, n.w); x++) { if (m.cells[y][x] !== '.') put(n.cells, x, y, m.cells[y][x]); if (m.blight[y][x] !== '.') put(n.blight, x, y, m.blight[y][x]); if (m.read[y][x] !== '.') put(n.read, x, y, 'r'); }
  n.points = m.points.filter(p => p.x < n.w && p.y < n.h).map(p => ({ ...p })); n.next = m.next;
  return n;
}
export const cloneMap = m => ({ ...m, cells: [...m.cells], blight: [...m.blight], read: [...m.read], points: m.points.map(p => ({ ...p })) });

/* ---------- points ---------- */
export const pointAt = (m, x, y) => m.points.find(p => p.x === x && p.y === y) || null;
export const pointById = (m, id) => m.points.find(p => p.id === id) || null;
export function removePointAt(m, x, y) { const n = m.points.length; m.points = m.points.filter(p => !(p.x === x && p.y === y)); return m.points.length !== n; }
export function removePoint(m, id) { m.points = m.points.filter(p => p.id !== id); }
/* Place a point. It opens its cell if that is rock. One key location per number: placing it again moves it. */
export function addPoint(m, o) {
  if (!POINT_TYPES.includes(o.t) || !inBounds(m, o.x, o.y)) return null;
  if (o.t === 'k') { const old = m.points.find(p => p.t === 'k' && p.k === o.k); if (old) { old.x = o.x; old.y = o.y; if (m.cells[o.y][o.x] === '.') setCell(m, o.x, o.y, 'o'); return old; } }
  else { const here = pointAt(m, o.x, o.y); if (here && here.t === o.t) return here; }
  if (m.points.length >= MAP_LIMITS.points) return null;
  if (m.cells[o.y][o.x] === '.') setCell(m, o.x, o.y, 'o');
  const p = { id: 'p' + m.next++, t: o.t, x: o.x, y: o.y, k: o.t === 'k' ? Math.max(0, Math.trunc(o.k) || 0) : null, n: String(o.n || '').slice(0, 80), u: o.t === 'e' ? o.u !== false && !m.points.some(q => q.t === 'e') : false };
  m.points.push(p); return p;
}
export function movePoint(m, id, x, y) {
  const p = pointById(m, id); if (!p || !inBounds(m, x, y)) return false;
  p.x = x; p.y = y; if (m.cells[y][x] === '.') setCell(m, x, y, 'o'); return true;
}

/* ---------- distances and reach (cells along open passages) ---------- */
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export function distanceField(m, starts, usable = ch => ch === 'o') {
  const d = new Int32Array(m.w * m.h).fill(-1), q = [];
  for (const [x, y] of starts) if (inBounds(m, x, y) && usable(m.cells[y][x])) { d[y * m.w + x] = 0; q.push([x, y]); }
  for (let i = 0; i < q.length; i++) { const [x, y] = q[i], dd = d[y * m.w + x]; for (const [ax, ay] of NB) { const nx = x + ax, ny = y + ay; if (inBounds(m, nx, ny) && d[ny * m.w + nx] < 0 && usable(m.cells[ny][nx])) { d[ny * m.w + nx] = dd + 1; q.push([nx, ny]); } } }
  return d;
}
/* Distance, in markers, from a cell to the nearest known exit (an entrance marked known). Used by the hazard roll. */
export function nearestExit(m, x, y, { knownOnly = true, usable } = {}) {
  const d = distanceField(m, [[x, y]], usable);
  let best = null;
  for (const p of m.points) if (p.t === 'e' && (!knownOnly || p.u)) { const v = d[p.y * m.w + p.x]; if (v >= 0 && (!best || v < best.dist)) best = { exit: p.id, dist: v }; }
  return best;
}
/* Cells a deep scan could reach: open passages joined to an entrance (hidden and blocked ones are not seen). */
export function scanReach(m) { return distanceField(m, m.points.filter(p => p.t === 'e').map(p => [p.x, p.y])); }
export const reached = (m, field, x, y) => inBounds(m, x, y) && field[y * m.w + x] >= 0;

/* ---------- cleaning ---------- */
function cleanRows(rows, w, h, allowed) {
  const out = []; const src = Array.isArray(rows) ? rows : [];
  for (let y = 0; y < h; y++) { const r = typeof src[y] === 'string' ? src[y] : ''; let s = ''; for (let x = 0; x < w; x++) s += allowed.includes(r[x]) ? r[x] : '.'; out.push(s); }
  return out;
}
export function cleanMap(x) {
  if (!x || typeof x !== 'object' || x.v !== 2) return null;
  const w = Math.trunc(Number(x.w)), h = Math.trunc(Number(x.h));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w < MAP_LIMITS.wMin || w > MAP_LIMITS.wMax || h < MAP_LIMITS.hMin || h > MAP_LIMITS.hMax) return null;
  const m = { v: 2, w, h, cells: cleanRows(x.cells, w, h, 'ohx'), blight: cleanRows(x.blight, w, h, '123456789'), read: cleanRows(x.read, w, h, 'r'), points: [], next: 1 };
  for (let y = 0; y < h; y++) for (let c = 0; c < w; c++) if (m.cells[y][c] === '.') { if (m.blight[y][c] !== '.') put(m.blight, c, y, '.'); if (m.read[y][c] !== '.') put(m.read, c, y, '.'); }
  const ids = new Set();
  for (const p of Array.isArray(x.points) ? x.points.slice(0, MAP_LIMITS.points) : []) {
    if (!p || typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{1,20}$/.test(p.id) || ids.has(p.id) || !POINT_TYPES.includes(p.t)) continue;
    const px = Math.trunc(Number(p.x)), py = Math.trunc(Number(p.y)); if (!inBounds(m, px, py)) continue;
    ids.add(p.id);
    m.points.push({ id: p.id, t: p.t, x: px, y: py, k: p.t === 'k' ? clamp(Math.trunc(Number(p.k)) || 0, 0, 99) : null, n: typeof p.n === 'string' ? p.n.slice(0, 80) : '', u: p.t === 'e' && !!p.u });
  }
  m.next = Math.max(1, Math.trunc(Number(x.next)) || 1, ...m.points.map(p => Number(p.id.slice(1)) + 1 || 1));
  return m;
}

/* ---------- placing the generated features ----------
 * Carves a structure for the ruin and places its points, following the final-touches guidance:
 * entrances at different distances from the first key locations, key locations 4–8 markers apart
 * by passage, most with a second route, no obvious end point at the bottom, some passages hidden
 * or blocked. The first route to every key location is always open. */
export function generateMap(spec, rng = Math.random) {
  const M = Math.max(4, Math.min(MAP_LIMITS.hMax - 5, spec.markers | 0)), E = clamp(spec.entrances | 0, 1, 12), K = clamp(spec.keys | 0, 1, 60);
  const lo = spec.levelLo | 0, hi = spec.levelHi | 0, w = clamp(spec.w || DEFAULT_W, MAP_LIMITS.wMin, MAP_LIMITS.wMax), h = M + 4;
  const m = emptyMap(w, h), spine = new Set();
  const key = (x, y) => y * w + x;
  const open = (x, y, mark) => { if (x < 1 || x > w - 2 || y < 0 || y > h - 2) return; if (m.cells[y][x] === '.') setCell(m, x, y, 'o'); if (mark) spine.add(key(x, y)); };
  /* An L-shaped passage; returns its cells. */
  function carve(x0, y0, x1, y1, vFirst, mark) {
    const cells = []; let x = x0, y = y0; open(x, y, mark); cells.push([x, y]);
    if (vFirst) { while (y !== y1) { y += Math.sign(y1 - y); open(x, y, mark); cells.push([x, y]); } while (x !== x1) { x += Math.sign(x1 - x); open(x, y, mark); cells.push([x, y]); } }
    else { while (x !== x1) { x += Math.sign(x1 - x); open(x, y, mark); cells.push([x, y]); } while (y !== y1) { y += Math.sign(y1 - y); open(x, y, mark); cells.push([x, y]); } }
    return cells;
  }
  const chamber = (cx, cy, mark) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) open(cx + dx, cy + dy, mark); };
  const flag = (cells, ch, n) => { const free = cells.filter(([x, y]) => !spine.has(key(x, y))); if (free.length < n + 2) return; const at = Math.floor((free.length - n) / 2); for (let i = 0; i < n; i++) { const [x, y] = free[at + i]; setCell(m, x, y, ch); } };

  const ex = Array.from({ length: E }, (_, j) => clamp(Math.round(3 + (w - 7) * (E === 1 ? 0.5 : j / (E - 1))), 2, w - 3));
  ex.forEach((x, j) => { open(x, 0, j === 0); open(x, 1, j === 0); addPoint(m, { t: 'e', x, y: 0, u: j === 0 }); });
  /* Key locations along a spine: each hop 4–8 markers of passage. */
  const top = Math.max(3, Math.round(M * 0.15)), bottom = Math.max(top + 1, M - 4);
  const depths = Array.from({ length: K }, (_, i) => clamp(Math.round(top + (bottom - top) * (i + rng() * 0.6) / K), 3, h - 5)).sort((a, b) => a - b);
  const keys = []; let px = ex[0], py = 1;
  for (let i = 0; i < K; i++) {
    while (depths[i] - py > 8) { const ny = py + 8, nx = clamp(px + rint(rng, -2, 2), 3, w - 4); carve(px, py, nx, ny, true, true); px = nx; py = ny; }
    const dy = Math.max(0, depths[i] - py), L = rint(rng, Math.max(4, dy), 8), dxw = Math.max(0, L - dy);
    let sign = rng() < 0.5 ? -1 : 1; if (px + sign * dxw < 3 || px + sign * dxw > w - 4) sign = -sign;
    const nx = clamp(px + sign * dxw, 3, w - 4), ny = py + dy;
    const cells = carve(px, py, nx, ny, rng() < 0.5, true);
    chamber(nx, ny, true);
    const kp = addPoint(m, { t: 'k', k: i, x: nx, y: ny });
    keys.push({ x: nx, y: ny, i, cells, p: kp }); px = nx; py = ny;
  }
  /* Other entrances meet the spine at different distances. */
  ex.forEach((x, j) => { if (j === 0) return; const tgt = keys[Math.min(j, K - 1)]; const cells = carve(x, 1, tgt.x, tgt.y, rng() < 0.5, false); if (rng() < 0.3) flag(cells, 'h', 2); });
  /* Second routes: a loop round the hop where there is a corner, otherwise back to the key before. */
  for (let i = 1; i < K; i++) {
    const a = keys[i], b = keys[i - 1], c = keys[Math.max(0, i - 2)];
    const corner = a.x !== b.x && a.y !== b.y, to = corner ? b : c;
    const cells = carve(a.x, a.y, to.x, to.y, !corner ? rng() < 0.5 : a.cells.length % 2 === 0, false);
    const r = rng(); if (r < 0.25) flag(cells, 'h', 2); else if (r < 0.45) flag(cells, 'x', 1);
  }
  /* No obvious end point: several dead ends reach the bottom, none of them a key location. */
  const ends = Math.min(3, Math.max(2, Math.ceil(K / 3)));
  for (let n = 0; n < ends; n++) { const from = keys[Math.max(0, K - 1 - n * 2)]; const tx = clamp(from.x + (n % 2 ? 6 : -6) + rint(rng, -2, 2), 2, w - 3); const cells = carve(from.x, from.y, tx, M, true, false); if (n === 1 && rng() < 0.5) flag(cells, 'h', 2); }
  /* Blight by depth within the band's range. */
  for (let y = 2; y < h; y++) for (let x = 0; x < w; x++) {
    if (m.cells[y][x] === '.' || hi < 1) continue;
    const v = Math.round(lo + (hi - lo) * (y / M) + (rng() - 0.5)); const lvl = clamp(v, lo, hi); if (lvl >= 1) setBlight(m, x, y, lvl);
  }
  const spots = (minY, avoid, r = 4) => { const out = []; for (let y = minY; y < h - 2; y++) for (let x = 2; x < w - 2; x++) if (m.cells[y][x] === 'o' && !pointAt(m, x, y) && !avoid.some(([ax, ay]) => Math.abs(ax - x) < r && Math.abs(ay - y) < r)) out.push([x, y]); return out; };
  const used = [], cores = [];
  for (let c = 0; c < Math.min(40, spec.cores | 0); c++) { const s = spots(Math.max(3, Math.round(M * 0.4)), used); if (!s.length) break; const [x, y] = s[Math.floor(rng() * s.length)]; used.push([x, y]); cores.push([x, y]); addPoint(m, { t: 'c', x, y }); if (hi >= 1) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) setBlight(m, x + dx, y + dy, hi); }
  for (let o = 0; o < Math.min(40, spec.oases | 0); o++) { let s = spots(3, used); if (!s.length) s = spots(3, cores, 2); if (!s.length) break; const [x, y] = s[Math.floor(rng() * s.length)]; used.push([x, y]); addPoint(m, { t: 'o', x, y }); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) setBlight(m, x + dx, y + dy, 0); }
  return m;
}

/* run.js — running a delve: the clock, supply, movement, hazards, scans, camps and finds.
 * No DOM, no network, no book text. Every number here is a page constant verified against the
 * rules (PRD section 8); any wording comes from the data file you import.
 *
 * Only supply and clock effects are applied automatically. Everything else a hazard or the Blight
 * does (despair, damage, conditions, item loss) is raised as a prompt with an "applied" tick.
 */
import { distanceField, inBounds, blightAt, pointAt, isRead, setRead, nearestExit, DEFAULT_W } from './map.js';

export const ROLES = [['delver', 'Delver'], ['scout', 'Scout'], ['burrower', 'Burrower'], ['guard', 'Guard'], ['archaeologist', 'Archaeologist']];
export const ROLE_IDS = ROLES.map(r => r[0]);
export const STRETCHES_PER_SHIFT = 24;
export const HAZARD_ROWS = 9;
export const EXIT_BAND_SIZE = 5;       // 1–5 / 6–10 / 11–15 / 16+ → 0 / +1 / +2 / +3
export const FAILED_ROLL_HAZARD_MOD = 1;
export const FAILED_ROLL_SUPPLY = 2;   // a failed delving roll still moves 1 marker, for 2 supply
export const NORMAL_CREW = 5;          // +1 supply per stretch for each member over this
export const INCIDENT_AT_OR_BELOW = 3; // an Explorer at this many or fewer, losing another point
export const INCIDENT_OK = 7;          // D6 + remaining supply of this or more: no incident
export const BIRD_RANGE = 4;
export const SHARDS_PER_ENCUMBRANCE = 4;
export const MAX_CREW = 8;
export const MAX_LOG = 500;

const D6 = rng => 1 + Math.floor(rng() * 6);
const D66 = rng => D6(rng) * 10 + D6(rng);
const int = (x, lo, hi, d) => { const n = Math.trunc(Number(x)); return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : d; };
const S = (x, n) => (typeof x === 'string' ? x.slice(0, n) : '');

/* ---------- the run record ---------- */
export const emptyRun = () => ({ crew: [], pos: null, stretches: 0, used: [], blind: false, scanLock: false, scanned: false, bird: null, camps: [], log: [], prompts: [], found: [], arts: [], next: 1 });
export function cleanRun(x) {
  const r = emptyRun(); if (!x || typeof x !== 'object') return r;
  r.crew = (Array.isArray(x.crew) ? x.crew.slice(0, MAX_CREW) : []).filter(c => c && typeof c === 'object').map((c, i) => ({ id: /^[a-z0-9-]{1,20}$/.test(c.id) ? c.id : 'c' + (i + 1), name: S(c.name, 80), role: ROLE_IDS.includes(c.role) ? c.role : 'delver', heart: int(c.heart, 0, 99, 0), supply: int(c.supply, 0, 99, 0), cid: S(c.cid, 60) }));
  if (new Set(r.crew.map(c => c.id)).size !== r.crew.length) r.crew.forEach((c, i) => { c.id = 'c' + (i + 1); });
  r.pos = x.pos && typeof x.pos === 'object' && Number.isFinite(Number(x.pos.x)) && Number.isFinite(Number(x.pos.y)) ? { x: int(x.pos.x, 0, 200, 0), y: int(x.pos.y, 0, 200, 0) } : null;
  r.stretches = int(x.stretches, 0, 100000, 0);
  r.used = (Array.isArray(x.used) ? x.used.slice(0, 120) : []).filter(k => typeof k === 'string' && /^[a-z]+:\d$/.test(k));
  r.blind = !!x.blind; r.scanLock = !!x.scanLock; r.scanned = !!x.scanned;
  r.bird = x.bird && typeof x.bird === 'object' ? { who: S(x.bird.who, 20), y: int(x.bird.y, 0, 200, 0) } : null;
  r.camps = (Array.isArray(x.camps) ? x.camps.slice(0, 20) : []).filter(c => c && typeof c === 'object').map(c => ({ x: int(c.x, 0, 200, 0), y: int(c.y, 0, 200, 0), store: int(c.store, 0, 999, 0), notes: S(c.notes, 400) }));
  r.log = (Array.isArray(x.log) ? x.log.slice(-MAX_LOG) : []).filter(l => l && typeof l === 'object').map(l => ({ s: int(l.s, 0, 100000, 0), k: S(l.k, 20) || 'note', t: S(l.t, 600) }));
  r.prompts = (Array.isArray(x.prompts) ? x.prompts.slice(-200) : []).filter(p => p && typeof p === 'object').map((p, i) => ({ id: /^[a-z0-9-]{1,20}$/.test(p.id) ? p.id : 'q' + (i + 1), t: S(p.t, 600), done: !!p.done }));
  r.found = (Array.isArray(x.found) ? x.found.slice(0, 100) : []).map(v => !!v);
  r.arts = (Array.isArray(x.arts) ? x.arts.slice(0, 100) : []).filter(a => a && typeof a === 'object').map((a, i) => {
    const rolls = {}; for (const k of ['description', 'form', 'power', 'oddity']) { const v = a.rolls && Number(a.rolls[k]); if (Number.isInteger(v) && v >= 11 && v <= 66) rolls[k] = v; }
    return { id: /^[a-z0-9-]{1,20}$/.test(a.id) ? a.id : 'a' + (i + 1), kind: a.kind === 'major' ? 'major' : 'lesser', rolls, mod: int(a.mod, -9, 9, 0), name: S(a.name, 120), holder: S(a.holder, 80), handed: !!a.handed, cid: S(a.cid, 60) };
  });
  r.next = Math.max(1, int(x.next, 1, 100000, 1), r.crew.length + 1, r.prompts.length + 1, r.arts.length + 1);
  return r;
}
export function addLog(run, kind, text) { run.log.push({ s: run.stretches, k: kind, t: String(text).slice(0, 600) }); if (run.log.length > MAX_LOG) run.log.shift(); }
export function addPrompt(run, text) { const p = { id: 'q' + run.next++, t: String(text).slice(0, 600), done: false }; run.prompts.push(p); if (run.prompts.length > 200) run.prompts.shift(); return p; }
export function addCrew(run, o = {}) { if (run.crew.length >= MAX_CREW) return null; const c = { id: 'c' + run.next++, name: S(o.name, 80), role: ROLE_IDS.includes(o.role) ? o.role : 'delver', heart: int(o.heart, 0, 99, 0), supply: int(o.supply, 0, 99, 0), cid: S(o.cid, 60) }; run.crew.push(c); return c; }

/* ---------- the clock ---------- */
export const shiftOf = run => Math.floor(run.stretches / STRETCHES_PER_SHIFT) + 1;
export const stretchOf = run => (run.stretches % STRETCHES_PER_SHIFT) + 1;
export const clockText = run => `Shift ${shiftOf(run)}, stretch ${stretchOf(run)} of ${STRETCHES_PER_SHIFT}`;

/* ---------- supply ---------- */
export const poolOf = run => run.crew.reduce((n, c) => n + c.supply, 0);
/* Basic supply for a number of stretches: one point per stretch for the whole crew, plus one per member over five. */
export const stretchSupply = (stretches, crewSize) => stretches * (1 + Math.max(0, crewSize - NORMAL_CREW));
/* What a move costs. A failed delving roll still moves one marker, for two supply. Blind movement adds one per marker. */
export function moveCost({ markers, failed = false, blind = false, crewSize = 4 }) {
  const stretches = failed ? 1 : markers;
  const base = failed ? FAILED_ROLL_SUPPLY : markers;
  return { stretches, supply: base + Math.max(0, crewSize - NORMAL_CREW) * stretches + (blind ? markers : 0) };
}
/* Take points of supply from the crew, one at a time, from whoever has the most (so the cost alternates).
 * An Explorer at three or fewer who loses another point rolls on the supply incident table; a point owed
 * with none left rolls the out-of-supply table. Returns the events for the log. */
export function spendSupply(run, points, rng = Math.random) {
  const events = [];
  for (let n = 0; n < points; n++) {
    const who = [...run.crew].sort((a, b) => b.supply - a.supply)[0];
    if (!who) { events.push({ kind: 'nocrew' }); break; }
    if (who.supply <= 0) { const roll = D6(rng); events.push({ kind: 'out', who: who.id, roll, idx: roll <= 3 ? 0 : roll <= 5 ? 1 : 2 }); continue; }
    const before = who.supply; who.supply--;
    if (before <= INCIDENT_AT_OR_BELOW) { const roll = D6(rng), total = roll + who.supply; events.push({ kind: 'incident', who: who.id, roll, total, idx: total >= INCIDENT_OK ? -1 : Math.min(4, Math.max(0, 6 - total)) }); }
  }
  return events;
}

/* ---------- hazards ---------- */
export const exitBand = dist => (dist == null ? 3 : Math.min(3, Math.floor(Math.max(0, dist - 1) / EXIT_BAND_SIZE)));
export function rollHazard(run, dist, failed, rng = Math.random, tried = 0) {
  const hasArch = run.crew.some(c => c.role === 'archaeologist');
  const pick = () => {
    let d = D6(rng); for (let i = 0; i < 50 && d === 5 && !hasArch; i++) d = D6(rng);
    const role = d === 6 ? 'all' : ROLE_IDS[d - 1];
    const total = D6(rng) + exitBand(dist) + (failed ? FAILED_ROLL_HAZARD_MOD : 0);
    return { role, total, row: Math.min(HAZARD_ROWS, total), band: exitBand(dist) };
  };
  let h = pick();
  for (let i = 0; i < 80 && run.used.includes(`${h.role}:${h.row}`); i++) h = pick();
  h.key = `${h.role}:${h.row}`; h.repeat = run.used.includes(h.key);
  if (!h.repeat) run.used.push(h.key);
  void tried; return h;
}
/* The structured effects of a hazard entry: supply (a number or "D6") and stretch (a number). Nothing else is applied. */
export function hazardEffects(entry, rng = Math.random) {
  const fx = entry && entry.fx && typeof entry.fx === 'object' ? entry.fx : {};
  const sup = fx.supply === 'D6' ? D6(rng) : Number.isFinite(Number(fx.supply)) ? Math.max(0, Math.trunc(Number(fx.supply))) : 0;
  const str = Number.isFinite(Number(fx.stretch)) ? Math.max(0, Math.trunc(Number(fx.stretch))) : 0;
  return { supply: sup, stretches: str };
}
export const hazardEntry = (data, role, row) => (data && data.held && data.held.hazards && Array.isArray(data.held.hazards[role]) ? data.held.hazards[role][row - 1] || null : null);

/* ---------- movement over the map ---------- */
export function pathBetween(map, from, to, usable = ch => ch === 'o') {
  if (!inBounds(map, from.x, from.y) || !inBounds(map, to.x, to.y)) return null;
  const idx = (x, y) => y * map.w + x, prev = new Map([[idx(from.x, from.y), null]]), q = [[from.x, from.y]];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i]; if (x === to.x && y === to.y) break;
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + ax, ny = y + ay; if (inBounds(map, nx, ny) && !prev.has(idx(nx, ny)) && usable(map.cells[ny][nx])) { prev.set(idx(nx, ny), [x, y]); q.push([nx, ny]); } }
  }
  if (!prev.has(idx(to.x, to.y))) return null;
  const out = []; for (let c = [to.x, to.y]; c; c = prev.get(idx(c[0], c[1]))) out.push({ x: c[0], y: c[1] });
  return out.reverse();
}
const coreAt = (map, x, y) => map.points.some(p => p.t === 'c' && Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1);
/* Plan a move toward a target cell. mode "delve" moves one marker per success (or one marker on a failure);
 * "return" retraces explored passage with no roll, as far as you say. */
export function planMove(map, run, target, { mode = 'delve', successes = 1, markers = 1, blind = false } = {}) {
  if (!run.pos) return { error: 'Place the crew on the map first.' };
  const full = pathBetween(map, run.pos, target); if (!full) return { error: 'There is no open passage from the crew to that cell.' };
  const failed = mode === 'delve' && successes < 1;
  const want = mode === 'delve' ? Math.max(1, successes) : Math.max(1, markers);
  const steps = Math.min(want, full.length - 1); if (steps < 1) return { error: 'The crew is already there.' };
  const path = full.slice(0, steps + 1), dest = path.at(-1);
  const passed = path.slice(1);
  const maxBlight = Math.max(0, ...passed.map(c => blightAt(map, c.x, c.y)));
  const cost = moveCost({ markers: steps, failed, blind, crewSize: run.crew.length || 4 });
  return { path, dest, steps, failed, mode, cost, maxBlight, coreCells: passed.filter(c => coreAt(map, c.x, c.y)).length, key: (pointAt(map, dest.x, dest.y) || {}).t === 'k' ? pointAt(map, dest.x, dest.y) : null, deeper: dest.y > run.pos.y };
}
export function exitDistance(map, cell) { const n = nearestExit(map, cell.x, cell.y); return n ? n.dist : null; }

/* ---------- scans ---------- */
/* A Bird scan reads Blight levels within four markers of the crew along passage. */
export function readAround(map, pos, range = BIRD_RANGE) {
  const f = distanceField(map, [[pos.x, pos.y]], ch => ch === 'o' || ch === 'h'); let n = 0;
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) { const d = f[y * map.w + x]; if (d >= 0 && d <= range && !isRead(map, x, y)) { setRead(map, x, y, true); n++; } }
  return n;
}
export function readHere(map, pos) { if (!pos || isRead(map, pos.x, pos.y)) return false; setRead(map, pos.x, pos.y, true); return true; }

/* ---------- camps ---------- */
export const canCamp = (map, pos) => !!pos && inBounds(map, pos.x, pos.y) && map.cells[pos.y][pos.x] === 'o' && blightAt(map, pos.x, pos.y) === 0;
export const campAt = (run, pos) => run.camps.find(c => pos && c.x === pos.x && c.y === pos.y) || null;

/* ---------- finds ---------- */
export const encumbrance = shards => Math.ceil(Math.max(0, shards) / SHARDS_PER_ENCUMBRANCE);
/* Four independent D66 columns of eighteen ranges of two each. */
export const ART_RANGES = (() => { const v = []; for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) v.push(a * 10 + b); return Array.from({ length: 18 }, (_, i) => [v[i * 2], v[i * 2 + 1]]); })();
export const artIndex = r => ART_RANGES.findIndex(([lo, hi]) => r >= lo && r <= hi);
/* A major artefact has a power and an oddity; a lesser one keeps its oddity (with its description and form). */
export function rollArtefact(kind, rng = Math.random) {
  const rolls = { description: D66(rng), form: D66(rng), oddity: D66(rng) }; if (kind === 'major') rolls.power = D66(rng);
  return rolls;
}
export function addArtefact(run, kind, rng = Math.random) { if (run.arts.length >= 100) return null; const a = { id: 'a' + run.next++, kind: kind === 'major' ? 'major' : 'lesser', rolls: rollArtefact(kind, rng), mod: 0, name: '', holder: '', handed: false, cid: '' }; run.arts.push(a); return a; }
export function artLabel(data, col, r) { const rows = data && data.held && data.held.artifacts && data.held.artifacts.rows; const row = Array.isArray(rows) ? rows[artIndex(r)] : null; return row && typeof row[col] === 'string' ? row[col] : ''; }

/* ---------- Explorer sheets (the shared campaign) ----------
 * An Explorer sheet stores supply as supplyMax (a count) and supplyMarks (a 0/1 string, 1 = used), and Heart taken
 * as heartTaken. Heart's maximum is Insight + Perception. */
const num = v => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
export function fromSheet(data) {
  const max = Math.max(0, Math.min(60, Math.trunc(num(data.supplyMax) ?? 12))), marks = String(data.supplyMarks || '');
  let used = 0; for (let i = 0; i < max; i++) if (marks[i] === '1') used++;
  const a = num(data.insight), b = num(data.perception), hm = a == null || b == null ? null : a + b, taken = num(data.heartTaken) ?? 0;
  return { name: S(data.name, 80), supply: max - used, supplyMax: max, heart: hm == null ? null : Math.max(0, hm - taken), heartMax: hm };
}
export function toSheetPatch(member, data) {
  const max = Math.max(0, Math.min(60, Math.trunc(num(data.supplyMax) ?? 12))), used = Math.max(0, Math.min(max, max - member.supply));
  const patch = { supplyMarks: '1'.repeat(used) + '0'.repeat(max - used) };
  const a = num(data.insight), b = num(data.perception); if (a != null && b != null) patch.heartTaken = Math.max(0, a + b - member.heart);
  return patch;
}
export { DEFAULT_W };

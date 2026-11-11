/* model.js — the Atlas's map, with no DOM and no storage of its own.
 *
 * A map is a set of systems at positions on a canvas, the portal links between them and a few region labels.
 * Each system carries what the Horizon map shows (its stars, the kind of space, core, major spaceport, unstable
 * portals) and, once you build it out, its bodies in AD. Everything here is plain data, so the page, the tests
 * and the campaign hand-off all work on the same shape.
 */

export const FORMAT = "ctth-atlas-map/1";
export const W = 1200, H = 720;
export const LIMITS = { systems: 120, links: 400, regions: 24, bodies: 60, text: 200, notes: 4000 };

export const STAR_CLASSES = ["white", "yellow", "red", "blue", "white dwarf", "brown dwarf", "red giant", "hypergiant", "white hypergiant", "black hole"];
export const SPACES = { "": "Not set", faction: "Faction space", civilized: "Civilized space", border: "Border space", observandum: "Observandum" };
export const BODY_KINDS = { planet: "Planet", moon: "Moon", giant: "Gas giant", belt: "Asteroid belt", station: "Station", field: "Comet or region" };
// The label the campaign and Coriolis Sheets carry for each kind of body, and back again.
const CAMPAIGN_KIND = { planet: "Planet", moon: "Moon", giant: "Gas giant", belt: "Asteroid belt", station: "Station", field: "Comet" };
const FROM_CAMPAIGN_KIND = { planet: "planet", moon: "moon", "gas giant": "giant", giant: "giant", gas: "giant", "asteroid belt": "belt", belt: "belt", station: "station", comet: "field", field: "field" };
// The detail a world carries, with the same field names Coriolis Sheets uses.
export const WORLD_FIELDS = ["size", "atmosphere", "temperature", "geosphere", "orbit", "population", "spaceport", "factions", "other", "hooks"];

const clone = o => JSON.parse(JSON.stringify(o));
const now = () => new Date().toISOString();
const str = (v, n = LIMITS.text) => (typeof v === "string" ? v : v == null ? "" : String(v)).slice(0, n);
const num = (v, lo, hi, d) => { const n = typeof v === "number" ? v : parseFloat(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };
const SAFE_ID = { test: v => typeof v === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(v) && !["__proto__", "constructor", "prototype"].includes(v) };

export function blankMap(name = "Untitled map") {
  return { format: FORMAT, id: "map-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, note: "", regions: [], systems: [], links: [], cid: "", created: now(), updated: now(), savedAt: "" };
}

export const touch = map => { map.updated = now(); return map; };

/* ---------- ids ---------- */
function freshId(list, prefix) {
  let n = list.length + 1;
  while (list.some(x => x.id === prefix + n)) n++;
  return prefix + n;
}
const byId = (map, id) => map.systems.find(s => s.id === id) || null;
export { byId as system };

/* ---------- systems ---------- */
export function addSystem(map, { x, y, name } = {}) {
  if (map.systems.length >= LIMITS.systems) return null;
  const id = freshId(map.systems, "s");
  const sys = {
    id, name: str(name) || `System ${map.systems.length + 1}`,
    x: Math.round(num(x, 20, W - 20, W / 2)), y: Math.round(num(y, 20, H - 20, H / 2)),
    stars: ["yellow"], starNames: [], space: "", core: false, spaceport: false, unstable: false,
    portal: 0.5, portalStation: "", note: "", bodies: [], cid: ""
  };
  map.systems.push(sys); touch(map);
  return sys;
}
export function moveSystem(map, id, x, y) {
  const s = byId(map, id); if (!s) return false;
  s.x = Math.round(num(x, 20, W - 20, s.x)); s.y = Math.round(num(y, 20, H - 20, s.y)); touch(map); return true;
}
export function removeSystem(map, id) {
  const i = map.systems.findIndex(s => s.id === id); if (i < 0) return false;
  map.systems.splice(i, 1); map.links = map.links.filter(l => l.a !== id && l.b !== id); touch(map); return true;
}
export function setStars(sys, classes) {
  const list = classes.filter(c => STAR_CLASSES.includes(c)).slice(0, 3);
  sys.stars = list.length ? list : ["white"];
  sys.starNames = (sys.starNames || []).slice(0, sys.stars.length);
  sys.bodies.forEach(b => { if (b.star >= sys.stars.length) b.star = 0; });
}
export function starName(sys, i) {
  const given = (sys.starNames || [])[i];
  return given || (i ? `${sys.name} ${"ABC"[i]}` : sys.name);
}
// "Binary yellow/red", as the Horizon map words it
export function starText(sys) {
  const s = sys.stars.map(c => c[0].toUpperCase() + c.slice(1));
  const lead = sys.stars.length === 3 ? "Trinary " : sys.stars.length === 2 ? "Binary " : "";
  return lead + (sys.stars.length > 1 ? s.map(x => x.toLowerCase()).join("/") : s[0]);
}

/* ---------- links ---------- */
export const linkOf = (map, a, b) => map.links.find(l => (l.a === a && l.b === b) || (l.a === b && l.b === a)) || null;
export function addLink(map, a, b) {
  if (a === b) return { ok: false, why: "A system can't link to itself." };
  if (!byId(map, a) || !byId(map, b)) return { ok: false, why: "That system isn't on the map." };
  if (linkOf(map, a, b)) return { ok: false, why: "Those two are already linked." };
  if (map.links.length >= LIMITS.links) return { ok: false, why: `A map holds up to ${LIMITS.links} links.` };
  const link = { a, b, danger: false }; map.links.push(link); touch(map);
  return { ok: true, link };
}
export function removeLink(map, a, b) {
  const l = linkOf(map, a, b); if (!l) return false;
  map.links.splice(map.links.indexOf(l), 1); touch(map); return true;
}
export const neighbours = (map, id) => map.links.filter(l => l.a === id || l.b === id).map(l => (l.a === id ? l.b : l.a));

/* ---------- regions ---------- */
export function addRegion(map, { x, y, name } = {}) {
  if (map.regions.length >= LIMITS.regions) return null;
  const r = { id: freshId(map.regions, "r"), name: str(name) || "New region", x: Math.round(num(x, 20, W - 20, W / 2)), y: Math.round(num(y, 20, H - 20, 40)) };
  map.regions.push(r); touch(map); return r;
}
export function removeRegion(map, id) {
  const i = map.regions.findIndex(r => r.id === id); if (i < 0) return false;
  map.regions.splice(i, 1); touch(map); return true;
}

/* ---------- bodies ---------- */
export function addBody(sys, kind = "planet") {
  if (sys.bodies.length >= LIMITS.bodies) return null;
  const body = { id: freshId(sys.bodies, "b"), name: "", kind: BODY_KINDS[kind] ? kind : "planet", ad: null, star: 0 };
  WORLD_FIELDS.forEach(k => (body[k] = ""));
  sys.bodies.push(body); return body;
}
export function removeBody(sys, id) {
  const i = sys.bodies.findIndex(b => b.id === id); if (i < 0) return false;
  sys.bodies.splice(i, 1); return true;
}
// Bodies in the shape the system chart draws: [name, AD from its star, kind, star index]. Bodies with no distance can't be placed.
export function chartBodies(sys) {
  const rows = sys.bodies.filter(b => b.ad != null && Number.isFinite(b.ad) && b.ad >= 0).map(b => [b.name || BODY_KINDS[b.kind], b.ad, b.kind, b.star || 0]);
  if (sys.portalStation) rows.push([sys.portalStation, sys.portal, "station", 0]);
  return rows.sort((p, q) => p[1] - q[1]);
}
export const unplaced = sys => sys.bodies.filter(b => b.ad == null || !Number.isFinite(b.ad));

/* ---------- routes and checks ---------- */
export const linkRisk = (map, a, b) => (linkOf(map, a, b) && linkOf(map, a, b).danger ? 1 : 0) + ((byId(map, a) || {}).unstable || (byId(map, b) || {}).unstable ? 1 : 0);
// Fewest jumps, and of those the fewest unstable portals and dangerous links: the Mission tool's rule, on your map.
export function route(map, from, to) {
  if (!byId(map, from) || !byId(map, to)) return null;
  if (from === to) return [from];
  const cost = { [from]: 0 }, prev = {}, done = new Set();
  for (;;) {
    let u = null; for (const k in cost) if (!done.has(k) && (u === null || cost[k] < cost[u])) u = k;
    if (u === null) break; done.add(u);
    neighbours(map, u).forEach(v => { const c = cost[u] + 1 + 0.01 * linkRisk(map, u, v); if (cost[v] == null || c < cost[v]) { cost[v] = c; prev[v] = u; } });
  }
  if (cost[to] == null) return null;
  const path = [to]; while (path[0] !== from) path.unshift(prev[path[0]]);
  return path;
}
export function components(map) {
  const seen = new Set(), out = [];
  map.systems.forEach(s => {
    if (seen.has(s.id)) return;
    const group = [], q = [s.id]; seen.add(s.id);
    while (q.length) { const u = q.shift(); group.push(u); neighbours(map, u).forEach(v => { if (!seen.has(v)) { seen.add(v); q.push(v); } }); }
    out.push(group);
  });
  return out.sort((p, q) => q.length - p.length);
}
export function check(map) {
  const issues = [];
  if (!map.systems.length) return [{ level: "info", text: "The map is empty. Add a system to begin." }];
  const names = new Map(); map.systems.forEach(s => { const k = s.name.trim().toLowerCase(); names.set(k, [...(names.get(k) || []), s]); });
  [...names.values()].forEach(g => { if (g.length > 1) issues.push({ level: "warn", text: `${g.length} systems are called "${g[0].name}". The campaign tells systems apart by name.`, ids: g.map(s => s.id) }); });
  const parts = components(map);
  if (parts.length > 1) {
    const lone = parts.slice(1).flat();
    issues.push({ level: "warn", text: `${lone.length} ${lone.length === 1 ? "system has" : "systems have"} no portal route to the rest of the map: ${lone.slice(0, 6).map(id => byId(map, id).name).join(", ")}${lone.length > 6 ? "…" : ""}.`, ids: lone });
  }
  const empty = map.systems.filter(s => !s.bodies.length);
  if (empty.length) issues.push({ level: "info", text: `${empty.length} of ${map.systems.length} systems have no bodies yet.`, ids: empty.map(s => s.id) });
  return issues;
}

/* ---------- reading a map in from outside ---------- */
/* A map arrives from a file or a campaign, so every field is checked and clamped rather than trusted. */
export function normaliseMap(x) {
  if (!x || typeof x !== "object" || Array.isArray(x)) throw new Error("That file is not an Atlas map.");
  if (x.format !== FORMAT) throw new Error("That file is not an Atlas map (ctth-atlas-map/1).");
  const map = blankMap(str(x.name) || "Untitled map");
  if (typeof x.id === "string" && SAFE_ID.test(x.id)) map.id = x.id;
  map.note = str(x.note, LIMITS.notes); map.cid = typeof x.cid === "string" && SAFE_ID.test(x.cid) ? x.cid : "";
  map.created = typeof x.created === "string" ? x.created.slice(0, 40) : map.created; map.updated = typeof x.updated === "string" ? x.updated.slice(0, 40) : map.updated;
  map.savedAt = typeof x.savedAt === "string" ? x.savedAt.slice(0, 40) : "";
  const ids = new Set();
  (Array.isArray(x.systems) ? x.systems : []).slice(0, LIMITS.systems).forEach(s => {
    if (!s || typeof s !== "object" || typeof s.id !== "string" || !SAFE_ID.test(s.id) || ids.has(s.id)) return;
    ids.add(s.id);
    const sys = {
      id: s.id, name: str(s.name) || "Unnamed", x: Math.round(num(s.x, 20, W - 20, W / 2)), y: Math.round(num(s.y, 20, H - 20, H / 2)),
      stars: [], starNames: (Array.isArray(s.starNames) ? s.starNames : []).slice(0, 3).map(n => str(n)),
      space: Object.hasOwn(SPACES, s.space) ? s.space : "", core: s.core === true, spaceport: s.spaceport === true, unstable: s.unstable === true,
      portal: num(s.portal, 0, 1000, 0.5), portalStation: str(s.portalStation), note: str(s.note, LIMITS.notes), bodies: [], cid: typeof s.cid === "string" && SAFE_ID.test(s.cid) ? s.cid : ""
    };
    setStars(sys, Array.isArray(s.stars) ? s.stars : []);
    (Array.isArray(s.bodies) ? s.bodies : []).slice(0, LIMITS.bodies).forEach(b => {
      if (!b || typeof b !== "object") return;
      const body = addBody(sys, Object.hasOwn(BODY_KINDS, b.kind) ? b.kind : "planet");
      body.name = str(b.name); body.ad = b.ad == null || b.ad === "" ? null : num(b.ad, 0, 100000, null);
      body.star = Math.min(sys.stars.length - 1, Math.max(0, Math.floor(num(b.star, 0, 2, 0))));
      WORLD_FIELDS.forEach(k => (body[k] = str(b[k], LIMITS.notes)));
    });
    map.systems.push(sys);
  });
  const seen = new Set();
  (Array.isArray(x.links) ? x.links : []).slice(0, LIMITS.links).forEach(l => {
    if (!l || !ids.has(l.a) || !ids.has(l.b) || l.a === l.b) return;
    const key = [l.a, l.b].sort().join("|"); if (seen.has(key)) return; seen.add(key);
    map.links.push({ a: l.a, b: l.b, danger: l.danger === true });
  });
  const rids = new Set();
  (Array.isArray(x.regions) ? x.regions : []).slice(0, LIMITS.regions).forEach(r => {
    if (!r || typeof r.id !== "string" || !SAFE_ID.test(r.id) || rids.has(r.id)) return; rids.add(r.id);
    map.regions.push({ id: r.id, name: str(r.name) || "Region", x: Math.round(num(r.x, 20, W - 20, W / 2)), y: Math.round(num(r.y, 20, H - 20, 40)) });
  });
  return map;
}

/* ---------- the campaign ---------- */
/* A map becomes one "map" entity (its layout, its links, its flags) and one "system" entity per system (its stars,
   its notes and its bodies, in the shape Coriolis Sheets and the System tool read). The map entity points at the
   systems by id. The campaign store flattens anything deep, so the bodies live in the system entities. */
export function systemData(sys) {
  return {
    name: sys.name, star: starText(sys), notes: sys.note || "",
    bodies: sys.bodies.map(b => {
      const out = { name: b.name, kind: CAMPAIGN_KIND[b.kind] || "Planet", distance: b.ad == null ? "" : String(b.ad), star: b.star || 0 };
      WORLD_FIELDS.forEach(k => { if (b[k]) out[k] = b[k]; });
      return out;
    })
  };
}
export function mapData(map) {
  return {
    name: map.name, note: map.note,
    regions: map.regions.map(r => ({ id: r.id, name: r.name, x: r.x, y: r.y })),
    systems: map.systems.map(s => ({ id: s.id, cid: s.cid, name: s.name, x: s.x, y: s.y, stars: s.stars.slice(), starNames: s.starNames.slice(), space: s.space, core: s.core, spaceport: s.spaceport, unstable: s.unstable, portal: s.portal, portalStation: s.portalStation })),
    links: map.links.map(l => ({ a: l.a, b: l.b, danger: l.danger }))
  };
}

/* Write the map and its systems to the campaign. C is the CtthCampaign API. Returns what happened. */
export function pushToCampaign(C, map) {
  if (!map.systems.length) return { ok: false, why: "Add at least one system before saving the map." };
  const before = { cid: map.cid, sys: map.systems.map(s => s.cid) };
  const rollback = () => { map.cid = before.cid; map.systems.forEach((s, i) => (s.cid = before.sys[i])); };
  if (!map.cid) map.cid = C.makeId("map");
  map.systems.forEach(s => { if (!s.cid) s.cid = C.makeId("sys"); });
  let saved = 0;
  for (const s of map.systems) {
    const e = C.upsert("system", { id: s.cid, name: s.name, source: "ctth-atlas", data: systemData(s), refs: { map: map.cid } });
    if (!e) { rollback(); return { ok: false, why: `The campaign refused "${s.name}": its store may be full.` }; }
    saved++;
  }
  const me = C.upsert("map", { id: map.cid, name: map.name, source: "ctth-atlas", data: mapData(map) });
  if (!me) { rollback(); return { ok: false, why: "The campaign refused the map: its store may be full." }; }
  // Links tie the map to its systems. Drop any to systems no longer on the map and say how many are left behind.
  const live = new Set(map.systems.map(s => s.cid));
  let left = 0;
  C.linksOf("map", map.cid, "contains").forEach(l => { if (l.other.kind === "system" && !live.has(l.other.id)) { C.unlink({ kind: "map", id: map.cid }, l.other, "contains"); left++; } });
  map.systems.forEach(s => C.link({ kind: "map", id: map.cid }, { kind: "system", id: s.cid }, "contains"));
  map.savedAt = me.updated;
  return { ok: true, saved, left };
}

/* Build a map from a campaign "map" entity, reading each system's bodies from its campaign system. */
export function pullFromCampaign(C, id) {
  const e = C.get("map", id); if (!e) return null;
  const d = e.data || {};
  const map = normaliseMap({
    format: FORMAT, id: SAFE_ID.test(id) ? id : undefined, cid: id, name: d.name || e.name, note: d.note, created: e.created, updated: e.updated, savedAt: e.updated,
    regions: d.regions, links: d.links,
    systems: (Array.isArray(d.systems) ? d.systems : []).map(s => {
      const se = s && s.cid ? C.get("system", s.cid) : null, sd = (se && se.data) || {};
      return { ...s, name: (se && (sd.name || se.name)) || s.name, note: sd.notes || "", bodies: (Array.isArray(sd.bodies) ? sd.bodies : []).map(bodyFromCampaign).filter(Boolean) };
    })
  });
  return map;
}
function bodyFromCampaign(b) {
  if (!b || typeof b !== "object") return null;
  const d = b.distance === "" || b.distance == null ? null : parseFloat(b.distance);
  const out = { name: String(b.name || ""), kind: FROM_CAMPAIGN_KIND[String(b.kind || "").trim().toLowerCase()] || "planet", ad: Number.isFinite(d) ? d : null, star: Number(b.star) || 0 };
  WORLD_FIELDS.forEach(k => { if (b[k] != null) out[k] = String(b[k]); });
  return out;
}

export function exportMap(map) { return JSON.stringify({ ...clone(map), format: FORMAT }, null, 1); }

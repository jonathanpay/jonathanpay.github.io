/* chart.js — the Atlas's drawing: the portal map and the system chart, in the Third Horizon's holographic style.
 *
 * The same look the System and Mission tools draw (gold links, an orange glow round each star, red etching on
 * unstable portals, companion stars as small dots, dust behind), but fed from your map rather than the printed
 * one. Star classes come from /tools/ctth-horizon.js (STAR_LOOK), which the page loads first.
 *
 * Drawing only: no storage, and no state beyond what it is handed. The page attaches its own handlers.
 */
import { W, H, BODY_KINDS, starName, starText, SPACES } from "./model.js";

const NS = "http://www.w3.org/2000/svg";
const HZ = () => window.CtthHorizon || { STAR_LOOK: {}, SPACE_NAME: {} };
export const sv = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const k in attrs) { if (attrs[k] == null || attrs[k] === false) continue; if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); } kids.flat().forEach(c => c != null && c !== false && e.append(c)); return e; };

let glowN = 0;
// The glow behind each star and the dust of the background, as on the printed map.
function holoBase(svg, x0, y0, w, hgt, seed) {
  const id = "ag" + (++glowN), defs = sv("defs", {}, svg);
  const mk = (gid, stops) => { const g = sv("radialGradient", { id: gid }, defs); stops.forEach(([o, c, a]) => sv("stop", { offset: o, "stop-color": c, "stop-opacity": a }, g)); };
  mk(id + "s", [[0, "#ffb347", .85], [.25, "#ff8a2a", .38], [.6, "#d4561b", .12], [1, "#a03a10", 0]]);
  mk(id + "n", [[0, "#c8581f", .22], [1, "#6b2a0c", 0]]);
  let r = seed || 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < (w * hgt) / 1800; i++) sv("circle", { cx: x0 + rnd() * w, cy: y0 + rnd() * hgt, r: rnd() < .92 ? .7 : 1.4, class: "speck", opacity: (.15 + rnd() * .55).toFixed(2) }, svg);
  return { star: `url(#${id}s)`, neb: `url(#${id}n)` };
}

// Companion stars sit in the widest open angles round their system: away from its portal links and its name.
function companionSpots(map, sys) {
  const n = sys.stars.length - 1; if (n < 1) return [];
  const avoid = map.links.filter(l => l.a === sys.id || l.b === sys.id).map(l => { const o = map.systems.find(s => s.id === (l.a === sys.id ? l.b : l.a)); return Math.atan2(o.y - sys.y, o.x - sys.x); });
  avoid.push(Math.atan2(-13, 30));
  const gap = (a, b) => { const d = Math.abs(a - b) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); };
  let seed = [...sys.id].reduce((t, c) => t * 31 + c.charCodeAt(0), 7); const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const out = [], placed = [];
  for (let k = 0; k < n; k++) {
    let best = 0, bestScore = -1;
    for (let a = -Math.PI; a < Math.PI; a += Math.PI / 36) { const score = Math.min(...avoid.map(v => gap(a, v)), ...placed.map(v => gap(a, v) * .6)); if (score > bestScore) { bestScore = score; best = a; } }
    const r = 10 + rnd() * 5, a = best + (rnd() - .5) * .3;
    out.push([r * Math.cos(a), r * Math.sin(a)]); placed.push(a);
  }
  return out;
}

/* The portal map. opt: selected (system id), link (a|b key of the selected link), pending (system id a link is
   being drawn from), path (system ids to light), onSystem(id, event), onLink(a, b, event), onRegion(id, event). */
export function drawMap(map, opt = {}) {
  const svg = sv("svg", { viewBox: `0 0 ${W} ${H}`, class: "hmap", role: "group", "aria-label": `Map of ${map.name}` });
  const G = holoBase(svg, 0, 0, W, H, 11);
  sv("rect", { x: 0, y: 0, width: W, height: H, class: "canvas", "data-bg": "1" }, svg);
  if (opt.grid) for (let x = 100; x < W; x += 100) { sv("line", { x1: x, y1: 0, x2: x, y2: H, class: "grid" }, svg); }
  if (opt.grid) for (let y = 100; y < H; y += 100) { sv("line", { x1: 0, y1: y, x2: W, y2: y, class: "grid" }, svg); }
  map.systems.forEach(s => sv("circle", { cx: s.x, cy: s.y, r: s.core ? 34 : 24, fill: G.star, "pointer-events": "none" }, svg));
  map.regions.forEach(r => {
    const g = sv("g", { class: "reg" + (opt.onRegion ? " hit" : "") + (opt.region === r.id ? " sel" : ""), "data-region": r.id }, svg);
    const w = r.name.length * 7.4 + 14;
    sv("rect", { x: r.x - w / 2, y: r.y - 13, width: w, height: 19, class: "regionbox" }, g);
    const t = sv("text", { x: r.x, y: r.y + 1, class: "region", "text-anchor": "middle" }, g); t.textContent = r.name.toUpperCase();
  });
  const P = id => map.systems.find(s => s.id === id);
  map.links.forEach(l => { if (l.danger) { const A = P(l.a), B = P(l.b); sv("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: "danger", "pointer-events": "none" }, svg); } });
  const lines = sv("g", { class: "lines" }, svg);
  map.links.forEach(l => { const A = P(l.a), B = P(l.b); sv("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: "link" + (opt.link === l.a + "|" + l.b || opt.link === l.b + "|" + l.a ? " sel" : ""), "pointer-events": "none" }, lines); });
  const path = opt.path || [];
  for (let i = 1; i < path.length; i++) { const A = P(path[i - 1]), B = P(path[i]); if (A && B) sv("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: "route", "pointer-events": "none" }, svg); }
  // Wide, invisible strokes make a thin link easy to hit.
  if (opt.onLink) map.links.forEach(l => { const A = P(l.a), B = P(l.b); const hit = sv("line", { x1: A.x, y1: A.y, x2: B.x, y2: B.y, class: "linkhit", "data-a": l.a, "data-b": l.b }, svg); const t = sv("title", {}, hit); t.textContent = `${A.name} – ${B.name}${l.danger ? " (dangerous area)" : ""}`; });
  map.systems.forEach(s => {
    const g = sv("g", { class: "sys" + (opt.onSystem ? " hit" : "") + (path.includes(s.id) ? " on" : "") + (opt.selected === s.id ? " picked" : ""), tabindex: opt.onSystem ? "0" : "-1", "data-sys": s.id }, svg);
    if (opt.pending === s.id) sv("circle", { cx: s.x, cy: s.y, r: 15, class: "here" }, g);
    if (opt.selected === s.id) sv("circle", { cx: s.x, cy: s.y, r: 17, class: "pick" }, g);
    if (s.unstable) { sv("circle", { cx: s.x, cy: s.y, r: 20, class: "etch" }, g); sv("circle", { cx: s.x, cy: s.y, r: 20, class: "etch-line" }, g); }
    companionSpots(map, s).forEach(([dx, dy]) => sv("circle", { cx: (s.x + dx).toFixed(1), cy: (s.y + dy).toFixed(1), r: 2.4, class: "star" }, g));
    sv("circle", { cx: s.x, cy: s.y, r: s.core ? 6 : 4, class: "star" }, g);
    if (s.core) sv("circle", { cx: s.x, cy: s.y, r: 10, class: "halo" }, g);
    // A major spaceport: a small diamond under the star
    if (s.spaceport) sv("path", { d: `M${s.x} ${s.y + 14}l3.5 3.5l-3.5 3.5l-3.5 -3.5z`, class: "port" }, g);
    sv("circle", { cx: s.x, cy: s.y, r: 22, class: "grab" }, g);
    const t = sv("text", { x: s.x + 10, y: s.y - 9, class: "lbl" }, g); t.textContent = s.name;
    const tt = sv("title", {}, g); tt.textContent = s.name;
  });
  return svg;
}

export function mapKey() {
  return h("div", { class: "holokey" }, h("span", { text: "— portal link" }), h("span", { text: "◌ red etching: unstable portals" }), h("span", { text: "▬ dangerous area" }), h("span", { text: "· companion stars" }), h("span", { text: "◇ major spaceport" }), h("span", { text: "○ halo: core system" }));
}

let starGrad = 0;
function drawStar(svg, x, y, kind) {
  const look = HZ().STAR_LOOK[kind] || HZ().STAR_LOOK.white || ["#fff", "#ccd", "#dde", 9];
  const [core, glow, ring, r] = look, id = "asg" + (++starGrad);
  const d = sv("defs", {}, svg), g = sv("radialGradient", { id }, d);
  [[0, glow, .9], [.28, glow, .42], [.62, glow, .12], [1, glow, 0]].forEach(([o, c, a]) => sv("stop", { offset: o, "stop-color": c, "stop-opacity": a }, g));
  sv("circle", { cx: x, cy: y, r: r * 6.5, fill: `url(#${id})` }, svg);
  if (kind === "black hole") { sv("ellipse", { cx: x, cy: y, rx: r * 2.2, ry: r * .7, fill: "none", stroke: ring, "stroke-width": 2.2, opacity: .9 }, svg); sv("circle", { cx: x, cy: y, r, fill: core, stroke: ring, "stroke-width": 1 }, svg); }
  else sv("circle", { cx: x, cy: y, r, fill: core }, svg);
  const R1 = r + 6, R2 = r + 13;
  sv("circle", { cx: x, cy: y, r: R1, fill: "none", stroke: ring, "stroke-width": 1.4 }, svg);
  sv("circle", { cx: x, cy: y, r: R2, fill: "none", stroke: ring, "stroke-width": 1.4, "stroke-dasharray": "3 4" }, svg);
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; sv("line", { x1: x + (R1 + 2) * Math.cos(a), y1: y + (R1 + 2) * Math.sin(a), x2: x + (R1 + 5) * Math.cos(a), y2: y + (R1 + 5) * Math.sin(a), stroke: ring, "stroke-width": 1.4 }, svg); }
  const t = sv("title", {}, svg); t.textContent = kind[0].toUpperCase() + kind.slice(1);
}

function chartKey(sys, kinds) {
  const item = (label, draw) => { const s = sv("svg", { viewBox: "-12 -12 24 24", width: 22, height: 22, "aria-hidden": "true" }); draw(s); return h("span", { class: "keyitem" }, s, label); };
  const C = "var(--holo)", F = "#ffe3a3";
  const items = [
    item("Planet", s => sv("circle", { r: 4, fill: F }, s)),
    item("Gas giant", s => { sv("circle", { r: 5, fill: F }, s); sv("circle", { r: 9, fill: "none", stroke: C, "stroke-width": 1.2 }, s); }),
    item("Asteroid belt", s => { for (let q = -2; q <= 2; q++) sv("circle", { cx: Math.sin(q * 1.9) * 2, cy: q * 4, r: 1.4, fill: F }, s); }),
    item("Moon", s => { sv("line", { x1: -10, y1: 5, x2: 10, y2: 5, stroke: C, "stroke-width": .6, opacity: .6 }, s); sv("circle", { cy: -3, r: 2.4, fill: F }, s); }),
    item("Station", s => sv("rect", { x: -4.5, y: -4.5, width: 9, height: 9, fill: "none", stroke: C, "stroke-width": 1.3 }, s)),
    item("Comet or region", s => { sv("circle", { r: 8, fill: "none", stroke: C, "stroke-width": 1.1, "stroke-dasharray": "2 2.5" }, s); sv("circle", { r: 2, fill: F }, s); }),
    item(sys.unstable ? "Portal (unstable)" : "Portal", s => { sv("circle", { r: 5, fill: "none", stroke: sys.unstable ? "#e0553a" : C, "stroke-width": 1.3, "stroke-dasharray": sys.unstable ? "2 2" : null }, s); })
  ];
  const seen = [...new Set(kinds)];
  const stars = seen.map(k => item(k[0].toUpperCase() + k.slice(1), s => { const [core, glow, , r] = HZ().STAR_LOOK[k] || ["#fff", "#ccd", "", 9]; sv("circle", { r: 10, fill: glow, opacity: .35 }, s); sv("circle", { r: Math.min(7, r * .6), fill: core, stroke: k === "black hole" ? glow : "none", "stroke-width": 1.2 }, s); }));
  return h("div", { class: "holokey chartkey" }, h("span", { class: "keyhead", text: "Key" }), items, h("span", { class: "keyhead", text: seen.length > 1 ? "Stars" : "Star" }), stars);
}

/* A system chart in the Great Dark's manner: the star on the left, orbits as faint arcs, bodies strung along the
   line at their distance, spaced by square root. sys is a model system; map supplies its portal links.
   rows: [name, AD, kind, star index]. Returns null when there is nothing to place. */
export function systemChart(map, sys, rows) {
  const portals = map.links.filter(l => l.a === sys.id || l.b === sys.id).map(l => ({ name: map.systems.find(s => s.id === (l.a === sys.id ? l.b : l.a)).name, ad: sys.portal, danger: l.danger }));
  if (!rows.length) return null;
  const kinds = sys.stars;
  const W2 = 960, RH = 170, used = kinds.map((_, i) => i).filter(i => i === 0 || rows.some(b => (b[3] || 0) === i) || i < kinds.length);
  const svg = sv("svg", { viewBox: `0 0 ${W2} ${used.length * RH + 10}`, class: "syschart", role: "img", "aria-label": `System chart of ${sys.name}` });
  const G = holoBase(svg, 0, 0, W2, used.length * RH + 10, sys.name.length * 13);
  const max = Math.max(...rows.map(b => b[1]), 0.5); const X = au => 150 + Math.sqrt(au) / Math.sqrt(max) * (W2 - 220);
  used.forEach((si, ri) => {
    const cy = ri * RH + RH / 2 + 18, sx = 70;
    const here = rows.filter(b => (b[3] || 0) === si).sort((a, b) => a[1] - b[1]);
    const cid = `aclip${++glowN}`; const cp = sv("clipPath", { id: cid }, svg); sv("rect", { x: 0, y: cy - RH / 2 + 4, width: W2, height: RH - 8 }, cp);
    const og = sv("g", { "clip-path": `url(#${cid})` }, svg);
    here.forEach(b => { const rx = X(b[1]) - sx; sv("ellipse", { cx: sx, cy, rx, ry: rx * .3, class: "orbit" }, og); });
    sv("line", { x1: sx, y1: cy, x2: W2 - 20, y2: cy, class: "axis" }, svg);
    drawStar(svg, sx, cy, kinds[si]);
    const st = sv("text", { x: sx - 10, y: cy - RH / 2 + 2, class: "cap" }, svg); st.textContent = `${starName(sys, si).toUpperCase()} · ${kinds[si].toUpperCase()}`;
    if (si === 0 && portals.length) {
      sv("ellipse", { cx: sx, cy, rx: 44, ry: 13, class: "sym faint" }, svg);
      const ANG = [[180], [180, 0], [180, 0, 90], [180, -90, 0, 90]][Math.min(portals.length, 4) - 1];
      portals.forEach((pt, k) => {
        const deg = ANG[k] != null ? ANG[k] : 180 + k * 40, a = deg * Math.PI / 180;
        const px = sx + 44 * Math.cos(a), py = cy + 13 * Math.sin(a), below = deg === 90, ly = below ? cy + 40 : cy - (deg === -90 ? 46 : 34);
        sv("line", { x1: px, y1: py + (below ? 5 : -5), x2: px, y2: ly + (below ? -9 : 3), class: "sym", "stroke-width": .7, opacity: .8 }, svg);
        sv("circle", { cx: px, cy: py, r: 5, class: "sym" + (sys.unstable ? " unstable" : "") }, svg);
        const t = sv("text", { x: px, y: ly, class: "tiny", "text-anchor": "middle" }, svg); t.textContent = "⊙ " + pt.name.toUpperCase();
      });
    }
    let lastX = -99, lift = 0;
    here.forEach(b => {
      const x = X(b[1]), k = b[2], g = sv("g", {}, svg);
      if (k !== "belt") sv("circle", { cx: x, cy, r: k === "giant" ? 26 : 16, fill: G.star, opacity: .8 }, g);
      if (k === "giant") { sv("circle", { cx: x, cy, r: 8, class: "core" }, g); sv("circle", { cx: x, cy, r: 14, class: "sym" }, g); }
      else if (k === "belt") for (let q = -5; q <= 5; q++) sv("circle", { cx: x + Math.sin(q * 1.9) * 3, cy: cy + q * 4.2, r: 1.7, class: "core" }, g);
      else if (k === "station") sv("rect", { x: x - 5, y: cy - 5, width: 10, height: 10, class: "sym" }, g);
      else if (k === "field") { sv("circle", { cx: x, cy, r: 11, class: "sym dash" }, g); sv("circle", { cx: x, cy, r: 2.5, class: "core" }, g); }
      else if (k === "moon") sv("circle", { cx: x, cy: cy - 12, r: 3, class: "core" }, g);
      else sv("circle", { cx: x, cy, r: 5.5, class: "core" }, g);
      // Crowded bodies alternate their names above and below the line.
      lift = x - lastX < 40 ? lift + 1 : 0; lastX = x;
      const below = lift % 2 === 1, ty = below ? cy + 30 : cy - 22;
      const t = sv("text", { x: x + 2, y: ty, class: "name", transform: `rotate(${below ? 30 : -30} ${x + 2} ${ty})` }, g); t.textContent = String(b[0]).toUpperCase();
      const a = sv("text", { x, y: below ? cy - 14 : cy + 26, class: "au", "text-anchor": "middle" }, g); a.textContent = String(b[1]);
    });
  });
  const wrap = h("div", { class: "holo" }, h("div", { class: "holocap", text: `System chart · ${sys.name} · ${starText(sys)}${sys.space ? " · " + (HZ().SPACE_NAME[sys.space] || SPACES[sys.space]) : ""}${sys.spaceport ? " · major spaceport" : ""}` }), svg);
  wrap.append(chartKey(sys, used.map(i => kinds[i])));
  wrap.append(h("div", { class: "holokey" }, h("span", { text: "Distances in AD from each star, spaced by square root." }),
    sys.unstable ? h("span", { text: "Unstable portals: every jump into or out of this system uses one." }) : null,
    portals.some(p => p.danger) ? h("span", { text: "A dangerous area lies on the link to " + portals.filter(p => p.danger).map(p => p.name).join(", ") + "." }) : null));
  return wrap;
}
export { BODY_KINDS };

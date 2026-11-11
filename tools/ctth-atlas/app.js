/* app.js — the Atlas page: edits a map, builds out its systems, saves it all to the campaign.
 * The map's rules live in model.js, the drawing in chart.js. This file is the page: state, forms, handlers. */
import * as M from "./model.js";
import { drawMap, mapKey, systemChart } from "./chart.js";

const $ = s => document.querySelector(s);
const h = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const k in attrs) { if (attrs[k] == null || attrs[k] === false) continue; if (k === "text") e.textContent = attrs[k]; else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]); else if (k === "value") e.value = attrs[k]; else if (k === "checked") e.checked = !!attrs[k]; else e.setAttribute(k, attrs[k]); } kids.flat().forEach(c => c != null && c !== false && e.append(c)); return e; };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
};
const plural = (n, w, p) => `${n} ${n === 1 ? w : (p || w + "s")}`;
const say = (id, msg) => { const el = document.getElementById(id); if (el) el.textContent = msg; };

const HZ = window.CtthHorizon;
if (!HZ) { document.body.append(h("p", { class: "nodata", text: "The horizon file (/tools/ctth-horizon.js) didn't load, so the star colours can't be drawn. Reload the page; if it keeps failing, the file is missing from the server." })); throw new Error("horizon missing"); }
const campaign = () => { const C = window.CtthCampaign; return C && typeof C.upsert === "function" ? C : null; };

/* ---------- state ---------- */
const KEY = "ctth-atlas-v1", STATE_FORMAT = "ctth-atlas/1", MAX_MAPS = 30;
const S = (() => {
  const raw = store.get(KEY, null), maps = [];
  if (raw && raw.format === STATE_FORMAT && Array.isArray(raw.maps)) raw.maps.slice(0, MAX_MAPS).forEach(x => { try { maps.push(M.normaliseMap(x)); } catch { /* a map that no longer reads is skipped */ } });
  if (!maps.length) maps.push(M.blankMap());
  return { maps, cur: maps.find(m => m.id === (raw && raw.current)) || maps[0] };
})();
const UI = { tab: "map", tool: "select", sel: null, pending: null, path: null, confirm: null, pick: null, saveFailed: false };

let saveTimer = null;
function persistNow() { clearTimeout(saveTimer); saveTimer = null; UI.saveFailed = !store.set(KEY, { format: STATE_FORMAT, current: S.cur.id, maps: S.maps }); if (UI.saveFailed) say("map-status", "This browser wouldn't keep the map (private window or full storage). Export it from the Campaign tab so it isn't lost."); }
function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(persistNow, 300); }
window.addEventListener("pagehide", () => { if (saveTimer) persistNow(); });
function edited() { M.touch(S.cur); queueSave(); updateHead(); }

const cur = () => S.cur;
const sysById = id => M.system(S.cur, id);
const selSys = () => (UI.sel && UI.sel.type === "sys" ? sysById(UI.sel.id) : null);

/* ---------- the header and the tabs ---------- */
function mapState(m) {
  const C = campaign();
  if (!m.cid || !m.savedAt) return "Not in the campaign";
  if (!C || !C.get("map", m.cid)) return "Saved once, no longer in the campaign";
  return m.updated > m.savedAt ? "Unsaved changes" : "Saved to the campaign";
}
function updateHead() { $("#head-map").textContent = `${S.cur.name} · ${plural(S.cur.systems.length, "system")} · ${plural(S.cur.links.length, "link")} · ${mapState(S.cur)}`; }
const TABS = ["map", "systems", "campaign"];
function setTab(t) {
  UI.tab = t;
  TABS.forEach(k => { $("#tab-" + k).setAttribute("aria-selected", String(k === t)); $("#view-" + k).hidden = k !== t; });
  if (t === "systems") renderSystems(); if (t === "campaign") renderCampaign(); if (t === "map") renderMap();
}

/* ---------- the map tab ---------- */
const mapBox = $("#map-svg");
$("#map-key").replaceChildren(mapKey());
function renderMapSvg() {
  const sel = UI.sel || {};
  const svg = drawMap(S.cur, { selected: sel.type === "sys" ? sel.id : null, link: sel.type === "link" ? sel.id : null, region: sel.type === "region" ? sel.id : null, pending: UI.pending, path: UI.path, grid: UI.tool === "add", onSystem: true, onLink: true, onRegion: true });
  mapBox.replaceChildren(svg);
}
function renderMap() { $("#map-name").value = S.cur.name; $("#map-note").value = S.cur.note; renderTools(); renderMapSvg(); renderSel(); renderChecks(); updateHead(); }
function renderTools() {
  const hint = { select: "Drag a system to move it. Click it, a link or a region label to edit it.", add: "Click empty space to place a new system. Drag or click existing ones as usual.", link: UI.pending ? `Linking from ${(sysById(UI.pending) || {}).name}: click the system at the other end. Click empty space to cancel.` : "Click one system, then another, to draw a portal link between them. Click an existing link's pair again to see it." }[UI.tool];
  $("#tool-hint").textContent = hint;
  document.querySelectorAll("[data-tool]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tool === UI.tool)));
  mapBox.dataset.tool = UI.tool;
}
function setTool(t) { UI.tool = t; UI.pending = null; renderTools(); renderMapSvg(); }
function select(sel) { UI.sel = sel; UI.confirm = null; renderMapSvg(); renderSel(); }

function toSvg(svg, e) { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = svg.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
let drag = null;
mapBox.addEventListener("pointerdown", e => {
  if (e.button !== 0) return;
  const svg = mapBox.querySelector("svg"); if (!svg) return;
  const sysG = e.target.closest("[data-sys]"), regG = e.target.closest("[data-region]"), linkEl = e.target.closest(".linkhit"), pt = toSvg(svg, e);
  if (sysG) {
    const id = sysG.dataset.sys;
    if (UI.tool === "link") { e.preventDefault(); return linkClick(id); }
    e.preventDefault(); return beginDrag({ type: "sys", id }, e, pt);
  }
  if (regG) { e.preventDefault(); return beginDrag({ type: "region", id: regG.dataset.region }, e, pt); }
  if (linkEl && UI.tool !== "add") { UI.tool = "select"; renderTools(); return select({ type: "link", id: `${linkEl.dataset.a}|${linkEl.dataset.b}` }); }
  if (UI.tool === "add") {
    e.preventDefault(); // keep the focus we are about to give the name field
    const s = M.addSystem(S.cur, { x: pt.x, y: pt.y });
    if (!s) return say("map-status", `A map holds up to ${M.LIMITS.systems} systems.`);
    edited(); UI.sel = { type: "sys", id: s.id }; renderMapSvg(); renderSel(); renderChecks();
    const nm = $("#sel-name"); if (nm) { nm.focus(); nm.select(); }
    return;
  }
  if (UI.tool === "link") { UI.pending = null; renderTools(); renderMapSvg(); return; }
  select(null);
});
function beginDrag(what, e, pt) {
  const obj = what.type === "sys" ? sysById(what.id) : S.cur.regions.find(r => r.id === what.id); if (!obj) return;
  select(what);
  drag = { what, sx: e.clientX, sy: e.clientY, dx: pt.x - obj.x, dy: pt.y - obj.y, moved: false };
  window.addEventListener("pointermove", onDrag); window.addEventListener("pointerup", endDrag); window.addEventListener("pointercancel", endDrag);
}
function onDrag(e) {
  if (!drag) return;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
  drag.moved = true;
  const svg = mapBox.querySelector("svg"); if (!svg) return;
  const p = toSvg(svg, e), x = p.x - drag.dx, y = p.y - drag.dy;
  if (drag.what.type === "sys") M.moveSystem(S.cur, drag.what.id, x, y);
  else { const r = S.cur.regions.find(q => q.id === drag.what.id); if (r) { r.x = Math.round(Math.min(M.W - 20, Math.max(20, x))); r.y = Math.round(Math.min(M.H - 20, Math.max(20, y))); M.touch(S.cur); } }
  renderMapSvg();
}
function endDrag() {
  window.removeEventListener("pointermove", onDrag); window.removeEventListener("pointerup", endDrag); window.removeEventListener("pointercancel", endDrag);
  if (drag && drag.moved) { edited(); renderChecks(); }
  drag = null;
}
mapBox.addEventListener("keydown", e => {
  const g = e.target.closest("[data-sys]"); if (!g) return;
  const id = g.dataset.sys;
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (UI.tool === "link") return linkClick(id); return select({ type: "sys", id }); }
  const step = e.shiftKey ? 1 : 10, d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
  if (d) { e.preventDefault(); const s = sysById(id); M.moveSystem(S.cur, id, s.x + d[0], s.y + d[1]); edited(); UI.sel = { type: "sys", id }; renderMapSvg(); renderSel(); const again = mapBox.querySelector(`[data-sys="${id}"]`); if (again) again.focus(); }
});
function linkClick(id) {
  if (!UI.pending) { UI.pending = id; renderTools(); return renderMapSvg(); }
  if (UI.pending === id) { UI.pending = null; renderTools(); return renderMapSvg(); }
  const res = M.addLink(S.cur, UI.pending, id), a = sysById(UI.pending), b = sysById(id);
  UI.pending = null;
  if (res.ok) { edited(); say("map-status", `Linked ${a.name} and ${b.name}.`); UI.sel = { type: "link", id: `${a.id}|${b.id}` }; }
  else say("map-status", res.why);
  renderTools(); renderMapSvg(); renderSel(); renderChecks();
}

/* the side panel: whatever is selected */
function field(label, input, cls) { return h("label", { class: "field" + (cls ? " " + cls : "") }, h("span", { text: label }), input); }
function check(label, checked, onchange, hint) { return h("div", { class: "checkrow" }, h("label", { class: "check" }, h("input", { type: "checkbox", checked, onchange: e => onchange(e.target.checked) }), h("span", { text: label })), hint ? h("p", { class: "note", text: hint }) : null); }
function confirmRow(key, label, onYes) {
  if (UI.confirm !== key) return h("button", { class: "mini danger", type: "button", text: label, onclick: () => { UI.confirm = key; renderSel(); } });
  return h("div", { class: "confirm" }, h("span", { class: "small", text: "Sure?" }), h("button", { class: "mini danger", type: "button", text: "Yes, " + label.toLowerCase(), onclick: () => { UI.confirm = null; onYes(); } }), h("button", { class: "mini", type: "button", text: "Keep it", onclick: () => { UI.confirm = null; renderSel(); } }));
}
function renderSel() {
  const box = $("#sel"), sel = UI.sel;
  if (!sel) { box.replaceChildren(h("h2", { text: "Nothing selected" }), h("p", { class: "small", text: S.cur.systems.length ? "Click a system, a link or a region label on the map to edit it." : "Choose Add system, then click the map to place your first one." })); return; }
  if (sel.type === "sys") return box.replaceChildren(...systemPanel(sysById(sel.id)));
  if (sel.type === "link") { const [a, b] = sel.id.split("|"), l = M.linkOf(S.cur, a, b); return box.replaceChildren(...linkPanel(l)); }
  if (sel.type === "region") return box.replaceChildren(...regionPanel(S.cur.regions.find(r => r.id === sel.id)));
}
function systemPanel(s) {
  if (!s) { UI.sel = null; return [h("h2", { text: "Nothing selected" })]; }
  const stars = h("div", { class: "stack" }, ...s.stars.map((c, i) => field(i ? `Companion ${"BC"[i - 1]}` : "Star", h("select", { "aria-label": `Star ${i + 1} class`, onchange: e => { const next = s.stars.slice(); next[i] = e.target.value; M.setStars(s, next); edited(); renderMapSvg(); } }, M.STAR_CLASSES.map(k => h("option", { value: k, text: k[0].toUpperCase() + k.slice(1), selected: k === c ? "" : null })))), ));
  const nStars = h("select", { "aria-label": "Number of stars", onchange: e => { const n = +e.target.value, next = s.stars.slice(0, n); while (next.length < n) next.push(next[next.length - 1] || "yellow"); M.setStars(s, next); edited(); renderMapSvg(); renderSel(); } }, [1, 2, 3].map(n => h("option", { value: n, text: ["Single star", "Binary", "Trinary"][n - 1], selected: n === s.stars.length ? "" : null })));
  const links = M.neighbours(S.cur, s.id).map(o => { const l = M.linkOf(S.cur, s.id, o), os = sysById(o); return h("li", { class: "linkrow" }, h("span", { text: os.name }), h("label", { class: "check small" }, h("input", { type: "checkbox", checked: l.danger, onchange: e => { l.danger = e.target.checked; edited(); renderMapSvg(); } }), "dangerous"), h("button", { class: "mini", type: "button", "aria-label": `Remove the link to ${os.name}`, text: "Remove", onclick: () => { M.removeLink(S.cur, s.id, o); edited(); renderMapSvg(); renderSel(); renderChecks(); } })); });
  return [
    h("h2", { text: "System" }),
    field("Name", h("input", { type: "text", id: "sel-name", value: s.name, maxlength: M.LIMITS.text, oninput: e => { s.name = e.target.value; edited(); renderMapSvg(); renderChecks(); } })),
    field("Stars", nStars), stars,
    field("Kind of space", h("select", { onchange: e => { s.space = e.target.value; edited(); } }, Object.entries(M.SPACES).map(([k, v]) => h("option", { value: k, text: v, selected: k === s.space ? "" : null })))),
    check("Core system", s.core, v => { s.core = v; edited(); renderMapSvg(); }, "A wider glow and a halo on the map."),
    check("Major spaceport", s.spaceport, v => { s.spaceport = v; edited(); renderMapSvg(); }, "A small diamond under the star."),
    check("Unstable portals", s.unstable, v => { s.unstable = v; edited(); renderMapSvg(); renderChecks(); }, "Every jump into or out of this system uses one. Red etching on the map, and the Mission tool's route cost counts it."),
    h("h3", { text: "Portal links" }),
    links.length ? h("ul", { class: "linklist" }, links) : h("p", { class: "small muted", text: "No links yet. Use the Link tool." }),
    h("div", { class: "row" },
      h("button", { class: "btn", type: "button", text: "Build out this system", onclick: () => { UI.pick = s.id; setTab("systems"); } }),
      confirmRow("del-sys", "Delete system", () => { const name = s.name; M.removeSystem(S.cur, s.id); UI.sel = null; if (UI.pending === s.id) UI.pending = null; edited(); renderMapSvg(); renderSel(); renderChecks(); say("map-status", `Deleted ${name} and its links.`); }))
  ];
}
function linkPanel(l) {
  if (!l) { UI.sel = null; return [h("h2", { text: "Nothing selected" })]; }
  const a = sysById(l.a), b = sysById(l.b);
  return [
    h("h2", { text: "Portal link" }), h("p", { class: "data", text: `${a.name} — ${b.name}` }),
    check("Dangerous area", l.danger, v => { l.danger = v; edited(); renderMapSvg(); }, "A red blur along the link, as the Horizon map marks its dangerous areas."),
    (a.unstable || b.unstable) ? h("p", { class: "note", text: `Unstable portals at ${[a, b].filter(x => x.unstable).map(x => x.name).join(" and ")}. Set that on the system, since it belongs to the system rather than the link.` }) : null,
    h("div", { class: "row" }, h("button", { class: "mini", type: "button", text: "Remove link", onclick: () => { M.removeLink(S.cur, l.a, l.b); UI.sel = null; edited(); renderMapSvg(); renderSel(); renderChecks(); } }))
  ];
}
function regionPanel(r) {
  if (!r) { UI.sel = null; return [h("h2", { text: "Nothing selected" })]; }
  return [
    h("h2", { text: "Region label" }),
    field("Name", h("input", { type: "text", value: r.name, maxlength: M.LIMITS.text, oninput: e => { r.name = e.target.value || "Region"; edited(); renderMapSvg(); } })),
    h("p", { class: "note", text: "A label on the map, like \"The Dabaran Circle\". Drag it where you want it." }),
    confirmRow("del-reg", "Delete label", () => { M.removeRegion(S.cur, r.id); UI.sel = null; edited(); renderMapSvg(); renderSel(); })
  ];
}

function renderChecks() {
  const issues = M.check(S.cur);
  $("#checks").replaceChildren(...(issues.length ? issues.map(i => h("li", { class: i.level }, i.ids ? h("button", { class: "linkbtn", type: "button", text: i.text, onclick: () => { UI.sel = { type: "sys", id: i.ids[0] }; renderMapSvg(); renderSel(); } }) : h("span", { text: i.text }))) : [h("li", { class: "ok", text: "Nothing to flag." })]));
  const opts = S.cur.systems.map(s => h("option", { value: s.id, text: s.name }));
  const from = $("#r-from"), to = $("#r-to"), f = from.value, t = to.value;
  from.replaceChildren(...opts.map(o => o.cloneNode(true))); to.replaceChildren(...opts.map(o => o.cloneNode(true)));
  if (S.cur.systems.some(s => s.id === f)) from.value = f; if (S.cur.systems.some(s => s.id === t)) to.value = t; else if (S.cur.systems.length > 1) to.value = S.cur.systems[S.cur.systems.length - 1].id;
  renderRoute(false);
}
function renderRoute(show = true) {
  const from = $("#r-from").value, to = $("#r-to").value, out = $("#r-out");
  if (!show) { if (!UI.path) { out.textContent = ""; return; } }
  if (!from || !to) { UI.path = null; out.textContent = ""; return renderMapSvg(); }
  const p = M.route(S.cur, from, to);
  UI.path = p && p.length > 1 ? p : null;
  const arrow = (a, b) => { const l = M.linkOf(S.cur, a, b); return l && l.danger ? " ⇝ " : (sysById(a).unstable || sysById(b).unstable) ? " ⇢ " : " → "; };
  out.textContent = p ? (p.length === 1 ? "Same system." : `${p.length - 1} ${p.length === 2 ? "jump" : "jumps"}: ` + p.map((id, i) => (i ? arrow(p[i - 1], id) : "") + sysById(id).name).join("")) : "No portal route between them.";
  renderMapSvg();
}

/* ---------- the systems tab ---------- */
function renderSystems() {
  const list = S.cur.systems, pick = $("#s-pick");
  pick.replaceChildren(...list.map(s => h("option", { value: s.id, text: s.name })));
  if (!list.some(s => s.id === UI.pick)) UI.pick = list.length ? list[0].id : null;
  pick.value = UI.pick || "";
  $("#s-empty").hidden = list.length > 0; $("#s-body").hidden = !list.length;
  $("#s-count").textContent = list.length ? `${plural(list.length, "system")} on ${S.cur.name}.` : "";
  if (list.length) renderSystem();
}
function renderSystem() {
  const s = sysById(UI.pick); if (!s) return;
  const C = campaign(), chips = [s.core ? "Core system" : null, s.spaceport ? "Major spaceport" : null, s.unstable ? "Unstable portals" : null, s.space ? M.SPACES[s.space] : null, s.cid && C && C.get("system", s.cid) ? "In the campaign" : null].filter(Boolean);
  $("#s-head").replaceChildren(h("h2", { text: s.name }), h("p", { class: "data muted small", text: `${M.starText(s)} · ${plural(M.neighbours(S.cur, s.id).length, "portal link")}` }), h("div", { class: "row" }, chips.map(c => h("span", { class: "chip" + (c === "Unstable portals" ? " hot" : c === "In the campaign" ? " teal" : ""), text: c }))));
  const form = [
    ...s.stars.map((c, i) => field(i ? `Companion ${"BC"[i - 1]} · ${c}` : `Star · ${c}`, h("input", { type: "text", value: (s.starNames || [])[i] || "", placeholder: M.starName(s, i), maxlength: M.LIMITS.text, oninput: e => { s.starNames = s.starNames || []; s.starNames[i] = e.target.value; for (let k = 0; k < s.stars.length; k++) s.starNames[k] = s.starNames[k] || ""; edited(); renderChart(); } }))),
    field("Portals at (AD)", h("input", { type: "number", min: "0", step: "any", value: String(s.portal), oninput: e => { const v = parseFloat(e.target.value); s.portal = Number.isFinite(v) && v >= 0 ? v : 0.5; edited(); renderChart(); } })),
    field("Portal station", h("input", { type: "text", value: s.portalStation, placeholder: "Leave empty for none", maxlength: M.LIMITS.text, oninput: e => { s.portalStation = e.target.value; edited(); renderChart(); } })),
    field("Notes", h("textarea", { rows: "3", maxlength: String(M.LIMITS.notes), oninput: e => { s.note = e.target.value; edited(); } }, ""), "wide")
  ];
  form[form.length - 1].querySelector("textarea").value = s.note;
  $("#s-form").replaceChildren(...form);
  renderBodies(); renderChart();
}
const KIND_BUTTONS = [["planet", "planet"], ["giant", "gas giant"], ["belt", "asteroid belt"], ["moon", "moon"], ["station", "station"], ["field", "comet or region"]];
function renderBodies() {
  const s = sysById(UI.pick); if (!s) return;
  const box = $("#s-bodies");
  const cards = s.bodies.map((b, i) => {
    const wf = (k, label, area) => field(label, area ? h("textarea", { rows: "2", maxlength: String(M.LIMITS.notes), oninput: e => { b[k] = e.target.value; edited(); } }) : h("input", { type: "text", value: b[k], maxlength: M.LIMITS.notes, oninput: e => { b[k] = e.target.value; edited(); } }), area ? "wide" : "");
    const details = h("details", { class: "worldbox" }, h("summary", { text: "World details" }),
      h("div", { class: "grid2" }, wf("size", "Size"), wf("atmosphere", "Atmosphere"), wf("temperature", "Temperature"), wf("geosphere", "Geosphere / composition"), wf("population", "Population"), wf("spaceport", "Spaceport"), wf("orbit", "In orbit", true), wf("factions", "Factions", true), wf("other", "Other / characteristics", true), wf("hooks", "Scenario hooks", true)));
    details.querySelectorAll("textarea").forEach((t, n) => { t.value = b[["orbit", "factions", "other", "hooks"][n]] || ""; });
    if (WORLD_HAS(b)) details.open = true;
    return h("li", { class: "bodycard" },
      h("div", { class: "row bodyrow" },
        field("Name", h("input", { type: "text", value: b.name, placeholder: M.BODY_KINDS[b.kind], maxlength: M.LIMITS.text, "aria-label": `Body ${i + 1} name`, oninput: e => { b.name = e.target.value; edited(); renderChart(); } })),
        field("Kind", h("select", { "aria-label": `Body ${i + 1} kind`, onchange: e => { b.kind = e.target.value; edited(); renderBodies(); renderChart(); } }, Object.entries(M.BODY_KINDS).map(([k, v]) => h("option", { value: k, text: v, selected: k === b.kind ? "" : null }))), "narrow"),
        field("AD from star", h("input", { type: "number", min: "0", step: "any", value: b.ad == null ? "" : String(b.ad), "aria-label": `Body ${i + 1} distance in AD`, oninput: e => { const v = e.target.value === "" ? null : parseFloat(e.target.value); b.ad = v != null && Number.isFinite(v) && v >= 0 ? v : null; edited(); renderChart(); } }), "narrow"),
        s.stars.length > 1 ? field("Orbits", h("select", { "aria-label": `Body ${i + 1} star`, onchange: e => { b.star = +e.target.value; edited(); renderChart(); } }, s.stars.map((_, k) => h("option", { value: k, text: M.starName(s, k), selected: k === b.star ? "" : null }))), "narrow") : null,
        h("button", { class: "mini", type: "button", text: "Remove", "aria-label": `Remove body ${i + 1}`, onclick: () => { M.removeBody(s, b.id); edited(); renderBodies(); renderChart(); } })),
      details);
  });
  box.replaceChildren(...(cards.length ? cards : [h("li", { class: "small muted", text: "No bodies yet. Add the planets, gas giants, belts and stations of this system below." })]));
}
const WORLD_HAS = b => M.WORLD_FIELDS.some(k => b[k]);
function renderChart() {
  const s = sysById(UI.pick), box = $("#s-chart"); if (!s) return;
  const rows = M.chartBodies(s), lost = M.unplaced(s);
  const chart = systemChart(S.cur, s, rows);
  box.replaceChildren(...[chart || h("p", { class: "nodata", text: "Give a body a distance in AD, or name a portal station, and the chart draws itself here." }),
    lost.length ? h("p", { class: "note", text: `${plural(lost.length, "body", "bodies")} with no distance ${lost.length === 1 ? "isn't" : "aren't"} drawn: ${lost.map(b => b.name || M.BODY_KINDS[b.kind]).join(", ")}.` }) : null].filter(Boolean));
}

/* ---------- the campaign tab ---------- */
function renderCampaign() {
  const C = campaign(), m = S.cur;
  $("#c-state").textContent = `${m.name}: ${mapState(m)}.`;
  $("#c-save").disabled = !C;
  $("#c-nostore").hidden = !!C;
  // every map in this browser
  $("#c-local").replaceChildren(...S.maps.map(x => h("li", { class: "maprow" + (x === S.cur ? " now" : "") },
    h("div", {}, h("b", { text: x.name }), h("span", { class: "small muted", text: ` · ${plural(x.systems.length, "system")} · ${mapState(x)}${x === S.cur ? " · open" : ""}` })),
    h("div", { class: "row" }, x === S.cur ? null : h("button", { class: "mini", type: "button", text: "Open", onclick: () => { S.cur = x; UI.sel = null; UI.pending = null; UI.path = null; UI.pick = null; persistNow(); renderCampaign(); updateHead(); } }),
      UI.confirm === "local-" + x.id ? h("span", { class: "confirm" }, h("button", { class: "mini danger", type: "button", text: "Yes, delete it here", onclick: () => deleteLocal(x) }), h("button", { class: "mini", type: "button", text: "Keep it", onclick: () => { UI.confirm = null; renderCampaign(); } }))
        : h("button", { class: "mini danger", type: "button", text: "Delete here", onclick: () => { UI.confirm = "local-" + x.id; renderCampaign(); } })))));
  // maps the campaign holds that this browser doesn't have open
  const there = C ? C.all("map") : [];
  $("#c-camp").replaceChildren(...(there.length ? there.map(e => {
    const local = S.maps.find(x => x.cid === e.id), n = Array.isArray((e.data || {}).systems) ? e.data.systems.length : 0;
    return h("li", { class: "maprow" },
      h("div", {}, h("b", { text: e.name || "Untitled map" }), h("span", { class: "small muted", text: ` · ${plural(n, "system")} · saved by ${e.source}${local ? " · open here" : ""}` })),
      h("div", { class: "row" }, h("button", { class: "mini", type: "button", text: local ? "Reload from the campaign" : "Open", onclick: () => openFromCampaign(e.id) }),
        UI.confirm === "camp-" + e.id ? h("span", { class: "confirm" }, h("button", { class: "mini danger", type: "button", text: "Remove the map", onclick: () => removeFromCampaign(e.id, false) }), h("button", { class: "mini danger", type: "button", text: "Map and its systems", onclick: () => removeFromCampaign(e.id, true) }), h("button", { class: "mini", type: "button", text: "Keep", onclick: () => { UI.confirm = null; renderCampaign(); } }))
          : h("button", { class: "mini danger", type: "button", text: "Remove from the campaign", onclick: () => { UI.confirm = "camp-" + e.id; renderCampaign(); } })));
  }) : [h("li", { class: "small muted", text: C ? "No maps in the campaign yet." : "The campaign store didn't load." })]));
}
function saveToCampaign() {
  const C = campaign(); if (!C) return say("c-status", "The campaign store didn't load, so nothing was saved. Reload the page and try again.");
  const res = M.pushToCampaign(C, S.cur);
  persistNow();
  if (!res.ok) return say("c-status", res.why);
  say("c-status", `Saved "${S.cur.name}": the map and ${plural(res.saved, "system")}. They show in the System tool and in Coriolis Sheets, which can roll worlds and fill in sheets for them.${res.left ? ` ${plural(res.left, "system")} you took off the map ${res.left === 1 ? "is" : "are"} still in the campaign as ${res.left === 1 ? "a" : ""} system${res.left === 1 ? "" : "s"}; remove ${res.left === 1 ? "it" : "them"} in Coriolis Sheets if you don't want ${res.left === 1 ? "it" : "them"}.` : ""}`);
  renderCampaign(); updateHead();
}
function openFromCampaign(id) {
  const C = campaign(); if (!C) return;
  const map = M.pullFromCampaign(C, id); if (!map) return say("c-status", "That map is no longer in the campaign.");
  const at = S.maps.findIndex(x => x.cid === id);
  if (at >= 0) { S.maps[at] = map; } else { if (S.maps.length >= MAX_MAPS) return say("c-status", `This browser holds up to ${MAX_MAPS} maps. Delete one here first.`); if (S.maps.some(x => x.id === map.id)) map.id = M.blankMap().id; S.maps.push(map); }
  S.cur = map; UI.sel = null; UI.pending = null; UI.path = null; UI.pick = null; UI.confirm = null;
  persistNow(); say("c-status", `Opened "${map.name}" from the campaign, with ${plural(map.systems.length, "system")} and their bodies as the campaign holds them now.`);
  renderCampaign(); updateHead();
}
function removeFromCampaign(id, withSystems) {
  const C = campaign(); if (!C) return;
  const e = C.get("map", id), sysIds = e && Array.isArray((e.data || {}).systems) ? e.data.systems.map(s => s.cid).filter(Boolean) : [];
  C.remove("map", id);
  if (withSystems) sysIds.forEach(sid => C.remove("system", sid));
  S.maps.filter(x => x.cid === id).forEach(x => { x.cid = ""; x.savedAt = ""; if (withSystems) x.systems.forEach(s => (s.cid = "")); });
  persistNow(); UI.confirm = null;
  say("c-status", `Removed the map${withSystems ? ` and ${plural(sysIds.length, "system")}` : ""} from the campaign. The copy in this browser is untouched.`);
  renderCampaign(); updateHead();
}
function deleteLocal(x) {
  S.maps = S.maps.filter(m => m !== x); if (!S.maps.length) S.maps.push(M.blankMap());
  if (S.cur === x) { S.cur = S.maps[0]; UI.sel = null; UI.pending = null; UI.path = null; UI.pick = null; }
  UI.confirm = null; persistNow(); renderCampaign(); updateHead();
}
function newMap() {
  if (S.maps.length >= MAX_MAPS) return say("map-status", `This browser holds up to ${MAX_MAPS} maps. Delete one on the Campaign tab first.`);
  const m = M.blankMap(`Untitled map ${S.maps.length + 1}`); S.maps.push(m); S.cur = m; UI.sel = null; UI.pending = null; UI.path = null; UI.pick = null; UI.tool = "add";
  persistNow(); renderMap(); say("map-status", "A blank map. Place your first system.");
}
function download(name, text) { const a = h("a", { href: URL.createObjectURL(new Blob([text], { type: "application/json" })), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
function importFile(file) {
  const r = new FileReader();
  r.onerror = () => say("c-status", "That file couldn't be read.");
  r.onload = () => {
    try {
      if (String(r.result).length > 4e6) throw new Error("That file is too big to be an Atlas map.");
      const m = M.normaliseMap(JSON.parse(String(r.result)));
      if (S.maps.length >= MAX_MAPS) throw new Error(`This browser holds up to ${MAX_MAPS} maps. Delete one first.`);
      // An import is a copy: it gets its own id and no campaign links, so saving it can't overwrite the map it came from.
      m.id = M.blankMap().id; m.cid = ""; m.savedAt = ""; m.systems.forEach(s => (s.cid = ""));
      S.maps.push(m); S.cur = m; UI.sel = null; UI.pending = null; UI.path = null; UI.pick = null;
      persistNow(); say("c-status", `Imported "${m.name}" as a new map: ${plural(m.systems.length, "system")}, ${plural(m.links.length, "link")}. Save it to the campaign when you're ready.`); renderCampaign(); updateHead();
    } catch (err) { say("c-status", err instanceof SyntaxError ? "That file isn't JSON." : err.message); }
  };
  r.readAsText(file);
}

/* ---------- wiring ---------- */
TABS.forEach(t => $("#tab-" + t).addEventListener("click", () => setTab(t)));
document.querySelectorAll("[data-tool]").forEach(b => b.addEventListener("click", () => setTool(b.dataset.tool)));
$("#map-name").addEventListener("input", e => { S.cur.name = e.target.value || "Untitled map"; edited(); });
$("#map-note").addEventListener("input", e => { S.cur.note = e.target.value; edited(); });
$("#map-new").addEventListener("click", newMap);
$("#add-region").addEventListener("click", () => { const r = M.addRegion(S.cur); if (!r) return say("map-status", `A map holds up to ${M.LIMITS.regions} region labels.`); edited(); select({ type: "region", id: r.id }); const n = $("#sel input[type=text]"); if (n) { n.focus(); n.select(); } });
$("#r-from").addEventListener("change", () => renderRoute()); $("#r-to").addEventListener("change", () => renderRoute());
$("#r-clear").addEventListener("click", () => { UI.path = null; $("#r-out").textContent = ""; renderMapSvg(); });
$("#s-pick").addEventListener("change", e => { UI.pick = e.target.value; renderSystem(); });
$("#s-onmap").addEventListener("click", () => { if (UI.pick) { UI.sel = { type: "sys", id: UI.pick }; setTab("map"); } });
KIND_BUTTONS.forEach(([k, label]) => $("#s-add").append(h("button", { class: "mini", type: "button", text: "Add " + label, onclick: () => { const s = sysById(UI.pick); if (!s) return; const b = M.addBody(s, k); if (!b) return say("s-status", `A system holds up to ${M.LIMITS.bodies} bodies.`); edited(); renderBodies(); renderChart(); const last = $("#s-bodies li:last-child input"); if (last) last.focus(); } })));
$("#s-sort").addEventListener("click", () => { const s = sysById(UI.pick); if (!s) return; s.bodies.sort((a, b) => (a.star || 0) - (b.star || 0) || (a.ad == null) - (b.ad == null) || (a.ad || 0) - (b.ad || 0)); edited(); renderBodies(); });
$("#c-save").addEventListener("click", saveToCampaign);
$("#c-export").addEventListener("click", () => download(`${(S.cur.name || "map").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "map"}.atlas.json`, M.exportMap(S.cur)));
$("#c-import").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; if (f) importFile(f); e.target.value = ""; });
{ const C = campaign(); if (C) C.subscribe(() => { if (UI.tab === "campaign") renderCampaign(); updateHead(); }); }

setTab("map");

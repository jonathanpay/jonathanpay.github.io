/* ctth-horizon.js — the Third Horizon: its map, its portals, its distances.
 *
 * Coriolis: The Third Horizon only. The Great Dark toolset (ctgd-*) gets its own horizon file when it arrives.
 *
 * Load as a plain script on every ctth page that draws the map, before the page's own code:
 *     <script src="/tools/ctth-horizon.js"></script>
 *     <script src="/tools/ctth-campaign.js"></script>
 *
 * What it holds:
 *   MAP          [id, name, x, y, region] for the 36 systems on the Horizon map, at rough map positions
 *   LINKS        [a, b, flag] portal links; flag is "danger" on a link through a dangerous area
 *   BODIES       charted bodies by system: {portal, stars, gaps, chartNote, bodies:[[name, AD, kind, starIndex]]}
 *   CORE         the six systems the map marks as core
 *   REGIONS      where the region labels sit; LABEL_AT the label offsets that avoid a collision
 *   INFO         per system: [star classes, bodies per star, kind of space, major spaceport]
 *   SPACE_NAME, SPACE_COL, parseCount, countText, STAR_LOOK, starKind, starCount, DANGER, UNSTABLE, ADJ
 *   ZONES        time bands by distance from the portal: [name, upper bound in AD, encounters per day, reaction modifier]
 *
 * What it does:
 *   buildSystems({data, extra, campaign}) → the merged system list. The map's own systems, then your data
 *                 file's systems and your extra systems merged in by id, then the campaign's systems added
 *                 read-only, then every map system given a portal body for each of its links and a portal
 *                 station beside them, exactly as the mission page has always built it. Returns the list.
 *   sysName(id), onMap(id), linkFlag(a, b), unstableAt(a, b), portalBody(sysObj, otherId)
 *   bfs(from), safest(from), route(from, to), routeText(path), zoneFor(dAU)
 *   campaignSystemId(id), campaignBodyRow(b)   the shape and the row a campaign system's bodies arrive in
 *
 * sysName resolves against the most recently built list, so a page that rebuilds after saving a system
 * gets the new name at once. Pass the data file, the extra systems and the campaign entities in: this file
 * has no DOM, no page state and no storage of its own.
 */
(function () {
"use strict";

const clone = o => JSON.parse(JSON.stringify(o));

/* The Third Horizon's portal map, redrawn: 36 systems at rough map positions, the portal links between them,
   the four systems with unstable portals and the two dangerous areas. Orbital distances in AD from the star only where the core rules give them (Kua). */
const MAP = [["menkar","Menkar",232,409,"sadaal"],["daybul","Daybul",289,337,"sadaal"],["ghodar","Ghodar",389,284,"sadaal"],["dziban","Dziban",489,245,"sadaal"],
  ["sadaal","Sadaal",437,387,"sadaal"],["nagar","Nagar",393,428,"sadaal"],["errai","Errai",542,331,"sadaal"],["aiwaz","Aiwaz",673,401,""],
  ["tarazug","Tarazug",680,216,"miran"],["zib","Zib",669,274,"miran"],["mira","Mira",722,331,"miran"],["zalos","Zalos",773,382,"miran"],["odacon","Odacon",814,206,"miran"],
  ["zhau","Zhau",955,254,"pillar"],["sivas","Sivas",896,312,"pillar"],["ordana","Ordana",971,337,"pillar"],["altai","Altai",899,401,"pillar"],
  ["kua","Kua",823,455,""],["awadhi","Awadhi",968,446,"algol"],["algol","Algol",1053,494,"algol"],["zamusa","Zamusa",1143,491,"algol"],["nharmada","Nharmada",1240,481,"algol"],
  ["anaspora","Anaspora",1130,596,"algol"],["yastapol","Yastapol",1210,602,"algol"],["erequ","Erequ",1336,587,"algol"],["eanu","Eanu",1356,676,"algol"],
  ["caph","Caph",898,519,"dabaran"],["marfik","Marfik",972,578,"dabaran"],["amedo","Amedo",1016,672,"dabaran"],["algebar","Algebar",997,773,"dabaran"],
  ["melik","Melik",933,843,"dabaran"],["rigel","Rigel",856,853,"dabaran"],["dabaran","Dabaran",791,857,"dabaran"],["uharu","Uharu",725,806,"dabaran"],
  ["taoan","Taoan",682,728,"dabaran"],["hamura","Hamura",712,606,"dabaran"]];
const LINKS = [["menkar","daybul"],["daybul","ghodar"],["ghodar","dziban"],["ghodar","sadaal"],["sadaal","nagar"],["sadaal","errai"],["dziban","errai"],
  ["errai","aiwaz"],["aiwaz","kua"],["aiwaz","zalos"],["zalos","mira"],["mira","zib"],["zib","tarazug"],["tarazug","odacon"],["odacon","zhau","danger"],
  ["zhau","sivas"],["zhau","ordana"],["sivas","altai"],["ordana","altai"],["altai","kua"],["altai","awadhi"],["awadhi","algol"],["algol","zamusa"],
  ["zamusa","nharmada"],["algol","anaspora"],["anaspora","yastapol"],["yastapol","nharmada"],["nharmada","erequ"],["erequ","eanu"],
  ["kua","caph"],["caph","marfik"],["marfik","amedo"],["amedo","algebar"],["algebar","melik"],["melik","rigel"],["rigel","dabaran"],
  ["dabaran","uharu"],["uharu","taoan","danger"],["taoan","hamura","danger"],["hamura","kua"]];
const REGIONS = [["The Sadaal Route",330,470],["The Miran Chain",801,287],["The Quadrant of the Pillar",1060,212],["The Algol Route",1260,650],["The Dabaran Circle",841,695]];
// Label placements where the default (up and to the right) collides: [dx, dy, anchor]
const LABEL_AT = { dabaran:[0,24,"middle"], rigel:[0,-12,"middle"], yastapol:[8,22,"start"], anaspora:[-8,22,"end"], zalos:[12,20,"start"], kua:[14,18,"start"] };
/* From the Horizon map (issued by the Foundation, CC61): star, planets per star (A: asteroid belt, G: gas giant), the kind of space, and a major spaceport. */
const INFO = {
  altai:["White","7AG","observandum"], zhau:["Trinary yellow/white/blue","6/4G/3A","border"], sivas:["Yellow","5G","civilized"], ordana:["Binary blue/white","7G/6A","civilized"],
  odacon:["Red","5AG","observandum"], tarazug:["White dwarf","4G","observandum"], zib:["Red","4A","border"], mira:["Trinary yellow/white/white","6AG/4G/5G","faction",1],
  zalos:["Binary yellow/white","3A/4G","observandum",1], aiwaz:["Binary white/yellow","3G/5AG","civilized"],
  errai:["Binary yellow/yellow","6A/2AG","border"], dziban:["Red","3AG","border"], sadaal:["Binary yellow/red","9G/3A","civilized",1], ghodar:["White","3AG","border"],
  nagar:["Binary red/black hole","4G/0","observandum"], daybul:["Binary yellow/red giant","3AG/2G","border"], menkar:["Binary yellow/white","4G/3AG","border"],
  awadhi:["Trinary white/yellow/black hole","3/7AG/0","border"], algol:["Trinary white/white dwarf/yellow","6AG/0/2","civilized",1], zamusa:["Hypergiant","2","observandum"],
  anaspora:["Yellow","3AG","border"], yastapol:["White dwarf","2G","border"], nharmada:["Trinary white/white/red giant","2/7/4AG","border"], erequ:["Red giant","5A","border"],
  eanu:["Binary yellow/red","6AG/3G","observandum"], kua:["White","6AG","faction",1], hamura:["White dwarf","2G","border"], taoan:["Red giant","3G","observandum"],
  uharu:["Binary yellow/brown dwarf","3/26A","observandum"], dabaran:["Red giant","7G","civilized",1], rigel:["White hypergiant","A","observandum"], melik:["White","5G","civilized"],
  algebar:["Yellow","12AG","border"], amedo:["Binary yellow/red","10AG/3","border"], marfik:["Red","4","observandum"], caph:["Binary blue/yellow","4/5AG","observandum"]
};
const SPACE_NAME = { faction:"Faction space", civilized:"Civilized space", border:"Border space", observandum:"Observandum" };
const SPACE_COL = { faction:"faction", civilized:"civilized", border:"fringe", observandum:"uncharted" };
// "6AG" → six bodies, one an asteroid belt and one a gas giant
function parseCount(part) { const m = String(part).match(/^(\d*)([AG]*)$/); if (!m) return null; const a = m[2].includes("A"), g = m[2].includes("G"); const n = m[1] ? +m[1] : (a ? 1 : 0) + (g ? 1 : 0); return { n, a, g }; }
function countText(c) { if (!c) return ""; if (!c.n) return "no planets"; const extra = [c.a ? "an asteroid belt" : null, c.g ? "a gas giant" : null].filter(Boolean); return `${c.n} ${c.n === 1 ? "body" : "bodies"}${extra.length ? `, with ${extra.join(" and ")}` : ""}`; }
const DANGER = new Set(LINKS.filter(l => l[2] === "danger").flatMap(l => l.slice(0, 2)));
const CORE = new Set(["kua","algol","dabaran","mira","sadaal","zalos"]);
/* Bodies: [name, AD from its star, kind, star index]. Kinds: planet, giant, belt, station, moon, field. Star 0 is the primary; 1 and 2 are companions.
   Distances from the system charts in the core rules (Kua) and the Quadrant of the Pillar and Sadaal charts. Portals sit at 0.5 AD unless a system says otherwise. */
const BODIES = {
  kua:{ portal:0.5, bodies:[["Lubau",1.5,"planet"],["Jina",3,"planet"],["Kua (Coriolis)",5,"planet"],["The asteroid belt",10,"belt"],["Xene",18,"giant"],["Surha",40,"planet"],["The Rimward Reach",47,"field"]] },
  altai:{ bodies:[["Imanon",3,"planet"],["The Black Sector",5,"belt"],["Altai",6,"planet"],["Marakanda (Khorsabad)",6.5,"moon"],["Zanjire",7.5,"planet"],["Baatar",10,"planet"],["Elajh",20,"giant"],["Maraabra",32,"planet"]] },
  ordana:{ stars:["Ordana","Yuisin (Ordana B)"], gaps:[0,200], bodies:[["Kermaz",2,"planet"],["Ordana",4,"planet"],["Hayrangi Station",6,"station"],["Barah",7,"planet"],["Butangë",9,"planet"],["O-21",11,"planet"],["Qargarin",23,"giant"],["Musfat",40,"planet"],["Irike",52,"planet"],
    ["Moshte",3,"planet",1],["Yuisin",4,"planet",1],["The Hawran Belt",10,"belt",1],["Murat",16,"planet",1],["Dayr",20,"planet",1],["Tal Afsar",30,"planet",1]] },
  sivas:{ bodies:[["Kala",4,"planet"],["Sivas",6,"planet"],["Karast",6,"moon"],["Loulan Station",6,"station"],["Yovani",11,"planet"],["Nurija",33,"planet"],["Gamhija",41,"planet"],["Comija",51,"planet"]] },
  zhau:{ stars:["Zhau A","Zhau B","Zhau C"], gaps:[0,80,400], bodies:[["The Lance Station",0.6,"station"],["Z3",4,"planet"],["Zhau (Z6)",6.5,"planet"],["Z9",8,"planet"],["Z29",9,"planet"],["Z45",17,"giant"],["Z60",43,"planet"],
    ["ZB3",4,"planet",1],["Zorana (ZB4)",6,"planet",1],["ZB7",15,"planet",1],["Yivae (ZB10)",22,"planet",1],["ZB46",32,"planet",1],
    ["ZC4",5,"planet",2],["The ZC asteroid belt",12,"belt",2],["ZCX",21,"planet",2]] },
  sadaal:{ stars:["Sadaal A","Bahram (Sadaal B)"], gaps:[0,50], bodies:[["Vanzur",3,"planet"],["Auf",5,"planet"],["Ramasi",6,"planet"],["Sadaal",8,"planet"],["Chathu",10,"planet"],["Marasta",16,"planet"],["Urmani",20,"planet"],["Buyasta",25,"giant"],["Beletser Station",26,"station"],["Choma",35,"planet"],["Hadladar",48,"planet"],
    ["The Portal Belt",2,"belt",1],["Bahram",4,"planet",1],["Sanfir",6,"planet",1],["The Outer Belt",7.5,"belt",1]] },
  algol:{ stars:["Algol (A)","Persei (B)","Rhaas (C)"], gaps:[0,null,150], bodies:[["Yavan",4,"planet"],["Ermeru",6,"planet"],["Algol",6.5,"planet"],["The Cloud Belt",15,"belt"],["Taus",30,"planet"],["Marakir",38,"planet"],["Younos",42,"planet"],
    ["Ghul",4,"planet",2],["Mining Station Rhaas-Mohra",6,"station",2],["Zabra",12,"planet",2]] },
  dabaran:{ stars:["Dabaran","Exilion (B)"], bodies:[["Arara",3,"planet"],["Dabaran",6,"planet"],["Karbana",7,"planet"],["Sumei",10,"planet"],["Mahmet",20,"planet"],["Salamanx",25,"giant"],["Yafir",30,"planet"],["Marfuk",40,"planet"]] },
  mira:{ stars:["Mira (A)","Antmira (B)","Menau (C)"], gaps:[0,75,1000], bodies:[["Inos",2,"planet"],["Mira",5,"planet"],["Gherbis Station",5,"station"],["Zamih",8,"planet"],["Khora",9,"planet"],["The asteroid belt",30,"belt"],["Jazaar",40,"giant"],["Nahid",52,"planet"],
    ["Trigon",4,"planet",1],["Antmira",6,"planet",1],["Zhir",10,"planet",1],["Makom",12,"giant",1],["Ofaared",25,"planet",1],
    ["M1",2,"planet",2],["Menau",3.5,"planet",2],["M3",5,"planet",2],["Moshtari",15,"giant",2],["Yahin",25,"planet",2],["Sufra",30,"planet",2],["The comet Vaarnathar",46,"field",2]] },
  zalos:{ stars:["Zalos (A)","Zahedan (B)"], bodies:[["Benagia",3,"giant"],["Karrmerruk",3,"moon"],["The asteroid belt",6,"belt"],["Zalos",8,"planet"],["The Monastery Fortress of Amshaar",18,"station"],
    ["Naftar",3,"planet",1],["Zahedan",6,"planet",1],["Monastery Station Manaat",6,"station",1],["Hamshir",15,"planet",1],["Ishan",25,"planet",1],["Korda's Eye",32,"giant",1]] },
  odacon:{ bodies:[["Khôban Portal Station",0.5,"station"],["Sethlan",2,"planet"],["Echron Station",2,"station"],["Rusah",4,"planet"],["The Ash Belt",6,"belt"],["Khurshid",8,"planet"],["Qayna",15,"planet"],["Chandra",25,"giant"]] },
  hamura:{ bodies:[["Portal Station Hamurabi",0.5,"station"],["Nestero",2.5,"planet"],["Hamura",3,"planet"],["Yublai",4.5,"planet"]] },
  // Zuhal's worlds are given from Uharu (13 to 17 AD); here they sit by their distance from Zuhal, which lies 15 AD out.
  uharu:{ stars:["Uharu","Zuhal (B)"], gaps:[0,15], chartNote:"Zuhal's worlds are shown by their distance from Zuhal; the books give them from Uharu, between 13 and 17 AD.", bodies:[["Albah",3,"planet"],["Rih",4,"planet"],["Yurja",7,"planet"],
    ["Pyre 1–6",0.2,"planet",1],["Ayn 1–6",0.25,"planet",1],["Azraq 1–5",0.5,"planet",1],["Oasa & Ouma",0.5,"planet",1],["Najila & Warah",1,"planet",1],["Alri & Harara",1,"planet",1],["Jadesh 1–6",1.5,"planet",1],["Bayd 1–5",1.7,"planet",1],["The asteroid belt",2,"belt",1]] }
};
const BASE_SYSTEMS = MAP.map(([id, n, x, y, region]) => ({ id, n, x, y, region, bodies:[], ...(BODIES[id] || {}) }));

/* Star classes from the Horizon map, coloured on the system charts: [core, glow, ring, core radius].
   A dwarf is small and hard, a giant swollen, a black hole a dark disc with a burning ring. */
const STAR_LOOK = {
  "white":["#f6f8ff","#d6e0ff","#e4eaff",9], "yellow":["#fff0b0","#ffc54a","#ffd77a",9], "red":["#ffa07a","#e2481f","#ff8a5c",9],
  "blue":["#cfe3ff","#4f86e8","#9cc2ff",9], "white dwarf":["#ffffff","#b8c8ff","#dfe6ff",5.5], "brown dwarf":["#c98a5a","#7a3e1a","#b07048",6],
  "red giant":["#ff8a5c","#d03a14","#ff7a48",13], "hypergiant":["#fff3d6","#ffb04a","#ffd28a",15], "white hypergiant":["#ffffff","#c8d4ff","#e8eeff",15],
  "black hole":["#050403","#ff9a3c","#ffb45a",8]
};
// "Trinary white/white dwarf/yellow" → the class of each star in order; "Vit/Gul" is the Swedish the map left in for white/yellow
function starKind(id, i) {
  const t = (INFO[id] || ["white"])[0].toLowerCase().replace(/^(binary|trinary)\s+/, "").replace("vit", "white").replace("gul", "yellow");
  const parts = t.split("/").map(x => x.trim());
  const k = parts[Math.min(i, parts.length - 1)] || "white";
  return STAR_LOOK[k] ? k : Object.keys(STAR_LOOK).find(x => k.includes(x)) || "white";
}
// How many stars the Horizon map gives the system (a single class, or a binary or trinary list)
const starCount = id => { const t = (INFO[id] || [""])[0]; return /^Trinary/.test(t) ? 3 : /^Binary/.test(t) ? 2 : 1; };

// Zones by distance from the portal (table 46): name, upper bound in AD, encounters per day, reaction modifier
const ZONES = [["Portal zone",0.5,12,2],["Core zone",3,2,0],["Habitable zone",10,1,0],["Fringe zone",40,1/3,-1],["Deep space zone",Infinity,1/7,-2]];
const zoneFor = dAU => ZONES.findIndex(z => dAU <= z[1]);

const ADJ = {}; LINKS.forEach(([a, b, f]) => { (ADJ[a] ||= []).push({ to:b, f }); (ADJ[b] ||= []).push({ to:a, f }); });
// Unstable portals belong to a system, not a link: every jump into or out of these systems uses one.
const UNSTABLE = new Set(["dziban","zamusa","yastapol","algebar"]);
const linkFlag = (a, b) => (LINKS.find(l => (l[0] === a && l[1] === b) || (l[0] === b && l[1] === a)) || [])[2] || (UNSTABLE.has(a) || UNSTABLE.has(b) ? "unstable" : "");
const unstableAt = (a, b) => [a, b].filter(x => UNSTABLE.has(x)).map(sysName).join(" and ");
function bfs(from) { const dist = { [from]:0 }, prev = {}; const q = [from]; while (q.length) { const u = q.shift(); (ADJ[u] || []).forEach(({ to }) => { if (dist[to] == null) { dist[to] = dist[u] + 1; prev[to] = u; q.push(to); } }); } return { dist, prev }; }
// Fewest jumps, and of those, the fewest unstable portals and dangerous links.
function safest(from) { const cost = { [from]:0 }, prev = {}, done = new Set(); for (;;) { let u = null; for (const k in cost) if (!done.has(k) && (u === null || cost[k] < cost[u])) u = k; if (u === null) break; done.add(u); (ADJ[u] || []).forEach(({ to }) => { const c = cost[u] + 1 + (linkFlag(u, to) ? 0.01 : 0); if (cost[to] == null || c < cost[to]) { cost[to] = c; prev[to] = u; } }); } return { prev, dist:cost }; }
function route(from, to) { if (!onMap(from) || !onMap(to)) return null; if (from === to) return [from]; const { prev, dist } = safest(from); if (dist[to] == null) return null; const p = [to]; while (p[0] !== from) p.unshift(prev[p[0]]); return p; }
const routeText = p => p.map((id, i) => i ? `${({ unstable:" ⇢ ", danger:" ⇝ " })[linkFlag(p[i - 1], id)] || " → "}${sysName(id)}` : sysName(id)).join("");

/* ---------- the campaign's systems, in the shape they arrive ---------- */
const campaignSystemId = id => "camp-" + id;
// A campaign body is an object; the charts and the pickers here read rows of [name, AD from the star, kind].
const BODY_KIND = { planet:"planet", moon:"moon", "gas giant":"giant", giant:"giant", gas:"giant", "asteroid belt":"belt", belt:"belt", station:"station", comet:"field", field:"field", star:"star" };
function campaignBodyRow(b) {
  if (!b || typeof b !== "object") return null;
  const name = String(b.name || "").trim(); if (!name) return null;
  const kind = BODY_KIND[String(b.kind || "").trim().toLowerCase()] || "planet";
  const d = b.distance === "" || b.distance == null ? NaN : parseFloat(b.distance);
  return [name, isFinite(d) ? d : null, kind];
}

/* ---------- the merged system list ---------- */
const onMapId = id => MAP.some(m => m[0] === id);
const onMap = id => MAP.some(m => m[0] === id);
let CURRENT = [];
function buildSystems({ data, extra, campaign } = {}) {
  const list = clone(BASE_SYSTEMS);
  const merge = s => { if (!s || !s.n) return; const id = s.id || s.n.toLowerCase().replace(/[^a-z0-9]+/g, ""); const have = list.find(x => x.id === id); if (have) { if (s.bodies && s.bodies.length) have.bodies = s.bodies; if (s.portal != null) have.portal = s.portal; ["note","known","exports","imports","portalStation"].forEach(k => { if (s[k]) have[k] = s[k]; }); } else list.push({ id, n:s.n, bodies:s.bodies || [], portal:s.portal, note:s.note, known:s.known, exports:s.exports, imports:s.imports }); };
  ((data && data.systems) || []).forEach(merge); (extra || []).forEach(merge);
  // Systems from the campaign (shared from Coriolis Sheets, or a world saved here) join the list read-only:
  // they are never written back to mb-systems, and a system already known by name is left as it is.
  (campaign || []).forEach(e => {
    const d = e.data || {}, n = String(d.name || e.name || "").trim(); if (!n) return;
    const id = campaignSystemId(e.id);
    if (list.some(x => x.id === id || String(x.n).toLowerCase() === n.toLowerCase())) return;
    list.push({ id, n, bodies:(Array.isArray(d.bodies) ? d.bodies : []).map(campaignBodyRow).filter(Boolean), campaign:true });
  });
  // Every map system gets a portal body for each of its links.
  list.forEach(sy => { const links = LINKS.filter(l => l[0] === sy.id || l[1] === sy.id).map(l => l[0] === sy.id ? l[1] : l[0]);
    const pa = sy.portal != null ? sy.portal : 0.5;
    sy.bodies = [...links.map(o => [`Portal to ${(MAP.find(m => m[0] === o) || [])[1]}`, pa, "portal"]), ...sy.bodies.filter(b => b[2] !== "portal")];
    // Every system has a portal station beside its portals. Only a few are named in print: a data file or your own
    // systems list can name the rest (a station at the portals' distance, or "portalStation" on the system).
    if (onMapId(sy.id)) {
      let st = sy.bodies.find(b => (b[2] === "station" || (!b[2] && /station/i.test(b[0]))) && (b[1] === pa || /portal/i.test(b[0])) && !(b[3] > 0)); if (st) st[2] = "station";
      if (sy.portalStation) { if (st) st[0] = sy.portalStation; else sy.bodies.push(st = [sy.portalStation, pa, "station"]); }
      if (!st) { st = [`${sy.n} portal station`, pa, "station"]; sy.unnamedStation = true; sy.bodies.push(st); }
      sy.portalStationName = st[0];
    } });
  CURRENT = list;
  return list;
}
const sysName = id => (CURRENT.find(s => s.id === id) || {}).n || (MAP.find(m => m[0] === id) || [])[1] || id || "—";
function portalBody(sysObj, otherId) { return sysObj.bodies.find(b => b[0] === `Portal to ${sysName(otherId)}`) || sysObj.bodies.find(b => b[2] === "portal"); }

window.CtthHorizon = {
  MAP, LINKS, BODIES, CORE, REGIONS, LABEL_AT, INFO, SPACE_NAME, SPACE_COL, STAR_LOOK, DANGER, UNSTABLE, ADJ, ZONES,
  parseCount, countText, starKind, starCount,
  sysName, onMap, linkFlag, unstableAt, portalBody, bfs, safest, route, routeText, zoneFor,
  campaignSystemId, campaignBodyRow, buildSystems
};
})();

/* ctgd-campaign.js — the campaign store the Great Dark tools share.
 *
 * The ctgd tools (voyage, sheets, delve table) all run on the same origin, so they
 * share one localStorage record: the campaign. An entity is a named thing in the
 * campaign (an NPC, a ship, a site, an artifact, a voyage, a story). Each tool reads
 * what it needs and writes back what it knows, and every entity carries a stable id
 * so the tools can point at the same thing rather than copy it.
 *
 * This is a separate store from the Third Horizon campaign (ctth-campaign.js): the
 * two games' campaigns never mix, and the key here (ctgd-campaign-v1) does not
 * collide with the voyage tool's own gd-* keys.
 *
 * Load as a plain script (not a module), before the page's own code:
 *     <script src="/tools/ctgd-campaign.js"></script>
 * then use window.CtgdCampaign.
 *
 * Nothing leaves the browser. No network calls, no timers beyond a debounce.
 */
(function () {
  "use strict";

  const KEY = "ctgd-campaign-v1";
  const FORMAT = "ctgd-campaign/1";
  const KINDS = ["npc", "ship", "site", "artifact", "voyage", "story"];
  const MAX_ENTITIES = 400;
  const MAX_BYTES = 200000; // one entity's data, as JSON
  const WRITER = Math.random().toString(36).slice(2, 10);

  const listeners = new Set();

  function empty() {
    return { format: FORMAT, updated: new Date().toISOString(), entities: kindsMap(), links: [] };
  }
  function kindsMap() {
    const out = {};
    KINDS.forEach(k => (out[k] = {}));
    return out;
  }

  /* Only plain, JSON-safe values. The tools store strings, numbers, booleans and
   * shallow objects, so anything deeper is flattened or dropped rather than
   * trusted. Keys are checked against prototype pollution. */
  function clean(value, depth) {
    if (depth > 4) return null;
    if (value == null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (Array.isArray(value)) {
      const out = value.slice(0, 200).map(v => clean(v, depth + 1));
      return out.some(v => v === undefined) ? out.map(v => (v === undefined ? null : v)) : out;
    }
    if (typeof value === "object") {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(k)) continue;
        if (k === "constructor" || k === "prototype" || k === "__proto__") continue;
        const c = clean(v, depth + 1);
        if (c !== undefined) out[k] = c;
      }
      return out;
    }
    return undefined;
  }

  function sizeOf(value) {
    try {
      return JSON.stringify(value || {}).length;
    } catch {
      return Infinity;
    }
  }

  function read() {
    let raw = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      return empty();
    }
    if (!raw) return empty();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return empty();
    }
    if (!parsed || typeof parsed !== "object" || parsed.format !== FORMAT) return empty();
    const db = empty();
    db.updated = typeof parsed.updated === "string" ? parsed.updated : db.updated;
    for (const kind of KINDS) {
      const bucket = parsed.entities && parsed.entities[kind];
      if (!bucket || typeof bucket !== "object") continue;
      for (const [id, entity] of Object.entries(bucket)) {
        const e = normalise(kind, { ...entity, id });
        if (e) db.entities[kind][id] = e;
      }
    }
    if (Array.isArray(parsed.links)) {
      db.links = parsed.links
        .filter(l => l && typeof l === "object" && l.from && l.to && KINDS.includes(l.from.kind) && KINDS.includes(l.to.kind))
        .slice(0, 2000)
        .map(l => ({ from: { kind: l.from.kind, id: String(l.from.id) }, to: { kind: l.to.kind, id: String(l.to.id) }, rel: String(l.rel || "related"), note: l.note ? String(l.note).slice(0, 500) : "" }));
    }
    return db;
  }

  function normalise(kind, entity) {
    if (!entity || typeof entity !== "object") return null;
    const id = String(entity.id || "");
    if (!id) return null;
    const data = clean(entity.data || {}, 0) || {};
    let spread = null;
    if (entity.spread && typeof entity.spread === "object") {
      const cards = Array.isArray(entity.spread.cards)
        ? entity.spread.cards.slice(0, 12).map(c => ({ position: String((c && c.position) || ""), card: Number(c && c.card) || 0, up: c ? c.up !== false : true }))
        : [];
      spread = {
        target: ["npc", "twist", "story"].includes(entity.spread.target) ? entity.spread.target : "npc",
        cards,
        reading: typeof entity.spread.reading === "string" ? entity.spread.reading.slice(0, 20000) : ""
      };
    }
    const name = String(entity.name || data.name || "").slice(0, 200);
    return {
      id,
      kind,
      name,
      source: String(entity.source || "unknown").slice(0, 40),
      writer: String(entity.writer || "").slice(0, 20),
      created: typeof entity.created === "string" ? entity.created : new Date().toISOString(),
      updated: typeof entity.updated === "string" ? entity.updated : new Date().toISOString(),
      data,
      spread,
      refs: clean(entity.refs || {}, 0) || {}
    };
  }

  function write(db) {
    db.format = FORMAT;
    db.updated = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch {
      return false;
    }
    emit();
    return true;
  }

  function emit() {
    const db = read();
    listeners.forEach(fn => {
      try {
        fn(db);
      } catch (err) {
        if (window.console) console.error("campaign listener failed", err);
      }
    });
  }

  function makeId(prefix) {
    const rand = Math.random().toString(36).slice(2, 8);
    const stamp = Date.now().toString(36);
    return `${prefix || "ent"}-${stamp}${rand}`;
  }

  function count(db) {
    return KINDS.reduce((n, k) => n + Object.keys(db.entities[k] || {}).length, 0);
  }

  function all(kind, db) {
    const source = db || read();
    const bucket = source.entities[kind] || {};
    return Object.values(bucket).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  }

  function get(kind, id, db) {
    const source = db || read();
    return (source.entities[kind] || {})[id] || null;
  }

  /* upsert(kind, {id?, name, data, refs, spread}) → the stored entity, or null. */
  function upsert(kind, entity) {
    if (!KINDS.includes(kind) || !entity || typeof entity !== "object") return null;
    const db = read();
    if (count(db) >= MAX_ENTITIES && !(entity.id && db.entities[kind][entity.id])) return null;
    const existing = entity.id ? db.entities[kind][entity.id] : null;
    const data = clean(entity.data || (existing && existing.data) || {}, 0) || {};
    if (sizeOf(data) > MAX_BYTES) return null;
    const next = normalise(kind, {
      id: (entity.id || (existing && existing.id) || makeId(kind)).slice(0, 80),
      kind,
      name: entity.name != null ? entity.name : existing ? existing.name : data.name,
      source: entity.source || (existing && existing.source) || "unknown",
      writer: WRITER,
      created: (existing && existing.created) || new Date().toISOString(),
      updated: new Date().toISOString(),
      data,
      spread: entity.spread !== undefined ? entity.spread : existing ? existing.spread : null,
      refs: { ...(existing && existing.refs), ...(entity.refs || {}) }
    });
    if (!next) return null;
    db.entities[kind][next.id] = next;
    if (!write(db)) return null;
    return next;
  }

  function patch(kind, id, changes) {
    const existing = get(kind, id);
    if (!existing) return null;
    return upsert(kind, {
      ...existing,
      ...changes,
      id,
      data: { ...existing.data, ...(changes.data || {}) },
      refs: { ...existing.refs, ...(changes.refs || {}) }
    });
  }

  function remove(kind, id) {
    const db = read();
    if (!db.entities[kind] || !db.entities[kind][id]) return false;
    delete db.entities[kind][id];
    db.links = db.links.filter(l => !(l.from.kind === kind && l.from.id === id) && !(l.to.kind === kind && l.to.id === id));
    return write(db);
  }

  function same(a, b) {
    return a && b && a.kind === b.kind && a.id === b.id;
  }

  function link(from, to, rel, note) {
    if (!from || !to || !KINDS.includes(from.kind) || !KINDS.includes(to.kind)) return false;
    const db = read();
    if (!db.entities[from.kind][from.id] || !db.entities[to.kind][to.id]) return false;
    if (db.links.some(l => same(l.from, from) && same(l.to, to) && l.rel === (rel || "related"))) return true;
    db.links.push({ from: { kind: from.kind, id: from.id }, to: { kind: to.kind, id: to.id }, rel: String(rel || "related").slice(0, 40), note: note ? String(note).slice(0, 500) : "" });
    return write(db);
  }

  function unlink(from, to, rel) {
    const db = read();
    const before = db.links.length;
    db.links = db.links.filter(l => !(same(l.from, from) && same(l.to, to) && (!rel || l.rel === rel)));
    return db.links.length !== before ? write(db) : false;
  }

  function linksOf(kind, id, rel) {
    const db = read();
    const side = l => (l.from.kind === kind && l.from.id === id ? l.to : l.to.kind === kind && l.to.id === id ? l.from : null);
    return db.links
      .filter(l => (!rel || l.rel === rel) && ((l.from.kind === kind && l.from.id === id) || (l.to.kind === kind && l.to.id === id)))
      .map(l => ({ ...l, other: side(l), entity: (() => { const o = side(l); return o ? get(o.kind, o.id, db) : null; })() }))
      .filter(l => l.entity);
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  /* A debounced writer: tools call save(kind, entity) on every keystroke and the
   * store coalesces. Keeps the campaign from churning on each character typed. */
  function saver(delay) {
    const pending = new Map();
    let timer = null;
    function flush() {
      timer = null;
      pending.forEach((entity, kind) => upsert(kind, entity));
      pending.clear();
    }
    return function save(kind, entity) {
      pending.set(kind, entity);
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, delay == null ? 500 : delay);
    };
  }

  function exportAll() {
    return read();
  }

  function importAll(x, mode) {
    if (!x || typeof x !== "object" || x.format !== FORMAT || !x.entities) throw new Error("That file is not a Great Dark campaign.");
    const incoming = normaliseAll(x);
    const db = mode === "replace" ? empty() : read();
    for (const kind of KINDS) {
      for (const [id, entity] of Object.entries(incoming.entities[kind] || {})) {
        if (count(db) >= MAX_ENTITIES && !db.entities[kind][id]) continue;
        db.entities[kind][id] = entity;
      }
    }
    for (const l of incoming.links) {
      if (!db.links.some(x2 => same(x2.from, l.from) && same(x2.to, l.to) && x2.rel === l.rel)) db.links.push(l);
    }
    write(db);
    return db;
  }

  function normaliseAll(x) {
    const db = empty();
    for (const kind of KINDS) {
      for (const [id, entity] of Object.entries((x.entities && x.entities[kind]) || {})) {
        const e = normalise(kind, { ...entity, id });
        if (e) db.entities[kind][id] = e;
      }
    }
    if (Array.isArray(x.links)) {
      x.links.slice(0, 2000).forEach(l => {
        if (!l || !l.from || !l.to || !KINDS.includes(l.from.kind) || !KINDS.includes(l.to.kind)) return;
        db.links.push({ from: { kind: l.from.kind, id: String(l.from.id) }, to: { kind: l.to.kind, id: String(l.to.id) }, rel: String(l.rel || "related"), note: l.note ? String(l.note).slice(0, 500) : "" });
      });
    }
    return db;
  }

  function purge() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      return false;
    }
    emit();
    return true;
  }

  window.addEventListener("storage", e => {
    if (e.key === KEY) emit();
  });

  window.CtgdCampaign = {
    KEY,
    FORMAT,
    KINDS,
    WRITER,
    read,
    write,
    empty,
    all,
    get,
    count,
    upsert,
    patch,
    remove,
    link,
    unlink,
    linksOf,
    subscribe,
    saver,
    makeId,
    exportAll,
    importAll,
    purge
  };
})();

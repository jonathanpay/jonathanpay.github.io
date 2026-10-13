// A one-line, result-aware pointer to the tool's course, shown at the foot of
// the results panel once a result is on screen. For example, CURVE says which
// element scored lowest and that CURVE is taught in The Buyer's Mind.
//
// Only the seven tools that lead with a live course have one (a contextual
// line pointing at a waitlist is low value). The tools' own bundles are
// minified build output, so this module does not change them: it watches the
// results panel and reads what the tool has already rendered. If a panel's
// markup changes and the reader no longer matches, the line just doesn't
// appear. Plan: _notes/email-tools-course-ctas-plan.md
//
// Copy rules: a line names its course with the {course} token (rendered as a
// link), and states only what a live course is known to cover.

import { COURSES, TOOLS, courseUrl } from "./course-ctas.js";

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// ---- Parsing what the tools render (pure, so it can be tested) -----------

// "Trust", "Competitive & Spontaneous", or "Mixed / Neutral".
export function parseDominant(text) {
  const t = (text || "").trim();
  if (!t) return null;
  if (/^mixed/i.test(t)) return { kind: "mixed" };
  const parts = t.split(/\s+&\s+/);
  if (parts.length === 2) return { kind: "tie", a: parts[0], b: parts[1] };
  return { kind: "one", a: t };
}

// "Weakest element: Relevance" or "All five elements present".
export function parseCurveTip(title) {
  const m = /weakest element:\s*(\w+)/i.exec(title || "");
  if (m) return { weakest: m[1] };
  return /all five/i.test(title || "") ? { weakest: null } : null;
}

// "... most likely to resonate with Humanistic buyer types."
export function parseBuyerNote(text) {
  const m = /resonate with (\w+) buyer types?/i.exec(text || "");
  return m ? { buyer: m[1] } : null;
}

// "⚠ Found 3 critical issues and 2 warnings." or "✓ No accessibility issues found".
export function parseAccessibility(text) {
  const t = text || "";
  if (/no accessibility issues/i.test(t)) return { critical: 0, warnings: 0 };
  const critical = /(\d+)\s+critical/i.exec(t);
  const warnings = /(\d+)\s+warning/i.exec(t);
  if (!critical && !warnings) return null;
  return { critical: critical ? +critical[1] : 0, warnings: warnings ? +warnings[1] : 0 };
}

// "⚠ Found 2 unique tokens. Issues: 1 token without a fallback." or
// "✓ Found 1 unique token — all have fallback values." No tokens found means
// there is nothing to say, so no line.
export function parsePersonalisation(text) {
  const t = (text || "").trim();
  if (!t || /no personalisation tokens/i.test(t)) return null;
  return { issues: /issues?:|⚠/i.test(t) };
}

// The three DMARC card badges, e.g. "Found & valid", "Not found", "Checking…".
export function parseDmarcBadges(badges) {
  if (!badges || badges.length !== 3) return null;
  const labels = badges.map((b) => (b || "").trim());
  if (labels.some((b) => !b || /checking/i.test(b))) return null;
  return {
    valid: labels.filter((b) => /found & valid/i.test(b)).length,
    attention: labels.filter((b) => /with an issue|^not found/i.test(b)).length,
  };
}

// ---- The lines (pure) ------------------------------------------------------

const APPEAL_TAIL = "Emotional triggers work on System 1 thinking, which {course} covers.";
const PERSONA_TAIL = "{course} teaches you to write for all four buyer types, including the ones your copy is missing.";
const CURVE_TAIL = "CURVE is taught in {course}, alongside System 1 and System 2 thinking.";
const PERSONALISATION_TAIL =
  "The strategic half, personalising by buyer modality, is the subject of {course}.";

export const CONTEXT = {
  "emotional-appeal": {
    panel: "#appeal-results",
    read: (panel) => parseDominant(panel.querySelector("#dominant-badge")?.textContent),
    line: (s) =>
      s.kind === "one"
        ? `Your copy leans on ${s.a}. ${APPEAL_TAIL}`
        : s.kind === "tie"
          ? `Your copy splits between ${s.a} and ${s.b}. ${APPEAL_TAIL}`
          : `No emotional trigger stands out. ${APPEAL_TAIL}`,
  },
  persona: {
    panel: "#persona-results",
    read: (panel) => parseDominant(panel.querySelector("#dominant-badge")?.textContent),
    line: (s) =>
      s.kind === "one"
        ? `Your copy speaks mostly to ${s.a} buyers. ${PERSONA_TAIL}`
        : s.kind === "tie"
          ? `Your copy speaks to ${s.a} and ${s.b} buyers. ${PERSONA_TAIL}`
          : `No buyer type stands out in this copy. {course} teaches you to write for each of the four.`,
  },
  curve: {
    panel: "#curve-results",
    read: (panel) => parseCurveTip(panel.querySelector("#curve-tip-title")?.textContent),
    line: (s) =>
      s.weakest
        ? `Your weakest element is ${s.weakest}. ${CURVE_TAIL}`
        : `All five elements present. ${CURVE_TAIL}`,
  },
  f2b: {
    panel: "#f2b-results",
    read: (panel) => {
      const note = panel.querySelector("#buyer-type-note");
      return note && note.style.display !== "none" ? parseBuyerNote(note.textContent) : null;
    },
    line: (s) => `This benefit speaks to ${s.buyer} buyers. How buyers decide is the subject of {course}.`,
  },
  personalisation: {
    panel: "#pc-results",
    read: (panel) => parsePersonalisation(panel.querySelector("#pc-summary")?.textContent),
    line: (s) =>
      s.issues
        ? `Fixing tokens is the technical half of personalisation. ${PERSONALISATION_TAIL}`
        : `Clean tokens are the technical half of personalisation. ${PERSONALISATION_TAIL}`,
  },
  accessibility: {
    panel: "#ax-results",
    read: (panel) => parseAccessibility(panel.querySelector("#ax-summary")?.textContent),
    line: (s) =>
      s.critical
        ? `${plural(s.critical, "critical issue", "critical issues")} to fix. Accessibility is a module of {course}.`
        : s.warnings
          ? `${plural(s.warnings, "warning", "warnings")} to look at. Accessibility is a module of {course}.`
          : "No issues found. Accessibility is a module of {course}.",
  },
  "dmarc-checker": {
    panel: "#dmarc-results",
    read: (panel) =>
      parseDmarcBadges([...panel.querySelectorAll(".dmarc-status-badge")].map((b) => b.textContent)),
    line: (s) =>
      s.valid === 3
        ? "SPF, DKIM and DMARC all found. Authentication is step one; {course} covers the rest of deliverability."
        : s.attention
          ? `${s.attention} of 3 records ${s.attention === 1 ? "needs" : "need"} attention. {course} covers authentication from the ground up.`
          : "Some checks were inconclusive. {course} covers authentication from the ground up.",
  },
};

export function lineFor(tool, state) {
  const config = CONTEXT[tool];
  return config && state ? config.line(state) : null;
}

// ---- Rendering --------------------------------------------------------------

function render(panel, tool, text) {
  const existing = panel.querySelector(":scope > .course-context");
  if (existing && existing.dataset.key === text) return;
  existing?.remove();

  const slug = TOOLS[tool].primary;
  const course = COURSES[slug];
  const [before, after = ""] = text.split("{course}");

  const link = document.createElement("a");
  link.href = courseUrl(slug, tool, "result");
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = course.title;

  const line = document.createElement("p");
  line.className = `course-context is-${course.level || "none"}`;
  line.dataset.key = text;
  line.append(before, link, after);
  panel.append(line);
}

function remove(panel) {
  panel.querySelector(":scope > .course-context")?.remove();
}

export function watch(tool, root = document) {
  const config = CONTEXT[tool];
  const panel = config && root.querySelector(config.panel);
  if (!panel) return false;

  let timer = null;
  const update = () => {
    timer = null;
    const state = panel.classList.contains("visible") ? config.read(panel) : null;
    const text = state && config.line(state);
    if (text) render(panel, tool, text);
    else remove(panel);
  };
  // Our own insert or removal triggers this again, but update() is idempotent.
  new MutationObserver(() => {
    if (timer === null) timer = setTimeout(update, 120);
  }).observe(panel, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
  update();
  return true;
}

if (typeof document !== "undefined") {
  const start = () => {
    const tool = document.querySelector("[data-course-cta]")?.dataset.courseCta;
    if (tool) watch(tool);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
}

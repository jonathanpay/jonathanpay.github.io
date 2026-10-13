import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { COURSES, TOOLS } from "../email-tools/assets/course-ctas.js";
import {
  CONTEXT,
  lineFor,
  parseAccessibility,
  parseBuyerNote,
  parseCurveTip,
  parseDmarcBadges,
  parseDominant,
  parsePersonalisation,
} from "../email-tools/assets/course-context.js";

const SEVEN = ["emotional-appeal", "persona", "curve", "f2b", "personalisation", "accessibility", "dmarc-checker"];

test("contextual lines exist for exactly the seven live-led tools", () => {
  assert.deepEqual(Object.keys(CONTEXT).sort(), [...SEVEN].sort());
  for (const tool of SEVEN) {
    assert.equal(COURSES[TOOLS[tool].primary].status, "live", `${tool}: a contextual line should point at a live course`);
  }
});

test("dominant badge text: one, tie, mixed", () => {
  assert.deepEqual(parseDominant("Trust"), { kind: "one", a: "Trust" });
  assert.deepEqual(parseDominant("Competitive & Spontaneous"), { kind: "tie", a: "Competitive", b: "Spontaneous" });
  assert.deepEqual(parseDominant("Mixed / Neutral"), { kind: "mixed" });
  assert.equal(parseDominant(""), null);
  assert.equal(parseDominant(undefined), null);
});

test("CURVE tip title", () => {
  assert.deepEqual(parseCurveTip("Weakest element: Relevance"), { weakest: "Relevance" });
  assert.deepEqual(parseCurveTip("All five elements present"), { weakest: null });
  assert.equal(parseCurveTip("Something else"), null);
});

test("buyer-type note", () => {
  assert.deepEqual(
    parseBuyerNote("This benefit is most likely to resonate with Humanistic buyer types. Check your full email in the Buyer Persona Matcher →"),
    { buyer: "Humanistic" },
  );
  assert.equal(parseBuyerNote(""), null);
});

test("accessibility summary", () => {
  assert.deepEqual(parseAccessibility("⚠ Found 3 critical issues and 2 warnings. See the breakdown below"), { critical: 3, warnings: 2 });
  assert.deepEqual(parseAccessibility("⚠ Found 1 critical issue."), { critical: 1, warnings: 0 });
  assert.deepEqual(parseAccessibility("⚠ Found 2 warnings."), { critical: 0, warnings: 2 });
  assert.deepEqual(parseAccessibility("✓ No accessibility issues found across the checks below."), { critical: 0, warnings: 0 });
  assert.equal(parseAccessibility(""), null);
});

test("personalisation summary", () => {
  assert.deepEqual(parsePersonalisation("⚠ Found 2 unique tokens. Issues: 1 token without a fallback."), { issues: true });
  assert.deepEqual(parsePersonalisation("✓ Found 1 unique token — all have fallback values."), { issues: false });
  assert.equal(parsePersonalisation("— No personalisation tokens found No Klaviyo-style tokens were detected in your copy."), null);
  assert.equal(parsePersonalisation(""), null);
});

test("DMARC badges wait for all three checks", () => {
  assert.equal(parseDmarcBadges(["Found & valid", "Checking…", "Found & valid"]), null);
  assert.equal(parseDmarcBadges(["Found & valid", "Found & valid"]), null);
  assert.deepEqual(parseDmarcBadges(["Found & valid", "Found & valid", "Found & valid"]), { valid: 3, attention: 0 });
  assert.deepEqual(parseDmarcBadges(["Found & valid", "Found, with an issue", "Inconclusive"]), { valid: 1, attention: 1 });
  assert.deepEqual(parseDmarcBadges(["Not found", "Not found", "Couldn't complete this check"]), { valid: 0, attention: 2 });
});

const SAMPLES = {
  "emotional-appeal": [{ kind: "one", a: "Trust" }, { kind: "tie", a: "Fear", b: "Hope" }, { kind: "mixed" }],
  persona: [{ kind: "one", a: "Competitive" }, { kind: "tie", a: "Competitive", b: "Spontaneous" }, { kind: "mixed" }],
  curve: [{ weakest: "Urgency" }, { weakest: null }],
  f2b: [{ buyer: "Methodical" }],
  personalisation: [{ issues: true }, { issues: false }],
  accessibility: [{ critical: 3, warnings: 2 }, { critical: 0, warnings: 2 }, { critical: 0, warnings: 0 }],
  "dmarc-checker": [{ valid: 3, attention: 0 }, { valid: 1, attention: 2 }, { valid: 1, attention: 0 }],
};

test("every state gives one sentence pair that links the course once, with no dates or promises", () => {
  const banned = /\b(launch(es|ing)?|coming soon|waitlist|\d{4})\b/i;
  for (const tool of SEVEN) {
    for (const state of SAMPLES[tool]) {
      const text = lineFor(tool, state);
      assert.ok(text, `${tool}: no line for ${JSON.stringify(state)}`);
      assert.equal(text.split("{course}").length, 2, `${tool}: {course} must appear once: ${text}`);
      assert.doesNotMatch(text, banned, `${tool}: ${text}`);
      assert.ok(!/undefined|NaN|null/.test(text), `${tool}: bad interpolation: ${text}`);
    }
  }
});

test("lines carry the result", () => {
  assert.match(lineFor("curve", { weakest: "Urgency" }), /weakest element is Urgency/);
  assert.match(lineFor("accessibility", { critical: 1, warnings: 0 }), /^1 critical issue to fix/);
  assert.match(lineFor("accessibility", { critical: 3, warnings: 0 }), /^3 critical issues to fix/);
  assert.match(lineFor("dmarc-checker", { valid: 1, attention: 2 }), /^2 of 3 records need attention/);
  assert.match(lineFor("dmarc-checker", { valid: 2, attention: 1 }), /^1 of 3 records needs attention/);
  assert.match(lineFor("persona", { kind: "tie", a: "Competitive", b: "Spontaneous" }), /Competitive and Spontaneous/);
  assert.equal(lineFor("curve", null), null);
  assert.equal(lineFor("sscc", { weakest: "x" }), null);
});

test("each of the seven pages loads the module and has the panel it watches", () => {
  const pages = {
    "emotional-appeal": "emotional-appeal-tool", persona: "persona-tool", curve: "curve-tool", f2b: "f2b-tool",
    personalisation: "personalisation-tool", accessibility: "accessibility-tool", "dmarc-checker": "dmarc-checker-tool",
  };
  for (const [tool, page] of Object.entries(pages)) {
    const html = readFileSync(new URL(`../email-tools/${page}.html`, import.meta.url), "utf8");
    assert.ok(html.includes("course-context.js"), `${page}: module not loaded`);
    const id = CONTEXT[tool].panel.slice(1);
    assert.ok(html.includes(`id="${id}"`), `${page}: no panel #${id}`);
  }
});

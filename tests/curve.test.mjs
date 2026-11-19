import { test } from "node:test";
import assert from "node:assert/strict";
import { analyseSubjectLine } from "../email-tools/assets/curve-score.js";

const levels = (line) =>
  Object.fromEntries(Object.entries(analyseSubjectLine(line)).map(([k, v]) => [k, v.level]));

test("a plain subject line has nothing but what it actually contains", () => {
  assert.deepEqual(levels("Hello"), {
    curiosity: "low", urgency: "low", relevance: "low", value: "low", emotion: "low",
  });
  assert.deepEqual(levels("Monthly update"), {
    curiosity: "low", urgency: "low", relevance: "low", value: "low", emotion: "low",
  });
});

test("counts are numbers, never objects or NaN", () => {
  for (const r of Object.values(analyseSubjectLine("Last chance: your free guide ends tonight"))) {
    assert.equal(typeof r.count, "number");
    assert.ok(Number.isFinite(r.count));
  }
});

test("each element is picked up by its own signals", () => {
  const l = levels("Last chance: your free guide ends tonight");
  assert.equal(l.urgency, "high"); // last chance, ends, tonight
  assert.equal(l.relevance, "medium"); // "your"
  assert.notEqual(l.value, "low"); // free, guide
  assert.equal(levels("Why do most welcome emails fail?").curiosity !== "low", true);
  assert.equal(levels("{first_name}, quick one").relevance, "high");
  assert.equal(levels("Save 20% this weekend").value, "high");
});

test("word boundaries: 'know' is not urgency's 'now'", () => {
  assert.equal(levels("Things we know").urgency, "low");
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHypothesis, validate } from "../email-tools/assets/hypothesis.js";
import { METRICS, OBJECTIVES, FACTORS, PROGRAMMES, LEVERS } from "../email-tools/assets/hypothesis-content.js";

const base = {
  programme: "promotional",
  objective: "engagement",
  problem: "Promotional emails get opened but the click rate is low",
  factor: "subject-line",
  change: "the subject line from a product announcement to a benefit-led line",
  metric: "click-rate",
  direction: "increase",
  lift: "10",
  baseline: "3.2",
  because: "it speaks to what the reader gains rather than what we're announcing",
};
const check = (result, id) => result.checks.find((c) => c.id === id);

test("builds the hypothesis sentence", () => {
  const r = buildHypothesis(base);
  assert.equal(
    r.sentence,
    "I think that by changing the subject line from a product announcement to a benefit-led line, it will cause the click rate to increase by at least 10% (relative) because it speaks to what the reader gains rather than what we're announcing."
  );
});

test("a complete, sensible hypothesis passes every check", () => {
  const r = buildHypothesis(base);
  assert.deepEqual(r.checks.map((c) => c.status), ["ok", "ok", "ok", "ok"]);
});

test("trailing full stops and spaces are trimmed before the sentence is built", () => {
  const r = buildHypothesis({ ...base, change: "  the CTA colour.  ", because: "it stands out. " });
  assert.match(r.sentence, /changing the CTA colour, it will/);
  assert.match(r.sentence, /because it stands out\.$/);
});

test("a blank because is flagged and the sentence keeps a placeholder", () => {
  const r = buildHypothesis({ ...base, because: "" });
  assert.match(r.sentence, /because \[add your reason\]\.$/);
  assert.equal(check(r, "has-because").status, "warn");
  assert.match(check(r, "has-because").detail, /what won, but not why/);
});

test("no lift means the hypothesis can't fail, and says so", () => {
  const r = buildHypothesis({ ...base, lift: "" });
  assert.equal(check(r, "testable").status, "warn");
  assert.match(r.sentence, /cause the click rate to increase because/);
  assert.ok(!r.durationUrl.includes("lift="));
});

test("opens are flagged as unreliable", () => {
  const r = buildHypothesis({ ...base, metric: "open-rate" });
  assert.equal(check(r, "metric-reliability").status, "warn");
  assert.match(check(r, "metric-reliability").detail, /Apple Mail Privacy Protection/);
});

test("a metric that doesn't match the objective is flagged with alternatives", () => {
  const r = buildHypothesis({ ...base, objective: "conversion", metric: "click-rate" });
  assert.equal(check(r, "metric-fit").status, "warn");
  assert.match(check(r, "metric-fit").detail, /conversion rate/);
});

test("more than one change is flagged", () => {
  for (const change of ["the subject line and the preheader", "the offer + the CTA", "the hero image as well as the headline"]) {
    assert.equal(check(buildHypothesis({ ...base, change }), "single-change").status, "warn", change);
  }
  assert.equal(check(buildHypothesis(base), "single-change").status, "ok");
});

test("decrease metrics read correctly", () => {
  const r = buildHypothesis({ ...base, objective: "list-health", metric: "unsubscribe-rate", direction: "decrease", lift: "20" });
  assert.match(r.sentence, /cause the unsubscribe rate to decrease by at least 20% \(relative\)/);
  assert.equal(check(r, "metric-fit").status, "ok");
});

test("Duration Calculator hand-off carries hypothesis, baseline and lift", () => {
  const url = new URL(buildHypothesis(base).durationUrl, "https://example.test/email-tools/");
  assert.equal(url.pathname, "/email-tools/ab-duration-tool.html");
  assert.equal(url.searchParams.get("baseline"), "3.2");
  assert.equal(url.searchParams.get("lift"), "10");
  assert.match(url.searchParams.get("hypothesis"), /^I think that by changing the subject line/);
});

test("baselines the Duration Calculator can't take are not passed on", () => {
  const tiny = buildHypothesis({ ...base, metric: "complaint-rate", direction: "decrease", baseline: "0.02" });
  assert.ok(!tiny.durationUrl.includes("baseline="));
  assert.match(tiny.durationNote, /0\.1%/);
  const revenue = buildHypothesis({ ...base, objective: "revenue", metric: "revenue-per-email", baseline: "0.45" });
  assert.ok(!revenue.durationUrl.includes("baseline="));
  assert.match(revenue.durationNote, /percentage rates/);
});

test("Planner row has the four columns, tab separated", () => {
  const r = buildHypothesis(base);
  assert.deepEqual(r.plannerTsv.split("\t"), [
    "The subject line from a product announcement to a benefit-led line",
    "Click rate to increase by at least 10% (relative)",
    "it speaks to what the reader gains rather than what we're announcing",
    "Click rate",
  ]);
});

test("tabs and newlines in free text can't break the Planner row", () => {
  const r = buildHypothesis({ ...base, because: "line one\nline two\tmore" });
  assert.equal(r.plannerTsv.split("\t").length, 4);
  assert.ok(!r.plannerTsv.includes("\n"));
});

test("validate asks for what's missing", () => {
  assert.equal(validate(base).length, 0);
  assert.equal(validate({}).length, 3);
  assert.equal(validate({ ...base, change: "   " }).length, 1);
});

test("content is internally consistent", () => {
  const metricIds = new Set(METRICS.map((m) => m.id));
  for (const o of OBJECTIVES) for (const id of o.metrics) assert.ok(metricIds.has(id), `${o.id} -> ${id}`);
  for (const list of [METRICS, OBJECTIVES, FACTORS, PROGRAMMES, LEVERS]) {
    const ids = list.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate id");
  }
});

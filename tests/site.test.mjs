import { test } from "node:test";
import assert from "node:assert/strict";

// The Academy plugin sets window.HEA_ET_CONFIG before any tool script runs.
globalThis.window = {
  HEA_ET_CONFIG: { internal: true, pages: { "ab-duration": "/email-tools/ab-duration/", persona: "/email-tools/persona/?x=1" } },
};
const { toolUrl } = await import("../email-tools/assets/site.js");
const { courseUrl } = await import("../email-tools/assets/course-ctas.js");
const { buildHypothesis } = await import("../email-tools/assets/hypothesis.js");

test("tool links use the WordPress page addresses", () => {
  assert.equal(toolUrl("ab-duration"), "/email-tools/ab-duration/");
  assert.equal(toolUrl("ab-duration", "lift=10"), "/email-tools/ab-duration/?lift=10");
  assert.equal(toolUrl("persona", "a=b"), "/email-tools/persona/?x=1&a=b");
  assert.equal(toolUrl("sscc"), "sscc.html"); // not configured: falls back to the file
});

test("course links stay on the site with ?ref=", () => {
  assert.equal(courseUrl("foundation-email-a-b-testing", "ab-duration"), "/courses/foundation-email-a-b-testing/?ref=email-tools-ab-duration");
  assert.equal(courseUrl("x", "curve", "index"), "/courses/x/?ref=email-tools-curve-index");
});

test("the Hypothesis Builder hands over to the configured Duration page", () => {
  const r = buildHypothesis({
    programme: "promotional", objective: "engagement", factor: "subject-line", change: "a shorter subject line",
    metric: "click-rate", direction: "increase", lift: "10", baseline: "3", because: "it reads faster",
  });
  assert.ok(r.durationUrl.startsWith("/email-tools/ab-duration/?"), r.durationUrl);
});

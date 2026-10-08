import { test } from "node:test";
import assert from "node:assert/strict";
import { erf, twoSidedConfidence, zScoreEqualSamples } from "../email-tools/assets/stats.js";

const near = (actual, expected, tol = 0.1) =>
  assert.ok(Math.abs(actual - expected) <= tol, `expected ${expected} ±${tol}, got ${actual}`);

test("two-sided confidence at the standard critical values", () => {
  near(twoSidedConfidence(1.645), 90.0);
  near(twoSidedConfidence(1.96), 95.0);
  near(twoSidedConfidence(2.576), 99.0);
  near(twoSidedConfidence(3.03), 99.8);
});

test("confidence is symmetric and bounded", () => {
  near(twoSidedConfidence(0), 0, 1e-4);
  near(twoSidedConfidence(-1.96), twoSidedConfidence(1.96), 1e-9);
  assert.ok(twoSidedConfidence(10) <= 100);
});

test("erf matches known values", () => {
  near(erf(0), 0, 1e-6);
  near(erf(1), 0.8427008, 1e-6);
  near(erf(-1), -0.8427008, 1e-6);
});

test("z-score with equal sample sizes", () => {
  near(zScoreEqualSamples(1000, 0.025, 0.031), 0.81, 0.005);
  near(zScoreEqualSamples(5000, 0.025, 0.03), 1.53, 0.005);
});

test("no variance gives z of 0, not NaN", () => {
  assert.equal(zScoreEqualSamples(1000, 0, 0), 0);
  assert.equal(zScoreEqualSamples(1000, 1, 1), 0);
});

test("worked examples from tests/README.md", () => {
  near(twoSidedConfidence(zScoreEqualSamples(1000, 0.025, 0.031)), 58.4);
  near(twoSidedConfidence(zScoreEqualSamples(5000, 0.025, 0.03)), 87.4);
  near(twoSidedConfidence(zScoreEqualSamples(10000, 0.025, 0.03)), 96.9);
});

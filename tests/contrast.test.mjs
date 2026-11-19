import { test } from "node:test";
import assert from "node:assert/strict";
import { contrastRatio, fontSizePx, isLargeText, isBold } from "../email-tools/assets/contrast.js";

const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `expected ${b}, got ${a}`);

test("contrast ratios match known WCAG values", () => {
  near(contrastRatio([0, 0, 0], [255, 255, 255]), 21);
  near(contrastRatio([255, 255, 255], [255, 255, 255]), 1);
  near(contrastRatio([118, 118, 118], [255, 255, 255]), 4.54); // #767676, the lightest AA grey on white
});

test("font sizes in px and pt", () => {
  assert.equal(fontSizePx("16px"), 16);
  near(fontSizePx("12pt"), 16);
  assert.equal(fontSizePx("1.2em"), null);
});

test("WCAG large text is 24px, or 18.66px when bold", () => {
  assert.equal(isLargeText(18, false), false);
  assert.equal(isLargeText(23, false), false);
  assert.equal(isLargeText(24, false), true);
  assert.equal(isLargeText(18, true), false);
  assert.equal(isLargeText(19, true), true);
  assert.equal(isLargeText(fontSizePx("14pt"), isBold("bold")), true);
});

test("bold detection", () => {
  assert.equal(isBold("700"), true);
  assert.equal(isBold("bold"), true);
  assert.equal(isBold("400"), false);
  assert.equal(isBold(""), false);
});

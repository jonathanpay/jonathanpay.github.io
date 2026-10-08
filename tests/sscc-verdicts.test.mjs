import { test } from "node:test";
import assert from "node:assert/strict";
import { bandFor } from "../email-tools/assets/sscc-verdicts.js";

test("bands switch at 95 and 99", () => {
  assert.equal(bandFor(99).id, "highly-significant");
  assert.equal(bandFor(99.9).id, "highly-significant");
  assert.equal(bandFor(98.99).id, "significant");
  assert.equal(bandFor(95).id, "significant");
  assert.equal(bandFor(94.99).id, "not-significant");
  assert.equal(bandFor(0).id, "not-significant");
});

test("NaN and negative values fall into not significant", () => {
  assert.equal(bandFor(NaN).id, "not-significant");
  assert.equal(bandFor(-5).id, "not-significant");
});

test("non-significant wording does not claim there is no effect", () => {
  assert.match(bandFor(50).note, /doesn't mean there's no difference/);
});

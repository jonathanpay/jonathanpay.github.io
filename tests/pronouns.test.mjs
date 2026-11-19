import { test } from "node:test";
import assert from "node:assert/strict";
import { countPronouns } from "../email-tools/assets/pronouns.js";

test("counts brand and reader pronouns, including possessives and reflexives", () => {
  const r = countPronouns("We made this for you. It's yours, and ours too — treat yourself.");
  assert.equal(r.brand, 2); // we, ours
  assert.equal(r.customer, 3); // you, yours, yourself
});

test("contractions count by their pronoun, curly apostrophes included", () => {
  const r = countPronouns("We’re sure you'll love it");
  assert.deepEqual([r.brand, r.customer], [1, 1]);
});

test("percentages add up to 100", () => {
  const r = countPronouns("we we you");
  assert.equal(r.brandPct + r.customerPct, 100);
  assert.equal(r.brandPct, 67);
});

test("no pronouns gives a total of zero, not a 0/0 split", () => {
  const r = countPronouns("Sale ends Friday. Shop the range.");
  assert.equal(r.total, 0);
});

test("words containing pronouns are not pronouns", () => {
  assert.equal(countPronouns("youth outweigh ourselvesish").total, 0);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { countKeywordHits, scoreCategories, declineNote } from "../email-tools/assets/dominance-scorer.js";
import { EMOTIONAL_APPEALS } from "../email-tools/assets/appeal-keywords.js";

test("whole words only: know is not now, they is not hey", () => {
  assert.equal(countKeywordHits("we know they care", ["now", "hey"]).total, 0);
  assert.equal(countKeywordHits("shop now, hey you", ["now", "hey"]).total, 2);
});

test("a trailing * is a stem", () => {
  assert.equal(countKeywordHits("trusted by those who trust us", ["trust*"]).total, 2);
  assert.equal(countKeywordHits("entrust", ["trust*"]).total, 0);
});

test("multi-word keywords allow any whitespace between words", () => {
  assert.equal(countKeywordHits("last\n  chance", ["last chance"]).total, 1);
});

const cats = [
  { id: "a", name: "A", keywords: ["alpha"] },
  { id: "b", name: "B", keywords: ["beta"] },
];

test("clear leader is dominant", () => {
  const r = scoreCategories("alpha alpha alpha alpha beta", cats);
  assert.equal(r.verdict, "dominant");
  assert.equal(r.dominant.id, "a");
});

test("too few hits declines with a low-signal note", () => {
  const filler = "word ".repeat(100);
  const r = scoreCategories(`alpha ${filler}`, cats);
  assert.equal(r.verdict, "mixed");
  assert.equal(r.lowSignal, true);
  assert.match(declineNote(r, "tone"), /Only 1 tone signal in 101 words/);
});

test("long-form text declines with a long-form note", () => {
  const r = scoreCategories("alpha ".repeat(950), cats);
  assert.equal(r.verdict, "mixed");
  assert.equal(r.longForm, true);
  assert.match(declineNote(r, "tone"), /longer than a typical email \(950 words\)/);
});

test("no hits at all leaves the message to the tool", () => {
  assert.equal(declineNote(scoreCategories("nothing to see here", cats), "tone"), null);
});

test("dominant or tie verdicts need no decline note", () => {
  assert.equal(declineNote(scoreCategories("alpha alpha alpha alpha beta", cats), "tone"), null);
});

test("the shared appeal lexicon has no degenerate keywords", () => {
  for (const cat of EMOTIONAL_APPEALS) {
    for (const kw of cat.keywords) assert.ok(kw && kw !== "*" && kw === kw.toLowerCase(), `${cat.id}: "${kw}"`);
  }
});

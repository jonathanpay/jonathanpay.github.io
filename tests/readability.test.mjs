import { test } from "node:test";
import assert from "node:assert/strict";
import { words, sentences, syllables, fleschReadingEase, gunningFog, smog, suggestions } from "../email-tools/assets/readability.js";

const near = (a, b, tol = 0.5) => assert.ok(Math.abs(a - b) <= tol, `expected ${b} ±${tol}, got ${a}`);

test("syllables: silent endings dropped, sounded ones kept", () => {
  const cases = { the: 1, time: 1, makes: 1, jumped: 1, table: 2, people: 2, wanted: 2, needed: 2, beautiful: 3, newsletter: 3, "don't": 1, your: 1 };
  for (const [w, n] of Object.entries(cases)) assert.equal(syllables(w), n, w);
});

test("line breaks end sentences, decimals and thousands don't", () => {
  const email = "Hi Sam\n\nSave 2.5% on 10,000 sends this week. Here's how\nShop now";
  assert.deepEqual(sentences(email), ["Hi Sam", "Save 25% on 10000 sends this week", "Here's how", "Shop now"]);
});

test("contractions are one word", () => {
  assert.deepEqual(words("Don't miss it"), ["Don't", "miss", "it"]);
});

test("Flesch Reading Ease on a reference passage", () => {
  // 2 sentences, 14 words, 18 syllables: 206.835 - 1.015*7 - 84.6*(18/14)
  const r = fleschReadingEase("The cat sat on the mat today. It was a very happy little cat.");
  near(r.score, 206.835 - 1.015 * 7 - 84.6 * (18 / 14), 0.01);
  assert.match(r.label, /reading age/);
});

test("an email laid out on lines scores as short sentences, not one long one", () => {
  const email = "Hi Sam\nYour order is on its way\nTrack it here\nThanks for shopping with us\nThe Team";
  assert.ok(fleschReadingEase(email).score > 80);
  assert.ok(gunningFog(email).score < 6);
});

test("grades are labelled with a UK reading age", () => {
  assert.match(gunningFog("Simple words here. Short lines too.").label, /reading age about \d+/);
  assert.match(smog("Organisational communication necessitates considerable deliberation. ".repeat(5)).label, /university level/);
});

test("suggestions flag long sentences and polysyllables", () => {
  const long = "This is a sentence that keeps on going and going with far too many words in it for anyone to read comfortably.";
  assert.ok(suggestions(long).some(s => s.includes("very long sentence")));
  assert.deepEqual(suggestions("Short one."), []);
});

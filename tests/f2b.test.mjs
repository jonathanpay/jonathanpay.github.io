import { test } from "node:test";
import assert from "node:assert/strict";
import { detectCategory, fillTemplate, categoryKeywords, buyerTypeMap } from "../email-tools/assets/f2b-match.js";
import { templates } from "../email-tools/assets/f2b-templates.js";

test("the category with most hits wins, not the last one listed", () => {
  // time-saving (automat) + analytics (reporting, dashboard) + support (24/7, support)
  assert.equal(detectCategory("Automated reporting dashboard").category, "analytics");
  assert.equal(detectCategory("Automated workflows and scheduled sends").category, "time-saving");
});

test("keywords must start a word", () => {
  assert.equal(detectCategory("Android app").matched, false); // not "roi"
  assert.equal(detectCategory("Breakfast menu").matched, false); // not "fast"
  assert.equal(detectCategory("Escalate tickets").matched, false); // not "scale"
  assert.equal(detectCategory("Real-time ROI tracking").category, "performance");
});

test("no match falls back to ease-of-use and says so", () => {
  assert.deepEqual(detectCategory("Blue widgets"), { category: "ease-of-use", matched: false });
});

test("the feature is capitalised only where it starts a sentence", () => {
  assert.equal(fillTemplate("{feature} saves time.", "automated reporting"), "Automated reporting saves time.");
  assert.equal(fillTemplate("With {feature}, you win.", "automated reporting"), "With automated reporting, you win.");
  assert.equal(fillTemplate("Stop waiting. {feature} does it.", "smart sends"), "Stop waiting. Smart sends does it.");
  assert.equal(fillTemplate("{feature} works.", "Live chat."), "Live chat works.");
});

test("every industry has 6 templates for every category, each with {feature}", () => {
  const cats = Object.keys(categoryKeywords);
  assert.equal(Object.keys(templates).length, 8);
  for (const [vertical, byCat] of Object.entries(templates)) {
    assert.deepEqual(Object.keys(byCat).sort(), [...cats].sort(), vertical);
    for (const cat of cats) {
      assert.equal(byCat[cat].length, 6, `${vertical}/${cat}`);
      for (const t of byCat[cat]) assert.ok(t.includes("{feature}"), `${vertical}/${cat}: ${t}`);
    }
  }
});

test("every category maps to a buyer type", () => {
  for (const cat of Object.keys(categoryKeywords)) assert.ok(buyerTypeMap[cat], cat);
});

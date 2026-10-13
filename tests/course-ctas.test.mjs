import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COURSES,
  TOOLS,
  buttonLabel,
  courseUrl,
  statusLabel,
} from "../email-tools/assets/course-ctas.js";

const LIVE = [
  "intermediate-the-buyers-mind",
  "intermediate-buyer-modalities-genai",
  "email-design-course-for-beginners",
  "strategic-email-marketing-from-vision-to-value",
  "foundation-email-deliverability-fundamentals",
];

test("every tool points at courses that exist", () => {
  for (const [tool, cfg] of Object.entries(TOOLS)) {
    assert.ok(COURSES[cfg.primary], `${tool}: unknown primary ${cfg.primary}`);
    if (cfg.next) assert.ok(COURSES[cfg.next], `${tool}: unknown next ${cfg.next}`);
    assert.notEqual(cfg.primary, cfg.next, `${tool}: primary and next are the same`);
    assert.ok(cfg.why.length > 0, `${tool}: missing why`);
  }
});

test("all 13 tools are mapped", () => {
  assert.equal(Object.keys(TOOLS).length, 13);
});

test("course status is live or waitlist, and the live list matches the roster", () => {
  for (const [slug, c] of Object.entries(COURSES)) {
    assert.ok(["live", "waitlist"].includes(c.status), `${slug}: bad status`);
  }
  const live = Object.keys(COURSES).filter((s) => COURSES[s].status === "live");
  assert.deepEqual(live.sort(), [...LIVE].sort());
});

test("only live courses carry an offer", () => {
  for (const [slug, c] of Object.entries(COURSES)) {
    if (c.offer) assert.equal(c.status, "live", `${slug}: offer on a waitlist course`);
  }
});

test("every tool has a live course to act on today", () => {
  for (const [tool, cfg] of Object.entries(TOOLS)) {
    const statuses = [cfg.primary, cfg.next].filter(Boolean).map((s) => COURSES[s].status);
    assert.ok(statuses.includes("live"), `${tool}: nothing live to enrol in`);
  }
});

test("urls carry the UTM convention and the course slug", () => {
  const url = new URL(courseUrl("foundation-email-a-b-testing", "ab-duration"));
  assert.equal(url.origin + url.pathname, "https://holisticemailacademy.com/courses/foundation-email-a-b-testing/");
  assert.equal(url.searchParams.get("utm_source"), "hem-tools");
  assert.equal(url.searchParams.get("utm_medium"), "tool");
  assert.equal(url.searchParams.get("utm_campaign"), "ab-duration");
});

test("waitlist and live wording differ", () => {
  assert.equal(buttonLabel(COURSES["foundation-email-a-b-testing"]), "Join the waitlist →");
  assert.equal(buttonLabel(COURSES["intermediate-the-buyers-mind"]), "See the course →");
  assert.equal(statusLabel(COURSES["foundation-email-a-b-testing"]), "Waitlist");
  assert.equal(statusLabel(COURSES["intermediate-the-buyers-mind"]), "Available now");
});

test("waitlist copy promises no date or content detail", () => {
  const banned = /\b(module|modules|lesson|lessons|launch(es|ing)?|opens? (on|in)|coming (in|on)|\d{4}|q[1-4])\b/i;
  for (const [tool, cfg] of Object.entries(TOOLS)) {
    if (COURSES[cfg.primary].status === "waitlist") {
      assert.doesNotMatch(cfg.why, banned, `${tool}: why mentions a date or module`);
    }
    if (cfg.next && COURSES[cfg.next].status === "waitlist" && cfg.nextWhy) {
      assert.doesNotMatch(cfg.nextWhy, banned, `${tool}: nextWhy mentions a date or module`);
    }
  }
});

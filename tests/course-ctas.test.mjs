import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  COURSES,
  TOOLS,
  buttonLabel,
  courseUrl,
  pillClass,
  pillLabel,
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

test("utm_content is only added when asked for", () => {
  assert.equal(new URL(courseUrl("foundation-email-a-b-testing", "sscc")).searchParams.has("utm_content"), false);
  assert.equal(new URL(courseUrl("foundation-email-a-b-testing", "sscc", "index")).searchParams.get("utm_content"), "index");
});

test("every primary course has a level and a pill label, so the index can show it", () => {
  for (const [tool, cfg] of Object.entries(TOOLS)) {
    const c = COURSES[cfg.primary];
    assert.ok(["foundation", "intermediate"].includes(c.level), `${tool}: primary has no level`);
    assert.ok(c.pill, `${tool}: primary has no pill label`);
  }
});

test("pills show level and flag waitlist courses", () => {
  assert.equal(pillLabel(COURSES["foundation-email-a-b-testing"]), "● Foundation Testing · Waitlist");
  assert.equal(pillLabel(COURSES["intermediate-the-buyers-mind"]), "● Intermediate Buyer's Mind");
  assert.equal(pillClass(COURSES["intermediate-the-buyers-mind"]), "hea-pill hea-pill--intermediate");
});

test("every course has a level, so every card gets a colour", () => {
  for (const [slug, c] of Object.entries(COURSES)) {
    assert.ok(["foundation", "intermediate", "advanced"].includes(c.level), `${slug}: no level`);
  }
  for (const slug of [
    "intermediate-the-buyers-mind",
    "intermediate-buyer-modalities-genai",
    "strategic-email-marketing-from-vision-to-value",
  ]) {
    assert.equal(COURSES[slug].level, "intermediate", `${slug} should be Intermediate`);
  }
});

test("all three levels have a name and a pill class", () => {
  for (const level of ["foundation", "intermediate", "advanced"]) {
    const course = { level, pill: "Testing", status: "live" };
    assert.match(pillLabel(course), new RegExp(`^● ${level[0].toUpperCase()}${level.slice(1)} Testing$`));
    assert.equal(pillClass(course), `hea-pill hea-pill--${level}`);
  }
});

test("index cards point at each tool's primary course", () => {
  const html = readFileSync(new URL("../email-tools/index.html", import.meta.url), "utf8");
  const pills = [...html.matchAll(/<a href="([^"]+)"[^>]*data-course-pill="([^"]+)"/g)];
  assert.equal(pills.length, Object.keys(TOOLS).length);
  for (const [, href, tool] of pills) {
    assert.ok(TOOLS[tool], `index has a pill for unknown tool ${tool}`);
    assert.ok(href.includes(`/courses/${TOOLS[tool].primary}/`), `${tool}: index pill points at the wrong course`);
  }
});

test("every tool page has a course block for its own key", () => {
  const pages = {
    hypothesis: "hypothesis-tool", "ab-duration": "ab-duration-tool", sscc: "sscc", wewe: "wewe-tool",
    ers: "ers-tool-feedback", tone: "tone-tool", "emotional-appeal": "emotional-appeal-tool",
    curve: "curve-tool", persona: "persona-tool", f2b: "f2b-tool", personalisation: "personalisation-tool",
    accessibility: "accessibility-tool", "dmarc-checker": "dmarc-checker-tool",
  };
  assert.deepEqual(Object.keys(pages).sort(), Object.keys(TOOLS).sort());
  for (const [tool, page] of Object.entries(pages)) {
    const html = readFileSync(new URL(`../email-tools/${page}.html`, import.meta.url), "utf8");
    assert.ok(html.includes(`data-course-cta="${tool}"`), `${page}: no course block`);
    assert.ok(html.includes("course-ctas.js") && html.includes("course-cta.css"), `${page}: block assets not loaded`);
    assert.doesNotMatch(html, /courses\/[a-z0-9-]+\/"[^>]*hea-btn/, `${page}: hard-coded course button left behind`);
  }
});

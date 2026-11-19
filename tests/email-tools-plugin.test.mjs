import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build, scopeCss, scopeSelector, rewriteLinks } from "../wordpress/build-email-tools.mjs";

const PLUGIN = new URL("../wordpress/hea-email-tools/", import.meta.url).pathname;

test("selectors are scoped to #hea-et", () => {
  assert.equal(scopeSelector(".tool-card"), "#hea-et .tool-card");
  assert.equal(scopeSelector(".hea h1"), "#hea-et h1");
  assert.equal(scopeSelector(".hea-pill"), "#hea-et .hea-pill");
  assert.equal(scopeSelector(":root"), "#hea-et");
  assert.equal(scopeSelector("body.hea"), "#hea-et.hea");
});

test("CSS scoping recurses into @media and leaves @font-face alone", () => {
  const out = scopeCss("/* c */ a, .b:not(.c, .d) { x: 1 } @media (max-width: 600px) { .e { y: 2 } } @font-face { font-family: X }");
  assert.match(out, /#hea-et a,#hea-et \.b:not\(\.c, \.d\)\{x: 1\}/);
  assert.match(out, /@media \(max-width: 600px\)\{#hea-et \.e\{y: 2\}/);
  assert.match(out, /@font-face\{font-family: X\}/);
});

test("links: tools become placeholders, Academy links stay on the site", () => {
  assert.equal(rewriteLinks('<a href="ab-duration-tool.html?x=1">'), '<a href="{{page:ab-duration}}?x=1">');
  assert.equal(
    rewriteLinks('<a href="https://holisticemailacademy.com/courses/c/?utm_source=hem-tools&amp;utm_medium=tool&amp;utm_campaign=tone&amp;utm_content=index" target="_blank" rel="noopener">'),
    '<a href="/courses/c/?ref=email-tools-tone-index">',
  );
  assert.equal(rewriteLinks('<a href="https://holisticemailacademy.com/contact/" class="b" target="_blank" rel="noopener">'), '<a href="/contact/" class="b">');
  assert.throws(() => rewriteLinks('<a href="missing.html">'), /unknown page/);
});

test("the committed plugin matches a fresh build of email-tools/", () => {
  const dir = mkdtempSync(join(tmpdir(), "hea-et-"));
  build(dir);
  for (const sub of ["templates", "assets/js", "assets/css"]) {
    const files = readdirSync(join(dir, sub)).sort();
    assert.deepEqual(readdirSync(join(PLUGIN, sub)).sort(), files, `${sub}: run node wordpress/build-email-tools.mjs`);
    for (const f of files) {
      assert.equal(readFileSync(join(PLUGIN, sub, f), "utf8"), readFileSync(join(dir, sub, f), "utf8"), `${sub}/${f} is stale: run node wordpress/build-email-tools.mjs`);
    }
  }
  assert.equal(readFileSync(join(PLUGIN, "tools.json"), "utf8"), readFileSync(join(dir, "tools.json"), "utf8"), "tools.json is stale");
});

test("templates: one H1 per page (the WordPress title), no HEM branding, no off-site Academy links", () => {
  for (const f of readdirSync(join(PLUGIN, "templates"))) {
    const html = readFileSync(join(PLUGIN, "templates", f), "utf8");
    assert.doesNotMatch(html, /<h1[\s>]/, f);
    assert.doesNotMatch(html, /Holistic Email Marketing|holisticemail\.com|utm_/, f);
    assert.doesNotMatch(html, /href="https:\/\/holisticemailacademy\.com/, f);
    assert.doesNotMatch(html, /href="[a-z0-9-]+\.html/, f);
  }
});

test("every module a page loads exists and is versioned", () => {
  const m = JSON.parse(readFileSync(join(PLUGIN, "tools.json"), "utf8"));
  assert.equal(Object.keys(m.tools).length, 14);
  for (const [key, tool] of Object.entries(m.tools)) {
    for (const js of tool.modules) assert.ok(m.scripts[js], `${key}: ${js}`);
    if (tool.css) assert.ok(m.styles[tool.css], `${key}: ${tool.css}`);
  }
  const tone = readFileSync(join(PLUGIN, "assets/js/tone.js"), "utf8");
  assert.match(tone, new RegExp(`from "\\./utils\\.js\\?v=${m.scripts["utils.js"]}"`));
});

test("every stylesheet rule is inside #hea-et", () => {
  for (const f of readdirSync(join(PLUGIN, "assets/css"))) {
    const css = readFileSync(join(PLUGIN, "assets/css", f), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of css.matchAll(/(^|\})\s*([^\s@{}][^{}]*)\{/g)) {
      for (const sel of m[2].replace(/\([^()]*\)/g, "()").split(",")) assert.match(sel.trim(), /^#hea-et|^\d+%|^from|^to/, `${f}: ${sel.trim()}`);
    }
  }
});

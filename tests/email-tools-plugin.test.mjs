import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build, scopeCss, scopeSelector, rewriteLinks, enlargeType, parseCopy, SEO, slugOf, pageUrl } from "../wordpress/build-email-tools.mjs";

const PLUGIN = fileURLToPath(new URL("../wordpress/hea-email-tools/", import.meta.url));

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

test("written content is on the page, not in the shortcode", () => {
  const m = build(mkdtempSync(join(tmpdir(), "hea-et-")));
  for (const [key, page] of Object.entries(m.pages)) {
    const tpl = readFileSync(join(PLUGIN, "templates", `${key}.html`), "utf8");
    assert.doesNotMatch(tpl, /class="(lead|tool-note|tool-section)"/, key);
    assert.ok(page.intro.length > 40, `${key}: intro`);
    assert.match(page.content, /^<!-- wp:group [^\n]*-->\n<div class="wp-block-group">\n<!-- wp:paragraph -->/, `${key}: opens with the intro`);
    if (key === "index") assert.doesNotMatch(page.content, /wp:shortcode/);
    else assert.match(page.content, new RegExp(`\\[hea_email_tool name="${key}"\\]`), key);
    assert.doesNotMatch(page.content.replace(/<div class="wp-block-group">/g, ""), /\{\{page:|<(section|div|span)\b/, key);
  }
  assert.equal((m.pages["dmarc-checker"].content.match(/<!-- wp:details -->/g) || []).length, 8);
});

test("type is enlarged and the background is the page's own", () => {
  assert.equal(enlargeType("a{font-size: 16px}"), "a{font-size: 18px}");
  assert.equal(enlargeType("a{font-size:10px}"), "a{font-size:13px}");
  assert.equal(enlargeType("--hea-text-sm: 14px;"), "--hea-text-sm: 16px;");
  const css = readFileSync(join(PLUGIN, "assets/css/email-tools.css"), "utf8");
  assert.match(css, /#hea-et\.hea-et\{[^}]*background:transparent/);
});

test("page copy: Markdown becomes blocks, About before the tool's notes and FAQ after", () => {
  const p = parseCopy("# wewe\n\n## About it\n\nSee [this](/x/) and `alt=\"\"`.\n\n### Q?\n\nA <b>.");
  assert.equal(p.wewe.length, 4);
  assert.match(p.wewe[1], /<p>See <a href="\/x\/">this<\/a> and <code>alt=""<\/code>\.<\/p>/);
  assert.match(p.wewe[3], /A &lt;b&gt;\./);
  const m = build(mkdtempSync(join(tmpdir(), "hea-et-")));
  const order = [...m.pages.wewe.content.matchAll(/<h2[^>]*>([^<]+)/g)].map((x) => x[1]);
  assert.deepEqual(order, ["About the We-We Calculator", "How it works", "Frequently asked questions"]);
});

test("search settings: every page has Yoast fields within Google's limits", () => {
  const m = build(mkdtempSync(join(tmpdir(), "hea-et-")));
  for (const key of Object.keys(m.tools)) {
    const s = SEO[key];
    assert.ok(s, `${key}: no entry in email-tools-seo.json`);
    assert.ok(s.title.length <= 60, `${key}: SEO title ${s.title.length} chars`);
    assert.ok(s.description.length >= 120 && s.description.length <= 155, `${key}: meta description ${s.description.length} chars`);
    const kp = s.keyphrase.toLowerCase();
    for (const f of ["title", "description", "intro"]) assert.ok(s[f].toLowerCase().includes(kp), `${key}: keyphrase missing from ${f}`);
    assert.equal(m.tools[key].description, s.description);
  }
});

test("search settings: slugs drive every page address and the intro sits above the tool", () => {
  const m = build(mkdtempSync(join(tmpdir(), "hea-et-")));
  assert.equal(pageUrl("sscc"), "/email-tools/significance-calculator/");
  assert.equal(pageUrl("index"), "/email-tools/");
  assert.equal(m.tools.sscc.slug, slugOf("sscc"));
  // Links written with a tool's key in the copy follow its slug.
  assert.match(m.pages["ab-duration"].content, /href="\/email-tools\/significance-calculator\/"/);
  assert.doesNotMatch(Object.values(m.pages).map((p) => p.content).join(""), /href="\/email-tools\/(sscc|ers|f2b|wewe|curve|hypothesis)\/"/);
  for (const key of Object.keys(m.tools)) {
    const c = m.pages[key].content;
    assert.ok(c.indexOf(SEO[key].intro.replace(/&/g, "&amp;").slice(0, 30)) > -1, `${key}: intro`);
    if (key !== "index") assert.ok(c.indexOf(SEO[key].intro.slice(0, 20).replace(/&/g, "&amp;")) < c.indexOf("wp:shortcode"), `${key}: intro above tool`);
  }
});

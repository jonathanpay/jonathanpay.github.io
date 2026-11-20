import { test } from "node:test";
import assert from "node:assert/strict";
import { analyseTokens, ESPs } from "../email-tools/assets/personalisation-rules.js";

const tok = (text, esp) => analyseTokens(text, esp).tokens;

test("every platform rule set is complete", () => {
  for (const [key, esp] of Object.entries(ESPs)) {
    for (const f of ["name", "tokenRegex", "extractVar", "detectFallback", "getFallbackValue", "platformNote"]) {
      assert.ok(esp[f] !== undefined, `${key}.${f}`);
    }
  }
  assert.equal(Object.keys(ESPs).length, 16);
});

test("a fallback on one use doesn't cover a bare use elsewhere", () => {
  const [t] = tok("Hi {{ first_name | default: 'there' }}, … thanks {{ first_name }}", "klaviyo");
  assert.equal(t.count, 2);
  assert.equal(t.withFallback, 1);
  assert.equal(t.hasFallback, false);
  assert.equal(t.fallbackValue, "there");
});

test("Brevo: the default filter is a fallback", () => {
  const [t] = tok('Hello {{ contact.FIRSTNAME | default:"there" }}', "brevo");
  assert.equal(t.varName, "contact.FIRSTNAME");
  assert.equal(t.hasFallback, true);
  assert.equal(t.fallbackValue, "there");
});

test("HubSpot: no invented 'fallback:' filter, defaults are set in HubSpot", () => {
  assert.doesNotMatch(ESPs.hubspot.platformNote, /fallback:/);
  assert.equal(ESPs.hubspot.noInlineFallback, true);
  const [t] = tok("Hi {{ contact.firstname }}", "hubspot");
  assert.equal(t.hasFallback, false);
});

test("Marketo: tokens with :default= are found and covered", () => {
  const ts = tok("Hi {{lead.First Name:default=Friend}} from {{company.Company Name}}", "marketo");
  assert.equal(ts.length, 2);
  assert.deepEqual([ts[0].varName, ts[0].hasFallback, ts[0].fallbackValue], ["lead.First Name", true, "Friend"]);
  assert.equal(ts[1].hasFallback, false);
});

test("SendGrid: insert with default=, or an if/else block", () => {
  const [a] = tok('Hello {{insert first_name "default=Friend"}}', "sendgrid");
  assert.deepEqual([a.varName, a.hasFallback, a.fallbackValue], ["first_name", true, "Friend"]);
  const [b] = tok("{{#if first_name}}{{first_name}}{{else}}Friend{{/if}}", "sendgrid");
  assert.equal(b.hasFallback, true);
  const [c] = tok("Hello {{first_name}}", "sendgrid");
  assert.equal(c.hasFallback, false);
});

test("Iterable: defaultIfEmpty is a fallback", () => {
  const [t] = tok('Hi {{defaultIfEmpty firstName "Friend"}}', "iterable");
  assert.deepEqual([t.varName, t.hasFallback, t.fallbackValue], ["firstName", true, "Friend"]);
});

test("Mailchimp: IF/ELSE block counts as a fallback, bare tag doesn't", () => {
  assert.equal(tok("*|IF:FNAME|* *|FNAME|*,*|ELSE:|* Hi,*|END:IF|*", "mailchimp")[0].hasFallback, true);
  assert.equal(tok("Hi *|FNAME|*", "mailchimp")[0].hasFallback, false);
});

test("a dotted field name in an #if block is matched literally", () => {
  const [t] = tok("{{#if user.name}}{{user.name}}{{else}}there{{/if}}", "pardot");
  assert.equal(t.hasFallback, true);
  assert.equal(tok("{{#if userXname}}{{user.name}}{{else}}x{{/if}}", "pardot")[0].hasFallback, false);
});

test("conditional blocks are counted", () => {
  const r = analyseTokens("{% if vip %}VIP{% endif %}{% if x %}", "klaviyo");
  assert.deepEqual([r.openCount, r.closeCount], [2, 1]);
});

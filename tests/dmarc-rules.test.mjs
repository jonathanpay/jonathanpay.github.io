import { test } from "node:test";
import assert from "node:assert/strict";
import { explainSPF, explainDMARC, explainDKIM, spfLookupCount } from "../email-tools/assets/dmarc-rules.js";

test("SPF: a normal record passes", () => {
  assert.equal(explainSPF(["v=spf1 include:_spf.google.com ~all"]).status, "pass");
  assert.equal(explainSPF(["google-site-verification=abc"]).status, "not-found");
});

test("SPF: bare a and mx count as lookups", () => {
  assert.equal(spfLookupCount("v=spf1 a mx include:x.com ip4:1.2.3.4 -all"), 3);
  assert.equal(spfLookupCount("v=spf1 a:mail.x.com mx/24 redirect=_spf.x.com"), 3);
});

test("SPF: more than 10 lookups warns", () => {
  const rec = "v=spf1 " + Array.from({ length: 11 }, (_, i) => `include:s${i}.com`).join(" ") + " -all";
  assert.equal(explainSPF([rec]).status, "warn");
});

test("SPF: +all and ?all are flagged, not passed", () => {
  assert.match(explainSPF(["v=spf1 include:x.com +all"]).message, /any server on the internet/);
  assert.match(explainSPF(["v=spf1 include:x.com ?all"]).message, /neutral/);
  assert.equal(explainSPF(["v=spf1 include:x.com"]).status, "warn");
  assert.equal(explainSPF(["v=spf1 redirect=_spf.x.com"]).status, "pass");
});

test("SPF: two records is a failure", () => {
  const r = explainSPF(["v=spf1 include:a.com ~all", "v=spf1 include:b.com ~all"]);
  assert.equal(r.status, "warn");
  assert.match(r.message, /only have one/);
});

test("DMARC: sp= doesn't hide the real policy", () => {
  const r = explainDMARC(["v=DMARC1; sp=none; p=reject; rua=mailto:x@y.com"]);
  assert.equal(r.status, "pass");
  assert.match(r.message, /p=reject/);
});

test("DMARC: none warns, quarantine passes, no policy warns", () => {
  assert.equal(explainDMARC(["v=DMARC1; p=none"]).status, "warn");
  assert.equal(explainDMARC(["v=DMARC1; p=quarantine; pct=100"]).status, "pass");
  assert.match(explainDMARC(["v=DMARC1; rua=mailto:x@y.com"]).message, /no valid policy/);
});

test("DMARC: two records is flagged", () => {
  assert.match(explainDMARC(["v=DMARC1; p=reject", "v=DMARC1; p=none"]).message, /ignore DMARC/);
});

test("DKIM: a key passes, an empty key is revoked", () => {
  assert.equal(explainDKIM(["v=DKIM1; k=rsa; p=MIIBIjANBg"], "s1").status, "pass");
  const revoked = explainDKIM(["v=DKIM1; p="], "s1");
  assert.equal(revoked.status, "warn");
  assert.match(revoked.message, /revoked/);
  assert.equal(explainDKIM(["something else"], "s1").status, "not-found");
});

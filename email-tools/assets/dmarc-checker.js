import { g as byId } from "./utils-jnLFB3bE.js";

const DOH_ENDPOINT = "https://dns.google/resolve";
const COMMON_DKIM_SELECTORS = ["google", "selector1", "selector2", "k1", "k2", "s1", "s2", "dkim", "mail", "default"];

function normaliseDomain(input) {
  return input
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .split("@").pop()
    .toLowerCase();
}

// Google's DoH JSON API can split a long TXT record across multiple quoted
// segments (e.g. `"v=spf1 ..." "include:..."`) — join them into one string.
function cleanTXT(raw) {
  return raw.replace(/^"|"$/g, "").split('" "').join("");
}

async function queryTXT(name) {
  const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(name)}&type=TXT`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DNS query failed (HTTP ${res.status})`);
  const data = await res.json();
  if (data.Status !== 0) return []; // NXDOMAIN / no records — not a fetch error
  return (data.Answer ?? []).filter((a) => a.type === 16).map((a) => cleanTXT(a.data));
}

export function explainSPF(records) {
  const spf = records.find((r) => /^v=spf1\b/i.test(r));
  if (!spf) {
    return { status: "not-found", record: null, message: "No SPF record found at this domain." };
  }
  const lookupCount = (spf.match(/\b(include|a|mx|ptr|exists|redirect)[:=]/gi) ?? []).length;
  if (lookupCount > 10) {
    return {
      status: "warn",
      record: spf,
      message: `Found, but this record has around ${lookupCount} DNS-lookup mechanisms (include/a/mx/ptr/exists/redirect). SPF fails validation ("permerror") above 10 — consider consolidating includes.`,
    };
  }
  if (!/[-~?]all\b/i.test(spf)) {
    return {
      status: "warn",
      record: spf,
      message: `Found, but there's no "all" mechanism at the end. Most setups should end in "-all" (hard fail) or "~all" (soft fail) so receiving servers know what to do with mail that doesn't match.`,
    };
  }
  return { status: "pass", record: spf, message: "A valid SPF record was found." };
}

export function explainDMARC(records) {
  const dmarc = records.find((r) => /^v=dmarc1\b/i.test(r));
  if (!dmarc) {
    return {
      status: "not-found",
      record: null,
      message: "No DMARC record found. Without one, receiving mail servers have no instructions for what to do with mail that fails SPF or DKIM checks.",
    };
  }
  const policyMatch = dmarc.match(/p=(none|quarantine|reject)/i);
  const policy = policyMatch ? policyMatch[1].toLowerCase() : null;
  if (!policy || policy === "none") {
    return {
      status: "warn",
      record: dmarc,
      message: `Found, but the policy is "p=none" (monitor-only) — failing mail isn't being quarantined or rejected yet. A reasonable starting point, but most senders should move to "quarantine" or "reject" once reports look clean.`,
    };
  }
  return {
    status: "pass",
    record: dmarc,
    message: `Found, with a policy of "p=${policy}" — mail that fails is being ${policy === "reject" ? "rejected" : "quarantined"}.`,
  };
}

export function explainDKIM(records, selectorTried) {
  const dkim = records.find((r) => /p=/i.test(r));
  if (!dkim) {
    return { status: "not-found", record: null, message: `No DKIM record found at selector "${selectorTried}".` };
  }
  return { status: "pass", record: dkim, selector: selectorTried, message: `A DKIM record was found at selector "${selectorTried}".` };
}

async function checkSPF(domain) {
  const records = await queryTXT(domain);
  return explainSPF(records);
}

async function checkDMARC(domain) {
  const records = await queryTXT(`_dmarc.${domain}`);
  return explainDMARC(records);
}

async function checkDKIM(domain, manualSelector) {
  const selectors = manualSelector ? [manualSelector] : COMMON_DKIM_SELECTORS;
  const attempts = await Promise.allSettled(
    selectors.map(async (sel) => ({ sel, records: await queryTXT(`${sel}._domainkey.${domain}`) }))
  );
  for (const attempt of attempts) {
    if (attempt.status === "fulfilled" && attempt.value.records.some((r) => /p=/i.test(r))) {
      return explainDKIM(attempt.value.records, attempt.value.sel);
    }
  }
  if (manualSelector) {
    return { status: "not-found", record: null, message: `No DKIM record found at selector "${manualSelector}".` };
  }
  return {
    status: "inconclusive",
    record: null,
    message: `None of the ${COMMON_DKIM_SELECTORS.length} common DKIM selectors we checked resolved. This doesn't confirm DKIM is missing — many providers use a selector we don't guess. If you know your selector, enter it above and check again.`,
  };
}

const STATUS_LABEL = {
  pass: "Found & valid",
  warn: "Found, with an issue",
  "not-found": "Not found",
  inconclusive: "Inconclusive",
  error: "Couldn't complete this check",
};

const STATUS_COLOR = {
  pass: "#166534",
  warn: "#92400E",
  "not-found": "#C53A4B",
  inconclusive: "#897680",
  error: "#897680",
};

function renderCard(cardKey, state) {
  const card = byId(`${cardKey}-card`);
  const badge = card.querySelector(".dmarc-status-badge");
  const recordBox = card.querySelector(".dmarc-record-box");
  const message = card.querySelector(".dmarc-message");
  const fallback = card.querySelector(".dmarc-fallback");

  if (state.loading) {
    badge.textContent = "Checking…";
    badge.style.color = "#897680";
    recordBox.style.display = "none";
    message.textContent = "";
    fallback.classList.remove("visible");
    return;
  }

  badge.textContent = STATUS_LABEL[state.status];
  badge.style.color = STATUS_COLOR[state.status];
  message.textContent = state.message;

  if (state.record) {
    recordBox.textContent = state.record;
    recordBox.style.display = "block";
  } else {
    recordBox.style.display = "none";
  }

  const needsFallback = state.status === "not-found" || state.status === "inconclusive" || state.status === "error";
  fallback.classList.toggle("visible", needsFallback);
}

function wireManualFallback(cardKey, explainFn) {
  const card = byId(`${cardKey}-card`);
  const input = card.querySelector(".dmarc-manual-input");
  const btn = card.querySelector(".dmarc-manual-btn");
  btn.addEventListener("click", () => {
    const pasted = input.value.trim();
    if (!pasted) return;
    const result = explainFn([pasted]);
    renderCard(cardKey, result);
  });
}

async function run() {
  const domainInput = byId("domain-input");
  const domain = normaliseDomain(domainInput.value);
  const errorEl = byId("dmarc-error");
  const resultsEl = byId("dmarc-results");
  const btn = byId("dmarc-btn");

  if (!domain || !domain.includes(".")) {
    errorEl.classList.add("visible");
    resultsEl.classList.remove("visible");
    return;
  }
  errorEl.classList.remove("visible");
  resultsEl.classList.add("visible");
  btn.disabled = true;
  btn.textContent = "Checking…";

  renderCard("spf", { loading: true });
  renderCard("dmarc", { loading: true });
  renderCard("dkim", { loading: true });

  const manualSelector = byId("dkim-selector-input").value.trim();

  const [spfResult, dmarcResult, dkimResult] = await Promise.all([
    checkSPF(domain).catch(() => ({ status: "error", record: null, message: "Couldn't reach the DNS lookup service. Try again, or paste your record below." })),
    checkDMARC(domain).catch(() => ({ status: "error", record: null, message: "Couldn't reach the DNS lookup service. Try again, or paste your record below." })),
    checkDKIM(domain, manualSelector || null).catch(() => ({ status: "error", record: null, message: "Couldn't reach the DNS lookup service. Try again, or paste your record below." })),
  ]);

  renderCard("spf", spfResult);
  renderCard("dmarc", dmarcResult);
  renderCard("dkim", dkimResult);

  btn.disabled = false;
  btn.textContent = "Check Domain →";
}

wireManualFallback("spf", explainSPF);
wireManualFallback("dmarc", explainDMARC);
wireManualFallback("dkim", (records) => explainDKIM(records, "pasted record"));

byId("dmarc-btn").addEventListener("click", run);
byId("domain-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") run();
});

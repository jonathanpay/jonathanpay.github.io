// SPF, DMARC and DKIM record checks for the DMARC, SPF & DKIM Checker.
// No DOM or network, so they can be tested. Each takes the TXT records found
// at the relevant name and returns { status, record, message }.

const LOOKUP_MECHANISMS = new Set(["include", "a", "mx", "ptr", "exists"]);

/** DNS-lookup mechanisms at the top level of an SPF record (nested includes not counted). */
export function spfLookupCount(spf) {
  return spf.split(/\s+/).slice(1).filter((term) => {
    const t = term.replace(/^[+\-~?]/, "").toLowerCase();
    return LOOKUP_MECHANISMS.has(t.split(/[:/]/)[0]) || t.startsWith("redirect=");
  }).length;
}

export function explainSPF(records) {
  const spfs = records.filter((r) => /^v=spf1(\s|$)/i.test(r.trim()));
  if (spfs.length === 0) {
    return { status: "not-found", record: null, message: "No SPF record found at this domain." };
  }
  if (spfs.length > 1) {
    return {
      status: "warn",
      record: spfs.join("\n"),
      message: `Found ${spfs.length} SPF records. A domain can only have one: with more, receiving servers treat SPF as failed ("permerror"). Merge them into a single record.`,
    };
  }
  const spf = spfs[0].trim();
  const terms = spf.split(/\s+/).map((t) => t.toLowerCase());
  const all = terms.find((t) => /^[+\-~?]?all$/.test(t));
  const lookups = spfLookupCount(spf);

  if (all === "+all" || all === "all") {
    return {
      status: "warn",
      record: spf,
      message: `Found, but it ends in "${all}", which allows any server on the internet to send as your domain. Use "-all" (hard fail) or "~all" (soft fail).`,
    };
  }
  if (lookups > 10) {
    return {
      status: "warn",
      record: spf,
      message: `Found, but it has ${lookups} DNS-lookup mechanisms (include, a, mx, ptr, exists, redirect). SPF fails validation ("permerror") above 10, and includes inside includes count too. Consider consolidating.`,
    };
  }
  if (!all && !terms.some((t) => t.startsWith("redirect="))) {
    return {
      status: "warn",
      record: spf,
      message: `Found, but there's no "all" mechanism at the end. Most setups should end in "-all" (hard fail) or "~all" (soft fail) so receiving servers know what to do with mail that doesn't match.`,
    };
  }
  if (all === "?all") {
    return {
      status: "warn",
      record: spf,
      message: `Found, but it ends in "?all" (neutral), which tells receiving servers nothing about mail that doesn't match. Use "~all" or "-all".`,
    };
  }
  const note = lookups >= 8 ? ` It uses ${lookups} of the 10 allowed DNS lookups at the top level, so check nested includes before adding more.` : "";
  return { status: "pass", record: spf, message: `A valid SPF record was found.${note}` };
}

/** Tag/value pairs from a DMARC or DKIM record: "v=DMARC1; p=reject" -> { v, p }. */
export function parseTags(record) {
  const tags = {};
  for (const part of record.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) tags[part.slice(0, i).trim().toLowerCase()] = part.slice(i + 1).trim();
  }
  return tags;
}

export function explainDMARC(records) {
  const dmarcs = records.filter((r) => /^v=dmarc1\b/i.test(r.trim()));
  if (dmarcs.length === 0) {
    return {
      status: "not-found",
      record: null,
      message: "No DMARC record found. Without one, receiving mail servers have no instructions for what to do with mail that fails SPF or DKIM checks.",
    };
  }
  if (dmarcs.length > 1) {
    return {
      status: "warn",
      record: dmarcs.join("\n"),
      message: `Found ${dmarcs.length} DMARC records. With more than one, receiving servers ignore DMARC for the domain. Remove all but one.`,
    };
  }
  const dmarc = dmarcs[0].trim();
  const policy = (parseTags(dmarc).p || "").toLowerCase();
  if (!["none", "quarantine", "reject"].includes(policy)) {
    return {
      status: "warn",
      record: dmarc,
      message: `Found, but it has no valid policy ("p=none", "p=quarantine" or "p=reject"), so receiving servers may ignore it.`,
    };
  }
  if (policy === "none") {
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

/** A TXT record that looks like a DKIM key record (has a p= tag). */
export function isDkimRecord(r) {
  return "p" in parseTags(r);
}

export function explainDKIM(records, selectorTried) {
  const dkim = records.find(isDkimRecord);
  if (!dkim) {
    return { status: "not-found", record: null, message: `No DKIM record found at selector "${selectorTried}".` };
  }
  if (parseTags(dkim).p === "") {
    return {
      status: "warn",
      record: dkim,
      selector: selectorTried,
      message: `A DKIM record was found at selector "${selectorTried}", but its key is empty ("p="), which means the key has been revoked. Mail signed with this selector will fail DKIM.`,
    };
  }
  return { status: "pass", record: dkim, selector: selectorTried, message: `A DKIM record was found at selector "${selectorTried}".` };
}

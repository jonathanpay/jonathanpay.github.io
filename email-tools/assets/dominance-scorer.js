// Shared "which category wins" algorithm used by the Emotional Appeal
// Analyzer, Tone Analyzer, and Buyer Persona Matcher.
//
// Applied 2026-09-29, previously drafted as dominance-scorer.next.js.
// Rationale, measurements and open follow-ups: ../scorer-notes.md
//
// What changed, and why (three defects, all in this file's dependency on the
// substring counter in utils-jnLFB3bE.js):
//
//   1. MATCHING. The old matcher counted raw substring occurrences with
//      `indexOf` and no word boundaries, so `know` hit "now", `they` hit "hey",
//      `against` hit "gain", `contested` hit "tested", `defending` hit
//      "ending", `closely` hit "lose". Every one of those was a scored hit.
//      This file now owns a boundary-aware matcher and no longer imports
//      countHits, which also means the fix survives a rebuild of the minified
//      utils bundle.
//
//   2. RECALL, deliberately preserved. Word boundaries alone would drop
//      legitimate inflections (`trust` no longer matching "trusted"). A
//      keyword ending in `*` is a stem: it matches the word and any suffix
//      (`trust*` -> trust, trusts, trusted, trusting). Multi-word keywords
//      allow any run of whitespace between their words.
//
//   3. THE FLOOR. Share-of-total alone is not a verdict. Long prose produces
//      roughly one hit per hundred words, so three or four incidental words
//      could decide a "dominant" reading. A category now has to clear both an
//      absolute hit floor and a density floor before it can be called
//      dominant; below that the honest answer is "no clear signal".
//
// verdict:
//   "mixed"     — no category has a strong-enough signal (dominant/runnerUp null)
//   "tie"       — top two categories are within 8% of total hits
//   "dominant"  — one category clearly leads (dominant set, runnerUp null)
//
// The return shape is unchanged and additive-only, so the three consuming
// bundles keep working untouched. Note that the "low signal" outcome is
// reported as verdict "mixed" on purpose: the callers treat any verdict other
// than "mixed"/"tie" as dominant and read `.name` off it, so a new verdict
// string here would throw in their render path.

// Calibration, measured rather than guessed (harness: scratch/hemtest/run.mjs):
//   real marketing email copy scores roughly 50-200 hits per 1,000 words
//   (the synthetic control: 149/1k); long-form prose scores roughly 6-17
//   (LTSL essays: 6.5-15.6/1k). The floors sit between those bands, so a
//   verdict needs real signal, and the length ceiling keeps the tool inside
//   the copy its lexicons were written for instead of inventing a reading for
//   an essay. Below the floors the honest answer is "no clear signal".
const MIN_HITS = 4; // fewer total hits than this cannot support a verdict
const MIN_DENSITY_PER_1K = 25; // hits per 1,000 words: the real discriminator
const MAX_WORDS_FOR_VERDICT = 900; // past this, treat as long-form and decline

const _cache = new Map();

function _compile(keyword) {
  let re = _cache.get(keyword);
  if (re) return re;

  const stem = keyword.endsWith("*");
  const body = stem ? keyword.slice(0, -1) : keyword;

  const escaped = body
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\s+/g, "\\s+");

  // Anchor on a word boundary only where the keyword actually starts/ends on a
  // word character, so phrases like "don't miss" still anchor correctly.
  const left = /^[a-z0-9]/i.test(body) ? "\\b" : "";
  const right = stem ? "\\w*" : /[a-z0-9]$/i.test(body) ? "\\b" : "";

  re = new RegExp(`${left}${escaped}${right}`, "g");
  _cache.set(keyword, re);
  return re;
}

/** Count whole-word / whole-phrase occurrences of each keyword. */
export function countKeywordHits(lowerText, keywords) {
  const hits = {};
  let total = 0;

  for (const keyword of keywords) {
    // A bare stem like "*" would match everything; skip degenerate entries.
    if (!keyword || keyword === "*") continue;

    const re = _compile(keyword);
    re.lastIndex = 0;

    let n = 0;
    let m;
    while ((m = re.exec(lowerText)) !== null) {
      n++;
      if (m.index === re.lastIndex) re.lastIndex++; // zero-length guard
    }

    if (n) {
      hits[keyword] = n;
      total += n;
    }
  }

  return { hits, total };
}

export function scoreCategories(text, categories) {
  const lower = text.toLowerCase();
  const wordCount = (text.match(/\S+/g) || []).length;

  const scored = categories.map((cat) => {
    const { hits } = countKeywordHits(lower, cat.keywords);
    const count = Object.values(hits).reduce((a, b) => a + b, 0);
    return { ...cat, count, hits };
  });

  const total = scored.reduce((sum, cat) => sum + cat.count, 0);
  const ranked = [...scored].sort((a, b) => b.count - a.count);
  const top = ranked[0];
  const second = ranked[1];

  const density = wordCount ? (total / wordCount) * 1000 : 0;
  const longForm = wordCount > MAX_WORDS_FOR_VERDICT;
  const enoughSignal = total >= MIN_HITS && density >= MIN_DENSITY_PER_1K;

  if (total === 0 || longForm || !enoughSignal) {
    return {
      scored,
      ranked,
      total,
      density,
      wordCount,
      verdict: "mixed",
      dominant: null,
      runnerUp: null,
      lowSignal: total > 0,
      longForm,
    };
  }

  if (second && second.count > 0 && (top.count - second.count) / total < 0.08) {
    return { scored, ranked, total, density, wordCount, verdict: "tie", dominant: top, runnerUp: second, lowSignal: false, longForm: false };
  }

  if (top.count / total < 0.3) {
    return { scored, ranked, total, density, wordCount, verdict: "mixed", dominant: null, runnerUp: null, lowSignal: false, longForm: false };
  }

  return { scored, ranked, total, density, wordCount, verdict: "dominant", dominant: top, runnerUp: null, lowSignal: false, longForm: false };
}

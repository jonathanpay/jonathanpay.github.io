import { c as countHits } from "./utils-jnLFB3bE.js";

// Shared "which category wins" algorithm used by the Emotional Appeal
// Analyzer, Tone Analyzer, and Buyer Persona Matcher. Previously each of
// those three tools re-implemented this independently.
//
// verdict:
//   "mixed" — no category has a strong-enough signal (dominant/runnerUp are null)
//   "tie"   — top two categories are within 8% of total hits (dominant + runnerUp both set)
//   "dominant" — one category clearly leads (dominant set, runnerUp null)
export function scoreCategories(text, categories) {
  const lower = text.toLowerCase();
  const scored = categories.map((cat) => ({ ...cat, count: countHits(lower, cat.keywords) }));
  const total = scored.reduce((sum, cat) => sum + cat.count, 0);
  const ranked = [...scored].sort((a, b) => b.count - a.count);
  const top = ranked[0];
  const second = ranked[1];

  if (total === 0) {
    return { scored, ranked, total, verdict: "mixed", dominant: null, runnerUp: null };
  }
  if (second && top.count > 0 && second.count > 0 && (top.count - second.count) / total < 0.08) {
    return { scored, ranked, total, verdict: "tie", dominant: top, runnerUp: second };
  }
  if (top.count / total < 0.3) {
    return { scored, ranked, total, verdict: "mixed", dominant: null, runnerUp: null };
  }
  return { scored, ranked, total, verdict: "dominant", dominant: top, runnerUp: null };
}

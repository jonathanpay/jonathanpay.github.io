// Shared statistics helpers for the email tools.
// Pure functions only (no DOM), so they can be tested with `node --test`.

// Error function, Abramowitz & Stegun 7.1.26 (max absolute error 1.5e-7).
export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const poly = ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  return sign * (1 - poly * Math.exp(-ax * ax));
}

// Two-sided confidence, as a percentage, that a difference with this z-score
// is real: 100 * (2 * Phi(|z|) - 1) = 100 * erf(|z| / sqrt(2)).
// Spreadsheet equivalent: =(2*NORM.S.DIST(ABS(z),TRUE)-1)*100
export function twoSidedConfidence(z) {
  return erf(Math.abs(z) / Math.SQRT2) * 100;
}

// z-score for two variants of equal size n, using the pooled rate.
// Rates are fractions (0.025 for 2.5%). Returns 0 when there is no variance.
export function zScoreEqualSamples(n, controlRate, variantRate) {
  const pooled = (controlRate + variantRate) / 2;
  const standardError = Math.sqrt((2 * pooled * (1 - pooled)) / n);
  if (!(standardError > 0)) return 0;
  return Math.abs(variantRate - controlRate) / standardError;
}

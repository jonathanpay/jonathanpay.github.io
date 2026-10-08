# Tests

Run from the repo root with Node 22 or later:

    node --test "tests/*.test.mjs"

These cover the pure logic in `email-tools/assets/` (anything that doesn't touch the DOM). This folder is excluded from the published site in `_config.yml`.

## Statistical Significance Calculator

Confidence is the two-sided normal confidence for the z-score: `erf(|z| / √2) × 100` (`stats.js`). The z-score uses the pooled rate and one sample size for both variants: `SE = √(2·p̄(1−p̄)/n)`.

The same number in a spreadsheet is `=(2*NORM.S.DIST(ABS(z),TRUE)-1)*100`; a workbook should give the values below.

| z | Confidence |
|---|---|
| 1.645 | 90.0% |
| 1.96 | 95.0% |
| 2.576 | 99.0% |
| 3.03 | 99.8% |

| n per variant | Control | Variant | z | Confidence |
|---|---|---|---|---|
| 1,000 | 2.5% | 3.1% | 0.81 | 58.4% |
| 5,000 | 2.5% | 3.0% | 1.53 | 87.4% |
| 10,000 | 2.5% | 3.0% | 2.16 | 96.9% |

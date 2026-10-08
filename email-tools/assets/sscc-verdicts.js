// What the Statistical Significance Calculator tells the reader, by confidence band.
// Kept separate from the DOM wiring in sscc.js so the bands can be tested.

export const BANDS = [
  {
    id: "highly-significant",
    min: 99,
    significant: true,
    verdict: "99% Confident",
    note: "Your result is highly significant. You can act on this with confidence.",
    validationHead: "Before you roll out — validate",
    validationBody:
      "A highly significant result is a strong signal. In Holistic Testing, the next step is validation: repeat the finding in a different segment or on a separate send occasion. One result, however strong, can still be a coincidence. Confirmation is what turns a signal into a reliable insight.",
    crosslinkLabel: "Planning your next test?",
  },
  {
    id: "significant",
    min: 95,
    significant: true,
    verdict: "At Least 95% Confident",
    note: "Your result meets the standard threshold for statistical significance.",
    validationHead: "Significant — but validate before rolling out",
    validationBody:
      "This result clears the standard threshold, but in Holistic Testing that's a reason to validate, not to immediately declare a winner. Repeat the test in a different context — a different segment, list, or send occasion — to confirm the pattern holds before committing to a change.",
    crosslinkLabel: "Planning your validation test?",
  },
  {
    id: "not-significant",
    min: -Infinity,
    significant: false,
    verdict: "Not Yet Significant",
    note:
      "You need more data before acting on this result. Not significant doesn't mean there's no difference — only that this test can't show one yet.",
    validationHead: "Two things to check",
    validationBody:
      "First, confirm your test has run for the duration you planned — checking early is a common source of false negatives. Second, if you've hit your planned duration and still have no result, your effect size may be smaller than your test was designed to detect. Use the Duration Calculator to check whether a longer run or a wider minimum effect would change things.",
    crosslinkLabel: "Check if your test was sized correctly →",
  },
];

// Highest band whose threshold the confidence (a percentage) meets.
export function bandFor(confidence) {
  return BANDS.find((band) => confidence >= band.min) ?? BANDS[BANDS.length - 1];
}

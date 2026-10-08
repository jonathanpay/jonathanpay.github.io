// Pure logic for the A/B Test Hypothesis Builder: no DOM, so it can be tested.
import { FACTORS, METRICS, OBJECTIVES, NO_BECAUSE_WARNING } from "./hypothesis-content.js";

const find = (list, id) => list.find((item) => item.id === id);

// Duration Calculator accepts a baseline between these (percent).
const BASELINE_MIN = 0.1;
const BASELINE_MAX = 99.9;

const MULTIPLE_CHANGES = /(\band\b|&|\+|\bplus\b|\bas well as\b|\balso\b)/i;

const tidy = (text) => String(text ?? "").trim().replace(/[\s.]+$/, "");
const num = (value) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
};

// Returns an array of problems with required input; empty means ready to build.
export function validate(input) {
  const problems = [];
  if (!find(FACTORS, input.factor)) problems.push("Choose what you will change.");
  if (!tidy(input.change)) problems.push("Describe the change you will make.");
  if (!find(METRICS, input.metric)) problems.push("Choose the metric you expect to move.");
  return problems;
}

export function buildHypothesis(input) {
  const factor = find(FACTORS, input.factor);
  const metric = find(METRICS, input.metric);
  const objective = find(OBJECTIVES, input.objective);
  const direction = input.direction === "decrease" ? "decrease" : "increase";
  const lift = num(input.lift);
  const baseline = num(input.baseline);
  const change = tidy(input.change);
  const because = tidy(input.because);

  const effect = lift
    ? `the ${metric.noun} to ${direction} by at least ${lift}% (relative)`
    : `the ${metric.noun} to ${direction}`;
  const sentence = `I think that by changing ${change}, it will cause ${effect} because ${because || "[add your reason]"}.`;

  const checks = [];
  const add = (id, ok, title, detail) => checks.push({ id, status: ok ? "ok" : "warn", title, detail });

  add(
    "single-change",
    !MULTIPLE_CHANGES.test(change),
    MULTIPLE_CHANGES.test(change) ? "This may be more than one change" : "One change",
    MULTIPLE_CHANGES.test(change)
      ? "If you change two things at once, you can't tell which one moved the result. If this is genuinely one change, carry on."
      : "A single change means any difference can be traced back to it."
  );

  if (objective) {
    const fits = objective.metrics.includes(metric.id);
    add(
      "metric-fit",
      fits,
      fits ? "The metric matches your objective" : "The metric may not match your objective",
      fits
        ? `${metric.label} is a direct measure of "${objective.label.toLowerCase()}".`
        : `For "${objective.label.toLowerCase()}", consider ${objective.metrics
            .map((id) => find(METRICS, id).label.toLowerCase())
            .join(" or ")}. A metric that's easy to measure isn't always the one that answers your question.`
    );
  }

  if (metric.warning) add("metric-reliability", false, `${metric.label} is an unreliable metric`, metric.warning);

  add(
    "has-because",
    Boolean(because),
    because ? "You've said why you expect this" : "No reason given yet",
    because ? "A reason lets you learn from the result even if the test loses." : NO_BECAUSE_WARNING
  );

  add(
    "testable",
    Boolean(lift),
    lift ? "You can tell if it failed" : "No success threshold yet",
    lift
      ? `If ${metric.noun} doesn't ${direction} by at least ${lift}%, the hypothesis was wrong.`
      : "Add the smallest improvement that would matter to you. Without one, you can't say what counts as the hypothesis being wrong."
  );

  const plannerRow = {
    change: change.charAt(0).toUpperCase() + change.slice(1),
    effect: lift ? `${metric.label} to ${direction} by at least ${lift}% (relative)` : `${metric.label} to ${direction}`,
    because: because || "",
    successMetric: metric.label,
  };
  const plannerTsv = [plannerRow.change, plannerRow.effect, plannerRow.because, plannerRow.successMetric]
    .map((cell) => cell.replace(/[\t\r\n]+/g, " "))
    .join("\t");

  const params = new URLSearchParams({ hypothesis: sentence });
  let durationNote = "";
  if (metric.rate && baseline !== null && baseline >= BASELINE_MIN && baseline <= BASELINE_MAX) {
    params.set("baseline", String(baseline));
  } else if (!metric.rate) {
    durationNote = `The Duration Calculator works with percentage rates, so it can't take ${metric.noun} as a baseline. Enter a related rate there instead.`;
  } else if (baseline !== null) {
    durationNote = `The Duration Calculator accepts baselines from ${BASELINE_MIN}% to ${BASELINE_MAX}%, so yours wasn't passed on.`;
  }
  if (lift && lift >= 1 && lift <= 200) params.set("lift", String(lift));

  return {
    sentence,
    effect,
    context: [find(OBJECTIVES, input.objective)?.label, tidy(input.problem)].filter(Boolean),
    checks,
    plannerRow,
    plannerTsv,
    durationUrl: `ab-duration-tool.html?${params.toString()}`,
    durationNote,
  };
}

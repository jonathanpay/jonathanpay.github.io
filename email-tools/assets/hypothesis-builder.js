import { g as byId } from "./utils-jnLFB3bE.js";
import { PROGRAMMES, OBJECTIVES, FACTORS, METRICS, LEVERS } from "./hypothesis-content.js";
import { buildHypothesis, validate } from "./hypothesis.js";

const OPTION_NONE = { value: "", label: "Choose…" };

function fillSelect(select, items, placeholder = OPTION_NONE) {
  select.innerHTML = "";
  const options = placeholder ? [placeholder, ...items.map((i) => ({ value: i.id, label: i.label }))] : items;
  for (const { value, label } of options) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
}

function chip(label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chip";
  button.textContent = label;
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => onClick(button));
  return button;
}

fillSelect(byId("programme"), PROGRAMMES);
fillSelect(byId("objective"), OBJECTIVES, { value: "", label: "Not sure yet" });
fillSelect(byId("factor"), FACTORS);
fillSelect(byId("metric"), METRICS);

// ---- Step 2: problem suggestions for the chosen programme ----
const problemBox = byId("problem");
byId("programme").addEventListener("change", () => {
  const programme = PROGRAMMES.find((p) => p.id === byId("programme").value);
  const holder = byId("problem-chips");
  holder.innerHTML = "";
  byId("problem-chips-label").hidden = !programme || programme.problems.length === 0;
  for (const text of programme?.problems ?? []) {
    holder.appendChild(
      chip(text, (button) => {
        problemBox.value = text;
        holder.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === button)));
        problemBox.focus();
      })
    );
  }
});

// ---- Step 4: metric defaults and the unreliable-metric warning ----
byId("metric").addEventListener("change", () => {
  const metric = METRICS.find((m) => m.id === byId("metric").value);
  const warning = byId("metric-warning");
  warning.textContent = metric?.warning ?? "";
  warning.classList.toggle("visible", Boolean(metric?.warning));
  if (metric) byId("direction").value = metric.defaultDirection;
});

// ---- Step 5: psychology levers ----
const becauseBox = byId("because");
let lastStarter = "";
const hint = byId("lever-hint");
for (const lever of LEVERS) {
  byId("lever-chips").appendChild(
    chip(lever.label, (button) => {
      byId("lever-chips").querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === button)));
      const replaceable = becauseBox.value.trim() === "" || becauseBox.value === lastStarter;
      hint.textContent = "";
      hint.append(`${lever.hint} `);
      if (replaceable) {
        becauseBox.value = lever.starter;
        lastStarter = lever.starter;
        hint.append("We've started the sentence for you. Edit it so it's about your reader.");
      } else {
        hint.append(`You've already written your own reason, so we've left it. A starter: "${lever.starter}".`);
      }
      if (lever.id === "buyer-modality") {
        const link = document.createElement("a");
        link.href = "persona-tool.html";
        link.textContent = "Buyer Persona Matcher";
        hint.append(" Not sure which your reader is? Try the ", link, ".");
      }
    })
  );
}

// ---- Build ----
function readInput() {
  return {
    programme: byId("programme").value,
    objective: byId("objective").value,
    problem: byId("problem").value,
    factor: byId("factor").value,
    change: byId("change").value,
    metric: byId("metric").value,
    direction: byId("direction").value,
    lift: byId("lift").value,
    baseline: byId("baseline").value,
    because: byId("because").value,
  };
}

function renderChecks(checks) {
  const list = byId("hyp-checks");
  list.innerHTML = "";
  for (const check of checks) {
    const item = document.createElement("li");
    item.className = check.status === "ok" ? "check-ok" : "check-warn";
    const icon = document.createElement("span");
    icon.className = "check-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = check.status === "ok" ? "✓" : "!";
    const body = document.createElement("div");
    const title = document.createElement("p");
    title.className = "check-title";
    title.textContent = check.title;
    const detail = document.createElement("p");
    detail.className = "check-detail";
    detail.textContent = check.detail;
    body.append(title, detail);
    item.append(icon, body);
    list.appendChild(item);
  }
}

let current = null;

byId("hyp-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = readInput();
  const problems = validate(input);
  const errorEl = byId("hyp-error");
  const resultsEl = byId("hyp-results");
  if (problems.length) {
    errorEl.textContent = problems.join(" ");
    errorEl.classList.add("visible");
    resultsEl.classList.remove("visible");
    return;
  }
  errorEl.classList.remove("visible");

  current = buildHypothesis(input);
  byId("hyp-sentence").textContent = current.sentence;
  byId("hyp-context").textContent = current.context.join(" · ");
  renderChecks(current.checks);
  byId("plan-change").textContent = current.plannerRow.change;
  byId("plan-effect").textContent = current.plannerRow.effect;
  byId("plan-because").textContent = current.plannerRow.because;
  byId("plan-metric").textContent = current.plannerRow.successMetric;
  byId("next-step").href = current.durationUrl;
  byId("duration-note").textContent = current.durationNote;
  byId("copy-status").textContent = "";
  resultsEl.classList.add("visible");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  resultsEl.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
});

// ---- Copy ----
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

async function copyAndReport(text, done) {
  const ok = current ? await copyText(text) : false;
  byId("copy-status").textContent = ok ? done : "Couldn't copy automatically. Select the text and copy it instead.";
}

byId("copy-sentence").addEventListener("click", () => copyAndReport(current?.sentence ?? "", "Hypothesis copied."));
byId("copy-row").addEventListener("click", () =>
  copyAndReport(current?.plannerTsv ?? "", "Copied. Paste it into your planner: change, expected effect, because, success metric.")
);

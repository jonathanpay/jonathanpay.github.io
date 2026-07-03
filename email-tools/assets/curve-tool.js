import { g as byId, a as animateBars, c as countHits } from "./utils-jnLFB3bE.js";
import { EMOTIONAL_APPEALS } from "./appeal-keywords.js";

// Curiosity and Emotion both draw on the Emotional Appeal Analyzer's shared
// keyword dictionary — Curiosity uses that category's own list, Emotion uses
// the other 5 (fear/hope/pride/trust/belonging) so curiosity isn't double-counted.
const CURIOSITY_WORDS = EMOTIONAL_APPEALS.find((cat) => cat.id === "curiosity").keywords;
const EMOTION_WORDS = EMOTIONAL_APPEALS.filter((cat) => cat.id !== "curiosity").flatMap((cat) => cat.keywords);

const URGENCY_WORDS = ["now","today","hurry","deadline","limited time","last chance","ends","ending","final hours","don't wait","act now","before it's gone","running out","expires","expiring","tonight","closing soon","final call","almost gone","this week only"];
const URGENCY_PATTERN = /\b\d+\s?(hours?|days?|minutes?)\s?(left|remaining)\b/i;

const VALUE_WORDS = ["free","save","guide","how to","tips","checklist","template","proven","results","boost","increase","reduce","improve","off","bonus","exclusive offer","worth","value","roi"];
const VALUE_PATTERN = /[£$€%]|\b\d+\b/;

const RELEVANCE_PRONOUNS = new Set(["you", "your"]);
const PERSONALISATION_PATTERN = /\{[^}]+\}|%\w+%|\[(first ?name|name|company)\]/i;

const CURVE_ELEMENTS = [
  { id: "curiosity", letter: "C", name: "Curiosity", desc: "An open loop or question the reader wants answered." },
  { id: "urgency",   letter: "U", name: "Urgency",   desc: "A reason to act now rather than later." },
  { id: "relevance", letter: "R", name: "Relevance", desc: "Speaks to the reader directly — \"you\"/\"your\" or a personalisation token." },
  { id: "value",     letter: "V", name: "Value",     desc: "A concrete payoff — a number, benefit, or outcome." },
  { id: "emotion",   letter: "E", name: "Emotion",   desc: "A feeling-word that makes the line land, not just inform." },
];

const SUGGESTIONS = {
  curiosity: 'Open a gap the reader wants closed: add a question, or a line like "…here\'s why" / "the one thing most emails get wrong".',
  urgency:   'Give the reader a reason to act now, not later: "before Friday", "today only", "48 hours left".',
  relevance: 'Speak to the reader directly — add "you"/"your", or a personalisation token like {first_name}.',
  value:     'Make the payoff concrete — a number, a benefit, or a word like "free", "save", or "in 5 minutes".',
  emotion:   'Add a feeling-word: trust ("proven"), belonging ("join"), or hope ("imagine").',
};

function scoreCuriosity(lower, raw) {
  let count = countHits(lower, CURIOSITY_WORDS);
  if (raw.includes("?")) count++;
  if (raw.includes("...") || raw.includes("…")) count++;
  return count;
}

function scoreUrgency(lower) {
  let count = countHits(lower, URGENCY_WORDS);
  if (URGENCY_PATTERN.test(lower)) count++;
  return count;
}

function scoreRelevance(lower) {
  const words = lower.match(/\b(\w+)\b/g) ?? [];
  const pronounHits = words.filter((w) => RELEVANCE_PRONOUNS.has(w)).length;
  const hasToken = PERSONALISATION_PATTERN.test(lower);
  return { pronounHits, hasToken, level: hasToken ? "high" : pronounHits > 0 ? "medium" : "low" };
}

function scoreValue(lower) {
  let count = countHits(lower, VALUE_WORDS);
  if (VALUE_PATTERN.test(lower)) count++;
  return count;
}

function scoreEmotion(lower) {
  return countHits(lower, EMOTION_WORDS);
}

function levelFromCount(count) {
  if (count <= 0) return "low";
  if (count === 1) return "medium";
  return "high";
}

function analyse(subjectLine) {
  const lower = subjectLine.toLowerCase();

  const relevance = scoreRelevance(lower);

  const results = {
    curiosity: { count: scoreCuriosity(lower, subjectLine) },
    urgency:   { count: scoreUrgency(lower) },
    relevance: { count: relevance.pronounHits, level: relevance.level },
    value:     { count: scoreValue(lower) },
    emotion:   { count: scoreEmotion(lower) },
  };

  for (const key of Object.keys(results)) {
    if (!results[key].level) results[key].level = levelFromCount(results[key].count);
  }

  return results;
}

function levelLabel(level) {
  return level === "high" ? "Present" : level === "medium" ? "Partial" : "Missing";
}

function levelColor(level) {
  return level === "high" ? "#166534" : level === "medium" ? "#92400E" : "#C53A4B";
}

function run() {
  const input = byId("curve-input");
  const subjectLine = input.value.trim();
  const errorMsg = byId("curve-error");
  const results = byId("curve-results");

  if (!subjectLine) {
    errorMsg.classList.add("visible");
    results.classList.remove("visible");
    return;
  }
  errorMsg.classList.remove("visible");

  const scores = analyse(subjectLine);
  const present = CURVE_ELEMENTS.filter((el) => scores[el.id].level !== "low").length;

  byId("curve-coverage-count").textContent = `${present}/5`;

  const rowsEl = byId("curve-rows");
  rowsEl.innerHTML = CURVE_ELEMENTS.map((el) => {
    const s = scores[el.id];
    const pct = s.level === "high" ? 100 : s.level === "medium" ? 55 : 12;
    const color = levelColor(s.level);
    return `<div class="curve-row">
      <span class="curve-letter" style="color:${color}">${el.letter}</span>
      <div class="curve-row-body">
        <div class="curve-row-head">
          <span class="curve-name">${el.name}</span>
          <span class="curve-status" style="color:${color}">${levelLabel(s.level)}</span>
        </div>
        <p class="curve-desc">${el.desc}</p>
        <div class="curve-bar-track">
          <div class="curve-bar-fill" data-pct="${pct}" style="background:${color}"></div>
        </div>
      </div>
    </div>`;
  }).join("");
  animateBars(rowsEl, ".curve-bar-fill");

  const weakest = CURVE_ELEMENTS.find((el) => scores[el.id].level === "low");
  const tipEl = byId("curve-tip");
  if (weakest) {
    tipEl.classList.add("visible");
    byId("curve-tip-title").textContent = `Weakest element: ${weakest.name}`;
    byId("curve-tip-body").textContent = SUGGESTIONS[weakest.id];
  } else {
    tipEl.classList.add("visible");
    byId("curve-tip-title").textContent = "All five elements present";
    byId("curve-tip-body").textContent = "Strong CURVE coverage — if open rates still lag, the issue is more likely list health or send timing than this subject line.";
  }

  results.classList.add("visible");
}

byId("curve-btn").addEventListener("click", run);
byId("curve-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") run();
});

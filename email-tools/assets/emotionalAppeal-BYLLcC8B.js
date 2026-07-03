import { g as byId, a as animateBars } from "./utils-jnLFB3bE.js";
import { EMOTIONAL_APPEALS } from "./appeal-keywords.js";
import { scoreCategories } from "./dominance-scorer.js";

function analyse() {
  const text = byId("appeal-input").value.trim();
  const errorEl = byId("appeal-error");
  const resultsEl = byId("appeal-results");
  const shortWarn = byId("short-warn");

  if (!text) {
    errorEl.classList.add("visible");
    resultsEl.classList.remove("visible");
    return;
  }
  errorEl.classList.remove("visible");

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  shortWarn.classList.toggle("visible", wordCount < 30);

  const { scored, ranked, total, verdict, dominant, runnerUp } = scoreCategories(text, EMOTIONAL_APPEALS);
  const topCategory = total > 0 ? ranked[0] : null;

  const badge = byId("dominant-badge");
  const note = byId("dominant-note");
  if (verdict === "mixed") {
    badge.textContent = "Mixed / Neutral";
    badge.style.background = "#897680";
    note.textContent = total === 0
      ? "No clear emotional triggers detected. Even subtle changes in word choice can shift the emotional register significantly."
      : "No single appeal dominates. Spreading emotional signals too evenly can dilute impact — consider which trigger best fits your goal for this email.";
  } else if (verdict === "tie") {
    badge.textContent = `${dominant.name} & ${runnerUp.name}`;
    badge.style.background = dominant.color;
    note.textContent = "Two appeals are registering at similar strength. Scroll down to check whether that combination is intentional.";
  } else {
    badge.textContent = dominant.name;
    badge.style.background = dominant.color;
    note.textContent = dominant.note;
  }

  const barsEl = byId("appeal-bars");
  barsEl.innerHTML = scored.map((cat) => {
    const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
    const isTop = topCategory && cat.id === topCategory.id;
    return `<div class="appeal-row${isTop ? " is-dominant" : ""}">
      <span class="appeal-name" style="${isTop ? `color:${cat.color}` : ""}">${cat.name}</span>
      <div class="appeal-bar-track">
        <div class="appeal-bar-fill" data-pct="${pct}" style="background:${cat.color}"></div>
      </div>
      <span class="appeal-pct" style="${isTop ? `color:${cat.color}` : ""}">${pct}%</span>
    </div>`;
  }).join("");
  animateBars(barsEl, ".appeal-bar-fill");

  const tipsEl = byId("appeal-tips");
  tipsEl.innerHTML = ranked.map((cat) => `
    <div class="appeal-tip-card" style="border-left-color:${cat.color}">
      <div class="appeal-tip-head">
        <span class="appeal-tip-name" style="color:${cat.color}">${cat.name}</span>
        <span class="appeal-tip-tag">${cat.desc}</span>
      </div>
      <p class="appeal-tip-desc">${cat.note}</p>
      <div class="appeal-tip-phrases">
        ${cat.phrases.map((p) => `<span class="phrase-chip" style="background:${cat.tint};color:${cat.color}">${p}</span>`).join("")}
      </div>
    </div>
  `).join("");

  resultsEl.classList.add("visible");
}

byId("appeal-btn").addEventListener("click", analyse);
byId("appeal-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) analyse();
});

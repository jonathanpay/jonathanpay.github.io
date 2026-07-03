import { g as byId, a as animateBars } from "./utils-jnLFB3bE.js";
import { scoreCategories } from "./dominance-scorer.js";

const PERSONA_TYPES = [
  {
    id: "competitive",
    name: "Competitive",
    color: "#C93D1B",
    tint: "rgba(201,61,27,0.1)",
    desc: "Direct, results-focused, and achievement-driven. Responds to performance language, specific outcomes, and speed.",
    note: "Effective for ROI-focused B2B emails, productivity tools, and high-performance audiences.",
    phrases: ['"Get results in X days"', '"Outperform your competition"', '"The fastest route to [outcome]"', `"Here's your ROI"`, '"Win more with less"'],
    keywords: ["results", "proven", "win", "achieve", "goal", "roi", "performance", "fast", "instantly", "quickly", "ahead", "advantage", "outperform", "growth", "bottom line", "number one", "gain", "dominate", "power", "beat", "success", "top", "efficient", "productivity", "faster", "leading", "rank", "competitive", "maximise", "maximize", "drive", "impact", "output", "accelerate", "scale"],
  },
  {
    id: "spontaneous",
    name: "Spontaneous",
    color: "#A86200",
    tint: "rgba(168,98,0,0.1)",
    desc: "Emotion-first and impulse-driven. Responds to excitement, novelty, exclusivity, and social momentum.",
    note: "Works well for flash sales, new product launches, limited offers, and community-driven brands.",
    phrases: [`"You'll love this"`, '"Just launched"', `"Don't miss out"`, `"Everyone's talking about"`, '"Limited spots available"'],
    keywords: ["exciting", "new", "discover", "amazing", "incredible", "love", "trending", "everyone", "exclusive", "limited", "last chance", "today only", "hurry", "surprise", "delight", "popular", "fantastic", "brilliant", "awesome", "special", "deal", "offer", "sale", "fun", "enjoy", "launch", "don't miss", "just dropped", "introducing", "fresh", "buzz", "sensation"],
  },
  {
    id: "humanistic",
    name: "Humanistic",
    color: "#167A5E",
    tint: "rgba(22,122,94,0.1)",
    desc: "Relationship-driven and empathy-led. Responds to warmth, shared values, community, and personal stories.",
    note: "Powerful for welcome sequences, nurture flows, non-profit emails, and values-led brands.",
    phrases: ['"We understand how you feel"', '"Join [X] people like you"', `"Here's [name]'s story"`, `"We're here whenever you need us"`, `"You're not alone in this"`],
    keywords: ["together", "community", "relationship", "story", "feel", "care", "support", "understand", "trust", "share", "connect", "belong", "journey", "you're not alone", "we're here", "personal", "people", "family", "team", "warmth", "values", "mission", "meaningful", "purpose", "heart", "compassion", "kindness", "culture", "listen", "empathy", "human", "real", "authentic"],
  },
  {
    id: "methodical",
    name: "Methodical",
    color: "#1A5FA8",
    tint: "rgba(26,95,168,0.1)",
    desc: "Detail-oriented and logic-led. Responds to data, process clarity, proof, and risk reduction.",
    note: "Essential for B2B, technical, financial, and enterprise audiences who need to justify decisions.",
    phrases: ['"Research shows that..."', `"Here's exactly how it works"`, '"Step 1… Step 2… Step 3…"', '"Backed by [X] studies"', '"Compare the data"'],
    keywords: ["research", "data", "study", "evidence", "statistics", "step by step", "process", "how it works", "because", "analysis", "compare", "guarantee", "risk-free", "backed by", "in fact", "specifically", "methodology", "framework", "system", "detailed", "comprehensive", "thorough", "accurate", "reliable", "consistent", "checklist", "guide", "roadmap", "benchmark", "measure", "criteria", "fact", "statistic", "percent", "breakdown", "specification", "structured"],
  },
];

function analyse() {
  const text = byId("persona-input").value.trim();
  const errorEl = byId("persona-error");
  const resultsEl = byId("persona-results");
  const shortWarn = byId("short-warn");

  if (!text) {
    errorEl.classList.add("visible");
    resultsEl.classList.remove("visible");
    return;
  }
  errorEl.classList.remove("visible");

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  shortWarn.classList.toggle("visible", wordCount < 30);

  const { scored, ranked, total, verdict, dominant, runnerUp } = scoreCategories(text, PERSONA_TYPES);
  const topCategory = total > 0 ? ranked[0] : null;

  const badge = byId("dominant-badge");
  const note = byId("dominant-note");
  if (verdict === "mixed") {
    badge.textContent = "Mixed / Neutral";
    badge.style.background = "#897680";
    note.textContent = total === 0
      ? "No clear persona signals detected. Adding intentional language cues will help your copy speak to specific buyer types."
      : "No single buyer type stands out. Targeted emails typically convert better when they speak to a specific persona.";
  } else if (verdict === "tie") {
    badge.textContent = `${dominant.name} & ${runnerUp.name}`;
    badge.style.background = dominant.color;
    note.textContent = "Your copy speaks to two types at similar strength. Check the breakdown to see which types you're underserving.";
  } else {
    badge.textContent = dominant.name;
    badge.style.background = dominant.color;
    note.textContent = dominant.note;
  }

  const barsEl = byId("persona-bars");
  barsEl.innerHTML = scored.map((cat) => {
    const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
    const isTop = topCategory && cat.id === topCategory.id;
    return `<div class="persona-row${isTop ? " is-dominant" : ""}">
      <span class="persona-name" style="${isTop ? `color:${cat.color}` : ""}">${cat.name}</span>
      <div class="persona-bar-track">
        <div class="persona-bar-fill" data-pct="${pct}" style="background:${cat.color}"></div>
      </div>
      <span class="persona-pct" style="${isTop ? `color:${cat.color}` : ""}">${pct}%</span>
    </div>`;
  }).join("");
  animateBars(barsEl, ".persona-bar-fill");

  const tipsEl = byId("persona-tips");
  tipsEl.innerHTML = ranked.map((cat) => `
    <div class="persona-tip-card" style="border-left-color:${cat.color}">
      <div class="persona-tip-head">
        <span class="persona-tip-name" style="color:${cat.color}">${cat.name}</span>
        <span class="persona-tip-tag">${cat.desc}</span>
      </div>
      <p class="persona-tip-desc">${cat.note}</p>
      <div class="persona-tip-phrases">
        ${cat.phrases.map((p) => `<span class="phrase-chip" style="background:${cat.tint};color:${cat.color}">${p}</span>`).join("")}
      </div>
    </div>
  `).join("");

  resultsEl.classList.add("visible");
}

byId("persona-btn").addEventListener("click", analyse);
byId("persona-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) analyse();
});

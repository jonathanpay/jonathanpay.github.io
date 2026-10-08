import { g as byId } from "./utils-jnLFB3bE.js";
import { twoSidedConfidence, zScoreEqualSamples } from "./stats.js";
import { bandFor } from "./sscc-verdicts.js";

function calculate() {
  const sampleSize = parseFloat(byId("sampleSize").value);
  const controlPct = parseFloat(byId("controlRate").value);
  const variantPct = parseFloat(byId("variantRate").value);
  const errorEl = byId("sscc-error");
  const resultsEl = byId("sscc-results");

  const valid =
    sampleSize > 0 &&
    controlPct >= 0 && controlPct <= 100 &&
    variantPct >= 0 && variantPct <= 100;
  if (!valid) {
    errorEl.classList.add("visible");
    resultsEl.classList.remove("visible");
    return;
  }
  errorEl.classList.remove("visible");

  const z = zScoreEqualSamples(sampleSize, controlPct / 100, variantPct / 100);
  const band = bandFor(twoSidedConfidence(z));

  const badge = byId("sscc-badge");
  const verdict = byId("sscc-verdict");
  const state = band.significant ? "is-significant" : "not-significant";
  badge.className = `confidence-badge ${state}`;
  verdict.className = `confidence-verdict ${state}`;
  verdict.textContent = band.verdict;
  byId("sscc-note").textContent = band.note;

  byId("badge-check").style.display = band.significant ? "" : "none";
  byId("badge-cross").style.display = band.significant ? "none" : "";

  byId("sscc-validation-head").textContent = band.validationHead;
  byId("sscc-validation-body").textContent = band.validationBody;
  byId("sscc-validation").style.display = "";
  byId("sscc-crosslink-label").textContent = band.crosslinkLabel;
  byId("sscc-crosslink").style.display = "";
  byId("sscc-course-cta").style.display = "";

  resultsEl.classList.add("visible");
}

byId("sscc-btn").addEventListener("click", calculate);
["sampleSize", "controlRate", "variantRate"].forEach((id) => {
  byId(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") calculate();
  });
});

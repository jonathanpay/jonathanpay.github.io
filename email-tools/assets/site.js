// Where things live. On jonathanpay.github.io the tools are sibling .html
// files and course links go out to holisticemailacademy.com with UTM tags.
// On the Academy site the WordPress plugin sets window.HEA_ET_CONFIG first:
//
//   { internal: true, pages: { "ab-duration": "/email-tools/ab-duration/", … } }
//
// so links between tools use the WordPress page addresses, and course links
// stay on the site with ?ref= (UTM tags on internal links would overwrite the
// visitor's real traffic source in analytics).

const config = (typeof window !== "undefined" && window.HEA_ET_CONFIG) || {};

export const TOOL_FILES = {
  index: "index.html",
  hypothesis: "hypothesis-tool.html",
  "ab-duration": "ab-duration-tool.html",
  sscc: "sscc.html",
  wewe: "wewe-tool.html",
  ers: "ers-tool-feedback.html",
  f2b: "f2b-tool.html",
  tone: "tone-tool.html",
  persona: "persona-tool.html",
  "emotional-appeal": "emotional-appeal-tool.html",
  personalisation: "personalisation-tool.html",
  accessibility: "accessibility-tool.html",
  curve: "curve-tool.html",
  "dmarc-checker": "dmarc-checker-tool.html",
};

/** The address of another tool, with an optional query string. */
export function toolUrl(key, params) {
  const base = config.pages?.[key] ?? TOOL_FILES[key];
  const query = params ? String(params) : "";
  if (!query) return base;
  return base + (base.includes("?") ? "&" : "?") + query;
}

/** True on the Academy site, where course pages are on the same site. */
export const internalLinks = Boolean(config.internal);

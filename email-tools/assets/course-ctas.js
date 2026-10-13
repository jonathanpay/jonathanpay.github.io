// Academy course CTAs for the email tools.
//
// One file decides which course each tool points to, whether that course is
// live or on the waitlist, and what the link looks like. A page only needs
//
//   <div data-course-cta="ab-duration"></div>
//
// plus this script and course-cta.css. To launch a course, change its
// `status` from "waitlist" to "live" here and every block updates.
//
// Waitlist courses are planned, not built: their copy promises no date and
// no content details (title and topic only). Plan: _notes/email-tools-course-ctas-plan.md

const BASE = "https://holisticemailacademy.com/courses/";

export const UTM = { source: "hem-tools", medium: "tool" };

// status: "live" | "waitlist". level: "foundation" | "intermediate" | "advanced" | null.
// pill: the short label on the index card (level and status are added to it).
// offer: optional line shown under a live course; delete it when it ends.
export const COURSES = {
  "intermediate-the-buyers-mind": {
    title: "The Buyer's Mind",
    pill: "Buyer's Mind",
    level: "intermediate",
    status: "live",
    offer: "Free with code BUYERSMIND",
  },
  "intermediate-buyer-modalities-genai": {
    title: "Buyer Modalities & GenAI",
    pill: "Buyer Modalities",
    level: "intermediate",
    status: "live",
  },
  "email-design-course-for-beginners": {
    title: "Foundation: Email Design Excellence",
    pill: "Design",
    level: "foundation",
    status: "live",
  },
  "strategic-email-marketing-from-vision-to-value": {
    title: "Strategic Email Marketing — From Vision to Value",
    pill: "Strategy",
    level: "intermediate",
    status: "live",
  },
  "foundation-email-deliverability-fundamentals": {
    title: "Foundation Deliverability",
    pill: "Deliverability",
    level: "foundation",
    status: "live",
  },
  "foundations-email-copywriting": {
    title: "Email Copywriting",
    pill: "Copywriting",
    level: "foundation",
    status: "waitlist",
  },
  "intermediate-email-copywriting-techniques": {
    title: "Email Copywriting Techniques",
    pill: "Copywriting",
    level: "intermediate",
    status: "waitlist",
  },
  "foundation-psychology-for-email": {
    title: "Foundation Psychology",
    pill: "Psychology",
    level: "foundation",
    status: "waitlist",
  },
  "foundation-email-a-b-testing": {
    title: "Foundation A/B Testing",
    pill: "Testing",
    level: "foundation",
    status: "waitlist",
  },
  "intermediate-managing-and-optimising-deliverability": {
    title: "Intermediate Deliverability",
    pill: "Deliverability",
    level: "intermediate",
    status: "waitlist",
  },
  "intermediate-email-design-course": {
    title: "Intermediate Email Design",
    pill: "Design",
    level: "intermediate",
    status: "waitlist",
  },
};

// Keys are the page name without "-tool" and ".html", and double as
// utm_campaign. `why` is the line above the buttons; `nextWhy` explains the
// second course. Keep both to topic level for waitlist courses.
const TESTING_PRIMARY = "foundation-email-a-b-testing";
const TESTING_NEXT = "strategic-email-marketing-from-vision-to-value";
const TESTING_NEXT_WHY =
  "Testing sits inside a wider email programme. This course is about running that programme.";

export const TOOLS = {
  hypothesis: {
    why: "A good hypothesis is where a test starts. Foundation A/B Testing is the Academy course on testing properly.",
    primary: TESTING_PRIMARY,
    next: TESTING_NEXT,
    nextWhy: TESTING_NEXT_WHY,
  },
  "ab-duration": {
    why: "Sizing a test before you run it is part of testing properly. Foundation A/B Testing is the Academy course on it.",
    primary: TESTING_PRIMARY,
    next: TESTING_NEXT,
    nextWhy: TESTING_NEXT_WHY,
  },
  sscc: {
    why: "Reading a result correctly is part of testing properly. Foundation A/B Testing is the Academy course on it.",
    primary: TESTING_PRIMARY,
    next: TESTING_NEXT,
    nextWhy: TESTING_NEXT_WHY,
  },
  curve: {
    why: "CURVE is taught in The Buyer's Mind, alongside System 1 and System 2 thinking.",
    primary: "intermediate-the-buyers-mind",
    next: "foundations-email-copywriting",
  },
  "emotional-appeal": {
    why: "The emotional triggers this tool scores are the System 1 side of The Buyer's Mind.",
    primary: "intermediate-the-buyers-mind",
    next: "foundation-psychology-for-email",
  },
  persona: {
    why: "Buyer Modalities & GenAI teaches you to write for all four buyer types, including the ones your copy is currently missing.",
    primary: "intermediate-buyer-modalities-genai",
    next: "intermediate-the-buyers-mind",
  },
  personalisation: {
    why: "Personalising by buyer modality is the subject of Buyer Modalities & GenAI.",
    primary: "intermediate-buyer-modalities-genai",
    next: "intermediate-the-buyers-mind",
  },
  f2b: {
    why: "Benefit-led copy draws on how buyers decide, which is what The Buyer's Mind covers.",
    primary: "intermediate-the-buyers-mind",
    next: "foundations-email-copywriting",
  },
  wewe: {
    why: "Writing about the reader rather than the brand is part of email copywriting.",
    primary: "foundations-email-copywriting",
    next: "intermediate-the-buyers-mind",
    nextWhy: "A related topic: how buyers decide.",
  },
  ers: {
    why: "Readable copy is part of email copywriting.",
    primary: "foundations-email-copywriting",
    next: "intermediate-the-buyers-mind",
    nextWhy: "A related topic: how buyers decide.",
  },
  tone: {
    why: "Choosing a tone is part of writing email copy that works.",
    primary: "intermediate-email-copywriting-techniques",
    next: "intermediate-buyer-modalities-genai",
    nextWhy: "This course covers setting tone by buyer modality.",
  },
  accessibility: {
    why: "Accessibility is a module of Foundation: Email Design Excellence.",
    primary: "email-design-course-for-beginners",
    next: "intermediate-email-design-course",
  },
  "dmarc-checker": {
    why: "Authentication is step one. Deliverability is a whole discipline — reputation, engagement, infrastructure, monitoring — and it's taught properly at the Holistic Email Academy.",
    primary: "foundation-email-deliverability-fundamentals",
    next: "intermediate-managing-and-optimising-deliverability",
  },
};

// Link to a course with UTM parameters. `tool` is a key of TOOLS; `content`
// (optional) tells placements apart, e.g. "index" for the index-card pills.
export function courseUrl(slug, tool, content) {
  const params = new URLSearchParams({
    utm_source: UTM.source,
    utm_medium: UTM.medium,
    utm_campaign: tool,
  });
  if (content) params.set("utm_content", content);
  return `${BASE}${slug}/?${params}`;
}

const LEVEL_NAMES = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function pillLabel(course) {
  const level = LEVEL_NAMES[course.level];
  const text = level ? `${level} ${course.pill}` : course.pill;
  return `● ${text}${course.status === "waitlist" ? " · Waitlist" : ""}`;
}

export function pillClass(course) {
  return `hea-pill hea-pill--${course.level}`;
}

export function buttonLabel(course) {
  return course.status === "live" ? "See the course →" : "Join the waitlist →";
}

export function statusLabel(course) {
  return course.status === "live" ? "Available now" : "Waitlist";
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function item(slug, tool, isPrimary, note) {
  const course = COURSES[slug];
  const level = course.level || "none";
  const root = el(
    "div",
    `course-cta-item is-${level}${isPrimary ? " is-primary" : ""}`,
  );

  const tags = el("div", "course-cta-tags");
  if (course.level) {
    tags.append(el("span", "course-cta-level", LEVEL_NAMES[course.level]));
  }
  tags.append(
    el("span", `course-cta-status is-${course.status}`, statusLabel(course)),
  );
  root.append(tags, el("strong", "course-cta-title", course.title));

  if (note) root.append(el("p", "course-cta-note", note));
  if (course.status === "live" && course.offer) {
    root.append(el("p", "course-cta-offer", course.offer));
  }

  const link = el(
    "a",
    `hea-btn ${isPrimary ? "hea-btn--primary" : "hea-btn--secondary"} hea-btn--sm`,
    buttonLabel(course),
  );
  link.href = courseUrl(slug, tool);
  link.target = "_blank";
  link.rel = "noopener";
  root.append(link);
  return root;
}

export function renderCourseCta(host) {
  const tool = host.dataset.courseCta;
  const config = TOOLS[tool];
  if (!config) return false;

  const cards = el("div", "course-cta-cards");
  cards.append(item(config.primary, tool, true));
  if (config.next) cards.append(item(config.next, tool, false, config.nextWhy));

  host.classList.add("course-cta");
  host.setAttribute("role", "complementary");
  host.setAttribute("aria-label", "Related Academy courses");
  host.replaceChildren(
    el("p", "course-cta-kicker", "Go deeper"),
    el("p", "course-cta-why", config.why),
    cards,
  );
  return true;
}

// Index-card pill: <a data-course-pill="tool"> becomes a link to the tool's
// primary course, labelled with its level and status.
export function renderPill(link) {
  const tool = link.dataset.coursePill;
  const config = TOOLS[tool];
  if (!config) return false;
  const course = COURSES[config.primary];
  link.className = pillClass(course);
  link.textContent = pillLabel(course);
  link.href = courseUrl(config.primary, tool, "index");
  return true;
}

export function renderAll(root = document) {
  root.querySelectorAll("[data-course-cta]").forEach(renderCourseCta);
  root.querySelectorAll("[data-course-pill]").forEach(renderPill);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderAll());
  } else {
    renderAll();
  }
}

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

// status: "live" | "waitlist". level: "foundation" | "intermediate" | null.
// offer: optional line shown under a live course; delete it when it ends.
export const COURSES = {
  "intermediate-the-buyers-mind": {
    title: "The Buyer's Mind",
    level: "intermediate",
    status: "live",
    offer: "Free with code BUYERSMIND",
  },
  "intermediate-buyer-modalities-genai": {
    title: "Buyer Modalities & GenAI",
    level: "intermediate",
    status: "live",
  },
  "email-design-course-for-beginners": {
    title: "Foundation: Email Design Excellence",
    level: "foundation",
    status: "live",
  },
  "strategic-email-marketing-from-vision-to-value": {
    title: "Strategic Email Marketing — From Vision to Value",
    level: null,
    status: "live",
  },
  "foundation-email-deliverability-fundamentals": {
    title: "Foundation Deliverability",
    level: "foundation",
    status: "live",
  },
  "foundations-email-copywriting": {
    title: "Email Copywriting",
    level: "foundation",
    status: "waitlist",
  },
  "intermediate-email-copywriting-techniques": {
    title: "Email Copywriting Techniques",
    level: "intermediate",
    status: "waitlist",
  },
  "foundation-psychology-for-email": {
    title: "Foundation Psychology",
    level: "foundation",
    status: "waitlist",
  },
  "foundation-email-a-b-testing": {
    title: "Foundation A/B Testing",
    level: "foundation",
    status: "waitlist",
  },
  "intermediate-managing-and-optimising-deliverability": {
    title: "Intermediate Deliverability",
    level: "intermediate",
    status: "waitlist",
  },
  "intermediate-email-design-course": {
    title: "Intermediate Email Design",
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
    why: "Authentication is step one of deliverability.",
    primary: "foundation-email-deliverability-fundamentals",
    next: "intermediate-managing-and-optimising-deliverability",
  },
};

// Link to a course with UTM parameters. `tool` is a key of TOOLS.
export function courseUrl(slug, tool) {
  const params = new URLSearchParams({
    utm_source: UTM.source,
    utm_medium: UTM.medium,
    utm_campaign: tool,
  });
  return `${BASE}${slug}/?${params}`;
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
  const root = el("div", `course-cta-item${isPrimary ? " is-primary" : ""}`);

  const head = el("div", "course-cta-item-head");
  head.append(
    el("strong", "course-cta-title", course.title),
    el("span", `course-cta-status is-${course.status}`, statusLabel(course)),
  );
  root.append(head);

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

  host.classList.add("course-cta");
  host.setAttribute("role", "complementary");
  host.setAttribute("aria-label", "Related Academy courses");
  host.replaceChildren(
    el("p", "course-cta-kicker", "Go deeper"),
    el("p", "course-cta-why", config.why),
    item(config.primary, tool, true),
  );
  if (config.next) host.append(item(config.next, tool, false, config.nextWhy));
  return true;
}

export function renderAll(root = document) {
  root.querySelectorAll("[data-course-cta]").forEach(renderCourseCta);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderAll());
  } else {
    renderAll();
  }
}

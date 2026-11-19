// Course suggestions on the assessment result.
//
// This copy lives on the Academy site, so it carries its own course data
// instead of importing the email tools' course-ctas.js. To launch a course,
// change its status to "live" here AND in wordpress/apps-script/Code.gs
// (the result email), then upload the new plugin version and deploy a new
// version of the script. tests/maturity-assessment-academy.test.mjs fails
// if the two drift.
//
// BY_DIMENSION decides which courses suit each dimension at each band:
//
//   foundation   = the area is at Ad Hoc or Foundational (levels 1-2)
//   intermediate = Strategic or Optimised (levels 3-4)
//   advanced     = Innovative (level 5)
//
// An empty list means nothing is suggested for that area at that band.
// Order matters: the first course is shown first.
(function (root) {
'use strict';

// Course pages are on this site, so links are relative and carry no UTM
// tags: UTM tags on internal links overwrite the visitor's real traffic
// source in Google Analytics. "ref" shows the click in page reports instead.
const BASE = '/courses/';

// status: "live" | "waitlist". level: "foundation" | "intermediate" | "advanced".
// offer: optional line shown under a live course; delete it when it ends.
const COURSES = {
  'strategic-email-marketing-from-vision-to-value': {title: 'Strategic Email Marketing — From Vision to Value', level: 'intermediate', status: 'live'},
  'foundation-email-deliverability-fundamentals': {title: 'Foundation Deliverability', level: 'foundation', status: 'live'},
  'intermediate-managing-and-optimising-deliverability': {title: 'Intermediate Deliverability', level: 'intermediate', status: 'waitlist'},
  'advanced-mastering-deliverability-strategy-troubleshooting': {title: 'Advanced Deliverability', level: 'advanced', status: 'waitlist'},
  'email-design-course-for-beginners': {title: 'Foundation: Email Design Excellence', level: 'foundation', status: 'live'},
  'foundation-psychology-for-email': {title: 'Foundation Psychology', level: 'foundation', status: 'waitlist'},
  'intermediate-the-buyers-mind': {title: "The Buyer's Mind", level: 'intermediate', status: 'live', offer: 'Free with code BUYERSMIND'},
  'intermediate-email-design-course': {title: 'Intermediate Email Design', level: 'intermediate', status: 'waitlist'},
  'foundation-email-a-b-testing': {title: 'Foundation A/B Testing', level: 'foundation', status: 'waitlist'},
  'intermediate-buyer-modalities-genai': {title: 'Buyer Modalities & GenAI', level: 'intermediate', status: 'live'}
};

const BY_DIMENSION = [
  // Strategy & Governance
  {
    foundation: ['strategic-email-marketing-from-vision-to-value'],
    intermediate: ['strategic-email-marketing-from-vision-to-value'],
    advanced: [],
  },
  // Deliverability & Infrastructure
  {
    foundation: ['foundation-email-deliverability-fundamentals'],
    intermediate: ['intermediate-managing-and-optimising-deliverability'],
    advanced: ['advanced-mastering-deliverability-strategy-troubleshooting'],
  },
  // Customer Experience & Psychology
  {
    foundation: ['email-design-course-for-beginners', 'foundation-psychology-for-email'],
    intermediate: ['intermediate-the-buyers-mind', 'intermediate-email-design-course'],
    advanced: [],
  },
  // Testing & Learning
  {
    foundation: ['foundation-email-a-b-testing'],
    intermediate: [],
    advanced: [],
  },
  // Personalisation & Lifecycle
  {
    foundation: ['intermediate-buyer-modalities-genai'],
    intermediate: ['intermediate-buyer-modalities-genai'],
    advanced: [],
  },
];

const band = level => (level <= 2 ? 'foundation' : level <= 4 ? 'intermediate' : 'advanced');
const courseUrl = (slug, content) => BASE + slug + '/?ref=maturity-assessment' + (content ? '-' + content : '');
const ALL_COURSES_URL = BASE + '?ref=maturity-assessment-later';

// targets: from courseTargets() in advice.js: [{dimension, level, confirmed}].
// level is only used to choose a band; it is shown only when confirmed.
// Returns up to `max` courses, without repeats.
function suggest(targets, max = 3) {
  const seen = new Set();
  const out = [];
  for (const {dimension, level, confirmed} of targets) {
    for (const slug of BY_DIMENSION[dimension][band(level)]) {
      if (seen.has(slug) || !COURSES[slug] || out.length >= max) continue;
      seen.add(slug);
      const course = COURSES[slug];
      const live = course.status === 'live';
      out.push({
        slug, dimension, level, confirmed,
        title: course.title,
        courseLevel: course.level,
        live,
        status: live ? 'Available now' : 'Waitlist',
        button: live ? 'See the course →' : 'Join the waitlist →',
        offer: live ? course.offer || '' : '',
        url: courseUrl(slug, 'dimension-' + (dimension + 1)),
      });
    }
  }
  return out;
}

const api = {COURSES, BY_DIMENSION, band, courseUrl, ALL_COURSES_URL, suggest};
if (typeof module !== 'undefined' && module.exports) module.exports = api;
else root.HEA_COURSES = api;
})(typeof window !== 'undefined' ? window : globalThis);

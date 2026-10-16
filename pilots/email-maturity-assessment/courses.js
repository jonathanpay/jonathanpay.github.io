// Course suggestions on the assessment result.
//
// Course titles, live/waitlist status and links come from the email tools'
// shared data (email-tools/assets/course-ctas.js), so launching a course
// there updates this page too. This file only decides which courses suit
// each dimension at each band of maturity:
//
//   foundation   = the area is at Ad Hoc or Foundational (levels 1-2)
//   intermediate = Strategic or Optimised (levels 3-4)
//   advanced     = Innovative (level 5)
//
// An empty list means nothing is suggested for that area at that band.
// Order matters: the first course is shown first.

import {COURSES, courseUrl, buttonLabel, statusLabel} from '/email-tools/assets/course-ctas.js';

export const BY_DIMENSION = [
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

export const band = level => (level <= 2 ? 'foundation' : level <= 4 ? 'intermediate' : 'advanced');

// targets: [{dimension, level}] for the areas holding the result back.
// Returns up to `max` courses, without repeats.
export function suggest(targets, max = 3) {
  const seen = new Set();
  const out = [];
  for (const {dimension, level} of targets) {
    for (const slug of BY_DIMENSION[dimension][band(level)]) {
      if (seen.has(slug) || !COURSES[slug] || out.length >= max) continue;
      seen.add(slug);
      const course = COURSES[slug];
      const url = new URL(courseUrl(slug, 'maturity-assessment'));
      url.searchParams.set('utm_source', 'hem-assessment');
      url.searchParams.set('utm_medium', 'assessment');
      url.searchParams.set('utm_content', 'dimension-' + (dimension + 1));
      out.push({
        slug, dimension, level,
        title: course.title,
        courseLevel: course.level,
        live: course.status === 'live',
        status: statusLabel(course),
        button: buttonLabel(course),
        offer: course.status === 'live' ? course.offer || '' : '',
        url: url.toString(),
      });
    }
  }
  return out;
}

if (typeof window !== 'undefined') {
  window.HEA_COURSES = {suggest};
  window.dispatchEvent(new Event('hea-courses-ready'));
}

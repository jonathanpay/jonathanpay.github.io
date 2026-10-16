// Rules for what the result may say about courses and support, given what
// the answers actually establish. Shared by the page (app.js) and the tests;
// apps-script/Code.gs keeps a copy for the emailed result (a test checks
// that the two agree).
//
// - An area with unknown answers has no definitive level (Review 04), so a
//   course card never states one for it, and never says it is holding the
//   result back.
// - An area with no known answers gets no course card: nothing supports one.
// - Courses are promoted only when the person says the obstacle is knowledge
//   or skills; otherwise they are optional, or reduced to a single link when
//   the area is not a priority.
(function (root) {
  'use strict';

  // Obstacle indexes match data.js "obstacles".
  const KNOWLEDGE = 0, NOT_PRIORITY = 6;

  // Areas that course suggestions may be offered for, and what may be said.
  // level: the area's level when confirmed; otherwise its lowest possible
  // level, used only to choose a course band and never shown.
  function courseTargets(result) {
    const ids = result.state === 'complete' ? result.constraints : result.possibleConstraints;
    return ids.map(function (i) {
      const d = result.dimensions[i];
      if (d.unknowns.length === d.indices.length) return null;
      return d.complete
        ? {dimension: i, level: d.score.level, confirmed: true}
        : {dimension: i, level: d.lowerLevel, confirmed: false};
    }).filter(Boolean);
  }

  // 'promoted' | 'optional' | 'link'
  function courseMode(p1) {
    const answered = p1 && p1.status === 'answered' && Number.isInteger(p1.obstacle);
    if (answered && p1.obstacle === KNOWLEDGE) return 'promoted';
    if (answered && p1.obstacle === NOT_PRIORITY) return 'link';
    return 'optional';
  }

  // "Get support" copy, by obstacle. None of it contradicts the course panel.
  const SUPPORT_DEFAULT = 'Start with the next step above. The courses below are optional, if you want to build skills in this area. If something is making progress difficult, the optional question further down can tailor this advice.';
  const SUPPORT = [
    'You said a knowledge or skills gap is making this difficult. The courses below cover this area; the free tools are a good place to try things first.',
    'Pick the one next step above and agree who has capacity for it. A course will not create time on its own, so the courses below are optional.',
    'Involve the data or technical owner before changing practice; they can tell you what is possible. The courses below are optional background.',
    'Start with the free tools and the next step above, and build a case for investment from what you find. The courses below are optional.',
    'Share this result and one specific proposal with the person who decides. The courses below are optional.',
    'Start with the next step above: treat it as your first priority. The courses below are optional.',
    'Keep this result for when this area becomes a priority. There is a link to the Academy below for later.',
    'Start with the next step above, and work out which of the obstacles matters most. The courses below are optional.',
    'Start with the next step above. It is fine not to know yet what is making this difficult. The courses below are optional.'
  ];
  function supportCopy(p1) {
    const answered = p1 && p1.status === 'answered' && Number.isInteger(p1.obstacle) && SUPPORT[p1.obstacle];
    return answered ? SUPPORT[p1.obstacle] : SUPPORT_DEFAULT;
  }

  const api = {courseTargets: courseTargets, courseMode: courseMode, supportCopy: supportCopy, SUPPORT: SUPPORT, SUPPORT_DEFAULT: SUPPORT_DEFAULT};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HEA_ADVICE = api;
})(typeof window !== 'undefined' ? window : globalThis);

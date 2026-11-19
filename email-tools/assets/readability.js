// Readability formulas for the Email Readability Score. No DOM, so it can be tested.
//
// Email copy is full of lines with no full stop: headings, bullets, buttons,
// sign-offs. Each line break therefore ends a sentence too, or the whole
// email reads as one enormous sentence and every score looks harder than it is.

const WORD_RE = /[a-z]+(?:['’][a-z]+)*/gi;

export function words(text) {
  return text.match(WORD_RE) ?? [];
}

export function sentences(text) {
  return text
    .replace(/(\d)[.,](\d)/g, '$1$2') // 2.5% and 10,000 are not sentence ends
    .split(/[.!?…]+(?=\s|$)|\n+/)
    .map(s => s.trim())
    .filter(s => /[a-z]/i.test(s));
}

/**
 * Heuristic syllable count. Drops a silent final "e", "es" and "ed"
 * ("time", "makes", "jumped") but keeps "-le" ("table") and "-ted"/"-ded"
 * ("wanted", "needed"), which are sounded.
 */
export function syllables(word) {
  let w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouydt]ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = w.match(/[aeiouy]+/g);
  return groups ? groups.length : 1;
}

function stats(text) {
  const wordList = words(text);
  const wordCount = wordList.length || 1;
  const sentenceCount = Math.max(1, sentences(text).length);
  const syllableCount = wordList.reduce((n, w) => n + syllables(w), 0);
  const complex = wordList.filter(w => syllables(w) >= 3).length;
  return { wordCount, sentenceCount, syllableCount, complex };
}

/** US school grade to UK reading age (grade 8 is about age 13–14). */
function readingAge(grade) {
  if (grade >= 13) return 'university level';
  const age = Math.max(6, Math.round(grade) + 5);
  return `reading age about ${age}`;
}

function gradeLabel(grade) {
  let label;
  if (grade <= 6) label = 'Clear & accessible';
  else if (grade <= 8) label = 'Good for most email';
  else if (grade <= 10) label = 'Moderate complexity';
  else if (grade <= 12) label = 'Challenging';
  else label = 'Very complex';
  return `${label} — ${readingAge(grade)}`;
}

/** Flesch Reading Ease: 0–100, higher is easier. */
export function fleschReadingEase(text) {
  const s = stats(text);
  const score = 206.835 - 1.015 * (s.wordCount / s.sentenceCount) - 84.6 * (s.syllableCount / s.wordCount);
  let label;
  if (score >= 90) label = 'Very easy — reading age 10–11';
  else if (score >= 80) label = 'Easy — reading age 11–12';
  else if (score >= 70) label = 'Fairly easy — reading age 12–13';
  else if (score >= 60) label = 'Plain English — reading age 13–15';
  else if (score >= 50) label = 'Fairly difficult — reading age 15–18';
  else if (score >= 30) label = 'Difficult — university level';
  else label = 'Very difficult — graduate level';
  return { score, label };
}

/** Gunning Fog index: a school grade. */
export function gunningFog(text) {
  const s = stats(text);
  const grade = 0.4 * (s.wordCount / s.sentenceCount + 100 * (s.complex / s.wordCount));
  return { score: grade, label: gradeLabel(grade) };
}

/** SMOG grade, scaled to 30 sentences as in McLaughlin's formula. */
export function smog(text) {
  const s = stats(text);
  const grade = 1.043 * Math.sqrt(s.complex * (30 / s.sentenceCount)) + 3.1291;
  return { score: grade, label: gradeLabel(grade) };
}

export function suggestions(text) {
  const out = [];
  if (sentences(text).some(s => words(s).length > 20)) {
    out.push('You have at least one very long sentence (20+ words). Breaking it up will improve readability.');
  }
  if (words(text).filter(w => syllables(w) >= 3).length > 5) {
    out.push('Your text contains several words of three or more syllables. Where possible, swap them for shorter alternatives.');
  }
  const passive = text.match(/\b(is|was|were|been|being|are|be)\s+\w+ed\b/gi);
  if (passive && passive.length > 2) {
    out.push('Passive voice detected multiple times. Active constructions ("we sent" vs "was sent") tend to read faster.');
  }
  return out;
}

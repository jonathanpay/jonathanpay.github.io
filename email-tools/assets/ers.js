import { getEl } from './utils.js';

function syllablesInWord(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/e$/, '');
  const matches = word.match(/[aeiouy]+/g);
  return matches ? Math.max(1, matches.length) : 1;
}

function countSyllables(text) {
  return (text.match(/\b[a-zA-Z]+\b/g) ?? []).reduce((n, w) => n + syllablesInWord(w), 0);
}

function complexWordCount(text) {
  return (text.match(/\b[a-zA-Z]+\b/g) ?? []).filter(w => syllablesInWord(w) >= 3).length;
}

function gradeLabel(grade) {
  if (grade <= 6)  return 'Clear & accessible';
  if (grade <= 8)  return 'Good for most email';
  if (grade <= 10) return 'Moderate complexity';
  if (grade <= 12) return 'Challenging';
  return 'Very complex';
}

function calcFleschKincaid(text) {
  const wordList  = text.match(/\b[a-zA-Z]+\b/g) ?? [];
  const words     = wordList.length || 1;
  const sentences = Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
  const syllables = countSyllables(text);
  const score     = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));

  let label = '';
  if      (score >= 90) label = 'Very Easy — 5th grade';
  else if (score >= 80) label = 'Easy — 6th grade';
  else if (score >= 70) label = 'Fairly Easy — 7th grade';
  else if (score >= 60) label = 'Standard — 8th–9th grade';
  else if (score >= 50) label = 'Fairly Difficult — 10th–12th grade';
  else if (score >= 30) label = 'Difficult — College level';
  else                  label = 'Very Difficult — Advanced College';

  return { score: score.toFixed(1), label };
}

function calcGunningFog(text) {
  const words     = (text.match(/\b[a-zA-Z]+\b/g) ?? []).length || 1;
  const sentences = Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
  const complex   = complexWordCount(text);
  const grade     = 0.4 * ((words / sentences) + 100 * (complex / words));
  return { score: grade.toFixed(1), label: gradeLabel(grade) };
}

function calcSMOG(text) {
  const sentences = Math.max(1, (text.match(/[.!?]+/g) ?? []).length);
  const complex   = complexWordCount(text);
  const grade     = 1.0430 * Math.sqrt(complex * (30 / sentences)) + 3.1291;
  return { score: grade.toFixed(1), label: gradeLabel(grade) };
}

function analyseText(text) {
  const feedback = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  if (sentences.some(s => (s.match(/\b[a-zA-Z]+\b/g) ?? []).length > 20))
    feedback.push('You have at least one very long sentence (20+ words). Breaking it up will improve readability.');
  if (complexWordCount(text) > 5)
    feedback.push('Your text contains several polysyllabic words. Where possible, swap them for shorter alternatives.');
  const passive = text.match(/\b(is|was|were|been|being|are|be)\s+\w+ed\b/gi);
  if (passive && passive.length > 2)
    feedback.push('Passive voice detected multiple times. Active constructions ("we sent" vs "was sent") tend to read faster.');
  return feedback;
}

function check() {
  const text      = getEl('readability-input').value.trim();
  const errorEl   = getEl('ers-error');
  const resultsEl = getEl('ers-results');

  if (!text) {
    errorEl.classList.add('visible');
    resultsEl.classList.remove('visible');
    return;
  }
  errorEl.classList.remove('visible');

  const fk   = calcFleschKincaid(text);
  const gf   = calcGunningFog(text);
  const smog = calcSMOG(text);
  const feedback = analyseText(text);

  getEl('fk-score').textContent   = fk.score;
  getEl('fk-grade').textContent   = fk.label;
  getEl('gf-score').textContent   = gf.score;
  getEl('gf-grade').textContent   = gf.label;
  getEl('smog-score').textContent = smog.score;
  getEl('smog-grade').textContent = smog.label;

  const allDifficult = parseFloat(fk.score) < 50 && parseFloat(gf.score) > 10 && parseFloat(smog.score) > 10;
  getEl('ers-consulting-cta').style.display = allDifficult ? '' : 'none';

  const suggestWrap = getEl('suggestions-wrap');
  const suggestList = getEl('suggestions-list');
  if (feedback.length > 0) {
    suggestList.innerHTML = feedback.map(s => `<li>${s}</li>`).join('');
    suggestWrap.style.display = 'block';
  } else {
    suggestWrap.style.display = 'none';
  }

  resultsEl.classList.add('visible');
}

getEl('ers-btn').addEventListener('click', check);
getEl('readability-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) check();
});

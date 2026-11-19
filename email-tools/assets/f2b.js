import { getEl } from './utils.js';
import { toolUrl } from './site.js';
import { templates } from './f2b-templates.js';
import { detectCategory, fillTemplate, buyerTypeMap } from './f2b-match.js';

function convert() {
  const feature   = getEl('feature-input').value.trim();
  const vertical  = getEl('vertical-select').value;
  const errorEl   = getEl('f2b-error');
  const resultsEl = getEl('f2b-results');

  if (!feature) {
    errorEl.classList.add('visible');
    resultsEl.classList.remove('visible');
    return;
  }
  errorEl.classList.remove('visible');

  const { category, matched } = detectCategory(feature);
  const pool     = templates[vertical][category];
  const benefit  = fillTemplate(pool[Math.floor(Math.random() * pool.length)], feature);

  getEl('benefit-output').textContent = benefit;

  const buyerType = buyerTypeMap[category];
  const noteEl = getEl('buyer-type-note');
  const unmatched = matched ? '' : 'We couldn\'t tell what kind of feature this is, so this is an ease-of-use angle. A word about what it does (saves time, cuts costs, keeps data safe, shows results) gives a closer match. ';
  noteEl.innerHTML = `${unmatched}This benefit is most likely to resonate with <strong>${buyerType}</strong> buyer types. <a href="${toolUrl('persona')}">Check your full email in the Buyer Persona Matcher →</a>`;
  noteEl.style.display = '';

  resultsEl.classList.add('visible');
}

getEl('f2b-btn').addEventListener('click', convert);
getEl('f2b-again').addEventListener('click', convert);
getEl('feature-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') convert();
});

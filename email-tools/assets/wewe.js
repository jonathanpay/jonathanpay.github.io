import { getEl } from './utils.js';
import { countPronouns } from './pronouns.js';

const TIP_BRAND_HEAVY = 'Your copy is heavily brand-focused. Try replacing "we", "us", and "our" with "you" and "your" to put your reader at the centre of the message.';

function analyse() {
  const text = getEl('wewe-input').value.trim();
  const errorEl = getEl('wewe-error');
  const resultsEl = getEl('wewe-results');

  if (!text) {
    errorEl.classList.add('visible');
    resultsEl.classList.remove('visible');
    return;
  }
  errorEl.classList.remove('visible');

  const { total, brandPct, customerPct } = countPronouns(text);
  const tipText = getEl('wewe-tip-text');

  if (total === 0) {
    getEl('brand-pct').textContent = '—';
    getEl('customer-pct').textContent = '—';
    getEl('brand-bar').style.width = '0%';
    getEl('customer-bar').style.width = '0%';
    tipText.textContent = 'No brand or reader pronouns found (we, our, I, you, your…), so there\'s no balance to measure. Copy that never says "you" can still feel distant: try speaking to the reader directly.';
    getEl('wewe-tip').classList.add('visible');
    getEl('wewe-consulting-cta').style.display = 'none';
    resultsEl.classList.add('visible');
    return;
  }

  getEl('brand-pct').textContent = brandPct + '%';
  getEl('customer-pct').textContent = customerPct + '%';
  resultsEl.classList.add('visible');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    getEl('brand-bar').style.width = brandPct + '%';
    getEl('customer-bar').style.width = customerPct + '%';
  }));

  tipText.textContent = TIP_BRAND_HEAVY;
  getEl('wewe-tip').classList.toggle('visible', brandPct > 60);
  getEl('wewe-consulting-cta').style.display = brandPct > 75 ? '' : 'none';
}

getEl('wewe-btn').addEventListener('click', analyse);
getEl('wewe-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) analyse();
});

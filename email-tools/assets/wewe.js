import { getEl } from './utils.js';

const BRAND_WORDS = new Set(['we', 'us', 'our', 'my', 'i', 'me']);
const CUSTOMER_WORDS = new Set(['you', 'your']);

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

  const words = text.toLowerCase().match(/\b(\w+)\b/g) ?? [];
  let brand = 0, customer = 0;
  for (const w of words) {
    if (BRAND_WORDS.has(w)) brand++;
    else if (CUSTOMER_WORDS.has(w)) customer++;
  }

  const total = brand + customer;
  const brandPct = total > 0 ? Math.round(brand / total * 100) : 0;
  const customerPct = total > 0 ? Math.round(customer / total * 100) : 0;

  getEl('brand-pct').textContent = brandPct + '%';
  getEl('customer-pct').textContent = customerPct + '%';
  resultsEl.classList.add('visible');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    getEl('brand-bar').style.width = brandPct + '%';
    getEl('customer-bar').style.width = customerPct + '%';
  }));

  getEl('wewe-tip').classList.toggle('visible', brandPct > 60);
  getEl('wewe-consulting-cta').style.display = brandPct > 75 ? '' : 'none';
}

getEl('wewe-btn').addEventListener('click', analyse);
getEl('wewe-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) analyse();
});

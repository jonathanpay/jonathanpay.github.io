import { getEl } from './utils.js';
import { analyseTokens } from './personalisation-rules.js';

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function analyse() {
  const espKey  = getEl('esp-select').value;
  const text    = getEl('pc-input').value.trim();
  const errorEl = getEl('pc-error');
  const results = getEl('pc-results');

  if (!espKey) {
    errorEl.textContent = 'Please select your email platform before checking.';
    errorEl.classList.add('visible');
    results.classList.remove('visible');
    return;
  }
  if (!text) {
    errorEl.textContent = 'Please paste some email copy before checking.';
    errorEl.classList.add('visible');
    results.classList.remove('visible');
    return;
  }
  errorEl.classList.remove('visible');

  const { esp, tokens, openCount, closeCount } = analyseTokens(text, espKey);

  renderSummary(tokens, esp, openCount, closeCount);
  renderTokenSection(tokens, esp, text);
  renderBlocksSection(openCount, closeCount, esp);
  renderPlatformNote(esp);

  results.classList.add('visible');
}

function renderSummary(tokens, esp, openCount, closeCount) {
  const el = getEl('pc-summary');
  const total       = tokens.length;
  const withFallback = tokens.filter(t => t.hasFallback).length;
  const withoutFallback = total - withFallback;
  const blocksBalanced = (openCount === 0 && closeCount === 0) || openCount === closeCount;

  if (total === 0) {
    el.innerHTML = `
      <div class="pc-summary-box pc-summary-box--neutral">
        <span class="pc-summary-icon">—</span>
        <div>
          <strong>No personalisation tokens found</strong>
          <p>No ${escapeHtml(esp.name)}-style tokens were detected in your copy. If you expected to find some, check that you selected the correct platform and that the tokens are formatted correctly.</p>
        </div>
      </div>`;
    return;
  }

  if (esp.advancedScripting) {
    el.innerHTML = `
      <div class="pc-summary-box pc-summary-box--neutral">
        <span class="pc-summary-icon">—</span>
        <div><p>Found <strong>${total} unique token${total !== 1 ? 's' : ''}</strong>. ${escapeHtml(esp.name)} sets fallbacks in scripting, so check those by hand.${blocksBalanced ? '' : ` Conditional blocks don't match (${openCount} open, ${closeCount} close).`}</p></div>
      </div>`;
    return;
  }

  const issues = withoutFallback > 0 || !blocksBalanced;
  const cls = issues ? 'pc-summary-box--warn' : 'pc-summary-box--ok';
  const icon = issues ? '⚠' : '✓';

  let msg = '';
  if (!issues) {
    msg = `Found <strong>${total} unique token${total !== 1 ? 's' : ''}</strong> — all have fallback values.`;
  } else {
    const parts = [];
    if (withoutFallback > 0) parts.push(`<strong>${withoutFallback} token${withoutFallback !== 1 ? 's' : ''} without a fallback</strong>`);
    if (!blocksBalanced) parts.push(`<strong>mismatched conditional blocks</strong> (${openCount} open, ${closeCount} close)`);
    msg = `Found ${total} unique token${total !== 1 ? 's' : ''}. Issues: ${parts.join(' and ')}.`;
  }

  el.innerHTML = `
    <div class="pc-summary-box ${cls}">
      <span class="pc-summary-icon">${icon}</span>
      <div><p>${msg}</p></div>
    </div>`;
}

function renderTokenSection(tokens, esp, fullText) {
  const section = getEl('pc-token-section');
  const list    = getEl('pc-token-list');

  if (tokens.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  list.innerHTML = tokens.map(t => {
    const hasFallback = t.hasFallback || (esp.noInlineFallback && esp.detectFallback(t.raw, fullText));
    const warn = !hasFallback && !esp.advancedScripting;
    const cardCls = warn ? 'pc-token-card pc-token-card--warn' : 'pc-token-card';
    const dotCls  = warn ? 'pc-status-dot pc-status-dot--warn' : 'pc-status-dot pc-status-dot--ok';
    const partial = !hasFallback && t.withFallback > 0;
    const statusText = esp.advancedScripting
      ? '<span class="pc-token-status pc-token-status--info">Advanced scripting — check manually</span>'
      : partial
        ? `<span class="pc-token-status pc-token-status--warn">⚠ ${t.count - t.withFallback} of ${t.count} uses have no fallback</span>`
      : hasFallback
        ? `<span class="pc-token-status pc-token-status--ok">✓ Has fallback${t.fallbackValue ? `: <em>${escapeHtml(t.fallbackValue)}</em>` : ''}</span>`
        : esp.noInlineFallback
          ? '<span class="pc-token-status pc-token-status--warn">⚠ No inline fallback supported — set default in platform</span>'
          : '<span class="pc-token-status pc-token-status--warn">⚠ No fallback value</span>';

    const fixHtml = (!hasFallback && !esp.advancedScripting && esp.fixTemplate)
      ? `<div class="pc-token-fix"><strong>Suggested fix:</strong> <code>${escapeHtml(esp.fixTemplate(t.varName))}</code></div>`
      : '';

    return `
      <div class="${cardCls}">
        <div class="pc-token-head">
          <span class="${dotCls}"></span>
          <code class="pc-token-code">${escapeHtml(t.raw)}</code>
          <span class="pc-count-badge">${t.count}×</span>
        </div>
        <div class="pc-token-meta">
          <span class="pc-token-var">Field: <strong>${escapeHtml(t.varName)}</strong></span>
          ${statusText}
        </div>
        ${fixHtml}
      </div>`;
  }).join('');
}

function renderBlocksSection(open, close, esp) {
  const section = getEl('pc-blocks-section');

  if (esp.ifOpenRegex === null) {
    section.style.display = 'none';
    return;
  }

  if (open === 0 && close === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  const balanced = open === close;
  const cls  = balanced ? 'pc-blocks-status--ok'   : 'pc-blocks-status--warn';
  const icon = balanced ? '✓' : '⚠';
  const msg  = balanced
    ? `${open} conditional block${open !== 1 ? 's' : ''} found — opening and closing tags are balanced.`
    : `Mismatched blocks: ${open} opening tag${open !== 1 ? 's' : ''} and ${close} closing tag${close !== 1 ? 's' : ''}. Check for missing <code>endif</code> or unclosed <code>if</code>.`;

  getEl('pc-blocks-status').innerHTML = `
    <div class="pc-blocks-status ${cls}">
      <span>${icon}</span>
      <span>${msg}</span>
    </div>`;
}

function renderPlatformNote(esp) {
  const el = getEl('pc-platform-note');
  el.innerHTML = `<strong>${escapeHtml(esp.name)}:</strong> ${esp.platformNote}`;
}

getEl('pc-btn').addEventListener('click', analyse);
getEl('pc-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) analyse();
});

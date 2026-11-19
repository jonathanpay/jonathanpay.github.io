import { getEl } from './utils.js';

const ESPs = {

  klaviyo: {
    name: 'Klaviyo',
    tokenRegex: /\{\{\s*[\w.]+(?:\s*\|[^}]*)?\s*\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').split('|')[0].trim(),
    detectFallback:   raw => /\|\s*default\s*:/i.test(raw),
    getFallbackValue: raw => { const m = raw.match(/\|\s*default\s*:\s*['"]?([^'"}\s|]+)['"]?/i); return m?.[1] ?? null; },
    ifOpenRegex:      /\{%-?\s*if\s/g,
    ifCloseRegex:     /\{%-?\s*endif/g,
    noInlineFallback:  false,
    advancedScripting: false,
    platformNote: 'Use <code>{{ first_name | default: \'Friend\' }}</code> to set fallback values inline.',
    fixTemplate: v => `{{ ${v} | default: 'value' }}`,
  },

  hubspot: {
    name: 'HubSpot',
    tokenRegex: /\{\{\s*[\w.]+(?:\s*\|[^}]*)?\s*\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').split('|')[0].trim(),
    detectFallback:   raw => /\|\s*fallback\s*:/i.test(raw),
    getFallbackValue: raw => { const m = raw.match(/\|\s*fallback\s*:\s*['"]?([^'"}\s|]+)['"]?/i); return m?.[1] ?? null; },
    ifOpenRegex:      /\{%-?\s*if\s/g,
    ifCloseRegex:     /\{%-?\s*endif/g,
    noInlineFallback:  false,
    advancedScripting: false,
    platformNote: 'HubSpot uses HubL. Add fallbacks with <code>{{ contact.firstname | fallback: "Friend" }}</code>.',
    fixTemplate: v => `{{ ${v} | fallback: "value" }}`,
  },

  brevo: {
    name: 'Brevo (Sendinblue)',
    tokenRegex: /\{\{\s*[\w.]+(?:\s+or\s+[^}]*)?\s*\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').split(/\s+or\s+/i)[0].trim(),
    detectFallback:   raw => /\s+or\s+/i.test(raw),
    getFallbackValue: raw => { const m = raw.match(/\s+or\s+['"]?([^'"}\s]+)['"]?/i); return m?.[1] ?? null; },
    ifOpenRegex:      /\{%-?\s*if\s/g,
    ifCloseRegex:     /\{%-?\s*endif/g,
    noInlineFallback:  false,
    advancedScripting: false,
    platformNote: 'Brevo uses Jinja2-style syntax. Set a fallback with <code>{{ contact.FIRSTNAME or \'Friend\' }}</code>.',
    fixTemplate: v => `{{ ${v} or 'value' }}`,
  },

  drip: {
    name: 'Drip',
    tokenRegex: /\{\{\s*[\w.]+(?:\s*\|[^}]*)?\s*\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').split('|')[0].trim(),
    detectFallback:   raw => /\|\s*default\s*:/i.test(raw),
    getFallbackValue: raw => { const m = raw.match(/\|\s*default\s*:\s*['"]?([^'"}\s|]+)['"]?/i); return m?.[1] ?? null; },
    ifOpenRegex:      /\{%-?\s*if\s/g,
    ifCloseRegex:     /\{%-?\s*endif/g,
    noInlineFallback:  false,
    advancedScripting: false,
    platformNote: 'Drip uses Liquid. Add fallbacks with <code>{{ subscriber.first_name | default: \'Friend\' }}</code>.',
    fixTemplate: v => `{{ ${v} | default: 'value' }}`,
  },

  convertkit: {
    name: 'ConvertKit / Kit',
    tokenRegex: /\{\{\s*[\w.]+(?:\s*\|[^}]*)?\s*\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').split('|')[0].trim(),
    detectFallback:   raw => /\|\s*default\s*:/i.test(raw),
    getFallbackValue: raw => { const m = raw.match(/\|\s*default\s*:\s*['"]?([^'"}\s|]+)['"]?/i); return m?.[1] ?? null; },
    ifOpenRegex:      /\{%-?\s*if\s/g,
    ifCloseRegex:     /\{%-?\s*endif/g,
    noInlineFallback:  false,
    advancedScripting: false,
    platformNote: 'ConvertKit uses Liquid. Add fallbacks with <code>{{ subscriber.first_name | default: \'Friend\' }}</code>.',
    fixTemplate: v => `{{ ${v} | default: 'value' }}`,
  },

  mailchimp: {
    name: 'Mailchimp',
    tokenRegex: /\*\|(?!IF:|ELSE:|END:|ELSEIF:)[A-Z][A-Z0-9_:]*\|\*/g,
    extractVar:       raw => raw.replace(/^\*\|/, '').replace(/\|\*$/, ''),
    detectFallback:   (raw, fullText) => {
      const varName = raw.replace(/^\*\|/, '').replace(/\|\*$/, '');
      return new RegExp(`\\*\\|IF:${varName}\\|\\*`, 'i').test(fullText)
          && /\*\|ELSE:\|\*/.test(fullText);
    },
    getFallbackValue: () => null,
    ifOpenRegex:      /\*\|IF:[A-Z][A-Z0-9_]*\|\*/g,
    ifCloseRegex:     /\*\|END:IF\|\*/g,
    noInlineFallback:  true,
    advancedScripting: false,
    platformNote: 'Mailchimp merge tags don\'t support inline fallbacks. Wrap the tag in a conditional block: <code>*|IF:FNAME|* *|FNAME|*,*|ELSE:|* Friend,*|END:IF|*</code>',
    fixTemplate: v => `*|IF:${v}|* *|${v}|*,*|ELSE:|* value,*|END:IF|*`,
  },

  activecampaign: {
    name: 'ActiveCampaign',
    tokenRegex: /%[A-Z][A-Z0-9_]*%/g,
    extractVar:       raw => raw.replace(/%/g, ''),
    detectFallback:   () => false,
    getFallbackValue: () => null,
    ifOpenRegex:      null,
    ifCloseRegex:     null,
    noInlineFallback:  true,
    advancedScripting: false,
    platformNote: 'ActiveCampaign personalisation tags (<code>%FIRSTNAME%</code>) do not support inline fallback values. Set a default value for the contact field inside ActiveCampaign\'s contact settings instead.',
    fixTemplate: null,
  },

  campaignmonitor: {
    name: 'Campaign Monitor',
    tokenRegex: /\[[a-zA-Z_]\w*(?:,[^\]]+)?\]/g,
    extractVar:       raw => raw.replace(/^\[/, '').replace(/\]$/, '').split(',')[0].trim(),
    detectFallback:   raw => /,\s*fallback\s*=/i.test(raw),
    getFallbackValue: raw => { const m = raw.match(/,\s*fallback\s*=\s*([^\]]+)/i); return m?.[1]?.trim() ?? null; },
    ifOpenRegex:      null,
    ifCloseRegex:     null,
    noInlineFallback:  false,
    advancedScripting: false,
    platformNote: 'Campaign Monitor supports inline fallbacks in square-bracket syntax: <code>[firstname,fallback=Friend]</code>.',
    fixTemplate: v => `[${v},fallback=value]`,
  },

  omnisend: {
    name: 'Omnisend',
    tokenRegex: /\[\[\s*[\w.]+(?:\s*\|[^\]]*?)?\s*\]\]/g,
    extractVar:       raw => raw.replace(/\[\[|\]\]/g, '').split('|')[0].trim(),
    detectFallback:   raw => /\|\s*default\s*:/i.test(raw),
    getFallbackValue: raw => { const m = raw.match(/\|\s*default\s*:\s*['"]?([^'"\]\s|]+)['"]?/i); return m?.[1] ?? null; },
    ifOpenRegex:      /\[%-?\s*if\s/g,
    ifCloseRegex:     /\[%-?\s*endif/g,
    noInlineFallback:  false,
    advancedScripting: false,
    platformNote: 'Omnisend uses double square-bracket tokens. Add fallbacks with <code>[[ contact.firstName | default: "Friend" ]]</code>.',
    fixTemplate: v => `[[${v} | default: "value"]]`,
  },

  sendgrid: {
    name: 'SendGrid / Twilio',
    tokenRegex: /\{\{(?!#|\/|!|>)\s*[\w.]+\s*\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').trim(),
    detectFallback:   (raw, fullText) => {
      const varName = raw.replace(/\{\{|\}\}/g, '').trim();
      return new RegExp(`\\{\\{#if\\s+${varName}\\s*\\}\\}`, 'i').test(fullText)
          && /\{\{else\}\}/i.test(fullText);
    },
    getFallbackValue: () => null,
    ifOpenRegex:      /\{\{#if\s/g,
    ifCloseRegex:     /\{\{\/if\}\}/g,
    noInlineFallback:  true,
    advancedScripting: false,
    platformNote: 'SendGrid uses Handlebars. Fallbacks require a conditional block: <code>{{#if first_name}}{{first_name}}{{else}}Friend{{/if}}</code>',
    fixTemplate: v => `{{#if ${v}}}{{${v}}}{{else}}value{{/if}}`,
  },

  iterable: {
    name: 'Iterable',
    tokenRegex: /\{\{(?!#|\/|!|>)\s*[\w.]+\s*\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').trim(),
    detectFallback:   (raw, fullText) => {
      const varName = raw.replace(/\{\{|\}\}/g, '').trim();
      return new RegExp(`\\{\\{#if\\s+${varName}\\s*\\}\\}`, 'i').test(fullText)
          && /\{\{else\}\}/i.test(fullText);
    },
    getFallbackValue: () => null,
    ifOpenRegex:      /\{\{#if\s/g,
    ifCloseRegex:     /\{\{\/if\}\}/g,
    noInlineFallback:  true,
    advancedScripting: false,
    platformNote: 'Iterable uses Handlebars syntax. Fallbacks require a block: <code>{{#if firstName}}{{firstName}}{{else}}Friend{{/if}}</code>',
    fixTemplate: v => `{{#if ${v}}}{{${v}}}{{else}}value{{/if}}`,
  },

  pardot: {
    name: 'Pardot / Account Engagement',
    tokenRegex: /\{\{(?!#|\/|!|>)\s*[\w.]+\s*\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').trim(),
    detectFallback:   (raw, fullText) => {
      const varName = raw.replace(/\{\{|\}\}/g, '').trim();
      return new RegExp(`\\{\\{#if\\s+${varName}\\s*\\}\\}`, 'i').test(fullText)
          && /\{\{else\}\}/i.test(fullText);
    },
    getFallbackValue: () => null,
    ifOpenRegex:      /\{\{#if\s/g,
    ifCloseRegex:     /\{\{\/if\}\}/g,
    noInlineFallback:  true,
    advancedScripting: false,
    platformNote: 'Pardot uses Handlebars-style syntax. Fields typically use <code>Recipient.</code> prefix (e.g. <code>{{Recipient.FirstName}}</code>). Fallbacks require conditional blocks.',
    fixTemplate: v => `{{#if ${v}}}{{${v}}}{{else}}value{{/if}}`,
  },

  dotdigital: {
    name: 'Dotdigital',
    tokenRegex: /@[A-Z][A-Z0-9_]*@/g,
    extractVar:       raw => raw.replace(/@/g, ''),
    detectFallback:   () => false,
    getFallbackValue: () => null,
    ifOpenRegex:      null,
    ifCloseRegex:     null,
    noInlineFallback:  true,
    advancedScripting: false,
    platformNote: 'Dotdigital uses at-sign tokens (<code>@FIRSTNAME@</code>). Fallback values must be configured in the contact data field settings within Dotdigital — they cannot be set inline in copy.',
    fixTemplate: null,
  },

  mailerlite: {
    name: 'MailerLite',
    tokenRegex: /\{\$[a-z_]\w*\}/g,
    extractVar:       raw => raw.replace(/^\{\$/, '').replace(/\}$/, ''),
    detectFallback:   () => false,
    getFallbackValue: () => null,
    ifOpenRegex:      null,
    ifCloseRegex:     null,
    noInlineFallback:  true,
    advancedScripting: false,
    platformNote: 'MailerLite uses dollar-sign tokens (<code>{$name}</code>). Fallback values must be set as field defaults in your MailerLite account — inline fallbacks are not supported.',
    fixTemplate: null,
  },

  sfmc: {
    name: 'Salesforce Marketing Cloud',
    tokenRegex: /%%[A-Z_a-z][^%]*%%/g,
    extractVar:       raw => raw.replace(/%%/g, '').trim(),
    detectFallback:   () => false,
    getFallbackValue: () => null,
    ifOpenRegex:      /\bIF\s+@?\w+\s*==\s*/gi,
    ifCloseRegex:     /\bENDIF\b/gi,
    noInlineFallback:  false,
    advancedScripting: true,
    platformNote: '<strong>Advanced scripting detected.</strong> SFMC supports AMPscript and SSJS. Fallbacks can be set using <code>AttributeValue()</code> or <code>IIF()</code> in AMPscript — this tool shows token counts only and does not validate scripting logic.',
    fixTemplate: null,
  },

  marketo: {
    name: 'Marketo',
    tokenRegex: /\{\{(?:lead|my|company|system)\.[\w\s]+\}\}/g,
    extractVar:       raw => raw.replace(/\{\{|\}\}/g, '').trim(),
    detectFallback:   () => false,
    getFallbackValue: () => null,
    ifOpenRegex:      /#if\s*\(/gi,
    ifCloseRegex:     /#end\b/gi,
    noInlineFallback:  false,
    advancedScripting: true,
    platformNote: '<strong>Advanced scripting detected.</strong> Marketo uses Velocity scripting. Fallbacks can be set in the token definition itself in Design Studio. This tool counts tokens only and does not validate Velocity logic.',
    fixTemplate: null,
  },

};

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function findAll(text, re) {
  const fresh = new RegExp(re.source, re.flags);
  const matches = [];
  let m;
  while ((m = fresh.exec(text)) !== null) matches.push(m[0]);
  return matches;
}

function countMatches(text, re) {
  return findAll(text, re).length;
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

  const esp = ESPs[espKey];
  const rawTokens = findAll(text, esp.tokenRegex);

  const tokenMap = new Map();
  for (const raw of rawTokens) {
    const varName = esp.extractVar(raw);
    const existing = tokenMap.get(varName);
    if (existing) {
      existing.count++;
    } else {
      tokenMap.set(varName, {
        raw,
        varName,
        hasFallback:   esp.detectFallback(raw, text),
        fallbackValue: esp.getFallbackValue(raw),
        count: 1,
      });
    }
  }

  const tokens = Array.from(tokenMap.values());
  const openCount  = esp.ifOpenRegex  ? countMatches(text, esp.ifOpenRegex)  : 0;
  const closeCount = esp.ifCloseRegex ? countMatches(text, esp.ifCloseRegex) : 0;

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
    const statusText = esp.advancedScripting
      ? '<span class="pc-token-status pc-token-status--info">Advanced scripting — check manually</span>'
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

/* =================================================================
   CAROUSEL TEMPLATES — Render functions
   Exposes: window.CarouselTemplates = { render(slide), FAMILIES, LAYOUTS, FIELDS, THEMES, ICONS }
   ================================================================= */
(function(){
'use strict';

// ── Helpers ────────────────────────────────────────────────────────
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
// *word* → <em>word</em>  (used for accent colour on key words)
const acc = (s, color) => {
  const style = color ? ` style="color:${color}"` : '';
  return esc(s ?? '').replace(/\*(.+?)\*/g, `<em${style}>$1</em>`);
};
const accNoEsc = (raw, color) => {
  // For when we want raw mark inside accent
  const style = color ? ` style="color:${color}"` : '';
  return esc(raw ?? '').replace(/\*(.+?)\*/g, `<em${style}>$1</em>`);
};
const lineBreak = s => esc(s ?? '').replace(/\n/g, '<br>');
const accBR = (s, color) => {
  const style = color ? ` style="color:${color}"` : '';
  return esc(s ?? '')
    .replace(/\*(.+?)\*/g, `<em${style}>$1</em>`)
    .replace(/\n/g, '<br>');
};
const iconSrc = key => (!key || key === 'none') ? null : 'assets/icons/' + key;
const fmtSlide = (slide) => slide.format === 'portrait' ? 'portrait' : '';

// ── Families ───────────────────────────────────────────────────────
const FAMILIES = {
  'jp-editorial': {
    brand: 'jp', label: 'JP — Editorial', subtitle: 'Refined navy + gold',
    themes: ['navy','white','gold'],
  },
  'jp-magazine': {
    brand: 'jp', label: 'JP — Magazine', subtitle: 'Luxe oversized italic',
    themes: ['navy','cream','midnight'],
  },
  'hea-clean': {
    brand: 'hea', label: 'HEA — Clean', subtitle: 'Bright purple, polished',
    themes: ['purple','cyan','green','dark'],
  },
  'hea-shapes': {
    brand: 'hea', label: 'HEA — Shapes', subtitle: 'Dark + geometric blocks',
    themes: ['purple','cyan','green','plum'],
  },
};

// ── Layouts ────────────────────────────────────────────────────────
const LAYOUTS = ['cover','stat','tip','list','quote','compare','case','image','author','cta'];

const LAYOUT_LABELS = {
  cover: 'Cover', stat: 'Big Stat', tip: 'Numbered Tip', list: 'Checklist',
  quote: 'Pull Quote', compare: 'Compare', case: 'Case Study',
  image: 'Image + Caption', author: 'Author', cta: 'CTA',
};

// ── Field definitions per layout (used to build sidebar) ──────────
const FIELDS = {
  cover: [
    { id:'eyebrow', label:'Eyebrow / Tag', ph:'Email Strategy' },
    { id:'headline', label:'Headline (use *word* for accent)', ph:'5 *tips* to write better emails', ta:true },
    { id:'sub', label:'Subheadline', ph:'A practical guide for marketers who actually want to grow.', ta:true },
  ],
  stat: [
    { id:'number', label:'Big number', ph:'73%' },
    { id:'label', label:'What it means', ph:'of emails get deleted in under 3 seconds', ta:true },
    { id:'body', label:'Supporting context', ph:'Your subject line is the door. If it doesn\'t open, nothing else matters.', ta:true },
  ],
  tip: [
    { id:'step', label:'Step / Tip number', ph:'01' },
    { id:'kicker', label:'Kicker (small label)', ph:'TIP ONE' },
    { id:'headline', label:'Headline', ph:'Write *subject lines* that get opened', ta:true },
    { id:'body', label:'Body', ph:'Front-load value, drop the cleverness, and keep it under 50 characters.', ta:true },
  ],
  list: [
    { id:'headline', label:'Headline', ph:'5 things *every* email needs', ta:true },
    { id:'sub', label:'Subheadline', ph:'A quick checklist before you hit send.' },
    { id:'item1', label:'Item 1', ph:'A subject line that earns the open' },
    { id:'item2', label:'Item 2', ph:'A single, clear goal per send' },
    { id:'item3', label:'Item 3', ph:'Copy that respects their time' },
    { id:'item4', label:'Item 4', ph:'A CTA that actually makes sense' },
    { id:'item5', label:'Item 5 (optional)', ph:'A reason to keep subscribing' },
    { id:'item6', label:'Item 6 (optional)', ph:'' },
  ],
  quote: [
    { id:'quote', label:'Quote', ph:'The best email you\'ll ever send is the one your subscriber actually asked for.', ta:true },
    { id:'attr', label:'Attribution', ph:'— Jonathan Pay' },
  ],
  compare: [
    { id:'headline', label:'Headline', ph:'Stop doing *this*. Try this instead.', ta:true },
    { id:'dontTitle', label:'Don\'t — title', ph:'Don\'t' },
    { id:'dontBody', label:'Don\'t — body', ph:'Sending the same template to every segment and hoping for the best.', ta:true },
    { id:'doTitle', label:'Do — title', ph:'Do' },
    { id:'doBody', label:'Do — body', ph:'Match the message to the behaviour. Trigger > broadcast every time.', ta:true },
  ],
  case: [
    { id:'headline', label:'Headline', ph:'How one tweak doubled the *click-through*', ta:true },
    { id:'p1', label:'Problem', ph:'Open rates were strong but nobody was clicking through.' },
    { id:'p2', label:'Fix', ph:'Cut the body in half and led with a single, specific CTA.' },
    { id:'p3', label:'Result', ph:'CTR jumped from 1.8% to 4.1% within two weeks.' },
  ],
  image: [
    { id:'eyebrow', label:'Category / Eyebrow', ph:'Behind the Send' },
    { id:'headline', label:'Headline', ph:'What I learned shipping 400 emails', ta:true },
    { id:'body', label:'Caption / body', ph:'Some patterns only show up at volume. Here\'s what I noticed.', ta:true },
    { id:'photoUrl', label:'Photo URL (optional)', ph:'paste image URL or leave blank for placeholder' },
  ],
  author: [
    { id:'role', label:'Role / kicker', ph:'About the author' },
    { id:'name', label:'Name', ph:'Jonathan Pay' },
    { id:'bio', label:'Bio', ph:'Email marketer, writer, second-generation ESP brat. I\'ve worked in email since before Gmail existed.', ta:true },
    { id:'handles', label:'Handles / links (comma separated)', ph:'@jonathanpay, jonathanpay.com' },
    { id:'photoUrl', label:'Photo URL (optional)', ph:'paste image URL' },
  ],
  cta: [
    { id:'pre', label:'Pre-headline', ph:'Want more like this?' },
    { id:'headline', label:'Headline', ph:'Follow for *smarter* email tips', ta:true },
    { id:'sub', label:'Body', ph:'Weekly notes on what\'s working in my inbox and what I\'m testing next.', ta:true },
    { id:'pill', label:'Button label', ph:'Follow →' },
  ],
};

// ── Theme registry (maps family.theme → CSS class modifier) ───────
const THEMES = {
  'jp-editorial': {
    navy:  { label:'Navy',   swatch:'#2c3d50', cls:{cover:'dark',cta:'dark',quote:'dark',tip:'',list:'',stat:'',compare:'',case:'',image:'',author:''} },
    white: { label:'White',  swatch:'#ffffff', cls:{} },
    gold:  { label:'Gold',   swatch:'#dfb81f', cls:{cover:'gold-bg',cta:'gold-bg'} },
  },
  'jp-magazine': {
    navy:    { label:'Navy',   swatch:'#15202c', cls:{} },
    cream:   { label:'Cream',  swatch:'#f4eedb', cls:{_all:'cream'} },
    midnight:{ label:'Black',  swatch:'#0d1620', cls:{_all:'midnight'} },
  },
  'hea-clean': {
    purple: { label:'Purple', swatch:'#9E41BF', cls:{} },
    cyan:   { label:'Cyan',   swatch:'#22CEF2', cls:{_all:'cyan'} },
    green:  { label:'Green',  swatch:'#21BF3D', cls:{_all:'green'} },
    dark:   { label:'Plum',   swatch:'#3D2A35', cls:{_all:'dark'} },
  },
  'hea-shapes': {
    purple: { label:'Purple', swatch:'#9E41BF', cls:{} },
    cyan:   { label:'Cyan',   swatch:'#22CEF2', cls:{_all:'cyan'} },
    green:  { label:'Green',  swatch:'#21BF3D', cls:{_all:'green'} },
    plum:   { label:'Plum',   swatch:'#4a1f5c', cls:{_all:'purple-bg'} },
  },
};

const ICONS = [
  'email.png','growth.png','heart.png','brain.png','strategy.png','target.png',
  'graduation.png','book.png','bolt.png','chart.png','compass.png','puzzle.png',
  'teacher.png','badge.png','mind.png','shield.png','plan.png','notebook.png',
  'design.png','handshake.png',
];

// ── Theme class helper ─────────────────────────────────────────────
function themeCls(family, theme, layout){
  const t = THEMES[family]?.[theme];
  if (!t || !t.cls) return '';
  if (t.cls._all) return t.cls._all;
  return t.cls[layout] || '';
}

// ── Photo block (image slot or placeholder) ────────────────────────
function photoBlock(url, label){
  if (url){
    return `<img src="${esc(url)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">`;
  }
  return `<span style="opacity:0.7">${esc(label || 'PHOTO PLACEHOLDER')}</span>`;
}

// ── JP-EDITORIAL renderers ────────────────────────────────────────
const JPE = {};

JPE.cover = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpe jpe-cover ${t} ${f}">
    <div class="top">
      <div class="jpe-eyebrow">${esc(fields.eyebrow)}</div>
      <img src="assets/logos/jp-full.png" class="jpe-logo" alt="JP">
    </div>
    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="jpe-rule"></div>
      <h1 class="jpe-h1">${acc(fields.headline)}</h1>
      ${fields.sub ? `<p class="jpe-sub">${lineBreak(fields.sub)}</p>` : ''}
    </div>
    <div class="jpe-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

JPE.stat = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpe jpe-stat ${t} ${f}">
    <div class="jpe-rule"></div>
    <div class="number">${esc(fields.number)}</div>
    <div class="label">${acc(fields.label)}</div>
    ${fields.body ? `<p class="jpe-body" style="margin-top:8px">${lineBreak(fields.body)}</p>` : ''}
    <div class="jpe-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

JPE.tip = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpe jpe-tip ${t} ${f}">
    <div class="jpe-watermark-num">${esc(fields.step)}</div>
    <div class="body-block">
      <div class="step">${esc(fields.kicker || 'Tip')}  ·  ${esc(fields.step)}</div>
      <div class="jpe-rule"></div>
      <h2 class="jpe-h2">${acc(fields.headline)}</h2>
      <p class="jpe-body">${lineBreak(fields.body)}</p>
    </div>
    <div class="jpe-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

JPE.list = (s, t, f) => {
  const fields = s.fields || {};
  const items = [fields.item1, fields.item2, fields.item3, fields.item4, fields.item5, fields.item6].filter(Boolean);
  return `<div class="slide jpe jpe-list ${t} ${f}">
    <div>
      <div class="jpe-rule"></div>
      <h2 class="jpe-h2" style="margin-top:14px">${acc(fields.headline)}</h2>
      ${fields.sub ? `<p style="font-size:14px;color:var(--fg-soft);margin-top:6px">${esc(fields.sub)}</p>` : ''}
      <ul>${items.map(i => `<li>${lineBreak(i)}</li>`).join('')}</ul>
    </div>
    <div class="jpe-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

JPE.quote = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpe jpe-quote ${t} ${f}">
    <div class="qmark">"</div>
    <p class="qtext">${lineBreak(fields.quote)}</p>
    <div class="qattr">${esc(fields.attr)}</div>
    <div style="position:absolute;bottom:24px;left:48px;right:48px;display:flex;justify-content:space-between;font-size:10px;color:var(--muted)">
      <span class="handle" style="color:var(--link)">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

JPE.compare = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpe jpe-compare ${t} ${f}">
    <div>
      <div class="jpe-rule"></div>
      <h2 class="compare-head" style="margin-top:10px">${acc(fields.headline)}</h2>
    </div>
    <div class="cols">
      <div class="col dont">
        <h3>✗ ${esc(fields.dontTitle || "Don't")}</h3>
        <p>${lineBreak(fields.dontBody)}</p>
      </div>
      <div class="col do">
        <h3>✓ ${esc(fields.doTitle || 'Do')}</h3>
        <p>${lineBreak(fields.doBody)}</p>
      </div>
    </div>
    <div class="jpe-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

JPE.case = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpe jpe-case ${t} ${f}">
    <div>
      <div class="jpe-rule"></div>
      <h2 class="jpe-h2" style="margin-top:12px;font-size:30px">${acc(fields.headline)}</h2>
    </div>
    <div style="display:flex;flex-direction:column;flex:1;justify-content:center">
      <div class="row"><div class="label">Problem</div><div class="content"><p>${lineBreak(fields.p1)}</p></div></div>
      <div class="row"><div class="label">Fix</div><div class="content"><p>${lineBreak(fields.p2)}</p></div></div>
      <div class="row"><div class="label">Result</div><div class="content"><p>${lineBreak(fields.p3)}</p></div></div>
    </div>
    <div class="jpe-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

JPE.image = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpe jpe-image ${t} ${f}">
    <div class="image-slot">
      ${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block">` : `<div class="placeholder">Photo placeholder</div>`}
    </div>
    <div class="caption-block">
      <div class="eyebrow">${esc(fields.eyebrow)}</div>
      <h2>${acc(fields.headline)}</h2>
      <p>${lineBreak(fields.body)}</p>
      <div class="jpe-footer" style="margin-top:8px">
        <span class="handle">${esc(s.handle)}</span>
        <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
      </div>
    </div>
  </div>`;
};

JPE.author = (s, t, f) => {
  const fields = s.fields || {};
  const handles = (fields.handles || '').split(',').map(h => h.trim()).filter(Boolean);
  return `<div class="slide jpe jpe-author ${t} ${f}">
    <div class="photo-side">
      ${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover">` : 'PORTRAIT'}
    </div>
    <div class="text-side">
      <div class="role">${esc(fields.role)}</div>
      <div class="name">${esc(fields.name)}</div>
      <p class="bio">${lineBreak(fields.bio)}</p>
      <div class="handles">${handles.map(h => `<span>${esc(h)}</span>`).join('')}</div>
    </div>
  </div>`;
};

JPE.cta = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpe jpe-cta ${t} ${f}">
    <div class="jpe-eyebrow">${esc(fields.pre)}</div>
    <h2 class="jpe-h1" style="font-size:48px">${acc(fields.headline)}</h2>
    ${fields.sub ? `<p class="jpe-sub">${lineBreak(fields.sub)}</p>` : ''}
    ${fields.pill ? `<div class="pill">${esc(fields.pill)}</div>` : ''}
    <div class="jpe-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

// ── JP-MAGAZINE renderers ──────────────────────────────────────────
const JPM = {};
const jpmChrome = (s) => `<div class="jpm-chrome">
  <span class="pg">Page ${esc(s.pg)} / ${esc(s.pgTot)}</span>
  <span class="badge">${esc(s.handle)}</span>
</div>`;
const jpmFooter = () => `<div class="jpm-footer">
  <div class="underline"></div>
  <span class="stars">✦ ✦ ✦</span>
</div>`;

JPM.cover = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpm jpm-cover ${t} ${f}">
    ${jpmChrome(s)}
    <div class="stage">
      ${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.35;z-index:0">` : `<div class="photo-bg"></div>`}
      <div>
        <div class="jpm-script" style="margin-bottom:8px">${esc(fields.eyebrow)}</div>
        <h1 class="jpm-h1">${acc(fields.headline, 'var(--accent)')}</h1>
      </div>
      ${fields.sub ? `<p class="jpm-body" style="margin-top:14px;max-width:88%;font-size:15px">${lineBreak(fields.sub)}</p>` : ''}
      <div class="signature jpm-arrow">↳ swipe</div>
    </div>
    ${jpmFooter()}
  </div>`;
};

JPM.stat = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpm jpm-stat ${t} ${f}">
    ${jpmChrome(s)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:18px;text-align:center">
      <div class="num">${esc(fields.number)}</div>
      <div class="label">${acc(fields.label, 'var(--accent)')}</div>
      ${fields.body ? `<p class="sub">${lineBreak(fields.body)}</p>` : ''}
    </div>
    ${jpmFooter()}
  </div>`;
};

JPM.tip = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpm jpm-tip ${t} ${f}">
    <div class="chrome-strip">
      <span>Page ${esc(s.pg)} / ${esc(s.pgTot)}</span>
      <span>${esc(s.handle)}</span>
    </div>
    <div class="grid">
      <div class="photo">${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">` : 'PHOTO'}</div>
      <div class="text">
        <div class="tipnum">Tip ${esc(fields.step)}</div>
        <h2>${acc(fields.headline, 'var(--accent)')}</h2>
        <p>${lineBreak(fields.body)}</p>
      </div>
    </div>
    <div class="footer-row"><span>${esc(s.handle)}</span><span class="jpm-arrow" style="font-size:22px">↳</span></div>
  </div>`;
};

JPM.list = (s, t, f) => {
  const fields = s.fields || {};
  const items = [fields.item1, fields.item2, fields.item3, fields.item4, fields.item5, fields.item6].filter(Boolean);
  return `<div class="slide jpm jpm-list ${t} ${f}">
    ${jpmChrome(s)}
    <h2>${acc(fields.headline, 'var(--accent)')}</h2>
    ${fields.sub ? `<div class="sub">${esc(fields.sub)}</div>` : ''}
    <ul>
      ${items.map((it, i) => `<li><span class="n">${String(i+1).padStart(2,'0')}</span><span>${lineBreak(it)}</span></li>`).join('')}
    </ul>
    ${jpmFooter()}
  </div>`;
};

JPM.quote = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpm jpm-quote ${t} ${f}">
    ${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.3;z-index:0">` : `<div class="photo-bg"></div>`}
    <div class="open-q">"</div>
    <p class="qtext">${lineBreak(fields.quote)}</p>
    <span class="qattr">${esc(fields.attr)}</span>
    <div style="position:absolute;bottom:28px;left:48px;right:48px;display:flex;justify-content:space-between;font-size:11px;color:var(--fg-soft);z-index:1">
      <span>${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

JPM.compare = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpm jpm-compare ${t} ${f}">
    ${jpmChrome(s)}
    <h2>${acc(fields.headline, 'var(--accent)')}</h2>
    <div class="grid">
      <div class="col a">
        <h3>✗ ${esc(fields.dontTitle || "Don't")}</h3>
        <p>${lineBreak(fields.dontBody)}</p>
      </div>
      <div class="vs">vs</div>
      <div class="col b">
        <h3>✓ ${esc(fields.doTitle || 'Do')}</h3>
        <p>${lineBreak(fields.doBody)}</p>
      </div>
    </div>
    ${jpmFooter()}
  </div>`;
};

JPM.case = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpm jpm-case ${t} ${f}">
    ${jpmChrome(s)}
    <h2>${acc(fields.headline, 'var(--accent)')}</h2>
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
      <div class="step"><div class="marker">Problem<br>↓</div><div><h3>What was happening</h3><p>${lineBreak(fields.p1)}</p></div></div>
      <div class="step"><div class="marker">Fix<br>↓</div><div><h3>What I changed</h3><p>${lineBreak(fields.p2)}</p></div></div>
      <div class="step"><div class="marker">Result</div><div><h3>What shifted</h3><p>${lineBreak(fields.p3)}</p></div></div>
    </div>
    ${jpmFooter()}
  </div>`;
};

JPM.image = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpm jpm-image ${t} ${f}">
    <div class="chrome-strip">
      <span>Page ${esc(s.pg)} / ${esc(s.pgTot)}</span>
      <span>${esc(s.handle)}</span>
    </div>
    <div class="photo">${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0">` : 'PHOTO'}</div>
    <div class="caption">
      <div class="jpm-script">${esc(fields.eyebrow)}</div>
      <h2>${acc(fields.headline, 'var(--accent)')}</h2>
      <p>${lineBreak(fields.body)}</p>
    </div>
  </div>`;
};

JPM.author = (s, t, f) => {
  const fields = s.fields || {};
  const handles = (fields.handles || '').split(',').map(h => h.trim()).filter(Boolean);
  return `<div class="slide jpm jpm-author ${t} ${f}">
    <div class="chrome-strip">
      <span>Page ${esc(s.pg)} / ${esc(s.pgTot)}</span>
      <span>${esc(s.handle)}</span>
    </div>
    <div class="body">
      <div class="photo">${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" style="width:100%;height:100%;object-fit:cover">` : 'PORTRAIT'}</div>
      <div class="text">
        <div class="role">${esc(fields.role)}</div>
        <div class="name">${esc(fields.name)}</div>
        <p class="bio">${lineBreak(fields.bio)}</p>
        <div style="display:flex;gap:14px;font-size:11px;color:var(--accent);font-weight:700;margin-top:6px">${handles.map(h => `<span>${esc(h)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="footer-row"><span class="jpm-arrow" style="font-size:22px">✦ ✦ ✦</span><span></span></div>
  </div>`;
};

JPM.cta = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide jpm jpm-cta ${t} ${f}">
    ${jpmChrome(s)}
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:20px">
      ${fields.pre ? `<div class="pre">${esc(fields.pre)}</div>` : ''}
      <h2>${acc(fields.headline, 'var(--accent)')}</h2>
      ${fields.sub ? `<p>${lineBreak(fields.sub)}</p>` : ''}
      ${fields.pill ? `<div class="pill">${esc(fields.pill)} <span style="font-family:Caveat;font-size:22px">↳</span></div>` : ''}
    </div>
    ${jpmFooter()}
  </div>`;
};

// ── HEA-CLEAN renderers ────────────────────────────────────────────
const HEC = {};

HEC.cover = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hec hec-cover ${t} ${f}">
    <div class="top">
      <div class="hec-pill solid">${esc(fields.eyebrow || 'HEA')}</div>
      <img src="assets/logos/hea-mark.png" class="hec-logo" alt="HEA" style="height:36px">
    </div>
    <div style="display:flex;flex-direction:column;gap:14px">
      <h1 class="hec-h1">${acc(fields.headline)}</h1>
      ${fields.sub ? `<p class="hec-sub">${lineBreak(fields.sub)}</p>` : ''}
    </div>
    <div class="hec-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HEC.stat = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hec hec-stat ${t} ${f}">
    <div class="hec-pill">${esc(fields.kicker || 'BY THE NUMBERS')}</div>
    <div class="pct">${esc(fields.number)}</div>
    <div class="label">${acc(fields.label)}</div>
    ${fields.body ? `<p class="sub">${lineBreak(fields.body)}</p>` : ''}
    <div class="hec-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HEC.tip = (s, t, f) => {
  const fields = s.fields || {};
  const icon = iconSrc(s.icon);
  return `<div class="slide hec hec-tip ${t} ${f}">
    <div class="hec-numbig">${esc(fields.step)}</div>
    <div class="icon-num-row">
      <div class="number-circle">${esc(fields.step)}</div>
      ${icon ? `<div class="hec-iconcircle"><img src="${icon}"></div>` : ''}
    </div>
    <div class="body-block">
      <div class="hec-pill">${esc(fields.kicker || 'TIP')}</div>
      <h2 class="hec-h2">${acc(fields.headline)}</h2>
      <p class="hec-body">${lineBreak(fields.body)}</p>
    </div>
    <div class="hec-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HEC.list = (s, t, f) => {
  const fields = s.fields || {};
  const items = [fields.item1, fields.item2, fields.item3, fields.item4, fields.item5, fields.item6].filter(Boolean);
  return `<div class="slide hec hec-list ${t} ${f}">
    <div class="header-block">
      <h2 class="hec-h2">${acc(fields.headline)}</h2>
      ${fields.sub ? `<p class="hec-body" style="margin-top:6px">${esc(fields.sub)}</p>` : ''}
    </div>
    <ul>${items.map(i => `<li><span class="check">✓</span><span>${lineBreak(i)}</span></li>`).join('')}</ul>
    <div class="hec-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HEC.quote = (s, t, f) => {
  const fields = s.fields || {};
  const icon = iconSrc(s.icon);
  return `<div class="slide hec hec-quote ${t} ${f}">
    <div class="bar"></div>
    <p class="qtext">"${lineBreak(fields.quote)}"</p>
    <span class="qattr">${esc(fields.attr)}</span>
    ${icon ? `<div class="qicon"><img src="${icon}"></div>` : ''}
  </div>`;
};

HEC.compare = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hec hec-compare ${t} ${f}">
    <h2>${acc(fields.headline)}</h2>
    <div class="cols">
      <div class="col dont">
        <h3><span class="badge">✗</span>${esc(fields.dontTitle || "Don't")}</h3>
        <p>${lineBreak(fields.dontBody)}</p>
      </div>
      <div class="col do">
        <h3><span class="badge">✓</span>${esc(fields.doTitle || 'Do')}</h3>
        <p>${lineBreak(fields.doBody)}</p>
      </div>
    </div>
    <div class="hec-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HEC.case = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hec hec-case ${t} ${f}">
    <h2>${acc(fields.headline)}</h2>
    <div class="stages">
      <div class="stage">
        <div class="step-num">1</div>
        <div><h3>The Problem</h3><p>${lineBreak(fields.p1)}</p></div>
      </div>
      <div class="stage">
        <div class="step-num">2</div>
        <div><h3>The Fix</h3><p>${lineBreak(fields.p2)}</p></div>
      </div>
      <div class="stage">
        <div class="step-num">3</div>
        <div><h3>The Result</h3><p>${lineBreak(fields.p3)}</p></div>
      </div>
    </div>
    <div class="hec-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HEC.image = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hec hec-image ${t} ${f}">
    <div class="photo ${fields.photoUrl ? 'photo-real' : ''}">${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" style="width:100%;height:100%;object-fit:cover">` : 'PHOTO'}</div>
    <div class="body">
      <div class="meta">${esc(fields.eyebrow)}</div>
      <h2>${acc(fields.headline)}</h2>
      <p>${lineBreak(fields.body)}</p>
      <div class="hec-footer" style="margin-top:auto">
        <span class="handle">${esc(s.handle)}</span>
        <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
      </div>
    </div>
  </div>`;
};

HEC.author = (s, t, f) => {
  const fields = s.fields || {};
  const handles = (fields.handles || '').split(',').map(h => h.trim()).filter(Boolean);
  return `<div class="slide hec hec-author ${t} ${f}">
    <div class="top-row">
      <div class="avatar">${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : 'PORTRAIT'}</div>
      <div class="who">
        <div class="role">${esc(fields.role)}</div>
        <div class="name">${esc(fields.name)}</div>
      </div>
    </div>
    <p class="bio">${lineBreak(fields.bio)}</p>
    <div class="handles">${handles.map(h => `<span>${esc(h)}</span>`).join('')}</div>
    <div class="hec-footer" style="width:100%">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HEC.cta = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hec hec-cta ${t} ${f}">
    <div class="pre">${esc(fields.pre)}</div>
    <h2>${acc(fields.headline)}</h2>
    ${fields.sub ? `<p>${lineBreak(fields.sub)}</p>` : ''}
    ${fields.pill ? `<div class="pill">${esc(fields.pill)}</div>` : ''}
    <div class="footer">
      <span>${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

// ── HEA-SHAPES renderers ───────────────────────────────────────────
const HES = {};

HES.cover = (s, t, f) => {
  const fields = s.fields || {};
  const icon = iconSrc(s.icon);
  return `<div class="slide hes hes-cover ${t} ${f}">
    <div class="hes-shape top-arc"></div>
    <div style="position:relative;z-index:1">
      <h1 class="hes-h1"><span class="stack">${esc(fields.eyebrow || 'Why')}</span><span class="stack">${acc(fields.headline)}</span></h1>
    </div>
    ${fields.sub ? `<p class="hes-sub">${lineBreak(fields.sub)}</p>` : ''}
    <div class="hes-footer">
      <span class="handle">${esc(s.handle)}</span>
      <div class="hes-cbtn">⏭</div>
    </div>
  </div>`;
};

HES.stat = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hes hes-stat ${t} ${f}">
    <div class="hes-shape center-circle"></div>
    <div class="num">${esc(fields.number)}</div>
    <div class="label">${acc(fields.label)}</div>
    ${fields.body ? `<p class="sub">${lineBreak(fields.body)}</p>` : ''}
    <div class="hes-footer" style="position:absolute;bottom:32px;left:40px;right:40px">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HES.tip = (s, t, f) => {
  const fields = s.fields || {};
  const icon = iconSrc(s.icon);
  return `<div class="slide hes hes-tip ${t} ${f}">
    <div class="hes-shape tr-circle"></div>
    <div class="step-bar">
      <div class="num">${esc(fields.step)}</div>
      <div class="lbl">${esc(fields.kicker || 'Step')}  ·  ${esc(s.pg)} / ${esc(s.pgTot)}</div>
    </div>
    <div class="body-block">
      ${icon ? `<div style="width:48px;height:48px;border-radius:50%;background:var(--shape);display:flex;align-items:center;justify-content:center;margin-bottom:4px"><img src="${icon}" style="width:26px;height:26px;filter:brightness(0) invert(1)"></div>` : ''}
      <h2 class="hes-h2">${acc(fields.headline)}</h2>
      <p class="hes-body">${lineBreak(fields.body)}</p>
    </div>
    <div class="hes-footer">
      <span class="handle">${esc(s.handle)}</span>
      <div class="hes-cbtn">⏭</div>
    </div>
  </div>`;
};

HES.list = (s, t, f) => {
  const fields = s.fields || {};
  const items = [fields.item1, fields.item2, fields.item3, fields.item4, fields.item5, fields.item6].filter(Boolean);
  return `<div class="slide hes hes-list ${t} ${f}">
    <div class="hes-shape tr-circle"></div>
    <div>
      <h2>${acc(fields.headline)}</h2>
      ${fields.sub ? `<div class="sub">${esc(fields.sub)}</div>` : ''}
    </div>
    <ul>${items.map(i => `<li><span class="check">✓</span><span>${lineBreak(i)}</span></li>`).join('')}</ul>
    <div class="hes-footer">
      <span class="handle">${esc(s.handle)}</span>
      <div class="hes-cbtn">⏭</div>
    </div>
  </div>`;
};

HES.quote = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hes hes-quote ${t} ${f}">
    <div class="hes-shape bl-circle"></div>
    <div class="qmark">"</div>
    <p class="qtext">${lineBreak(fields.quote)}</p>
    <span class="qattr">${esc(fields.attr)}</span>
    <div class="hes-footer" style="position:absolute;bottom:32px;left:44px;right:44px">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HES.compare = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hes hes-compare ${t} ${f}">
    <h2>${acc(fields.headline)}</h2>
    <div class="cols">
      <div class="col dont">
        <h3><span class="badge">✗</span>${esc(fields.dontTitle || "Don't")}</h3>
        <p>${lineBreak(fields.dontBody)}</p>
      </div>
      <div class="col do">
        <h3><span class="badge">✓</span>${esc(fields.doTitle || 'Do')}</h3>
        <p>${lineBreak(fields.doBody)}</p>
      </div>
    </div>
    <div class="hes-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HES.case = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hes hes-case ${t} ${f}">
    <h2>${acc(fields.headline)}</h2>
    <div class="stages">
      <div class="stage">
        <div class="step-num">1</div>
        <div><h3>Problem</h3><h4>What was happening</h4><p>${lineBreak(fields.p1)}</p></div>
      </div>
      <div class="stage">
        <div class="step-num">2</div>
        <div><h3>Fix</h3><h4>What changed</h4><p>${lineBreak(fields.p2)}</p></div>
      </div>
      <div class="stage">
        <div class="step-num">3</div>
        <div><h3>Result</h3><h4>What shifted</h4><p>${lineBreak(fields.p3)}</p></div>
      </div>
    </div>
    <div class="hes-footer">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HES.image = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hes hes-image ${t} ${f}">
    <div class="photo ${fields.photoUrl ? 'photo-real' : ''}">${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" style="width:100%;height:100%;object-fit:cover">` : 'PHOTO'}</div>
    <div class="caption">
      <div class="meta">${esc(fields.eyebrow)}</div>
      <h2>${acc(fields.headline)}</h2>
      <p>${lineBreak(fields.body)}</p>
      <div class="hes-footer" style="margin-top:auto">
        <span class="handle">${esc(s.handle)}</span>
        <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
      </div>
    </div>
  </div>`;
};

HES.author = (s, t, f) => {
  const fields = s.fields || {};
  const handles = (fields.handles || '').split(',').map(h => h.trim()).filter(Boolean);
  return `<div class="slide hes hes-author ${t} ${f}">
    <div class="hes-shape tr-circle" style="opacity:0.7"></div>
    <div class="top-row">
      <div class="avatar">${fields.photoUrl ? `<img src="${esc(fields.photoUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : 'PORTRAIT'}</div>
      <div class="who">
        <div class="role">${esc(fields.role)}</div>
        <div class="name">${esc(fields.name)}</div>
      </div>
    </div>
    <p class="bio">${lineBreak(fields.bio)}</p>
    <div class="handles">${handles.map(h => `<span>${esc(h)}</span>`).join('')}</div>
    <div class="hes-footer" style="width:100%">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

HES.cta = (s, t, f) => {
  const fields = s.fields || {};
  return `<div class="slide hes hes-cta ${t} ${f}">
    <div class="hes-shape tr-circle" style="opacity:0.85"></div>
    <div class="pre">${esc(fields.pre)}</div>
    <h2>${acc(fields.headline)}</h2>
    ${fields.sub ? `<p>${lineBreak(fields.sub)}</p>` : ''}
    <div class="arrow-btn">→</div>
    <div class="hes-footer" style="margin-top:auto">
      <span class="handle">${esc(s.handle)}</span>
      <span>${esc(s.pg)} / ${esc(s.pgTot)}</span>
    </div>
  </div>`;
};

// ── Custom template registry ───────────────────────────────────────
const _customFamilies = new Map();

function cstmVars(cfg, themeKey) {
  const th = (cfg.themes || {})[themeKey] || Object.values(cfg.themes || {})[0] || {};
  const font = cfg.fonts || {};
  return [
    `--cbg:${th.bg         || '#1a1a1a'}`,
    `--cbg2:${th.bgAlt     || th.bg     || '#111'}`,
    `--ctxt:${th.text      || '#ffffff'}`,
    `--ctxt2:${th.textMuted|| 'rgba(255,255,255,0.6)'}`,
    `--cacc:${th.accent    || '#dfb81f'}`,
    `--catxt:${th.accentText|| '#000000'}`,
    `--cbrd:${th.rule      || 'rgba(255,255,255,0.2)'}`,
    `--cfont-h:${font.headingFamily || "'Inter','Helvetica Neue',sans-serif"}`,
    `--cfont-b:${font.bodyFamily    || "'Inter','Helvetica Neue',sans-serif"}`,
  ].join(';');
}

function cstmLogo(cfg) {
  if (!cfg.logo) return '';
  const s = esc(cfg.logoStyle || 'height:40px;max-width:150px;object-fit:contain');
  return `<img src="${esc(cfg.logo)}" alt="" class="cstm-logo" style="${s}">`;
}

function cstmFooter(s) {
  return `<div class="cstm-footer"><span>${esc(s.handle)}</span><span>${esc(s.pg)} / ${esc(s.pgTot)}</span></div>`;
}

// ── Generic renderer — 10 layouts ─────────────────────────────────
const CSTM = {};

CSTM.cover = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-cover ${f}" style="${v}">
    <div class="cstm-top">
      <div class="cstm-eyebrow">${esc(fl.eyebrow)}</div>
      ${cstmLogo(cfg)}
    </div>
    <div class="cstm-grow">
      <div class="cstm-rule"></div>
      <h1 class="cstm-h1">${acc(fl.headline, 'var(--cacc)')}</h1>
      ${fl.sub ? `<p class="cstm-sub">${lineBreak(fl.sub)}</p>` : ''}
    </div>
    ${cstmFooter(s)}
  </div>`;
};

CSTM.stat = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-stat ${f}" style="${v}">
    <div class="cstm-rule"></div>
    <div class="cstm-bignum">${esc(fl.number)}</div>
    <div class="cstm-stat-label">${acc(fl.label, 'var(--cacc)')}</div>
    ${fl.body ? `<p class="cstm-body cstm-grow">${lineBreak(fl.body)}</p>` : '<div class="cstm-grow"></div>'}
    ${cstmFooter(s)}
  </div>`;
};

CSTM.tip = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-tip ${f}" style="${v}" data-step="${esc(fl.step)}">
    <div class="cstm-kicker">${esc(fl.kicker)}</div>
    <h2 class="cstm-h2 cstm-grow">${acc(fl.headline, 'var(--cacc)')}</h2>
    ${fl.body ? `<p class="cstm-body">${lineBreak(fl.body)}</p>` : ''}
    ${cstmFooter(s)}
  </div>`;
};

CSTM.list = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  const items = [fl.item1, fl.item2, fl.item3, fl.item4, fl.item5, fl.item6]
    .filter(Boolean)
    .map(i => `<li class="cstm-item">${esc(i)}</li>`).join('');
  return `<div class="slide cstm cstm-list ${f}" style="${v}">
    <h2 class="cstm-h2">${acc(fl.headline, 'var(--cacc)')}</h2>
    ${fl.sub ? `<p class="cstm-list-sub">${esc(fl.sub)}</p>` : ''}
    <div class="cstm-rule"></div>
    <ul class="cstm-items cstm-grow">${items}</ul>
    ${cstmFooter(s)}
  </div>`;
};

CSTM.quote = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-quote ${f}" style="${v}">
    <div class="cstm-qdeco">"</div>
    <blockquote class="cstm-blockquote cstm-grow">${accBR(fl.quote, 'var(--cacc)')}</blockquote>
    <p class="cstm-attr">${esc(fl.attr)}</p>
    ${cstmFooter(s)}
  </div>`;
};

CSTM.compare = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-compare ${f}" style="${v}">
    <h2 class="cstm-h2">${acc(fl.headline, 'var(--cacc)')}</h2>
    <div class="cstm-compare-grid cstm-grow">
      <div class="cstm-dont">
        <div class="cstm-col-head cstm-dont-head"><span class="cstm-x">✗</span> ${esc(fl.dontTitle || "Don't")}</div>
        <p>${lineBreak(fl.dontBody)}</p>
      </div>
      <div class="cstm-do">
        <div class="cstm-col-head cstm-do-head"><span>✓</span> ${esc(fl.doTitle || 'Do')}</div>
        <p>${lineBreak(fl.doBody)}</p>
      </div>
    </div>
    ${cstmFooter(s)}
  </div>`;
};

CSTM.case = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-case ${f}" style="${v}">
    <h2 class="cstm-h2">${acc(fl.headline, 'var(--cacc)')}</h2>
    <div class="cstm-rule"></div>
    <div class="cstm-case-rows cstm-grow">
      <div class="cstm-case-row"><span class="cstm-arrow">→</span><p>${lineBreak(fl.p1)}</p></div>
      <div class="cstm-case-row"><span class="cstm-arrow">→</span><p>${lineBreak(fl.p2)}</p></div>
      <div class="cstm-case-row"><span class="cstm-arrow">→</span><p>${lineBreak(fl.p3)}</p></div>
    </div>
    ${cstmFooter(s)}
  </div>`;
};

CSTM.image = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-image ${f}" style="${v}">
    <div class="cstm-photo">${photoBlock(fl.photoUrl, 'PHOTO')}</div>
    <div class="cstm-eyebrow">${esc(fl.eyebrow)}</div>
    <h2 class="cstm-h2">${acc(fl.headline, 'var(--cacc)')}</h2>
    ${fl.body ? `<p class="cstm-body cstm-grow">${lineBreak(fl.body)}</p>` : '<div class="cstm-grow"></div>'}
    ${cstmFooter(s)}
  </div>`;
};

CSTM.author = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-author ${f}" style="${v}">
    <div class="cstm-role">${esc(fl.role)}</div>
    <div class="cstm-author-bio cstm-grow">
      ${fl.photoUrl ? `<div class="cstm-av"><img src="${esc(fl.photoUrl)}" alt=""></div>` : ''}
      <div class="cstm-author-text">
        <div class="cstm-name">${esc(fl.name)}</div>
        <p class="cstm-body">${lineBreak(fl.bio)}</p>
        ${fl.handles ? `<div class="cstm-handles">${esc(fl.handles)}</div>` : ''}
      </div>
    </div>
    ${cstmFooter(s)}
  </div>`;
};

CSTM.cta = (s, t, f, cfg) => {
  const fl = s.fields || {};
  const v  = cstmVars(cfg, s.theme);
  return `<div class="slide cstm cstm-cta ${f}" style="${v}">
    <div class="cstm-grow cstm-cta-inner">
      <p class="cstm-pre">${esc(fl.pre)}</p>
      <h1 class="cstm-h1">${acc(fl.headline, 'var(--cacc)')}</h1>
      ${fl.sub ? `<p class="cstm-sub">${lineBreak(fl.sub)}</p>` : ''}
      <div class="cstm-pill">${esc(fl.pill || 'Follow →')}</div>
    </div>
    ${cstmFooter(s)}
  </div>`;
};

// ── Custom family registration ─────────────────────────────────────
function registerCustomFamily(cfg) {
  if (!cfg || !cfg.id || !cfg.label || !cfg.themes) {
    throw new Error('Template must have id, label, and themes');
  }
  const id = String(cfg.id).replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  cfg = { ...cfg, id };

  // Load Google Fonts if specified
  if (cfg.fonts && cfg.fonts.googleFonts && typeof document !== 'undefined') {
    if (!document.head.querySelector(`link[data-cstm-font="${id}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=' + cfg.fonts.googleFonts;
      link.dataset.cstmFont = id;
      document.head.appendChild(link);
    }
  }

  // Build renderer closures (each captures cfg)
  const renderer = {};
  LAYOUTS.forEach(layout => {
    renderer[layout] = (s, t, f) => CSTM[layout](s, t, f, cfg);
  });
  RENDERERS[id] = renderer;

  FAMILIES[id] = {
    brand: 'custom',
    label: cfg.label,
    subtitle: cfg.subtitle || 'Custom template',
    _custom: true,
    _handle: cfg.handle || '',
  };

  THEMES[id] = {};
  Object.entries(cfg.themes).forEach(([themeKey, th]) => {
    THEMES[id][themeKey] = {
      label: th.label || themeKey,
      swatch: th.swatch || th.bg || '#888',
      cls: {},
    };
  });

  _customFamilies.set(id, cfg);
  return id;
}

function removeCustomFamily(id) {
  if (!_customFamilies.has(id)) return;
  delete RENDERERS[id];
  delete FAMILIES[id];
  delete THEMES[id];
  if (typeof document !== 'undefined') {
    const link = document.head.querySelector(`link[data-cstm-font="${id}"]`);
    if (link) link.remove();
  }
  _customFamilies.delete(id);
}

function getCustomFamilies() {
  return Array.from(_customFamilies.values());
}

// ── Dispatch ───────────────────────────────────────────────────────
const RENDERERS = {
  'jp-editorial': JPE,
  'jp-magazine': JPM,
  'hea-clean': HEC,
  'hea-shapes': HES,
};

function render(slide){
  const family = slide.family || 'jp-editorial';
  const layout = slide.layout || 'cover';
  const theme  = slide.theme || Object.keys(THEMES[family] || THEMES['jp-editorial'])[0];
  const tCls   = themeCls(family, theme, layout);
  const fCls   = fmtSlide(slide);
  const r = RENDERERS[family]?.[layout];
  if (!r) return `<div class="slide" style="background:#400;color:#fff;display:flex;align-items:center;justify-content:center;font-family:monospace">Missing renderer: ${family} / ${layout}</div>`;
  return r(slide, tCls, fCls);
}

// ── Exports ────────────────────────────────────────────────────────
window.CarouselTemplates = {
  FAMILIES, LAYOUTS, LAYOUT_LABELS, FIELDS, THEMES, ICONS,
  render,
  registerCustomFamily,
  removeCustomFamily,
  getCustomFamilies,
};

})();

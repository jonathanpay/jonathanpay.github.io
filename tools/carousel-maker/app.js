/* =================================================================
   CAROUSEL MAKER — App logic
   ================================================================= */
(function(){
'use strict';

const T = window.CarouselTemplates;

// ── State ──────────────────────────────────────────────────────────
const DEFAULT_HANDLE_JP = '@jonathanpay';
const DEFAULT_HANDLE_HEA = '@holisticemailacademy';

function defaultsFor(family, layout, idx){
  const fields = {};
  (T.FIELDS[layout] || []).forEach(def => {
    // photoUrl and similar URL fields should default to empty (placeholder is a hint, not a value)
    if (/url$/i.test(def.id)) fields[def.id] = '';
    else fields[def.id] = def.ph || '';
  });
  const fam = T.FAMILIES[family] || T.FAMILIES['jp-editorial'];
  const brand = fam.brand;
  const handle = fam._handle || (brand === 'hea' ? DEFAULT_HANDLE_HEA : DEFAULT_HANDLE_JP);
  return {
    family, layout,
    theme: Object.keys(T.THEMES[family] || T.THEMES['jp-editorial'])[0],
    icon: 'none',
    format: state?.format || 'square',
    pg: String(idx).padStart(2,'0'),
    pgTot: String(Math.max(idx, 1)).padStart(2,'0'),
    handle,
    fields,
  };
}

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "showPageNumbers": true,
  "showHandles": true,
  "showWatermarkNum": true,
  "fontScale": 100,
  "outerPadding": 100
}/*EDITMODE-END*/;

const state = {
  format: 'square',
  slides: [],
  currentIdx: 0,
  tweaks: { ...TWEAKS_DEFAULTS },
};

// Seed with a cover slide
state.slides.push(defaultsFor('jp-editorial', 'cover', 1));
state.slides[0].pgTot = '05';

// ── DOM refs ───────────────────────────────────────────────────────
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ── Layout icon SVGs (small previews in the layout picker) ────────
const LAYOUT_ICONS = {
  cover: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><line x1="6" y1="9" x2="14" y2="9" stroke="currentColor" stroke-width="2"/><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/><line x1="6" y1="15" x2="12" y2="15" stroke="currentColor" stroke-width="1.4"/></svg>`,
  stat: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><text x="12" y="16" text-anchor="middle" font-size="13" font-weight="900" fill="currentColor">73%</text><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/></svg>`,
  tip: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/><line x1="6" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="1.6"/><line x1="6" y1="16" x2="14" y2="16" stroke="currentColor" stroke-width="1.4"/></svg>`,
  list: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="9" r="1.2" fill="currentColor"/><line x1="10" y1="9" x2="18" y2="9" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="13" r="1.2" fill="currentColor"/><line x1="10" y1="13" x2="16" y2="13" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="17" r="1.2" fill="currentColor"/><line x1="10" y1="17" x2="17" y2="17" stroke="currentColor" stroke-width="1.4"/></svg>`,
  quote: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><text x="7" y="13" font-size="14" font-weight="700" fill="currentColor">"</text><line x1="6" y1="15" x2="18" y2="15" stroke="currentColor" stroke-width="1.4"/><line x1="6" y1="17" x2="13" y2="17" stroke="currentColor" stroke-width="1.2"/></svg>`,
  compare: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" stroke-width="1.2"/><text x="7.5" y="14" font-size="6" fill="currentColor">✗</text><text x="14.5" y="14" font-size="6" fill="currentColor">✓</text></svg>`,
  case: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><circle cx="7" cy="8" r="1.5" fill="currentColor"/><circle cx="7" cy="12" r="1.5" fill="currentColor"/><circle cx="7" cy="16" r="1.5" fill="currentColor"/><line x1="7" y1="9.5" x2="7" y2="10.5" stroke="currentColor"/><line x1="7" y1="13.5" x2="7" y2="14.5" stroke="currentColor"/><line x1="10" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1.4"/><line x1="10" y1="16" x2="17" y2="16" stroke="currentColor" stroke-width="1.4"/></svg>`,
  image: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><rect x="5" y="5" width="14" height="9" fill="currentColor" opacity="0.5"/><line x1="5" y1="17" x2="17" y2="17" stroke="currentColor" stroke-width="1.4"/><line x1="5" y1="19.5" x2="13" y2="19.5" stroke="currentColor" stroke-width="1.2"/></svg>`,
  author: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><circle cx="8.5" cy="10" r="2.5" stroke="currentColor" stroke-width="1.4"/><line x1="12" y1="9" x2="18" y2="9" stroke="currentColor" stroke-width="1.4"/><line x1="12" y1="12" x2="17" y2="12" stroke="currentColor" stroke-width="1.2"/><line x1="6" y1="17" x2="18" y2="17" stroke="currentColor" stroke-width="1.2"/></svg>`,
  cta: `<svg class="icon-svg" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="1.4"/><line x1="6" y1="9" x2="18" y2="9" stroke="currentColor" stroke-width="1.8"/><line x1="6" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.2"/><rect x="6" y="15" width="9" height="4" rx="2" fill="currentColor"/></svg>`,
};

// ── Init ───────────────────────────────────────────────────────────
function init(){
  loadCustomTemplates(); // must be before buildFamilyPicker
  checkUrlOrDraft();     // restore shared/draft carousel before first render
  buildFamilyPicker();
  buildLayoutPicker();
  buildIconGrid();
  buildTweaksPanel();
  setupGlobals();
  loadCurrent();
  renderTray();
  renderCanvas();
  setupShowcase();
  setupEditMode();
}

// ── Sidebar: family picker ─────────────────────────────────────────
function buildFamilyPicker(){
  const wrap = $('#family-picker');
  wrap.innerHTML = '';
  Object.entries(T.FAMILIES).forEach(([key, fam]) => {
    const btn = document.createElement('button');
    btn.className = 'family-card' + (fam._custom ? ' family-card-custom' : '');
    btn.dataset.family = key;
    btn.onclick = () => setFamily(key);
    const themes = T.THEMES[key] || {};
    const swatchColor = themes[Object.keys(themes)[0]]?.swatch || '#888';
    const deleteBtn = fam._custom
      ? `<button class="family-card-del" title="Delete template" onclick="event.stopPropagation();deleteCustomTemplate('${key}')">×</button>`
      : '';
    btn.innerHTML = `
      <div class="swatch" style="background:${swatchColor}"></div>
      <div class="label">${fam.label}</div>
      <div class="subtitle">${fam.subtitle}</div>
      ${deleteBtn}
    `;
    wrap.appendChild(btn);
  });
  // "Import template" card
  const addBtn = document.createElement('button');
  addBtn.className = 'family-card family-card-import';
  addBtn.onclick = openImportModal;
  addBtn.innerHTML = `<div class="import-plus">+</div><div class="label">Import template</div>`;
  wrap.appendChild(addBtn);
}

// ── Sidebar: layout picker ─────────────────────────────────────────
function buildLayoutPicker(){
  const wrap = $('#layout-picker');
  wrap.innerHTML = '';
  T.LAYOUTS.forEach(l => {
    const btn = document.createElement('button');
    btn.className = 'layout-btn';
    btn.dataset.layout = l;
    btn.onclick = () => setLayout(l);
    btn.innerHTML = `${LAYOUT_ICONS[l] || ''}<div class="name">${T.LAYOUT_LABELS[l]}</div>`;
    wrap.appendChild(btn);
  });
}

// ── Sidebar: theme picker ──────────────────────────────────────────
function buildThemePicker(){
  const wrap = $('#theme-swatches');
  wrap.innerHTML = '';
  const slide = state.slides[state.currentIdx];
  const themes = T.THEMES[slide.family];
  Object.entries(themes).forEach(([key, th]) => {
    const btn = document.createElement('button');
    btn.className = 'theme-swatch' + (key === slide.theme ? ' active' : '');
    btn.style.background = th.swatch;
    btn.title = th.label;
    btn.dataset.theme = key;
    btn.onclick = () => setTheme(key);
    wrap.appendChild(btn);
  });
}

// ── Sidebar: icon picker (HEA only) ────────────────────────────────
function buildIconGrid(){
  const grid = $('#icon-grid');
  grid.innerHTML = `<div class="icon-opt none-opt selected" data-icon="none">∅</div>`;
  T.ICONS.forEach(key => {
    const div = document.createElement('div');
    div.className = 'icon-opt';
    div.dataset.icon = key;
    div.title = key.replace('.png','');
    div.innerHTML = `<img src="assets/icons/${key}" alt="">`;
    div.onclick = () => setIcon(key);
    grid.appendChild(div);
  });
  $('#icon-grid .none-opt').onclick = () => setIcon('none');
}

// ── Sidebar: dynamic content fields ────────────────────────────────
function renderFields(){
  const slide = state.slides[state.currentIdx];
  const defs = T.FIELDS[slide.layout] || [];
  const wrap = $('#fields');
  wrap.innerHTML = '';
  defs.forEach(def => {
    const field = document.createElement('div');
    field.className = 'field';
    const lbl = document.createElement('label');
    lbl.textContent = def.label;
    field.appendChild(lbl);
    const el = document.createElement(def.ta ? 'textarea' : 'input');
    if (!def.ta) el.type = 'text';
    el.id = 'fld-' + def.id;
    el.placeholder = def.ph || '';
    el.value = slide.fields[def.id] ?? '';
    el.addEventListener('input', () => {
      slide.fields[def.id] = el.value;
      renderCanvas();
      refreshThumb(state.currentIdx);
    });
    field.appendChild(el);
    wrap.appendChild(field);
  });
}

// ── Sidebar: global slide controls (page, handle) ──────────────────
function setupGlobals(){
  const slide = state.slides[state.currentIdx];
  $('#fld-pg').value = slide.pg;
  $('#fld-pgtot').value = slide.pgTot;
  $('#fld-handle').value = slide.handle;
  $('#fld-pg').oninput = () => { slide.pg = $('#fld-pg').value; renderCanvas(); refreshThumb(state.currentIdx); };
  $('#fld-pgtot').oninput = () => { slide.pgTot = $('#fld-pgtot').value; renderCanvas(); refreshThumb(state.currentIdx); };
  $('#fld-handle').oninput = () => { slide.handle = $('#fld-handle').value; renderCanvas(); refreshThumb(state.currentIdx); };
}

// ── Sidebar: photo URL field (added inline when layout supports it) ─
// (handled by general renderFields since photoUrl is just another field)

// ── Tweaks panel ───────────────────────────────────────────────────
function buildTweaksPanel(){
  const wrap = $('#tweaks-body');
  wrap.innerHTML = `
    <div class="tweak-section">
      <h3>Footer</h3>
      <div class="toggle-row">
        <span>Show page numbers</span>
        <div class="toggle ${state.tweaks.showPageNumbers ? 'on' : ''}" data-tweak="showPageNumbers"></div>
      </div>
      <div class="toggle-row">
        <span>Show handles</span>
        <div class="toggle ${state.tweaks.showHandles ? 'on' : ''}" data-tweak="showHandles"></div>
      </div>
    </div>
    <div class="tweak-section">
      <h3>Visual</h3>
      <div class="toggle-row">
        <span>Watermark numbers (Tip slides)</span>
        <div class="toggle ${state.tweaks.showWatermarkNum ? 'on' : ''}" data-tweak="showWatermarkNum"></div>
      </div>
      <div class="slider-row">
        <div class="lbl">Font scale <span class="val">${state.tweaks.fontScale}%</span></div>
        <input type="range" min="80" max="130" step="5" value="${state.tweaks.fontScale}" data-tweak="fontScale">
      </div>
      <div class="slider-row">
        <div class="lbl">Outer padding <span class="val">${state.tweaks.outerPadding}%</span></div>
        <input type="range" min="60" max="140" step="5" value="${state.tweaks.outerPadding}" data-tweak="outerPadding">
      </div>
    </div>
    <div class="tweak-section">
      <h3>Apply</h3>
      <button class="btn btn-ghost" onclick="window.__resetTweaks()" style="width:100%">Reset to defaults</button>
    </div>
  `;

  wrap.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => {
      const key = t.dataset.tweak;
      state.tweaks[key] = !state.tweaks[key];
      t.classList.toggle('on', state.tweaks[key]);
      persistTweaks();
      applyTweaks();
    });
  });
  wrap.querySelectorAll('input[type="range"]').forEach(r => {
    r.addEventListener('input', () => {
      const key = r.dataset.tweak;
      state.tweaks[key] = parseInt(r.value, 10);
      r.closest('.slider-row').querySelector('.val').textContent = r.value + '%';
      persistTweaks();
      applyTweaks();
    });
  });
}

window.__resetTweaks = function(){
  state.tweaks = { ...TWEAKS_DEFAULTS };
  buildTweaksPanel();
  persistTweaks();
  applyTweaks();
};

function persistTweaks(){
  try {
    window.parent.postMessage({type:'__edit_mode_set_keys', edits: state.tweaks}, '*');
  } catch(e){}
}

function applyTweaks(){
  const root = document.documentElement;
  root.style.setProperty('--slide-font-scale', state.tweaks.fontScale / 100);
  root.style.setProperty('--slide-padding-scale', state.tweaks.outerPadding / 100);
  // Re-render
  renderCanvas();
  renderTray();
}

// ── Setters ────────────────────────────────────────────────────────
function setFamily(key){
  const slide = state.slides[state.currentIdx];
  slide.family = key;
  const fam = T.FAMILIES[key] || {};
  const brand = fam.brand;
  slide.theme = Object.keys(T.THEMES[key] || {})[0] || 'navy';
  // Update handle if it's still at a known default
  if (slide.handle === DEFAULT_HANDLE_JP || slide.handle === DEFAULT_HANDLE_HEA){
    slide.handle = fam._handle || (brand === 'hea' ? DEFAULT_HANDLE_HEA : DEFAULT_HANDLE_JP);
    $('#fld-handle').value = slide.handle;
  }
  if (brand !== 'hea') slide.icon = 'none';
  reflectSidebar();
  renderCanvas();
  refreshThumb(state.currentIdx);
}

function setLayout(layout){
  const slide = state.slides[state.currentIdx];
  slide.layout = layout;
  // Backfill fields with placeholders if undefined (skip URL fields)
  (T.FIELDS[layout] || []).forEach(def => {
    if (slide.fields[def.id] === undefined){
      slide.fields[def.id] = /url$/i.test(def.id) ? '' : (def.ph || '');
    }
  });
  reflectSidebar();
  renderCanvas();
  refreshThumb(state.currentIdx);
}

function setTheme(key){
  const slide = state.slides[state.currentIdx];
  slide.theme = key;
  reflectSidebar();
  renderCanvas();
  refreshThumb(state.currentIdx);
}

function setIcon(key){
  const slide = state.slides[state.currentIdx];
  slide.icon = key;
  $$('.icon-opt').forEach(el => el.classList.toggle('selected', el.dataset.icon === key));
  renderCanvas();
  refreshThumb(state.currentIdx);
}

function setFormat(fmt){
  state.format = fmt;
  state.slides.forEach(s => s.format = fmt);
  $$('.format-toggle button').forEach(b => b.classList.toggle('active', b.dataset.fmt === fmt));
  renderCanvas();
  renderTray();
}

// ── Reflect current slide into sidebar UI ─────────────────────────
function reflectSidebar(){
  const slide = state.slides[state.currentIdx];
  $$('.family-card').forEach(b => b.classList.toggle('active', b.dataset.family === slide.family));
  $$('.layout-btn').forEach(b => b.classList.toggle('active', b.dataset.layout === slide.layout));
  buildThemePicker();
  $$('.icon-opt').forEach(el => el.classList.toggle('selected', el.dataset.icon === slide.icon));
  const brand = (T.FAMILIES[slide.family] || {}).brand;
  $('#icon-section').style.display = brand === 'hea' ? '' : 'none';
  renderFields();
  setupGlobals();
}

function loadCurrent(){
  reflectSidebar();
}

// ── Canvas rendering ──────────────────────────────────────────────
function renderCanvas(){
  const slide = state.slides[state.currentIdx];
  // Apply tweaks-derived modifications (e.g., strip page numbers / handles)
  const renderSlide = applyRenderTweaks(slide);
  const html = T.render(renderSlide);
  const wrap = $('#slide-canvas-wrap');
  wrap.innerHTML = html;
  // Size container by slide aspect
  const slideEl = wrap.querySelector('.slide');
  if (slideEl) updateCanvasSize();
  updateSlideInfo();
  debouncePersistDraft();
}

function applyRenderTweaks(slide){
  const s = { ...slide, fields: { ...slide.fields } };
  if (!state.tweaks.showPageNumbers){ s.pg = ''; s.pgTot = ''; }
  if (!state.tweaks.showHandles){ s.handle = ''; }
  return s;
}

function updateCanvasSize(){
  // Slides have fixed 540 or 540x675 size — fit the available preview area
  const area = $('#preview-area');
  const slide = $('.slide');
  if (!slide) return;
  const aw = area.clientWidth - 48;
  const ah = area.clientHeight - 48;
  const sw = slide.offsetWidth;
  const sh = slide.offsetHeight;
  const scale = Math.min(aw / sw, ah / sh, 1.4);
  const wrap = $('#slide-canvas-wrap');
  wrap.style.transform = `scale(${scale})`;
  wrap.style.transformOrigin = 'center';
}

function updateSlideInfo(){
  $('#slide-info').textContent = `Slide ${state.currentIdx + 1} of ${state.slides.length}`;
}

// ── Tray ───────────────────────────────────────────────────────────
function renderTray(){
  const tray = $('#tray');
  // Clear and rebuild
  tray.innerHTML = '';
  state.slides.forEach((slide, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'tray-thumb' + (idx === state.currentIdx ? ' active' : '') + (state.format === 'portrait' ? ' portrait' : '');
    thumb.dataset.idx = idx;
    thumb.onclick = () => switchTo(idx);
    thumb.innerHTML = `
      <button class="thumb-del" title="Delete">×</button>
      <span class="thumb-num">${idx + 1}</span>
      <div class="thumb-inner"></div>
    `;
    const inner = thumb.querySelector('.thumb-inner');
    inner.innerHTML = T.render(applyRenderTweaks(slide));
    thumb.querySelector('.thumb-del').onclick = (e) => { e.stopPropagation(); deleteSlide(idx); };
    tray.appendChild(thumb);
  });
  const add = document.createElement('button');
  add.className = 'tray-add';
  add.onclick = addSlide;
  add.innerHTML = `<span>+</span>Add slide`;
  tray.appendChild(add);
}

function refreshThumb(idx){
  const thumb = document.querySelector(`.tray-thumb[data-idx="${idx}"]`);
  if (!thumb) return;
  thumb.querySelector('.thumb-inner').innerHTML = T.render(applyRenderTweaks(state.slides[idx]));
}

// ── Slide management ──────────────────────────────────────────────
function switchTo(idx){
  state.currentIdx = idx;
  loadCurrent();
  renderCanvas();
  // Update tray active state
  $$('.tray-thumb').forEach(t => t.classList.toggle('active', parseInt(t.dataset.idx,10) === idx));
}

function addSlide(opts){
  const last = state.slides[state.slides.length - 1];
  const idx = state.slides.length + 1;
  const newSlide = defaultsFor(opts?.family || last.family, opts?.layout || 'tip', idx);
  newSlide.theme = opts?.theme || last.theme;
  newSlide.format = state.format;
  newSlide.handle = last.handle;
  state.slides.push(newSlide);
  state.currentIdx = state.slides.length - 1;
  // Update pgTot on all
  const total = String(state.slides.length).padStart(2,'0');
  state.slides.forEach((s, i) => { s.pgTot = total; if (!opts) s.pg = s.pg || String(i+1).padStart(2,'0'); });
  state.slides[state.currentIdx].pg = String(state.slides.length).padStart(2,'0');
  loadCurrent();
  renderTray();
  renderCanvas();
}

function duplicateSlide(){
  const slide = state.slides[state.currentIdx];
  const copy = JSON.parse(JSON.stringify(slide));
  copy.pg = String(state.slides.length + 1).padStart(2,'0');
  state.slides.splice(state.currentIdx + 1, 0, copy);
  // Update pgTot
  const total = String(state.slides.length).padStart(2,'0');
  state.slides.forEach(s => s.pgTot = total);
  state.currentIdx = state.currentIdx + 1;
  loadCurrent();
  renderTray();
  renderCanvas();
}

function deleteSlide(idx){
  if (state.slides.length === 1) return toast('Cannot delete last slide');
  state.slides.splice(idx, 1);
  if (state.currentIdx >= state.slides.length) state.currentIdx = state.slides.length - 1;
  const total = String(state.slides.length).padStart(2,'0');
  state.slides.forEach(s => s.pgTot = total);
  loadCurrent();
  renderTray();
  renderCanvas();
}

// ── Export ────────────────────────────────────────────────────────
async function exportSlide(){
  if (!window.html2canvas) return toast('Exporter loading…');
  const wrap = $('#slide-canvas-wrap');
  // Render at native size, untransformed
  const prevTransform = wrap.style.transform;
  wrap.style.transform = 'scale(1)';
  const slide = wrap.querySelector('.slide');
  const w = slide.offsetWidth;
  const h = slide.offsetHeight;
  // Scale up to 1080 export
  const exportScale = 1080 / w;
  const canvas = await html2canvas(slide, {
    backgroundColor: null,
    scale: exportScale,
    width: w, height: h,
    useCORS: true,
    logging: false,
  });
  wrap.style.transform = prevTransform;
  // Download
  const a = document.createElement('a');
  a.download = `carousel-${String(state.currentIdx + 1).padStart(2,'0')}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  toast('PNG downloaded');
}

async function exportAll(){
  if (!window.html2canvas) return toast('Exporter loading…');
  toast('Exporting all slides…');
  const origIdx = state.currentIdx;
  for (let i = 0; i < state.slides.length; i++){
    state.currentIdx = i;
    renderCanvas();
    await new Promise(r => setTimeout(r, 100));
    const wrap = $('#slide-canvas-wrap');
    const prevTransform = wrap.style.transform;
    wrap.style.transform = 'scale(1)';
    const slide = wrap.querySelector('.slide');
    const w = slide.offsetWidth, h = slide.offsetHeight;
    const exportScale = 1080 / w;
    const canvas = await html2canvas(slide, {
      backgroundColor: null, scale: exportScale,
      width: w, height: h, useCORS: true, logging: false,
    });
    wrap.style.transform = prevTransform;
    const a = document.createElement('a');
    a.download = `carousel-${String(i+1).padStart(2,'0')}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    await new Promise(r => setTimeout(r, 250));
  }
  state.currentIdx = origIdx;
  renderCanvas();
  toast('All slides exported');
}

// ── Showcase ──────────────────────────────────────────────────────
function setupShowcase(){
  const body = $('#showcase-body');
  body.innerHTML = '';
  const sampleFor = (family, layout) => {
    const idx = 1;
    const s = defaultsFor(family, layout, idx);
    s.pgTot = '06';
    s.format = state.format;
    return s;
  };
  Object.entries(T.FAMILIES).forEach(([famKey, fam]) => {
    const row = document.createElement('div');
    row.className = 'show-row';
    row.innerHTML = `<h3>${fam.label}</h3><div class="row-sub">${fam.subtitle}</div><div class="show-grid"></div>`;
    const grid = row.querySelector('.show-grid');
    T.LAYOUTS.forEach(layout => {
      const card = document.createElement('div');
      card.className = 'show-card';
      const sample = sampleFor(famKey, layout);
      // Pick first non-base theme to add variety occasionally
      const themes = Object.keys(T.THEMES[famKey]);
      // Cover defaults to first theme; let's vary a bit
      if (layout === 'quote' && themes.length > 1) sample.theme = themes[1] || themes[0];
      if (layout === 'cta')   sample.theme = themes[0];
      card.innerHTML = `
        <div class="card-preview">
          <div class="preview-inner"></div>
        </div>
        <div class="card-label">${T.LAYOUT_LABELS[layout]}</div>
        <div class="card-meta">${fam.label.split(' — ')[1] || fam.label}</div>
      `;
      const inner = card.querySelector('.preview-inner');
      inner.innerHTML = T.render(sample);
      // Scale the 540 preview to card width (~196)
      const cardEl = card.querySelector('.card-preview');
      requestAnimationFrame(() => {
        const w = cardEl.clientWidth || 196;
        const slideW = state.format === 'portrait' ? 540 : 540;
        const slideH = state.format === 'portrait' ? 675 : 540;
        const scale = w / slideW;
        inner.style.transform = `scale(${scale})`;
        inner.style.width = slideW + 'px';
        inner.style.height = slideH + 'px';
        cardEl.style.aspectRatio = state.format === 'portrait' ? '4 / 5' : '1';
      });
      card.onclick = () => {
        addSlide({ family: famKey, layout, theme: sample.theme });
        closeShowcase();
      };
      grid.appendChild(card);
    });
    body.appendChild(row);
  });
}

function openShowcase(){
  setupShowcase();
  $('#showcase').classList.add('open');
}

function closeShowcase(){
  $('#showcase').classList.remove('open');
}

// ── Edit mode (tweaks toggle) ─────────────────────────────────────
function setupEditMode(){
  window.addEventListener('message', (e) => {
    if (e.data?.type === '__activate_edit_mode')   $('#tweaks').classList.add('open');
    if (e.data?.type === '__deactivate_edit_mode') $('#tweaks').classList.remove('open');
  });
  try {
    window.parent.postMessage({type:'__edit_mode_available'}, '*');
  } catch(e){}
}

// ── Misc ───────────────────────────────────────────────────────────
let toastTimer;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Custom template persistence ───────────────────────────────────
const STORAGE_KEY = 'carouselMaker_customTemplates';

function saveCustomTemplates(){
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(T.getCustomFamilies()));
  } catch(e) {}
}

function loadCustomTemplates(){
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    stored.forEach(cfg => {
      try { T.registerCustomFamily(cfg); } catch(e) {}
    });
  } catch(e) {}
}

// ── Colour utilities ──────────────────────────────────────────────
const escAttr = s => String(s ?? '').replace(/[&"<>]/g, c => ({'&':'&amp;','"':'&quot;','<':'&lt;','>':'&gt;'})[c]);

function hexToRgb(hex) {
  const h = hex.replace('#','');
  return { r: parseInt(h.slice(0,2),16), g: parseInt(h.slice(2,4),16), b: parseInt(h.slice(4,6),16) };
}
function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
function darkenHex(hex, amount) {
  let { r, g, b } = hexToRgb(hex);
  return '#' + [r,g,b].map(x => Math.max(0, Math.round(x*(1-amount))).toString(16).padStart(2,'0')).join('');
}
function contrastColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299*r + 0.587*g + 0.114*b) > 140 ? '#000000' : '#ffffff';
}

// ── Custom template management ────────────────────────────────────
window.deleteCustomTemplate = function(id){
  if (!confirm('Remove this template from your library?')) return;
  const slide = state.slides[state.currentIdx];
  if (slide.family === id) setFamily('jp-editorial');
  T.removeCustomFamily(id);
  saveCustomTemplates();
  buildFamilyPicker();
  reflectSidebar();
  toast('Template removed');
};

// ── Build form ────────────────────────────────────────────────────
let _buildLogo = '';

function switchImportTab(tab) {
  $$('.import-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $('#tab-build').style.display = tab === 'build' ? '' : 'none';
  $('#tab-json').style.display  = tab === 'json'  ? '' : 'none';
}

function initBuildForm() {
  _buildLogo = '';
  $('#build-logo-preview').innerHTML = '';
  $('#build-logo-clear').style.display = 'none';
  $('#build-label').value    = '';
  $('#build-subtitle').value = '';
  $('#build-handle').value   = '';
  $('#build-error').textContent = '';
  $('#build-themes').innerHTML = '';
  addBuildTheme({ name: 'Dark',  bg: '#1e2235', accent: '#7c5cff', text: '#ffffff' });
  addBuildTheme({ name: 'Light', bg: '#ffffff',  accent: '#7c5cff', text: '#1a1a2e' });
}

function addBuildTheme(defaults) {
  const idx = $('#build-themes').querySelectorAll('.build-theme-row').length;
  const d = defaults || { name: 'Theme ' + (idx+1), bg: '#2c3d50', accent: '#dfb81f', text: '#ffffff' };
  const row = document.createElement('div');
  row.className = 'build-theme-row';
  row.dataset.themeIdx = idx;
  row.innerHTML = `
    <div class="theme-row-header">
      <input class="build-theme-name" type="text" value="${escAttr(d.name)}" placeholder="Theme name">
      <button class="theme-row-del" title="Remove">×</button>
    </div>
    <div class="theme-colours">
      <div class="colour-row"><label>Background</label><div class="colour-input-wrap"><input type="color" data-key="bg" value="${d.bg}"><span class="colour-hex">${d.bg}</span></div></div>
      <div class="colour-row"><label>Accent</label><div class="colour-input-wrap"><input type="color" data-key="accent" value="${d.accent}"><span class="colour-hex">${d.accent}</span></div></div>
      <div class="colour-row"><label>Text</label><div class="colour-input-wrap"><input type="color" data-key="text" value="${d.text}"><span class="colour-hex">${d.text}</span></div></div>
    </div>
  `;
  row.querySelector('.theme-row-del').onclick = () => {
    row.remove();
    $$('.build-theme-row').forEach((r,i) => r.dataset.themeIdx = i);
  };
  row.querySelectorAll('input[type="color"]').forEach(inp => {
    inp.oninput = () => inp.nextElementSibling.textContent = inp.value;
  });
  $('#build-themes').appendChild(row);
}

function buildTemplateFromForm() {
  const label = $('#build-label').value.trim();
  if (!label) { $('#build-error').textContent = 'Enter a brand name.'; return null; }
  const themeRows = [...$$('.build-theme-row')];
  if (!themeRows.length) { $('#build-error').textContent = 'Add at least one colour theme.'; return null; }

  const id = label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'custom';
  const themes = {};
  themeRows.forEach(row => {
    const name    = row.querySelector('.build-theme-name').value.trim() || 'Theme';
    const bg      = row.querySelector('[data-key="bg"]').value;
    const accent  = row.querySelector('[data-key="accent"]').value;
    const text    = row.querySelector('[data-key="text"]').value;
    const themeId = name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'theme';
    themes[themeId] = {
      label: name, swatch: bg, bg,
      bgAlt:      darkenHex(bg, 0.12),
      text,
      textMuted:  hexToRgba(text, 0.6),
      accent,
      accentText: contrastColor(accent),
      rule:       hexToRgba(text, 0.18),
    };
  });

  return {
    id,
    label,
    subtitle: $('#build-subtitle').value.trim() || 'Custom template',
    handle:   $('#build-handle').value.trim(),
    logo:     _buildLogo,
    themes,
  };
}

window.clearBuildLogo = function() {
  _buildLogo = '';
  $('#build-logo-preview').innerHTML = '';
  $('#build-logo-clear').style.display = 'none';
};

function openImportModal(){
  $('#import-modal').classList.add('open');
  $('#import-json').value = '';
  $('#import-error').textContent = '';
  initBuildForm();
  switchImportTab('build');
}

function closeImportModal(){
  $('#import-modal').classList.remove('open');
}

function doImportTemplate(){
  const raw = $('#import-json').value.trim();
  if (!raw) { $('#import-error').textContent = 'Paste your template JSON above.'; return; }
  let cfg;
  try { cfg = JSON.parse(raw); } catch(e) {
    $('#import-error').textContent = 'Invalid JSON — check for missing quotes or commas.';
    return;
  }
  try {
    const id = T.registerCustomFamily(cfg);
    saveCustomTemplates();
    buildFamilyPicker();
    closeImportModal();
    setFamily(id);
    toast(`"${cfg.label}" added to your library`);
  } catch(e) {
    $('#import-error').textContent = e.message;
  }
}

function downloadSampleTemplate(){
  const sample = {
    id: 'my-brand',
    label: 'My Brand — Clean',
    subtitle: 'Custom colour palette',
    handle: '@mybrand',
    logo: '',
    logoStyle: 'height:40px;max-width:150px;object-fit:contain',
    fonts: {
      headingFamily: "'Inter','Helvetica Neue',sans-serif",
      bodyFamily: "'Inter','Helvetica Neue',sans-serif",
      googleFonts: ''
    },
    themes: {
      primary: {
        label: 'Primary',
        swatch: '#2c3d50',
        bg: '#2c3d50',
        bgAlt: '#1e2d3d',
        text: '#ffffff',
        textMuted: 'rgba(255,255,255,0.65)',
        accent: '#dfb81f',
        accentText: '#000000',
        rule: 'rgba(255,255,255,0.2)'
      },
      light: {
        label: 'Light',
        swatch: '#ffffff',
        bg: '#ffffff',
        bgAlt: '#f4f4f6',
        text: '#1a1a2e',
        textMuted: 'rgba(0,0,0,0.55)',
        accent: '#2c3d50',
        accentText: '#ffffff',
        rule: 'rgba(0,0,0,0.12)'
      }
    }
  };
  const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.download = 'carousel-template-sample.json';
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportCustomTemplate(id){
  const cfg = T.getCustomFamilies().find(c => c.id === id);
  if (!cfg) return;
  const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.download = `carousel-template-${id}.json`;
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Project: save / load / share / draft ─────────────────────────
const DRAFT_KEY = 'carouselMaker_draft';

let _draftTimer;
function debouncePersistDraft(){
  clearTimeout(_draftTimer);
  _draftTimer = setTimeout(persistDraft, 700);
}

function persistDraft(){
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      version: 1, savedAt: Date.now(),
      format: state.format, tweaks: state.tweaks,
      slides: state.slides, currentIdx: state.currentIdx,
    }));
  } catch(e){}
}

function relTime(ts){
  const d = Date.now() - ts;
  if (d < 90000)   return 'just now';
  if (d < 3600000) return Math.round(d/60000) + 'm ago';
  if (d < 86400000)return Math.round(d/3600000) + 'h ago';
  return Math.round(d/86400000) + 'd ago';
}

function checkUrlOrDraft(){
  if (location.hash.startsWith('#c=')){
    try {
      const data = JSON.parse(_fromBase64(location.hash.slice(3)));
      history.replaceState(null, '', location.pathname + location.search);
      _applyCarouselData(data, true);
      // banner not needed — URL load is intentional
    } catch(e){ console.warn('URL decode failed:', e); }
    return;
  }
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (!draft.slides || !draft.slides.length) return;
    const banner = $('#draft-banner');
    if (banner){
      $('#draft-time').textContent = draft.savedAt ? relTime(draft.savedAt) : '';
      banner.style.display = 'flex';
      document.body.classList.add('has-banner');
      window._pendingDraft = draft;
    }
  } catch(e){}
}

window.dismissDraft = function(){
  $('#draft-banner').style.display = 'none';
  document.body.classList.remove('has-banner');
  localStorage.removeItem(DRAFT_KEY);
};

window.restoreDraft = function(){
  if (!window._pendingDraft) return;
  _applyCarouselData(window._pendingDraft);
  buildFamilyPicker();
  $$('.format-toggle button').forEach(b => b.classList.toggle('active', b.dataset.fmt === state.format));
  applyTweaks();
  reflectSidebar();
  renderTray();
  renderCanvas();
  $('#draft-banner').style.display = 'none';
  document.body.classList.remove('has-banner');
  toast('Draft restored');
};

function _applyCarouselData(data, quiet){
  if (!data || !data.slides || !data.slides.length) return;
  if (data.customTemplates){
    data.customTemplates.forEach(cfg => {
      if (!T.FAMILIES[cfg.id]) try { T.registerCustomFamily(cfg); } catch(e){}
    });
    saveCustomTemplates();
  }
  state.slides = data.slides;
  state.format = data.format || 'square';
  state.currentIdx = Math.min(data.currentIdx || 0, data.slides.length - 1);
  if (data.tweaks) state.tweaks = { ...TWEAKS_DEFAULTS, ...data.tweaks };
}

function saveCarousel(){
  const usedCustom = T.getCustomFamilies()
    .filter(cfg => state.slides.some(s => s.family === cfg.id));
  const data = {
    version: 1, format: state.format,
    tweaks: state.tweaks, slides: state.slides,
    ...(usedCustom.length ? { customTemplates: usedCustom } : {}),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.download = 'carousel.json';
  a.href = URL.createObjectURL(blob);
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Carousel saved');
}

function _toBase64(str){
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p) => String.fromCharCode(parseInt(p, 16))));
}
function _fromBase64(str){
  return decodeURIComponent(Array.prototype.map.call(atob(str), c => '%' + c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
}

function shareCarousel(){
  const usedCustom = T.getCustomFamilies()
    .filter(cfg => state.slides.some(s => s.family === cfg.id))
    .map(cfg => ({ ...cfg, logo: '' })); // strip logos to keep URL short
  const data = {
    version: 1, format: state.format, tweaks: state.tweaks, slides: state.slides,
    ...(usedCustom.length ? { customTemplates: usedCustom } : {}),
  };
  const encoded = _toBase64(JSON.stringify(data));
  if (encoded.length > 20000){
    toast('Carousel too large for a link — use ↓ Save instead');
    return;
  }
  const url = location.origin + location.pathname + '#c=' + encoded;
  navigator.clipboard.writeText(url)
    .then(() => toast('Share link copied to clipboard'))
    .catch(() => prompt('Copy this link:', url));
}

// ── Load carousel modal ───────────────────────────────────────────
function openLoadModal(){
  $('#load-modal').classList.add('open');
  $('#load-json').value = '';
  $('#load-error').textContent = '';
}

function closeLoadModal(){
  $('#load-modal').classList.remove('open');
}

function doLoadCarousel(){
  const raw = $('#load-json').value.trim();
  if (!raw){ $('#load-error').textContent = 'Paste carousel JSON or upload a file.'; return; }
  let data;
  try { data = JSON.parse(raw); } catch(e){
    $('#load-error').textContent = 'Invalid JSON — check for missing quotes or commas.';
    return;
  }
  if (!data.slides || !data.slides.length){
    $('#load-error').textContent = 'No slides found. Is this a carousel file?';
    return;
  }
  _applyCarouselData(data);
  buildFamilyPicker();
  $$('.format-toggle button').forEach(b => b.classList.toggle('active', b.dataset.fmt === state.format));
  applyTweaks();
  reflectSidebar();
  renderTray();
  renderCanvas();
  closeLoadModal();
  persistDraft();
  toast('Carousel loaded — ' + data.slides.length + ' slides');
}

// ── Wire toolbar buttons ──────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  init();
  // Toolbar
  $('#btn-duplicate').onclick = duplicateSlide;
  $('#btn-export').onclick = exportSlide;
  $('#btn-export-all').onclick = exportAll;
  $('#btn-browse').onclick = openShowcase;
  $('#btn-tweaks').onclick = () => {
    const isOpen = $('#tweaks').classList.toggle('open');
    if (!isOpen){
      try { window.parent.postMessage({type:'__edit_mode_dismissed'}, '*'); } catch(e){}
    }
  };
  $('#close-showcase').onclick = closeShowcase;
  $('#close-tweaks').onclick = () => {
    $('#tweaks').classList.remove('open');
    try { window.parent.postMessage({type:'__edit_mode_dismissed'}, '*'); } catch(e){}
  };

  // Import modal — tabs
  $$('.import-tab').forEach(t => t.onclick = () => switchImportTab(t.dataset.tab));

  // Build tab
  $('#btn-add-theme').onclick = () => addBuildTheme();
  $('#btn-build-import').onclick = () => {
    $('#build-error').textContent = '';
    const cfg = buildTemplateFromForm();
    if (!cfg) return;
    try {
      const id = T.registerCustomFamily(cfg);
      saveCustomTemplates();
      buildFamilyPicker();
      closeImportModal();
      setFamily(id);
      toast(`"${cfg.label}" added to your library`);
    } catch(e) { $('#build-error').textContent = e.message; }
  };
  $('#build-logo-file').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      _buildLogo = ev.target.result;
      $('#build-logo-preview').innerHTML = `<img src="${_buildLogo}" alt="logo">`;
      $('#build-logo-clear').style.display = '';
    };
    reader.readAsDataURL(file);
  };
  $('#build-logo-clear').onclick = clearBuildLogo;

  // JSON tab
  $('#close-import').onclick = closeImportModal;
  $('#btn-import-do').onclick = doImportTemplate;
  $('#btn-sample').onclick = downloadSampleTemplate;
  $('#import-file').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { $('#import-json').value = ev.target.result; $('#import-error').textContent = ''; };
    reader.readAsText(file);
  };

  $('#import-modal').addEventListener('click', e => {
    if (e.target === $('#import-modal')) closeImportModal();
  });

  // Project: save / load / share
  $('#btn-save-carousel').onclick  = saveCarousel;
  $('#btn-share-carousel').onclick = shareCarousel;
  $('#btn-load-carousel').onclick  = openLoadModal;
  $('#close-load').onclick         = closeLoadModal;
  $('#btn-load-do').onclick        = doLoadCarousel;
  $('#load-file').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { $('#load-json').value = ev.target.result; $('#load-error').textContent = ''; };
    reader.readAsText(file);
  };
  $('#load-modal').addEventListener('click', e => {
    if (e.target === $('#load-modal')) closeLoadModal();
  });
  $('#btn-new-carousel').onclick = () => {
    if (!confirm('Start a new carousel? Your current work will be replaced.')) return;
    state.slides = [defaultsFor('jp-editorial','cover',1)];
    state.slides[0].pgTot = '01';
    state.currentIdx = 0;
    state.format = 'square';
    state.tweaks = { ...TWEAKS_DEFAULTS };
    $$('.format-toggle button').forEach(b => b.classList.toggle('active', b.dataset.fmt === 'square'));
    buildTweaksPanel();
    applyTweaks();
    reflectSidebar();
    renderTray();
    renderCanvas();
    persistDraft();
    toast('New carousel started');
  };

  // Format toggle
  $$('.format-toggle button').forEach(b => {
    b.onclick = () => setFormat(b.dataset.fmt);
  });

  // Initial selection reflection
  setTimeout(() => {
    reflectSidebar();
    renderCanvas();
    renderTray();
  }, 50);

  window.addEventListener('resize', updateCanvasSize);
});

// expose for debugging
window.__state = state;

})();

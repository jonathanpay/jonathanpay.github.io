/* ══════════════════════════════════════════════════════════════════
   Carousel Maker — stock families
   Families that ship with the tool (not browser-localStorage imports).
   Registered at load; re-registered on window load so a stale
   localStorage copy of the same id can never override the repo version.

   To add a family: append its cfg (id/label/subtitle/handle/logo/
   logoStyle/fonts/themes) to CAROUSEL_STOCK_FAMILIES below. The shape
   is identical to the app's Import-template JSON.
   ══════════════════════════════════════════════════════════════════ */
window.CAROUSEL_STOCK_FAMILIES = [
  {
    id: 'ltsl-brand',
    label: 'LTSL — Brand',
    subtitle: 'Paper, navy, one gold mend',
    handle: '@livingthescandalouslife',
    logo: '',
    logoStyle: 'height:36px;max-width:160px;object-fit:contain',
    fonts: {
      // Bebas Neue is caps-only: type headlines in UPPERCASE.
      // The engine forces weight 800/900 on headings; Bebas ships 400 only,
      // so bold is synthesised. Barlow Condensed is the hardened fallback
      // (web-loaded) in case Bebas is unavailable — never Impact.
      headingFamily: "'Bebas Neue', 'Barlow Condensed', Impact, 'Arial Narrow', sans-serif",
      bodyFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      googleFonts: 'Bebas+Neue&family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700'
    },
    themes: {
      paper: {
        label: 'Paper',
        swatch: '#FAFAFA',
        bg: '#FAFAFA',
        bgAlt: '#EBEBEB',
        text: '#1E1B4B',
        textMuted: '#4F4F4F',
        accent: '#1E1B4B',
        accentText: '#FAFAFA',
        rule: 'rgba(30, 27, 75, 0.18)'
      },
      mend: {
        label: 'Mend',
        swatch: '#D9BA45',
        bg: '#FAFAFA',
        bgAlt: '#EBEBEB',
        text: '#1E1B4B',
        textMuted: '#4F4F4F',
        accent: '#D9BA45',
        accentText: '#1E1B4B',
        rule: 'rgba(217, 186, 69, 0.55)'
      },
      navy: {
        label: 'Navy',
        swatch: '#1E1B4B',
        bg: '#1E1B4B',
        bgAlt: '#2C2956',
        text: '#E9E8F0',
        textMuted: '#C4C1D9',
        accent: '#D9BA45',
        accentText: '#1E1B4B',
        rule: 'rgba(233, 232, 240, 0.18)'
      }
    }
  }
];

(function registerStockFamilies() {
  function run() {
    var T = window.CarouselTemplates;
    if (!T || typeof T.registerCustomFamily !== 'function') return;
    window.CAROUSEL_STOCK_FAMILIES.forEach(function (cfg) {
      try {
        T.registerCustomFamily(cfg);
      } catch (e) {
        console.warn('stock family failed to register:', cfg && cfg.id, e);
      }
    });
  }
  run();                                   // templates.js is loaded before this file
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  }
  window.addEventListener('load', run);    // last write wins over stale localStorage copies
})();

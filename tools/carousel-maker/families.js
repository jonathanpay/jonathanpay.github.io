/* ══════════════════════════════════════════════════════════════════
   Carousel Maker — stock families
   Families that ship with the tool (not browser-localStorage imports).
   Registered at load; re-registered on window load so a stale
   localStorage copy of the same id can never override the repo version.

   Sources: `~/Documents/linkedin-roots-carousel/carousel-themes/*.json`
   (jp-standard, ltsl-sermon) and the refined LTSL brand family
   (Bebas Neue caps + Inter, themes paper/mend/navy).

   To add a family: append its cfg (id/label/subtitle/handle/logo/
   logoStyle/fonts/themes) to CAROUSEL_STOCK_FAMILIES below. The shape
   is identical to the app's Import-template JSON.
   ══════════════════════════════════════════════════════════════════ */
window.CAROUSEL_STOCK_FAMILIES = [
  /* ── JP — Standard (personal brand: navy, white, gold) ─────────── */
  {
    id: 'jp-standard',
    label: 'JP — Standard',
    subtitle: 'Navy, white, gold',
    handle: '@jonathanpay',
    logo: 'assets/logos/jp-full.png',
    logoStyle: 'height:36px;max-width:160px;object-fit:contain',
    fonts: {
      headingFamily: "'Open Sans','Helvetica Neue',sans-serif",
      bodyFamily: "'Open Sans','Helvetica Neue',sans-serif",
      googleFonts: 'Open+Sans:ital,wght@0,400;0,600;0,700;0,800;1,700;1,800'
    },
    themes: {
      navy: {
        label: 'Navy', swatch: '#2c3d50', bg: '#2c3d50', bgAlt: '#1f2d3d',
        text: '#ffffff', textMuted: 'rgba(255,255,255,0.72)',
        accent: '#dfb81f', accentText: '#2c3d50', rule: 'rgba(255,255,255,0.14)'
      },
      white: {
        label: 'White', swatch: '#ffffff', bg: '#ffffff', bgAlt: '#f3efe4',
        text: '#2c3d50', textMuted: 'rgba(44,61,80,0.65)',
        accent: '#8b7417', accentText: '#2c3d50', rule: 'rgba(44,61,80,0.12)'
      },
      gold: {
        label: 'Gold', swatch: '#dfb81f', bg: '#dfb81f', bgAlt: '#c9a418',
        text: '#2c3d50', textMuted: 'rgba(44,61,80,0.75)',
        accent: '#2c3d50', accentText: '#ffffff', rule: 'rgba(44,61,80,0.2)'
      }
    }
  },

  /* ── LTSL — Sermon (deck language for social: ink, parchment, gold) ── */
  {
    id: 'ltsl-sermon',
    label: 'LTSL — Sermon',
    subtitle: 'Ink, parchment, gold',
    handle: '@livingthescandalouslife',
    logo: 'ltsl-ring',
    logoStyle: 'height:36px;max-width:160px;object-fit:contain',
    fonts: {
      headingFamily: "'Cormorant Garamond', Georgia, serif",
      bodyFamily: "'Karla', sans-serif",
      googleFonts: 'Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Karla:wght@400;500;600;700'
    },
    themes: {
      ink: {
        label: 'Ink', swatch: '#17140F', bg: '#17140F', bgAlt: '#241E16',
        text: '#F4EEE2', textMuted: '#DCD3C3',
        accent: '#C8963E', accentText: '#17140F', rule: 'rgba(244,238,226,0.14)'
      },
      parchment: {
        label: 'Parchment', swatch: '#F4EEE2', bg: '#F4EEE2', bgAlt: '#E8E0D0',
        text: '#17140F', textMuted: '#6E6455',
        accent: '#96703A', accentText: '#F4EEE2', rule: 'rgba(23,20,15,0.15)'
      },
      warm: {
        label: 'Warm ground', swatch: '#241E16', bg: '#241E16', bgAlt: '#17140F',
        text: '#F4EEE2', textMuted: '#C9BFAE',
        accent: '#E0B463', accentText: '#17140F', rule: 'rgba(244,238,226,0.12)'
      }
    }
  },

  /* ── LTSL — Brand (refined publication brand: paper, mend, navy) ─── */
  {
    id: 'ltsl-brand',
    label: 'LTSL — Brand',
    subtitle: 'Paper, navy, one gold mend',
    handle: '@livingthescandalouslife',
    logo: 'ltsl-ring',
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
        label: 'Paper', swatch: '#FAFAFA', bg: '#FAFAFA', bgAlt: '#EBEBEB',
        text: '#1E1B4B', textMuted: '#4F4F4F',
        accent: '#1E1B4B', accentText: '#FAFAFA', rule: 'rgba(30, 27, 75, 0.18)'
      },
      mend: {
        label: 'Mend', swatch: '#D9BA45', bg: '#FAFAFA', bgAlt: '#EBEBEB',
        text: '#1E1B4B', textMuted: '#4F4F4F',
        accent: '#D9BA45', accentText: '#1E1B4B', rule: 'rgba(217, 186, 69, 0.55)'
      },
      navy: {
        label: 'Navy', swatch: '#1E1B4B', bg: '#1E1B4B', bgAlt: '#2C2956',
        text: '#E9E8F0', textMuted: '#C4C1D9',
        accent: '#D9BA45', accentText: '#1E1B4B', rule: 'rgba(233, 232, 240, 0.18)'
      }
    }
  },

  /* ── LTSL — Brand (Classic) — the earlier system-sans version, kept
        so Jon's own exploration isn't lost. Superseded by ltsl-brand. ── */
  {
    id: 'ltsl-brand-classic',
    label: 'LTSL — Brand (Classic)',
    subtitle: 'System sans, navy paper',
    handle: 'livingthescandalouslife.substack.com',
    logo: 'ltsl-ring',
    logoStyle: 'height:36px;max-width:160px;object-fit:contain',
    fonts: {
      headingFamily: "'SF Pro Display', -apple-system, system-ui, 'Inter', 'Helvetica Neue', sans-serif",
      bodyFamily: "'SF Pro Display', -apple-system, system-ui, 'Inter', 'Helvetica Neue', sans-serif",
      googleFonts: 'Inter:wght@400;600;700;800'
    },
    themes: {
      navy: {
        label: 'Navy', swatch: '#1E1B4B', bg: '#1E1B4B', bgAlt: '#2C2956',
        text: '#E9E8F0', textMuted: 'rgba(233,232,240,0.72)',
        accent: '#D9BA45', accentText: '#363737', rule: 'rgba(233,232,240,0.16)'
      },
      paper: {
        label: 'Paper', swatch: '#FAFAFA', bg: '#FAFAFA', bgAlt: '#EBEBEB',
        text: '#363737', textMuted: '#4F4F4F',
        accent: '#1E1B4B', accentText: '#E9E8F0', rule: 'rgba(54,55,55,0.14)'
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

// Colour contrast and text size rules for the Email Accessibility Checker.
// No DOM, so it can be tested.

export function relativeLuminance([r, g, b]) {
  const channel = (c) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a, b) {
  const La = relativeLuminance(a);
  const Lb = relativeLuminance(b);
  return (Math.max(La, Lb) + 0.05) / (Math.min(La, Lb) + 0.05);
}

/** A CSS font-size in px, from px or pt (email HTML uses both). Null for anything else. */
export function fontSizePx(value) {
  const m = String(value).trim().match(/^([\d.]+)(px|pt)$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2].toLowerCase() === 'pt' ? n * (4 / 3) : n;
}

/** WCAG "large text": at least 18pt (24px), or 14pt (about 18.7px) and bold. */
export function isLargeText(sizePx, bold) {
  return sizePx >= 24 || (bold && sizePx >= 18.66);
}

export function isBold(fontWeight) {
  return fontWeight === 'bold' || fontWeight === 'bolder' || parseInt(fontWeight || '0', 10) >= 700;
}

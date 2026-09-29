# Kintsugi Overlay Generator

Browser tool for the *Living the Scandalous Life* feature images: takes a black
and white photo and lays a gold "kintsugi" line over it, derived from the
image's own deepest shadows, with a hand touch-up layer before export. Opened at
`/tools/kintsugi-overlay/`. Everything is client-side; no build step, no
dependencies beyond Google Fonts.

## Pipeline

1. **Automatic pass.** Luminance per pixel, optionally blurred (Smoothing). Anything
   darker than the threshold becomes gold; the rest becomes transparent. The edge is a
   smoothstep ramp (`CFG.soft`, 3% luminance) so the gold is not aliased.
2. **Threshold.** Slider, default window 8-30%, default 18%. **Override** opens it to
   1-60%. Unchecking Override clamps the value back into the window. A coverage readout
   ("Gold covers 3.2% of the image") flags under 0.3% as sparse and over 12% as busy.
3. **Touch-up.** Draw gold or erase, with a brush size slider. Edits are stored as
   strokes and replayed, so they survive threshold and colour changes and undo is exact.
   Erasing removes both automatic gold and hand-drawn gold.
4. **Export.** Image plus gold flattened to a PNG at the working resolution (long side
   capped at 3000px). The gold is always included, even if "Hide the gold" is ticked.

## Tuning

All the numbers that need real-image testing are in the `CFG` object at the top of the
script: the default window, the override limits, the edge softness, the working size.
The 12% and 0.3% coverage warnings are in `renderAuto()`.

## Status and open questions

First build, prototyped against one greyscaled portrait only. That is a poor case: broad
dark areas (jumper, hair) come out as solid gold blocks rather than cracks. The
default window is a guess and needs tuning against actual hero images.

- Gold is a fixed default (`#dfb81f`, the site gold) with a colour picker. Adjustable is
  the cheaper default; fix it later if consistency matters more.
- Interaction model is freehand draw, eraser and brush size, plus undo and clear.
- It is its own page rather than a mode of the journaling generator.
- A colour image is accepted and converted to luminance for the shadow pass, but the
  base image is shown and exported as supplied, not desaturated.

# Kintsugi Overlay Generator

Browser tool for the *Living the Scandalous Life* feature images: load a photo,
draw bold gold lines and shapes over it by hand, download the flattened PNG.
Opened at `/tools/kintsugi-overlay/`. Everything is client-side; no build step, no
dependencies beyond Google Fonts.

## What it does

- **Draw / Erase** (`B` / `E`), with a brush size slider. Undo with Cmd/Ctrl+Z, or clear all.
- **Colour picker.** Defaults to the site gold, `#dfb81f`. Changing it recolours everything
  drawn, so the image keeps one gold.
- **Smoothing.** Lines are drawn as quadratic curves through the midpoints between
  pointer samples, which takes the jitter out of a mouse or a finger.
- **Brush size** is in image pixels and starts at 1% of the long side (`CFG.brushFrac`),
  so a 2000px image opens with a 20px line.
- **Hide the drawing** to compare with the original. Starting a new stroke turns it back on.
- **Export.** Image plus drawing flattened at the image's own size, long side capped at
  3000px (`CFG.maxSide`). The drawing is always included, even if hidden in the preview.

Strokes are stored as point lists and replayed in order, so undo is exact and erasing
only ever removes drawn gold.

## History: the shadow pass was removed

The first build generated gold automatically from an image's deepest shadows
(threshold slider, override, smoothing, coverage readout). In use, Jon's hero images
turned out to be hand-drawn outlines and symbols (a column, gender symbols, a pen,
wings, wedding rings), not shadow cracks, and the automatic layer was never used. It
was removed in build 2026-09-30-a. It lives in the git history (PR #14) if it is ever
wanted again.

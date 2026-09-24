# Journaling Bible Generator

Jon's browser tool for laying a scripture passage out the way a journaling Bible
does: the text down two thirds of the page, a margin beside it for handwritten
notes. Everything is client-side; opened at
`https://jonathanpay.github.io/tools/journaling-bible/`.

Originated as a Canva one-off for the *Living the Scandalous Life* post
"Be Kind, Be Inclusive" (Luke 9:46-56). Built as a tool so the layout stops
being a manual exercise every time a post wants one.

## Files

| File | Role |
|---|---|
| `index.html` | The whole tool — editor, page render, html2canvas export. No build step. The only outside dependencies are Google Fonts and the html2canvas CDN script. |

## The page

A flat **1000 × 1000 px** square, exported at `scale: 3` → **3000 × 3000 PNG**,
which is the shape Substack and social want.

## The design system, measured

These are not choices I made. They were sampled or solved out of Jon's nine published
Canva pages (all 1080 × 1080) after he confirmed the fonts. Everything below is
expressed for the tool's 1000px page, which is 0.926 of the Canva original.

| Thing | Value | How it was pinned |
|---|---|---|
| Scripture | Playfair Display, **1.41rem**, line-height **1.365** | Reproducing Canva's line breaks. 1.41rem in a 500px column matches **all 22 lines** of the 1 John 4:13-21 page. 1.44rem was 2 per cent too large and flipped 10 of them |
| Paragraph break | **one full blank line** (1.365em) | Measured: Canva's gap between paragraphs is exactly one line pitch |
| Marginalia | Homemade Apple, **26.85px** (1.19 × scripture), line-height **1.52** | Two independent ways agreed: the size at which his notes break into the same lines, and the ratio of measured ink heights |
| Reference | Poppins **600**, **1.25rem**, centred | Ink box for "1 John 4:18" measures 447-553 in both |
| Paper | background **#F0F1ED** plus his texture, embedded | Sampled; grain amplitude is only ±4 levels, so the tone does more work than the grain |
| Marker | **#FFF197**-ish, soft ragged edge, 5px out and 9px beyond the line | Sampled, then matched as a *mean* over the fill rather than a brightest pixel |
| Ink | **#004AAD** | Darkest decile of the blue strokes, not the antialiased mean |
| Margins | **100px** all round | Canva's 108/1080. Must be px — see pitfalls |
| Columns | scripture **62.5%** (500px), gutter **15px** | Canva text column 108-646, notes start 662 of 1080 |
| Content start | top margin, **not** centred | Canva starts at the top margin |
| Pairs | same passage, different highlight | Already published as 1 John 4:18 (a) and (b) |

### The marker is a layer behind the text, not a background on the `<mark>`

This is the one to understand before touching it. `<mark>` carries no paint at all —
it only marks which words are highlighted. `renderHighlights()` measures each line
fragment of each mark and positions a `.highlight-strip` div behind the text.

Painting the bleed on the `<mark>` itself **cuts the line above off**: the background
of an inline element paints over the descenders of the previous line, because the
vertical padding that creates the bleed does not affect layout and so overlaps them.
Jon caught this on a real page. A real marker is under the writing, so the tool now
draws it there, where it cannot cover anything.

The strips also give the ragged edge: a data-URI SVG mask, soft edges, and a blotch
tile over the fill so it reads as ink rather than a flat block. If a renderer ignores
masks the strips fall back to plain rectangles, which is still correct, just plainer.

### Notes anchor to highlights, not paragraphs

A note belongs beside its **highlight**, so each note's "Beside" control lists the
highlights first (`✎ Highlight 1`, ...) and the paragraphs after (`¶ 1`, ...).
Anchoring to the mark is what makes the placement survive editing the passage.

### Two things worth knowing before you change anything

**Type size and column width are coupled.** The line breaks only match Canva at
1.41rem *and* 500px. Nudge either and lines start flipping.

**The leading and the paragraph break accumulated a 7px error** before they were
measured. Both are invisible in isolation and obvious when the page is laid over
Canva's, which is exactly why the marker looked "close but wrong" until the
paragraph gap was measured properly.

## Overflow behaviour

Deliberate: **overflow is hidden, never auto-shrunk.** A passage that runs long
loses its last lines at the foot, and the editor says how many ("⚠ 239px hidden
at the foot — about 7 lines cut off"). If losing those lines isn't acceptable,
**⤓ Fit to page** steps the text size down in 0.05rem increments until the
passage fits — opt-in, never automatic. **Reset** returns to 1.41rem.

Don't "fix" this by adding automatic shrinking. Jon's call was to be told and
decide, not to have the type quietly change size on him.

### The fit check watches three things, not one

The margin is its own column and overflows independently of the scripture, so a
check that only measures the text column reports "fits" while a note is half
hidden under the footer. The readout therefore warns on:

1. **Scripture past the foot** — text clipped at the bottom.
2. **A note past the foot** — the margin has run out. A note anchored to the
   last paragraph in particular has nowhere below it to go.
3. **Two notes overlapping** — anchoring two notes to the same or nearby
   paragraphs stacks them on top of each other unless the nudge separates them.

Two notes per page is the comfortable ceiling for a filled page; four only fits
on a short passage.

### One note block per highlight, not one note per thought

Corrected after building the first real page. The ceiling above is about **note
blocks**, not thoughts — and two thoughts belong in one block. Condense each
highlight's marginalia into a single note and **both highlights fit comfortably on
one page**; split them into separate blocks and the same content collides with the
foot and forces the passage across two pages, which is worse.

So: build one page, one note block per highlight, and only split the page when the
notes genuinely will not condense.

## Marginal notes

Each note anchors to a **highlight or a paragraph index**, with a pixel nudge. The
note's `top` is computed from the target's measured position, so notes stay beside
their verse when the text size changes or the passage is edited — they are not
stored as percentages of the column, which drifts the moment anything reflows.

Blank line in the scripture box = new paragraph. Wrap text in `<mark>…</mark>` for
the highlighter.

## Baseline

`python3 -m http.server` serves it exactly as Pages does; everything here also runs
from `file://` because nothing is fetched at runtime. Note that html2canvas cannot
read a canvas that has had a cross-origin image drawn to it, which is why the paper
texture is embedded as a data URI rather than referenced as a file.

## Pitfalls

| Symptom | Cause | Fix |
|---|---|---|
| Export is the wrong proportions (2706 × 3000 for a "1000 × 1000" page) | `#bible-page` is a flex child and shrank to its parent | `flex: 0 0 auto` on the element you capture |
| The **top** of the content is missing, not the bottom | Centred content overflows both ways | top-anchored layout (`flex-start`) |
| Page padding comes out 80px instead of 100px | A percentage padding resolves against the *preview pane*, not the page | Padding in px |
| The yellow highlight eats the descenders of the line above | The marker is painted on the `<mark>`, whose vertical padding overlaps the previous line | Draw the marker as a layer **behind** the text |
| The margin reads "fits" while a note sits under the footer | The fit check only measured the scripture column | Measure the margin too, and check for collisions |
| The readout goes stale after a note moves | The margin is redrawn without re-running the check | `checkFit()` at the end of `renderNotes()` |
| Lines land differently in the export than on screen | Webfonts weren't loaded when it rendered | `await document.fonts.ready` |
| The tool looks different in a tab you already had open | You're running a cached copy | Check the build stamp under the heading |

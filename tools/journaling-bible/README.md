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
| `index.html` | The whole tool — editor, page render, html2canvas export. No build step, no dependencies beyond two Google fonts and the html2canvas CDN script. |

## The page

A flat **1000 × 1000 px** square, exported at `scale: 3` → **3000 × 3000 PNG**,
which is the shape Substack and social want.

- Scripture column: `flex: 0 0 66%`, EB Garamond at 1.35rem default.
- Notes column: the remaining third, notes in Caveat at 1.6rem in ink blue.
- Footer band reserves the bottom ~130px for the reference line, with a paper
  gradient above it so clipped text fades out rather than running through it.

### Two things that are load-bearing

**`flex: 0 0 auto` on `#bible-page`.** The preview pane is a flex container, and
without this the page shrinks to fit the pane and the export stops being square.
The first version of this tool shipped a 2706 × 3000 export for exactly that
reason.

**`justify-content: safe center` on the page column.** Centres the content when
it fits, and falls back to top-anchored when it doesn't — which is what keeps a
too-long passage losing only its *foot*. Plain `center` clips the top and the
bottom equally, so the passage loses its opening.

## The design system, measured

These are not choices I made. They were sampled or solved out of Jon's nine published
Canva pages (all 1080 x 1080) after he confirmed the fonts. Everything below is
expressed for the tool's 1000px page, which is 0.926 of the Canva original.

| Thing | Value | How it was pinned |
|---|---|---|
| Scripture | Playfair Display, **1.41rem**, line-height **1.355** | Reproducing Canva's line breaks. 1.41rem in a 500px column matches **all 22 lines** of the 1 John 4:13-21 page. 1.44rem was 2 per cent too large and flipped 10 of them |
| Marginalia | Homemade Apple, **26.85px** (1.19 x scripture), line-height **1.52** | Two independent ways agreed: the size at which his notes break into the same lines, and the ratio of measured ink heights |
| Reference | Poppins **600**, **1.25rem**, centred on the page | Ink box for "1 John 4:18" measures 447-553 in both |
| Paper | background **#F0F1ED** plus his texture | Sampled; grain amplitude is only +-4 levels, so the tone does more work than the grain |
| Marker | **#FFF197**, padding **9px 5px**, margin **0 -5px** | Sampled colour; 9px vertical bleed and 5px horizontal from the measured band |
| Ink | **#004AAD** | Darkest decile of the blue strokes, not the antialiased mean |
| Margins | **100px** all round | Canva's 108/1080. Must be px, see pitfalls |
| Columns | scripture **62.5%** (500px), gutter **15px** | Canva text column 108-646, notes start 662 of 1080 |
| Pairs | same passage, different highlight | Already published as 1 John 4:18 (a) and (b) |

### Notes anchor to highlights, not paragraphs

A note belongs beside its **highlight**, so each note's "Beside" control lists the
highlights first (`M1`, `M2`, ...) and the paragraphs after (`P1`, `P2`, ...). Anchoring
to the mark is what makes the placement survive editing the passage.

### Two things worth knowing before you change anything

**The marker's padding is layout-neutral on purpose.** Horizontal padding of 5px with an
equal negative margin means the marker bleeds past the text without moving a single line
break. Change one without the other and the text reflows.

**Type size and column width are coupled.** The line breaks only match Canva at 1.41rem
*and* 500px. Nudge either and lines start flipping.

## Overflow behaviour

Deliberate: **overflow is hidden, never auto-shrunk.** A passage that runs long
loses its last lines at the foot, and the editor says how many ("⚠ 239px hidden
at the foot — about 7 lines cut off"). If losing those lines isn't acceptable,
**⤓ Fit to page** steps the text size down in 0.05rem increments until the
passage fits — opt-in, never automatic. **Reset** returns to 1.35rem.

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

Each note anchors to a **paragraph index**, with a pixel nudge. The note's `top`
is computed from the target paragraph's measured position, so notes stay beside
their verse when the text size changes or the passage is edited — they are not
stored as percentages of the column, which drifts the moment anything reflows.

Blank line in the scripture box = new paragraph. Wrap text in `<mark>…</mark>`
for the highlighter wash.

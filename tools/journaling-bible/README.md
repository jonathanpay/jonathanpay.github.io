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

## Overflow behaviour

Deliberate: **overflow is hidden, never auto-shrunk.** A passage that runs long
loses its last lines at the foot, and the editor says how many ("⚠ 239px hidden
at the foot — about 7 lines cut off"). If losing those lines isn't acceptable,
**⤓ Fit to page** steps the text size down in 0.05rem increments until the
passage fits — opt-in, never automatic. **Reset** returns to 1.35rem.

Don't "fix" this by adding automatic shrinking. Jon's call was to be told and
decide, not to have the type quietly change size on him.

## Marginal notes

Each note anchors to a **paragraph index**, with a pixel nudge. The note's `top`
is computed from the target paragraph's measured position, so notes stay beside
their verse when the text size changes or the passage is edited — they are not
stored as percentages of the column, which drifts the moment anything reflows.

Blank line in the scripture box = new paragraph. Wrap text in `<mark>…</mark>`
for the highlighter wash.

# Delve Table

An unofficial delve generator and map tool for *Coriolis: The Great Dark*. Opened at
`/tools/ctgd-delve/`. Plain HTML, CSS and JavaScript, no build step, no dependencies
beyond Google Fonts and one shared script for the campaign. Everything runs and is
saved in the browser.

It sits beside the Voyage Chart Table (`/tools/ctgd-voyage/`) and the Great Dark Sheets
(`/tools/ctgd-sheets/`), and shares their campaign.

Not affiliated with, sponsored or endorsed by Free League Publishing (Fria Ligan AB).
*Coriolis: The Great Dark* and its names are theirs.

This is the first stage of the tool: **Ruin**, **Map** and **Data**. Running the descent
(supply, hazards, the log) and camp and finds come later, on further tabs.

## What's in the page, and what isn't

The same split as the other Great Dark tools. The page carries dice and numbers: every
dice expression, every D66 and D6 range, the counts that hang off each band, the order
of the chain and which result picks which column. Nothing else from the books ships with
it. Every name and description comes from a **data file** you write and keep yourself,
imported on the Data tab. It is stored in that browser's localStorage and never uploaded.

The page owns every range; the file only names results, **by row position**: row 1 of a
table is its first range, row 2 its second, and so on. So a file never needs to repeat
the dice.

Without a data file the whole ruin still rolls and every result reads as its table id
and rolled number (for example `ruin.era · 23`). With one, each result is named. A file
may cover only some tables; the Data tab lists what each table has, and the rest fall
back to ids and numbers.

## Tabs

- **Ruin.** The generator chain, in order: era; purpose (the column follows the era);
  fate (the last fate result chains a second purpose and fate); type (one result rolls
  twice and combines); depth band, which sets markers deep, entrances and key
  locations by dice; a defining glyph and quirks; a shape and function for each key
  location; the discovery band, which sets shards at each key location (never below 0)
  and the lesser and major artefact counts; the Blight band, which sets Blight levels,
  cores and oases; a threat; and, if you want one, another party. Every result can be
  **rerolled**, **picked by hand** or **locked**; "Roll everything unlocked" respects
  the locks. Counted numbers can be edited, rerolled and locked too.
  The **delve class** is an estimate mapped from the Blight band (I to IV). The book
  gives no numeric rule for classes, so the page says so and lets you change it.
  How many quirks to roll is your choice (default 2).
- **Map.** The structure is painted on a grid, one cell to a marker, with the surface as row 0
  and each row down one marker deeper. Paint with **Dig**, **Hidden** and **Blocked**
  brushes (sizes 1 to 5, optional left-right mirror), erase (or right-click), and undo. Then
  put **points** on it: entrances, numbered key locations (taken from the ruin, with their
  shape and shards), Blight cores, oases and free notes, and paint **Blight levels** and
  **read** areas onto the cells. **Generate from ruin** carves a structure to start from:
  entrances at the surface at different distances from the first key locations, key
  locations 4–8 markers apart by passage, a second route round most of them, dead ends
  reaching the bottom so there is no obvious end point, some passages hidden or blocked
  (the first route to every key location is always open), and Blight by depth within the
  band's range. Points can be dragged; **Save image** writes a PNG. The panel shows the
  distance in markers from a point to the **nearest known exit** (an entrance marked
  known, along open passages), which the hazard roll uses.
  Two views come from one map. **GM view** shows everything. **Deep scan** is drawn as a
  player handout (amber on black, lettered and numbered grid, outlined passages, hexagon
  Blight badges, scanlines, interference below the deepest cell reached) and shows only
  the passages joined to an entrance by open cells, with Blight levels, cores and oases
  only where you have marked cells read (a dim ? marks a key location not yet read).
  The map saves with the delve. Maps from the first, zone-graph version are not carried over.
- **Data.** Import or remove the data file, download a template, see which tables the
  file covers, and back up or restore all your delves.

## Saving, backup and sending to the campaign

Delves save to this browser as you work (`ctgd-delve-v1`). **Export delve** and **Back up
all delves** download JSON in format `ctgd-delve-backup/1`; restoring checks the whole
file first, adds the delves to the ones you have, gives them new ids and leaves your
data file alone. **Send to the campaign** writes the delve as a `site` in
`ctgd-campaign-v1` (shared with the Sheets): its labels, key locations and a compact
copy of the map. The fields match the Sheets' Delve type, so it can be read there.

## The data file

Format `ctgd-delve-data/1`. Unknown fields and unknown table ids are ignored; strings
are capped; wrong formats are refused with a message. A sample with invented words is in
`data/sample.json`, and **Download template** writes a skeleton to start from.

| Table id | Rows (by position) | Row fields |
|---|---|---|
| `ruin.era` | 3 | `n`, `d` |
| `ruin.purpose` | 9 | `v: { early, middle, late }` |
| `ruin.fate` | 9 | `n` |
| `ruin.type` | 5 | `n` |
| `ruin.depth` | 4 | `n`, `d` |
| `theme.glyph` | 12 | `n`, `d` |
| `theme.quirk` | 36, in D66 order | `n` |
| `loc.shape` | 12 | `n` (shape), `f` (function) |
| `find.band` | 4 | `n`, `d` |
| `blight.band` | 4 | `n`, `d` |
| `threat.kind` | 5 | `n` |
| `party.kind` | 6 | `n` |
| `delve.class` | 4 | `n`, `d` |

The file may also carry `hazards`, `supplyIncidents`, `outOfSupply` and `artifacts`; the
page keeps them for the Descent and Camp tabs but does not use them yet.

**Real data files must not be committed.** `*.private.json` and `/private/` are
git-ignored, and a test fails if any tracked JSON under `tools/` other than a file called
`sample.json` declares a `ctgd-*` format.

## Files

- `index.html`, `app.js`, `delve.css`: the page.
- `model.js`: dice, ranges, the chain, the map generator and graph logic, validation. No
  DOM, so it is tested directly in `tests/ctgd-delve.test.mjs`.
- `data/sample.json`: invented-words sample data.
- `/tools/ctgd-campaign.js`: the shared campaign store.

## Storage keys

`ctgd-delve-v1` (delves and the open tab), `ctgd-delve-data-v1` (your data file),
`ctgd-campaign-v1`. The voyage tool's `gd-*` keys are not touched.

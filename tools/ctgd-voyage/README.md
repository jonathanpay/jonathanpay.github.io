# Voyage Chart Table

An unofficial voyage planner and tracker for *Coriolis: The Great Dark*. Opened at
`/tools/ctgd-voyage/`. One self-contained HTML file, no build step, no
dependencies beyond Google Fonts. Everything runs and is saved in the browser.

Not affiliated with, sponsored or endorsed by Free League Publishing (Fria Ligan AB).
*Coriolis: The Great Dark* and its names are theirs.

## What's in the page, and what isn't

The page ships with no rules text, tables, art or setting text from the books. It
carries place and ship names, the league distances from the Charted Sphere map,
section references (for example "core rules 11.3"), and my own redrawings of the
two maps. Everything else comes from a **data file** you write and keep yourself,
imported on the Data tab. It is stored in that browser and never uploaded.

Without a data file the page still plots routes, rolls every die, names the table
column to read and points you to the section. With one, it shows the results and
rolls their effects as you plan.

## Tabs

- **The Charted Sphere.** A schematic of the streams with league distances, trade
  routes, tributaries and named features. Pick two systems for the shortest route by
  leagues, with weeks per leg at Greatship (4) or Cruiser (3) speed. Systems with a
  chart in your data file show an orbital strip and a flat-space travel calculator.
  The card beside the map runs the voyage at the table: entry roll, each week's
  hazard column, exit roll, Hull, Morale and a log. Each week's plan is shown with
  the numbers filled in.
- **Voyages.** A week-by-week schedule for each voyage: entry, every week and exit
  of every leg. Each week has a hazard, a voyage event and a crew duty, which can be
  rolled or chosen, singly or in bulk. Bulk rolls fill empty slots only. A rolled
  event that's already been used moves to the next unused one. A projection gives
  Hull and Morale on arrival and flags the week Morale or Hull first hits 0, with
  switches for en-route repairs and weekly festivities.
- **Fleet.** Every Greatship and Slipstream Cruiser named in the core rules, by
  status. Stats come from the data file, or from your own edits, which are saved
  locally and used for new voyages.
- **The Lost Horizon.** A schematic of the wider map with a reconstructed key. The
  scallop (inhabited) and the hexagon (designated: goal, hazard, exclusion) are my
  readings, not the book's. Notes per place are saved locally.
- **Data.** Import or remove the data file. Export and restore a backup of voyages,
  ship edits and notes.

## Storage

Everything lives in `localStorage`. Keys are `gd-db` (voyages, fleet edits, notes),
`gd-data` (the data file) and a few `gd-*` view settings. A backup is a JSON file
with `"format": "voyage-chart-table-backup/1"`. Restoring merges it in, and the
backup's copy wins where both have the same voyage.

The page also runs as a Claude artifact, where it uses the artifact's shared store
instead of `localStorage`. The storage code checks for `window.claude` first.

## The data file

JSON with `"format": "voyage-chart-table-data/1"`. Every field is optional.

| Field | Shape | Used for |
|---|---|---|
| `name`, `created`, `note` | strings | Shown on the Data tab |
| `haz` | 5 columns (Entry/Exit, 1–3, 4–6, 7–9, 10+ weeks) × 6 rows of `[name, summary, effect]` | Hazard results |
| `duties` | 6 × `[name, summary]` | Crew duties |
| `events` | `{ key: { name, src, sp?, note?, list: [{ lo, hi, n, d, fx?, fxNote? }] } }` | D66 voyage event tables (`lo`–`hi` is the roll range) |
| `mutiny` | `{ n, d }` | The special event at Morale 0 |
| `sys`, `points`, `features`, `lh` | `{ id: note }` (`sys` takes `{ id: { note } }`) | Notes on places, by the ids in the page |
| `addSys`, `addFeatures`, `edges`, `tribs` | same shapes as the page's own arrays | Extra systems, features and streams (mark spoilers with `sp: true`) |
| `orbits` | `{ systemId: { star, src, items: [[name, AD, kind, drawAt?]] } }` | System charts; `kind` is `portal`, `planet`, `giant`, `station`, `lighthouse`, `field` or `trib` |
| `fleet` | `{ shipId: { hull, flat, slip, crew, morale, gp, captain, launched, route, upg: [], note, src, status?, sp? } }` | Ship stats and notes |
| `legNotes` | `{ systemId: text }` | A note shown on any leg that ends there |
| `voyages` | array of voyage objects as the page saves them | Example voyages, added on import if their ids are new |
| `hasSpoilers` | `true` | Shows the spoilers switch under the map |

An effect (`fx`) is `{ hull, morale, weeks, feature }`. Numbers are fixed; strings
like `"D6"`, `"-D3"`, `"+D6"` or `"D6+1"` are rolled when the slot is planned.
`hull: "D6"` means Hull −D6. `feature: true` knocks out a random entry from the
ship's upgrades list.

## Ships from your Sheets

When the Great Dark Sheets (`/tools/ctgd-sheets/`) have shared a Ship sheet to the campaign,
the New voyage form offers it under "Ships from your sheets". Choosing one fills the name,
Hull, Morale, Slipstream speed and upgrades from the sheet (Hull and Morale are the sheet's
maxima). The voyage tool only reads the campaign; it never writes to it.

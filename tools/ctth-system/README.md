# System

An unofficial system chart and world generator for *Coriolis: The Third Horizon*.
Opened at `/tools/ctth-system/`. One self-contained HTML file, no build step, no
dependencies beyond Google Fonts and one shared script for the Horizon itself.
Everything runs and is saved in the browser.

It is one of a pair. **Mission Board** at `/tools/ctth-mission/` posts the jobs and
rolls the trip between systems; this page charts the systems and rolls the worlds. The
two share one log, one campaign and one data file, so a world rolled here is the far end
of a job posted there.

Not affiliated with, sponsored or endorsed by Free League Publishing (Fria Ligan AB).
*Coriolis: The Third Horizon* and its names are theirs.

## What's in the page, and what isn't

The same split as the Voyage Chart Table and the Mission Board. The page carries dice,
table numbers and the numbers that drive the world generator: its table ids, and the
modifiers that chain through a roll, since atmosphere moves temperature and geosphere,
temperature moves geosphere, size moves population (small worlds can only be toxic or
thin) and population moves the spaceport.

The Horizon itself lives in `/tools/ctth-horizon.js` and is shared with the Mission
tool: the portal map drawn in the printed map's colours, the portal links and the
dangerous areas, the unstable portals, each system's star type, its planet count per
star (with asteroid belts and gas giants), the kind of space, the major spaceports, and
the orbital distances from the published system charts. It also builds the merged
system list, so a system's portal bodies and its portal station look the same on both
pages. This page loads that script before its own and checks for it: if it fails to
load, the page says so rather than drawing a broken map.

It carries no table text. Sizes, atmospheres, geospheres, populations, spaceports,
hooks, factions and the systems your Horizon adds come from a **data file** you write
and keep yourself, imported on the Data tab. It is stored in that browser and never
uploaded, and the Mission tool reads the same file.

Without a data file every line still rolls, chains its modifiers and tells you which
table and result to read.

## Tabs

- **Systems.** The Third Horizon's portal map, drawn as the Mission tool draws it: gold
  links, an orange glow round each star, red etching on the unstable portals, companion
  stars as small dots, dust and nebulae behind, in both themes. Click a system, or pick
  one from the list, and the panel under the map reads it: its region and the kind of
  space, chips for a core system, a major spaceport, a dangerous area or unstable
  portals, then a chart in the Great Dark's manner with the star at its class and one row
  per companion, its bodies with their distances in AD and the star they orbit, and its
  portal links with their distances and any danger or instability on them. A system the
  books don't chart is sketched from its planet count, with no positions, and the panel
  says so; roll a world for it on the Worlds tab or give it bodies in your data file. A
  system saved to the campaign or written in Coriolis Sheets joins the list with its
  bodies, and the panel marks it as coming from the campaign. "Refresh the list" rebuilds
  everything from the data file, your own list and the campaign without a reload.
- **Worlds.** The system generator: planets, gas giants and asteroid belts.
  Atmosphere moves temperature and geosphere, temperature moves geosphere, size moves
  population (small worlds can only be toxic or thin), population moves the
  spaceport. Rerolling or picking a line reworks everything below it. Hooks and
  factions are rolled separately. A small sketch shows the body. The system list is
  filled from the map, your data file, your own list and the campaign, so a world can be
  rolled for any of them.
- **Log.** The worlds you save, with their tables, their hooks, their factions, a status,
  notes and a Markdown copy for your campaign notes. The log is one array shared with the
  Mission tool, which owns the jobs and the voyages; this page shows and writes only the
  world entries and leaves the rest as it finds them.
- **Data.** Import or remove the data file, add the rest of your Horizon's systems one
  per line (with bodies and their distances after a colon), and export or restore this
  page's backup.

## Storage

Everything lives in `localStorage` under the `mb-*` keys, which the Mission tool reads
and writes too: `mb-data` (the data file), `mb-systems` (your systems list, edited
here), `mb-world` (the world you last rolled), `mb-log` (one array, of which this page
owns the world entries) and the board, the voyage and the deck, which this page only
reads around. No key is renamed and neither page keeps a copy of the other's.

A backup is a JSON file with `"format": "ctth-system-backup/1"`, holding the world, your
systems list and the world log entries. Restoring adds the backup's world entries to
your log and replaces the world and the systems list. The board, the voyage, the deck
and the job and voyage log entries are left exactly as they are. A file from the older
single-page tool (`mission-board-backup/1`) still restores its world and its systems
list.

The one exception to `mb-*` is the campaign below, which lives under `ctth-campaign-v1`.

## The campaign

The Coriolis tools on this site share one campaign: this page, the Mission Board,
Coriolis Sheets and Icon Spreads run on the same origin and keep their entities under
one key, `ctth-campaign-v1`, read through `/tools/ctth-campaign.js`. This page loads
that script before its own and checks for it at every hand-off, so the page works as
before without it.

One hand-off runs from here:

- **A world to a system sheet.** "Save to the campaign" on the Worlds tab writes the world
  as a body of a campaign system, with size, atmosphere, temperature, geosphere,
  population, spaceport, hooks and factions as they read here. A campaign system of the
  same name takes the body rather than a second copy of it. The system then joins this
  page's list at once, bodies and all, and shows in Coriolis Sheets.

Systems in the campaign join the Systems tab and the world generator's system list, so
a system drawn in the sheets can be charted and rolled for here. They are read only:
nothing is written back to `mb-systems`, and your data file and systems list are
untouched.

Nothing leaves the browser. The campaign sits in `localStorage` beside the `mb-*` keys, so
a campaign belongs to a browser rather than an account, and clearing the site's storage
clears it with everything else.

## The data file

JSON with `"format": "mission-board-data/1"`. Every field is optional. The Mission tool
reads the same file, and the mission and travel tables in it belong to that page.

| Field | Shape | Used for |
|---|---|---|
| `name`, `created`, `note` | strings | Shown on the Data tab |
| `tables` | `{ id: { rows: [{ lo, hi, n, d? }] } }` | The world tables, by the ids below |
| `systems` | `[{ id?, n, portal?, portalStation?, bodies?: [[name, AD?, kind?, star?]], known?: [], exports?, imports?, note? }]` | Bodies, distances and notes for the 36 map systems (shown on the chart), or extra systems (off the map, so no portal links) |

Row flags: `count` on a Table 16 row is the number of factions (a number, or dice like
`"D6"`). Rolls below the first row or above the last are read as the first or last row,
so modified rolls need no extra rows.

World table ids: `w.size`, `w.gasSize`, `w.gasColour`, `w.gasTemp`, `w.gasChar`,
`w.beltSize`, `w.beltComp`, `w.beltChar`, `w.orbit`, `w.atmosphere`, `w.temperature`,
`w.geosphere`, `w.population`, `w.spaceport`, `w.hook`, `w.factionCount`, `w.faction`.
The Data tab lists any of them your file leaves out. The mission and travel tables are
described in the Mission Board's README.

# Mission Board

An unofficial mission and travel generator for *Coriolis: The Third Horizon*. Opened at
`/tools/ctth-mission/`. One self-contained HTML file, no build step, no dependencies
beyond Google Fonts and one shared script for the Horizon itself. Everything runs and
is saved in the browser.

It is one of a pair. **System** at `/tools/ctth-system/` charts the systems and rolls
the worlds; this page posts the jobs and rolls the trip between them. The two share one
log, one campaign and one data file, so the job and the world at the end of it belong
to the same campaign.

Not affiliated with, sponsored or endorsed by Free League Publishing (Fria Ligan AB).
*Coriolis: The Third Horizon* and its names are theirs.

## What's in the page, and what isn't

The same split as the Voyage Chart Table. The page carries dice, table numbers and the
numbers that drive the mechanics: the mission type table, encounter rates by zone,
reaction and jump modifiers, Darkness Point rates, service costs, and the ids of the
mission and travel tables.

The Horizon itself lives in `/tools/ctth-horizon.js` and is shared with the System
tool: the portal map drawn in the printed map's colours, the portal links and the
dangerous areas, the unstable portals, each system's star type and planet count per
star (with asteroid belts and gas giants), the kind of space and which systems have a
major spaceport, my own redrawing of the map, the zones of Table 46, and the orbital
distances from the published system charts: Kua, Altai, Ordana and Yuisin, Sivas, Zhau
A to C, Sadaal and Bahram, Zalos and Zahedan, Mira, Antmira and Menau, Odacon, Dabaran,
Algol and Rhaas, Hamura, and Uharu with Zuhal. Where a chart gives the distance between
a system's stars, that is there too. This page loads that script before its own and
checks for it at every use: if it fails to load, the page says so rather than drawing a
broken map.

Systems the books don't chart are drawn as a sketch from the planet count, with no
positions, and their flights' encounter column follows the kind of space (border reads
as fringe, observandum as uncharted). It carries no table text. Employers, missions,
locations, complications, rewards, encounters, misfortunes and so on come from a
**data file** you write and keep yourself, imported on the Data tab. It is stored in
that browser and never uploaded.

Without a data file every line still rolls, chains its modifiers and tells you which
table and result to read.

## Tabs

- **Board.** Pick the crew's concept (agents, mercenaries, explorers, the three kinds
  of pilgrim, free traders) and where they are, then post jobs. Each job rolls Table 18
  for difficulty, destination, base pay, complications and extra rewards, then the
  concept's employer, task, location, complication and reward tables. A Birr reward
  rolls its bonus by difficulty. Any line can be rerolled or picked by hand. Nearby
  jobs go to a system one jump away on the map, faraway jobs to one two or three jumps
  away, and the card shows the route with any unstable portals or dangerous area on it.
  Every system has a portal station at 0.5 AD beside its portals. Print names only a
  few (Khôban at Odacon, Hamurabi at Hamura); the rest are called "<system> portal
  station" until you name them.
  Unstable portals belong to a system (Dziban, Zamusa, Yastapol and Algebar, from the printed map's labels, and Odacon,
  whose two portals the core rulebook calls unstable), which
  the map rings in red; companion stars show as small dots beside their system.
  The map above the board shows the crew and the jobs; click a system to move the crew.
  The map is drawn in the printed map's colours in both themes: gold links, an orange
  glow round each star, dust and nebulae behind. Under it, the crew's system has
  a chart in the Great Dark's manner: the star with its portals, then each body along
  the line at its distance (spaced by square root so the inner system stays legible),
  with companion stars on rows of their own. An Icon card can be drawn for each job as an omen, from a
  shuffled deck that remembers what's been drawn. Pilgrims have no location table of
  their own, so they borrow the agents' (Table 22), as the book's own example does.
- **Travel.** A voyage as a list of legs: in-system flights, portal jumps and
  planetside stretches. Accepting a job, or plotting a route between any two systems,
  lays the trip out along the fewest jumps (avoiding unstable portals and dangerous areas when there's a
  tie), with a day's transit through each system on the way. Legs in the map's
  dangerous areas default to the fringe encounter column, and the darkness route is
  set to well-trafficked only between core systems. Every map system has a portal
  body for each of its links, so flights run from the named portal; each flight shows
  the system chart with its two ends lit. A flight between bodies of different stars
  asks for the distance between the stars, which the charts don't give. Unstable portals are flagged; how
  much harder they make the jump is left to your table. Flights take
  AD ÷ speed days and split their time across the zones in Table 46, measured from the
  portal; the encounter count follows the book's rates, capped at a number you choose.
  Each encounter rolls Table 48 in the column you pick, a reaction with the zone's
  modifier, and Table 49 when the Dark between the Stars turns up. Jumps roll the
  pilot's dice with the method and blessing modifiers, and Table 7.2 on a failure
  (+1 to the tens die when jumping blind). Planetside legs roll a land misfortune and
  Table 50 encounters with the city, countryside or wilderness modifier. The summary
  gives total time, distance, jumps, Darkness Points and the service bill.
  A cursed ship takes −1 on jumps and counts darkness one level worse; antimatter
  rockets double the service bill. The service can be rolled at the port's modifier
  (no −3 with a service station aboard): a failure costs half and rolls ship wear
  (Table 7.12). Crew
  misfortunes roll Table 44 for the position and a d6 for the misfortune, and name the
  PC in that seat if you list your crew.
- **Log.** Accepted jobs and saved voyages, with a status, notes and a Markdown copy for
  your campaign notes. The log is one array shared with the System tool, which owns the
  world entries; this page shows and writes only its own two kinds and leaves the rest
  as it finds them.
- **Data.** Import or remove the data file, and export or restore this page's backup.
  The list of extra systems is edited in the System tool, since the systems are what
  that page is for.

## Storage

Everything lives in `localStorage` under the `mb-*` keys, which the System tool reads
and writes too: `mb-data` (the data file), `mb-systems` (your systems list, read here
and edited there), `mb-board`, `mb-voyage`, `mb-world` (the System tool's), `mb-log`,
`mb-deck`, `mb-vset` and a few more view settings. This page owns the board, the
voyage, the deck and its half of the log. No key is renamed and neither page keeps a
copy of the other's.

A backup is a JSON file with `"format": "mission-board-backup/2"`, holding the board,
the voyage, the deck and the job and voyage log entries. Restoring adds the backup's
log entries to yours and replaces the board, the voyage and the deck. The world, the
systems list and the world log entries are left exactly as they are. A file from the
older single-page tool (`mission-board-backup/1`) still restores its jobs and its trip,
but its world and its systems list are not written back.

The one exception to `mb-*` is the campaign below, which lives under `ctth-campaign-v1`.

## The campaign

The Coriolis tools on this site share one campaign: this board, Coriolis Sheets and
Icon Spreads run on the same origin and keep their entities under one key,
`ctth-campaign-v1`, read through `/tools/ctth-campaign.js`. This page loads that script
before its own and checks for it at every hand-off, so the page works as before
without it.

Two hand-offs run from here:

- **A job to a mission sheet.** "Send to the campaign" in a job's foot writes the job as a
  mission: concept, employer, task, location, destination, jumps, type, base pay, total
  reward and complications, taken from the same rolls the card shows. The card then carries
  an "In the campaign" chip and a link to the sheets, and the button reads "Update the
  campaign" for a job changed here afterwards.
- **A ship from a sheet.** When Coriolis Sheets holds a ship, the Travel tab shows a "Ship
  from the campaign" list at the top of the ship card. Picking one sets the voyage's speed
  from the ship's own and fills the crew positions from its stations, and a note under the
  list gives the ship's hull and energy. Every other line stays yours to change.

Systems in the campaign also join this page's system lists, so a system drawn in the sheets,
or a world saved in the System tool, can be a job's destination or a leg of the voyage.
They are read only: nothing is written back to `mb-systems`, and your data file and
systems list are untouched.

Nothing leaves the browser. The campaign sits in `localStorage` beside the `mb-*` keys, so
a campaign belongs to a browser rather than an account, and clearing the site's storage
clears it with everything else.

## The data file

JSON with `"format": "mission-board-data/1"`. Every field is optional. The System tool
reads the same file, and the world tables in it belong to that page.

| Field | Shape | Used for |
|---|---|---|
| `name`, `created`, `note` | strings | Shown on the Data tab |
| `tables` | `{ id: { rows: [{ lo, hi, n, d? }] } }` | Every table, by the ids below. `lo`–`hi` is the roll range, `n` the result, `d` a short description |
| `rewards` | `{ rewardName: text }` | Notes shown under a reward, keyed by its `n` |
| `misfortunes` | `{ captain, sensor, gunner, engineer, pilot, group: [[name, text] × 6] }` | Crew misfortunes by position |
| `development` | `[[name, text]]` | Development actions listed on the Travel tab |
| `cards` | `{ "11": title, … "66": title }` | Icon card titles |
| `systems` | `[{ id?, n, portal?, portalStation?, bodies?: [[name, AD?, kind?, star?]], known?: [], exports?, imports?, note? }]` | Bodies, distances and notes for the 36 map systems (shown on the system chart), or extra systems (off the map, so jumps are set by hand) |

Row flags: `birr: true` on a reward row rolls the Birr bonus; `dark: true` on an
encounter row rolls Table 49; `count` on a Table 16 row is the number of factions
(a number, or dice like `"D6"`). Rolls below the first row or above the last are read
as the first or last row, so modified rolls need no extra rows.

Table ids: `employer.*`, `task.*`, `location.*`, `complication.*` and `reward.*` for
each of `agents`, `mercenaries`, `explorers`, `pilgrims`, `entertainers`, `nomads` and
`traders` (pilgrims, entertainers and nomads have no `location.*`; traders' `task` is
Goods and `location` is Destination). Travel: `land.misfortune`, `reaction`,
`space.faction`, `space.civilized`, `space.fringe`, `space.uncharted`, `dark`,
`planet.city`, `planet.countryside`, `planet.wilderness`, `jump.fail`, `ship.wear`.
The world tables (`w.*`) are described in the System tool's README and are read there.
The Data tab lists any tables your file leaves out.

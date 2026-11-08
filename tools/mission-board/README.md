# Mission Board

An unofficial mission and travel generator for *Coriolis: The Third Horizon*. Opened at
`/tools/mission-board/`. One self-contained HTML file, no build step, no dependencies
beyond Google Fonts. Everything runs and is saved in the browser.

Not affiliated with, sponsored or endorsed by Free League Publishing (Fria Ligan AB).
*Coriolis: The Third Horizon* and its names are theirs.

## What's in the page, and what isn't

The same split as the Voyage Chart Table. The page carries dice, table numbers, the
numbers that drive the mechanics (the mission type table, encounter rates by zone,
reaction and jump modifiers, Darkness Point rates, service costs, the system
generator's modifiers), system and planet names, the Kua system's orbital
distances, my own redrawing of the Third Horizon's portal map, and orbital distances
from the published system charts: Kua, Altai, Ordana and Yuisin, Sivas, Zhau A to C,
Sadaal and Bahram, Zalos and Zahedan, Mira, Antmira and Menau, Odacon, Dabaran,
Algol and Rhaas, Hamura, and Uharu with Zuhal. Where a chart gives the distance
between a system's stars, the page carries that too. From the Horizon map it takes
each system's star type, its planet count per star (with asteroid belts and gas
giants), the kind of space and whether it has a major spaceport. Systems the books
don't chart are drawn as a sketch from that count, with no positions, and their
flights' encounter column follows the kind of space (border reads as fringe,
observandum as uncharted). It carries no table text. Employers, missions, locations, complications,
rewards, encounters, misfortunes and so on come from a **data file** you write and
keep yourself, imported on the Data tab. It is stored in that browser and never
uploaded.

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
  Unstable portals belong to a system (Dziban, Zamusa, Yastapol and Algebar), which
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
  gives total time, distance, jumps, Darkness Points and the service bill. Crew
  misfortunes roll Table 44 for the position and a d6 for the misfortune, and name the
  PC in that seat if you list your crew.
- **Worlds.** The system generator: planets, gas giants and asteroid belts.
  Atmosphere moves temperature and geosphere, temperature moves geosphere, size moves
  population (small worlds can only be toxic or thin), population moves the
  spaceport. Rerolling or picking a line reworks everything below it. Hooks and
  factions are rolled separately. A small sketch shows the body.
- **Log.** Accepted jobs, saved voyages and worlds, with a status, notes and a
  Markdown copy for your campaign notes.
- **Data.** Import or remove the data file, add the rest of your Horizon's systems,
  and export or restore a backup.

## Storage

Everything lives in `localStorage` under `mb-*` keys: `mb-data` (the data file),
`mb-board`, `mb-voyage`, `mb-world`, `mb-log`, `mb-deck`, `mb-systems` and a few view
settings. A backup is a JSON file with `"format": "mission-board-backup/1"`. Restoring
adds the backup's log entries to yours and replaces the board, voyage and world.

## The data file

JSON with `"format": "mission-board-data/1"`. Every field is optional.

| Field | Shape | Used for |
|---|---|---|
| `name`, `created`, `note` | strings | Shown on the Data tab |
| `tables` | `{ id: { rows: [{ lo, hi, n, d? }] } }` | Every table, by the ids below. `lo`–`hi` is the roll range, `n` the result, `d` a short description |
| `rewards` | `{ rewardName: text }` | Notes shown under a reward, keyed by its `n` |
| `misfortunes` | `{ captain, sensor, gunner, engineer, pilot, group: [[name, text] × 6] }` | Crew misfortunes by position |
| `development` | `[[name, text]]` | Development actions listed on the Travel tab |
| `cards` | `{ "11": title, … "66": title }` | Icon card titles |
| `systems` | `[{ id?, n, portal?, bodies?: [[name, AD?, kind?, star?]], known?: [], exports?, imports?, note? }]` | Bodies, distances and notes for the 36 map systems (shown on the system chart), or extra systems (off the map, so jumps are set by hand) |

Row flags: `birr: true` on a reward row rolls the Birr bonus; `dark: true` on an
encounter row rolls Table 49; `count` on a Table 16 row is the number of factions
(a number, or dice like `"D6"`). Rolls below the first row or above the last are read
as the first or last row, so modified rolls need no extra rows.

Table ids: `employer.*`, `task.*`, `location.*`, `complication.*` and `reward.*` for
each of `agents`, `mercenaries`, `explorers`, `pilgrims`, `entertainers`, `nomads` and
`traders` (pilgrims, entertainers and nomads have no `location.*`; traders' `task` is
Goods and `location` is Destination). Travel: `land.misfortune`, `reaction`,
`space.faction`, `space.civilized`, `space.fringe`, `space.uncharted`, `dark`,
`planet.city`, `planet.countryside`, `planet.wilderness`, `jump.fail`. Worlds:
`w.size`, `w.gasSize`, `w.gasColour`, `w.gasTemp`, `w.gasChar`, `w.beltSize`,
`w.beltComp`, `w.beltChar`, `w.orbit`, `w.atmosphere`, `w.temperature`, `w.geosphere`,
`w.population`, `w.spaceport`, `w.hook`, `w.factionCount`, `w.faction`. The Data tab
lists any your file leaves out.

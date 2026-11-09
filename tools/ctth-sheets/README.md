# Coriolis Sheets

An unofficial sheet editor for **Coriolis: The Third Horizon**, at
`/tools/ctth-sheets/`. Plain HTML, CSS and JavaScript modules; no build step or
new runtime dependencies. Uses the typography, colours, light/dark themes and site
navigation of Mission Board and Icon Readings.

## Sheets

- **Character:** both reference PDF pages, including attributes, calculated hit/mind
  point maxima, trauma taken, all 16 skills, relationships and buddies, talents,
  weapons, reloads, gear, armour, radiation, experience, cabin and personal notes.
- **Spaceship:** registry, debt, ship data, energy/hull points, critical damage,
  crew stations, modules and disabled flags, weapons, features, cargo and ship log.
  Seventeen model presets create a new editable ship, keeping the original.
- **System:** a system registry, orbital sketch and four initial bodies. Each body
  can be a planet, gas giant or asteroid belt. Distances in AD are entered by hand;
  the sketch uses a square-root scale and does not invent orbital distances.
- **Mission:** four initial missions, with destination, employer, reward,
  information and complications. Select one of seven group concepts for generation.
- **NPC:** three initial NPCs, including attributes, derived hit/stress maxima,
  skills, talents, equipment and weapons. Eleven archetypes use Table 15.1.
  Loading an archetype fills a blank NPC or appends a new entry if that NPC is edited.

System, mission and NPC entries can be added/removed. Repeating inventory/crew/log
rows can also be added/removed. Character and NPC trauma fields record **points
taken**; derived maxima are shown separately. Ship energy/hull values are editable.
Presets fill model statistics, module loadouts and features; weapon attack profiles
are left editable, since the supplied weapon table's damage columns did not survive
its Markdown export. Archetypes supply statistics, not invented names or equipment.

## Saving, importing and printing

Edits save to `localStorage` in the current browser and origin. They are not sent to
a server or shared between visitors. Private browsing and storage quotas can prevent
saving: the status message reports failure and JSON exports still work. Back up
before clearing browser data. Development and production origins have separate saves.

**Export sheet** downloads the open sheet. **Back up archive** downloads every
sheet. **Import sheets** validates an entire backup before adding anything; it
keeps existing sheets and gives imported sheets new IDs. The format is
`coriolis-sheets-backup/1`, with a `sheets` array. Backups do not include imported
generation tables; retain the table pack separately.

**Print / Save PDF** prints the open sheet, using white backgrounds and black ink in
both themes. Inputs become wrapping text, so long notes are not clipped. The
layout uses A4 landscape: four single-column cards across for systems and
missions, and three across for NPCs. Each record reads down the page, with writing
space beneath short entries. Long entries may need extra pages. Wide desktop
windows also use these columns; smaller screens stack them for readability.
Choose A4 landscape and disable your browser's headers/footers for a clean copy. Blank fields retain
writing lines. Print only contains the selected sheet, not navigation or controls.

## The campaign

This sheet, the Mission Board and Icon Readings share one campaign: a record of the
things in play, held in this browser and nowhere else. `tools/ctth-campaign.js`
is the shared store, `localStorage` key `ctth-campaign-v1`. Each thing carries a
stable id, so the tools point at the same NPC or mission rather than copying it.

**Share this sheet** publishes what is on it. On a character or ship sheet that is
the sheet itself; on an NPC or mission sheet it is every named entry, each with its
own id. **Import** brings something from the campaign onto this sheet. For NPCs and
missions it fills a blank entry, or re-links an unlinked entry with the same name,
rather than making a duplicate; for systems and ships it opens a new sheet. Either
way the copy stays linked, so an edit here reaches the other tools and an edit there
reaches this sheet. **Unlink** stops following an entry and leaves the campaign's
own copy alone. **Back up campaign** downloads the whole campaign as JSON.

What the other tools read: an NPC entity carries the sheet's NPC fields plus the
Icon spread as text, so a reading drawn in Icon Readings arrives in the NPC sheet's
**Icon spread** field and a saved NPC appears here with **Draw a spread** beside it.
A mission entity carries employer, destination, reward, complications and reading.
A system entity carries the star and its bodies. A ship entity carries speed, crew
stations and modules, which the Mission Board uses to lay out a trip.

Launch table files are still per tool: this page reads `coriolis-sheets-data/1` and
`mission-board-data/1`, and importing a pack here does not change the Mission
Board's copy. The campaign is the connection, not the table data.

## Launch tables and visitor imports

`data/launch-tables.json` is the public launch pack, and it is a skeleton: 50 keyed
tables with their dice, roll ranges and result names, and no descriptive text.
`mission.type` and `w.spaceport` keep their `d` values because those are numbers that
drive the mechanics (difficulty, jumps, pay, port modifiers), not prose. Everything
else in a row is a name. For descriptions, import your own pack with **Import tables**;
it is kept in this browser only. Chapter prose and the source PDFs are not in the
repository. `data/presets.json` holds the 11 typical NPCs from Campaign Table 15.1 and
17 model stat blocks from Spaceships and Star Travel. Travel and general reference
chapters were used as reference; this tool does not add a second travel simulator.

To revise launch data, edit these JSON files on a branch, run the checks below,
review the data changes and merge through the repository's usual process. The
existing Pages workflow deploys pushes to **master**. Imported visitor files never
change these public files or anyone else's browser. Every deployed static JSON
file is publicly downloadable, so only put material intended for public release in
these launch files.

Visitor imports **replace** the active table pack locally; they do not silently
merge with the launch pack. **Use launch tables** removes the local override and
fetches the bundled pack again. An incomplete pack is allowed for preparation,
but a generation operation requiring a missing table reports the table ID and
leaves all sheet fields unchanged. The downloadable template is an abbreviated
example, not a complete generator pack. Start from `data/launch-tables.json` for the
ids, dice and ranges, and add your own text.

### Table format

```json
{
  "format": "coriolis-sheets-data/1",
  "name": "My campaign tables",
  "tables": {
    "w.hook": {
      "dice": "D66",
      "rows": [
        {"lo": 11, "hi": 66, "n": "Abandoned listening station",
         "d": "Its beacon has started transmitting again."}
      ]
    }
  }
}
```

Supported dice: `D6`, `2D6`, `D66` (two six-sided dice as tens and units).
Rows have integer `lo`/`hi` bounds, inclusive, a result `n` and optional description
`d`. Rows must not overlap; every possible roll should have a result. Modified
rolls below/above the table use the first/last row. A gap within a table is an
error. Result strings are displayed as text, never HTML.

The table IDs match Mission Board's IDs (`w.size`, `task.agents`, etc.); its
`mission-board-data/1` format is also accepted. A Mission Board pack needs the
additional `mission.type` table described below to generate missions here. The
supplied complete pack is the canonical list of IDs and dice. `w.factionCount`
rows optionally carry `count` as a number or dice string, e.g. `"D6"`.

`mission.type` implements Table 18, with `dice: "D66"`. Its `n` is the difficulty
name; its description `d` contains five pipe-separated values:

```text
Within system | 1 | 3D6 | 0 | Normal
```

These mean **destination, complication count, base reward dice (thousands of birr),
extra reward rolls, difficulty**. Counts are capped at six. Base reward expressions
accept `D6`, `2D6`, etc. and a positive modifier, e.g. `3D6+2`.

Mission-specific IDs are `employer.<concept>`, `task.<concept>`,
`location.<concept>`, `complication.<concept>` and `reward.<concept>`.
Concepts: `agents`, `mercenaries`, `explorers`, `pilgrims`, `entertainers`, `nomads`,
`traders`. Pilgrim variants borrow `location.agents`, as in the book's worked
example. Generated destinations give a distance category and location type;
choose the actual star system and route yourself or use Mission Board.

### Generation behaviour

**Fill empty fields** creates results for the current system bodies or missions,
then copies results into empty fields only. It keeps your edits. Generate into
blank entries for a consistent set of linked rolls: manually retained fields do
not recalculate the generator's other rolls. A failed roll/import does not apply
partial changes. Roll details are kept in `values.rollLog` in the sheet export.

World generation applies size restrictions, atmosphere/temperature/geosphere
modifiers, population and spaceport modifiers, gas giant population and moon
counts, asteroid belt population, orbital features, one hook per body and faction
counts/strengths. Special atmosphere modifiers remain at zero with an explicit GM
note. Mission generation applies Table 18 payment, complication and reward counts,
plus the selected concept's tables and any additional birr reward.

### Source extraction decisions to review

The Word/Markdown exports contain merged rows and ambiguous range characters.
The launch data makes these explicit interpretations:

- Table 12's `<2` desert entry covers **2 and below**; otherwise 2 has no result.
- Table 13's `<-2` uninhabited entry covers **2 and below**.
- Table 14's `<3` primitive landing strip covers **3 and below**.
- Table 32 prints Spaceship **61–63**, then Wonders **63–66**. Wonders is
  assigned **64–66**, preserving Spaceship at 63.
- Table 39 prints Extra debt cancellation **61–66**, followed by Artifact
  **64–66**. Debt cancellation is assigned **61–63**, preserving Artifact at 64–66.
- Joined rows were separated in Tables 8, 13, 17, 25, 30 and 39. No results were
  invented. Gas giant and planet size examples stay as supporting result text.
- Interleaved spaceship columns were reconstructed into the individual model
  loadouts. Weapon module names are included; absent weapon damage/crit columns
  are not guessed. Prices are not substituted for ship debt.

## Development and verification

From the repository root:

```sh
python -m http.server 8000
# Open http://localhost:8000/tools/ctth-sheets/
node --test tests/ctth-sheets.test.mjs
```

Tests cover roll coverage, boundary rolls for all concepts, linked world modifiers,
import rejection, documented range interpretations and preset baseline stats.
The implementation was also checked in Chromium at desktop and 390px mobile
widths, including save/reload, backup imports, presets, generators, invalid file
imports, inert HTML strings, cancel-delete and print PDFs with long notes.

Storage keys: `coriolis-sheets-v1`, `coriolis-sheets-tables-v1`,
`coriolis-sheets-theme`. Existing tools' browser storage is untouched.

Not affiliated with or endorsed by Free League Publishing. Coriolis and its names
belong to their respective owners.

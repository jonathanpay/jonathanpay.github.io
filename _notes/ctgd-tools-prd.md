# PRD — Coriolis: The Great Dark tools

Written 2026-11-10. Nothing here is built yet. It is written for two readers:

1. **The rules session**, which reads the rulebook and settles the exact rules. Your job is section 8 (the verification table) and the private data files in section 6.
2. **The build session**, which builds the tools from this document once section 8 is filled in.

**This file is in a public repo.** It carries no rulebook text, no table contents and no effect wording. It names rules by section number (for example "core rules 12.3") and gives numbers and structure only. Keep it that way when you edit it.

---

## 1. Goal

Give *The Great Dark* the prep-and-play tools that *The Third Horizon* already has at `/tools/ctth-*`. The two games differ in shape. The Third Horizon runs on jobs from patrons and portal travel. The Great Dark runs on voyages through the Slipstream, delves into Builder ruins, and exploration. So the Third Horizon's Mission Board has no direct counterpart; the **Delve** tool takes its place.

| Third Horizon | Great Dark |
|---|---|
| Mission Board (jobs, travel legs) | **Voyage Chart Table** (exists, `/tools/ctgd-voyage/`) plus the new **Delve Table** |
| System (charts, world generator) | Already inside the voyage tool (system charts). Not rebuilt. |
| Coriolis Sheets | **Great Dark Sheets** (new) |
| Icon Readings | Out of scope here. See section 3. |

## 2. Principles

These come from the Third Horizon tools and are not up for debate in this document.

1. **The page carries machinery; a data file carries the book's words.** Dice, roll ranges, counts, thresholds, arithmetic, table ids and place names go on the page. Table entries, descriptions, effect text and any other prose come from a JSON file the user writes from their own copy of the book and imports on a Data tab. It is stored in that browser's `localStorage` and never uploaded.
2. **Without the data file, every tool still works.** It rolls the dice, chains modifiers, keeps state, and says which table and row to read.
3. **No book text in the public repo.** That covers the pages, READMEs, tests, fixtures, sample data and this note. Test and demo data use invented placeholder words.
4. **Self-contained pages.** Plain HTML, CSS and JavaScript, no build step, no dependencies beyond Google Fonts and shared scripts in `/tools/`. Same typography, light/dark themes, site navigation and print behaviour as the Third Horizon tools.
5. **Everything saves in the browser.** `localStorage`, with JSON export and import for backups. Nothing leaves the browser.
6. **Unofficial.** Each README and page footer carries the not-affiliated notice used by the existing tools.

## 3. Scope

**In scope**

- M0: shared plumbing (section 4)
- M1: Great Dark Sheets (section 5)
- M2–M4: Delve Table (section 6)

**Out of scope for now**

- The Wrecker "wanted" card deck. Parked on purpose.
- Any rework of the voyage tool beyond the extraction in M0. Behaviour must not change.
- Splitting a crew mid-delve (the book treats it as two separate delves). Possible v2.
- Adventure, event and NPC builders, and artefact stat blocks beyond the generator columns.
- Resolving combat, Blight attacks and attribute rolls. The tools prompt for these and record results; they do not play them.

## 4. Shared plumbing (M0)

**4.1 Extract the Charted Sphere.** Move the map data out of `tools/ctgd-voyage/index.html` (about 115 KB) into `/tools/ctgd-sphere.js`, as `ctth-horizon.js` does for the other game: systems, streams with league distances, trade routes, tributaries, named features, the Lost Horizon schematic. The voyage page loads it before its own script and checks for it at every use. *Acceptance:* the voyage tool behaves identically. Saved voyages and the existing `gd-*` keys load unchanged.

**4.2 A Great Dark campaign store.** New `/tools/ctgd-campaign.js`, same API as `/tools/ctth-campaign.js` (named entities with stable ids, links between them, plain JSON-safe values only, size limits, no network, prototype-pollution guards), stored under `ctgd-campaign-v1`. Entity kinds: `npc`, `ship`, `site` (a delve or other adventure site), `artifact`, `voyage`, `story`. It is a separate store from the Third Horizon campaign: the two games' campaigns should not mix. The existing test `tests/ctth-campaign.test.mjs` is the pattern.

**4.3 Naming.** Folders and keys use the `ctgd` prefix, in line with the already-moved `/tools/ctgd-voyage/`. Storage keys are `gd-*` for the voyage tool today; new tools use `ctgd-*` and must not collide with `gd-*`.

**4.4 Public/private file convention.** See section 7.

## 5. Great Dark Sheets (M1)

**Purpose.** An editable, printable sheet set that follows the architecture of `/tools/ctth-sheets/` (model, app and stylesheet split; presets; A4 landscape print; export, backup and import with validation; shared campaign).

**Sheet types**

- **Explorer.** The player-character sheet.
- **Ship.** Greatships and Slipstream Cruisers. Linked to the voyage tool's Fleet tab, not duplicating it. Presets are read from the voyage data file's `fleet` section; the sheet does not carry its own copy.
- **NPC.**
- **Delve.** A record of one delve (see 6.9) for printing and for the campaign.
- **Voyage log.** A printable week-by-week page matching the voyage tool's schedule.

**What the page carries.** Field layout, derived-value arithmetic and print layout. Supply boxes on the Explorer sheet are machinery: supply is marked in check boxes, 4 points weigh as much as one regular item (core rules 12.2, 12.4).

**What the data file carries.** Talent, gear and archetype lists and ship presets, as text. The skills and attributes lists are short labels, which the Third Horizon sheets keep on the page; the rules session should say whether they can stay on the page here too or should move to the data file.

**What I know and don't.** The delve chapters (12.1–12.5, 14.5) mention these things on the Explorer: Heart and Health, despair, Blight, conditions, a delving suit with a Blight protection rating, supply, a crew role, and a Bird. **The character chapters have not been read for this PRD.** Section 8 lists what the rules session must establish.

**Requirements**

- S1. Explorer, Ship, NPC, Delve and Voyage log sheets can be created, edited, duplicated, removed, exported and printed.
- S2. Supply on an Explorer is a number of boxes, individually markable. The Delve tool reads and writes it through the campaign (6.7).
- S3. Print is white and black in both themes, A4 landscape, with inputs rendered as wrapping text, as in the Third Horizon sheets.
- S4. Import validates a whole backup before adding anything, keeps existing sheets and gives imported sheets new ids. Format `ctgd-sheets-backup/1`.
- S5. Ship sheets pull Hull, Morale and upgrades from the voyage tool's fleet record where one is selected, and the voyage tool can read a Ship sheet from the campaign, as the Third Horizon Travel tab does.

## 6. Delve Table (M2–M4)

One page, `/tools/ctgd-delve/`. One page and not two (as the Third Horizon has Board and System) because the runner needs the generated map.

### 6.1 Tabs

| Tab | Purpose | Milestone |
|---|---|---|
| **Ruin** | Generate a delve from the delve-creation framework (core rules 14.5) | M2 |
| **Map** | Side-view delve map in markers, GM view and deep-scan (player) view | M2 |
| **Descent** | Run the delve procedure, supply and hazards (core rules 12.1–12.5) | M3 |
| **Camp & Finds** | Delve camps, shards, artefacts, Guild handover (core rules 12.5, 14.7, 14.8) | M4 |
| **Log** | Shared campaign log | M3 |
| **Data** | Import or remove the data file, export and restore a backup | M2 |

### 6.2 Ruin (generator)

A chain of dice rolls, each result filed against a table id. Any result can be rerolled or picked by hand. Stages, per core rules 14.5:

1. Background: era, then purpose (a column chosen by era), then fate. A "repurposed" fate rolls a second purpose and fate.
2. Structure: type (one result combines two rolls), then depth band.
3. Depth band fixes, by dice expression: distance in markers, number of entrances, number of key locations.
4. Theme: a defining glyph and quirks.
5. Key locations: a shape and function for each.
6. Discoveries: a shard count per key location and a number of lesser and major artefacts, by band.
7. Threats: Blight infestation (sets Blight level range, number of cores and oases), threat type, and optionally another party.
8. A derived **delve class** (I–IV, core rules 12.1) estimated from the generated Blight levels and cores. Do not roll it. *The rules session should say how the book defines the classes numerically, if it does at all.*

**Page carries:** all roll ranges, dice expressions, band thresholds, counts, the chain logic (which result selects which column) and the stage order. **Data file carries:** every label and description.

### 6.3 Map

A side-view map in markers: a graph of **zones**. Each zone has a depth (marker index), a Blight level (a number from 1 up, or none), and optional flags: entrance, key location (with shape and function), Blight core, Blight oasis, hidden or blocked path.

Per core rules 14.5 "Final touches" and 12.1:

- Entrances sit on the surface at different distances from the first key locations.
- Key locations are typically 4–8 markers apart.
- Most key locations should be reachable by at least two routes.
- Avoid an obvious end point at the bottom or top.
- Some paths are blocked or hidden.

The tool places generated features automatically and lets the GM drag, add, remove and edit zones. It draws two views from one map:

- **GM view.** Everything.
- **Deep-scan view.** Hides zones a deep scan could not reach and hides Blight levels not yet read with the Bird or a scanner (core rules 12.2).

It also computes the **distance from a zone to the nearest known exit**, which the hazard roll needs (6.5).

### 6.4 Descent: state

Held in `localStorage` and saved with the delve. Shape (all fields JSON-safe):

- `crew`: explorers with name, current Heart, current supply, role.
- `roles`: Delver, Scout, Burrower, Guard, optional Archaeologist (core rules 12.1). Rules: the Delver is always a player character; fewer than four or more than five crew changes supply use.
- `position`: zone id.
- `clock`: stretches and shifts elapsed.
- `rolledHazards`: set of hazard cells already used this delve.
- `flags`: blind (no deep scan), scan done, Bird scans done.
- `camps`: zone ids.
- `log`: ordered entries.

### 6.5 Descent: the loop (working understanding, to verify in section 8)

1. The player rolls the delving roll (AGILITY plus talent and gear, −2 if blind). The tool takes the **number of successes** as input. It does not roll the player's dice.
2. Each success is one marker deeper, one stretch and 1 supply each. A failed roll still moves 1 marker for 2 supply.
3. If the destination zone is a key location, the procedure stops and exploration begins at 1 supply per stretch. Otherwise a hazard fires.
4. **Hazard.** One D6 picks the role (reroll 5 if no Archaeologist). A second D6 plus modifiers picks the row. The modifier steps by distance to the nearest known exit (bands at 1–5, 6–10, 11–15 and 16+) and adds 1 for a failed delving roll. Results above the last row read as the last row. A cell already rolled this delve is rerolled.
5. **Blight.** Use the highest level among the zones passed or entered, excluding the zone the move started in. Each Explorer's suit-protection roll reduces it by one per success; the remainder comes off Heart.
6. Blight cores: one Blight attack per stretch spent in them. The tool flags this and records the result; it does not resolve the attack.
7. Going back up through explored zones needs no delving roll but still costs one stretch and the same supply per marker.
8. Deep scan: one stretch, 1 supply, LOGIC roll. A failed scan means at least one blind marker before retrying.
9. Bird scan: INSIGHT roll, reaches up to four markers, one stretch, 1 supply, reveals Blight levels, cores and oases in range.

### 6.6 Supply

Pool shared, but marked per Explorer. Consumption rules (core rules 12.4), each a page constant:

- 1 supply per stretch of delving or exploring, whether or not the crew moves.
- +1 per marker moved blind.
- 1 after strenuous activity, 1 per weapon reloaded.
- 1 per shift in a delve camp (instead of per stretch).
- 1 extra per stretch for each crew member over five.
- Redistributing supply costs one stretch (so 1 supply) unless in a camp.

**Supply incident.** When an individual Explorer is at 3 or fewer supply and loses another point, roll D6 + remaining supply. A total of 7 or more is no incident; lower totals map to five incident rows. **Out of supply:** each point owed with none left rolls a D6, banded 1–3, 4–5, 6.

*The page carries the thresholds, the banding and the arithmetic; the data file carries the incident and out-of-supply wording.*

### 6.7 Camp & Finds, and the campaign

- **Camps.** Only in a Blight-free zone. LOGIC roll, one stretch, 1 supply. Once set, rests cost 1 supply per shift, and the camp persists. A camp can hold stored supply and equipment.
- **Shards.** Count per key location from the discovery roll. Four shards equal one point of encumbrance. Value 50–250 rukh each (core rules 14.7).
- **Artefacts.** Four independent D66 columns: description, form, power, oddity. A *major* artefact has a power and an oddity; a *lesser* one keeps only its oddity (14.7, 14.8). Each artefact keeps its "understanding" modifier, if the sample entries show one.
- **Guild handover.** Artefacts may not be owned by individuals; they go to the Explorers Guild. The tool tracks "held" and "handed over".
- **Campaign hand-offs.** A finished or in-progress delve is written to the campaign as a `site`; artefacts as `artifact`; Explorers' supply and Heart read from and write to `npc`/Explorer sheets (S2). Linking mirrors the Third Horizon "Send to the campaign" pattern.

### 6.8 Requirements

- D1. Generate a complete ruin from the 6.2 chain with no data file, showing table ids and rolled numbers only.
- D2. With a data file, the same screen names every result.
- D3. Every generated value can be rerolled, picked by hand, or locked.
- D4. The map is editable, saves with the delve, and supports both views.
- D5. Descent applies supply costs automatically and shows the running pool and each Explorer's supply.
- D6. Supply incident and out-of-supply rolls trigger automatically at the thresholds in 6.6.
- D7. The hazard roll picks role and row, applies the exit-distance and failed-roll modifiers, rerolls duplicates and caps at the last row.
- D8. Only supply and clock effects are applied automatically. Despair, damage, Blight, conditions and item loss appear as prompts with an "applied" tick, and the user records them.
- D9. A delve can be saved, reopened, exported, restored and sent to the campaign.
- D10. Works with no data file and with a partial one. The Data tab lists tables the file leaves out.

### 6.9 Delve record (for the Sheets "Delve" type)

Era, purpose, fate, type, depth band, markers, entrances, key locations (shape, function, shards), glyph, quirks, Blight infestation, cores, oases, threat, other party, class, a hand-drawn map area, and a supply and hazard log.

## 7. The public/private split in files

| File | Where it lives | In public repo? |
|---|---|---|
| Pages, scripts, READMEs, this PRD | `/tools/ctgd-*`, `/_notes/` | Yes |
| **Sample** data file with invented words, for tests and demo | `tools/ctgd-delve/data/sample.json` | Yes |
| **Real** data files from the rulebook | Anywhere outside the repo, or a gitignored folder | **No** |

Proposals for the build session:

1. Real files are named `*.private.json`, and `.gitignore` gets `*.private.json` and `/private/`.
2. Add a test, in the style of `tests/ctth-campaign.test.mjs`, that fails if any tracked JSON under `tools/` declares a `ctgd-*` format with real content. The check is that only `sample.json` may declare one.
3. Fixtures in tests use invented placeholder words ("Alpha row", "Sample hazard").
4. The Data tab says plainly where the file is stored (browser `localStorage`, this browser only) and that it never leaves it.

**Existing precedent to resolve.** `tools/ctth-sheets/data/launch-tables.json` is tracked in the public repo and contains table entries from the Atlas Compendium (its own `source` field says so). That is the opposite of the split above. It's outside this PRD's scope, but the user should decide whether it stays before the Great Dark files are added alongside it.

### Data files to define

| Format id | Used by | Holds |
|---|---|---|
| `ctgd-delve-data/1` | Delve Table | Section 6 tables (below) |
| `ctgd-sheets-tables/1` | Sheets | Talents, gear, archetypes, skill lists if moved off the page |
| `voyage-chart-table-data/1` | Voyage tool | Already exists; also supplies ship presets to the Sheets |

**`ctgd-delve-data/1` skeleton.** Structure only. Every field is optional; unknown fields are ignored.

```json
{
  "format": "ctgd-delve-data/1",
  "name": "", "created": "", "note": "",

  "tables": {
    "ruin.era":      { "dice": "D66", "rows": [ { "lo": 0, "hi": 0, "n": "", "d": "" } ] },
    "ruin.purpose":  { "dice": "D66", "columns": ["early", "middle", "late"],
                       "rows": [ { "lo": 0, "hi": 0, "v": { "early": "", "middle": "", "late": "" } } ] },
    "ruin.fate":     { "dice": "D66", "rows": [] },
    "ruin.type":     { "dice": "D66", "rows": [] },
    "ruin.depth":    { "dice": "D66", "rows": [] },
    "theme.glyph":   { "dice": "D66", "rows": [ { "lo": 0, "hi": 0, "n": "", "d": "" } ] },
    "theme.quirk":   { "dice": "D66", "rows": [] },
    "loc.shape":     { "dice": "D66", "rows": [ { "lo": 0, "hi": 0, "n": "", "f": "" } ] },
    "find.band":     { "dice": "D66", "rows": [] },
    "blight.band":   { "dice": "D66", "rows": [] },
    "threat.kind":   { "dice": "D66", "rows": [] },
    "party.kind":    { "dice": "D6",  "rows": [] },
    "delve.class":   { "rows": [ { "n": "", "d": "" } ] }
  },

  "hazards": {
    "delver": [], "scout": [], "burrower": [], "guard": [],
    "archaeologist": [], "all": []
  },
  "_hazards_note": "Each role has one entry per hazard row, in row order: { n, d, attr?, fx? }. fx is optional structured effect data, e.g. { supply: 1, stretch: 1 }, which the tool applies. Everything else stays text.",

  "supplyIncidents": [ { "total": 0, "n": "", "d": "" } ],
  "outOfSupply":     [ { "lo": 0, "hi": 0, "n": "" } ],

  "artifacts": {
    "columns": ["description", "form", "power", "oddity"],
    "rows": [ { "lo": 0, "hi": 0, "description": "", "form": "", "power": "", "oddity": "" } ],
    "samples": [ { "n": "", "kind": "major", "mod": 0, "d": "", "talents": [] } ]
  }
}
```

Notes on the skeleton:

- Roll **ranges** (`lo`, `hi`) in a data file are the book's own numbers. The page also carries them for the machinery tables (depth band, discovery band, Blight band), so the data file only needs to supply the label for each band by index. The build session should decide, per table, which side is the source of truth, and the rules session should record any table where the two disagree.
- Table ids are namespaced (`ruin.*`, `theme.*`, `loc.*`, `find.*`, `blight.*`, `threat.*`, `party.*`) like the Third Horizon ids.
- Rows outside the first or last range are read as the first or last row, as in the existing tools.
- `fx` stays optional and minimal on purpose: the tool applies only supply and clock effects (D8).

## 8. Rules verification table (for the rules session)

Fill this in from the rulebook. For each row, confirm the working value or give the correct one, with the section it comes from. **Put the corrected numbers here. Put wording, table entries and descriptions only in the private data files, not in this file.**

| # | Constant or rule | Working value | Source | Verified |
|---|---|---|---|---|
| 1 | Marker moved per delving-roll success | 1 | 12.3 | |
| 2 | Supply per stretch | 1 | 12.4 | |
| 3 | Supply on a failed delving roll | 2, and the crew still moves 1 marker | 12.3 | |
| 4 | Blind delving: dice penalty and extra supply | −2 dice; +1 supply per marker | 12.2, 12.4 | |
| 5 | Hazard role roll and the Archaeologist reroll | D6, reroll 5 when no Archaeologist | 12.3 | |
| 6 | Hazard row roll | D6 + modifiers, 9+ is last row | 12.3 | |
| 7 | Exit-distance modifier bands | 1–5 / 6–10 / 11–15 / 16+ → 0 / +1 / +2 / +3 | 12.3 | |
| 8 | Failed-roll hazard modifier | +1 | 12.3 | |
| 9 | Duplicate hazards within one delve | Reroll | 12.3 | |
| 10 | Which zones count for Blight | Highest passed or entered, excluding start | 12.3 | |
| 11 | Blight protection | Each success lowers Blight by one, remainder off Heart | 12.3 | |
| 12 | Blight core effect | One Blight attack per stretch in a core | 12.1 | |
| 13 | Supply incident trigger | Individual at 3 or fewer, per point lost | 12.4 | |
| 14 | Supply incident roll | D6 + remaining supply; 7+ none; five incident rows | 12.4 | |
| 15 | Out-of-supply roll banding | D6: 1–3 / 4–5 / 6 | 12.4 | |
| 16 | Out of supply, further rule | Death at the next point owed if broken | 12.4 | |
| 17 | Crew size effects | 4–5 normal; +1 supply per stretch per member over 5 | 12.1, 12.4 | |
| 18 | Camp setup | Blight-free zone, LOGIC, one stretch, 1 supply | 12.5 | |
| 19 | Camp upkeep | 1 supply per shift | 12.4, 12.5 | |
| 20 | Sharing supply | One stretch, 1 supply, free in camp | 12.4 | |
| 21 | Deep scan | LOGIC, one stretch, 1 supply, retry only after a blind marker | 12.2 | |
| 22 | Bird scan | INSIGHT, up to 4 markers, one stretch, 1 supply | 12.2 | |
| 23 | Comlink range underground | 4 markers | 12.2 | |
| 24 | Going back up | No roll, one stretch and the same supply per marker | 12.3 | |
| 25 | Key location exploration | 1 supply per stretch | 12.3 | |
| 26 | Supply weight | 4 points = 1 regular item | 12.2, 12.4 | |
| 27 | Shard weight and value | 4 shards = 1 encumbrance; 50–250 rukh | 14.7 | |
| 28 | Depth band numbers | Four bands: dice for markers, entrances, key locations | 14.5 | |
| 29 | Discovery band numbers | Four bands: shard dice, lesser and major artefact counts | 14.5 | |
| 30 | Blight band numbers | Four bands: levels range, cores, oases | 14.5 | |
| 31 | Era, type, and every other D66 range | As in the table | 14.5 | |
| 32 | **Other Parties table ranges** | The export shows overlapping ranges (1–2, 2–3, 3–4, 5, 6, 6) | 14.5 | **Known export fault** |
| 33 | Delve class definitions | Four classes by Blight level and obstacles. Any numeric rule? | 12.1 | |
| 34 | Delve depth guidance | Typical delve 15–30 markers deep | 12.5 | |
| 35 | Condition list and effects | Not yet read | Character chapters | |
| 36 | Explorer attributes, skills, Heart/Health maxima | Not yet read | Character chapters | |
| 37 | Ship stats and upgrades | Not yet read | Ship chapters | |
| 38 | Hazard table attribute and fail effect for each cell | 54 cells | 12.3 | Data file only |

Also for the rules session:

- Say which of the 38 rows change the PRD's page-side constants and which only fill the data file.
- Produce `*.private.json` files for the formats in section 7, kept outside the repo.
- Flag anywhere the extracted rulebook text is damaged, as in row 32.

## 9. Milestones

| Milestone | Deliverable | Depends on |
|---|---|---|
| M0 | `ctgd-sphere.js` extracted; `ctgd-campaign.js`; the voyage tool unchanged; gitignore and guard test | Nothing |
| M1 | Great Dark Sheets | M0; verification rows 35–37 |
| M2 | Delve Table: Ruin, Map, Data tab, sample data file | M0; rows 28–34 |
| M3 | Descent, supply, hazards, Log | M2; rows 1–26, 38 |
| M4 | Camp & Finds, campaign hand-offs, README, tools-index card | M3; row 27 |

Each milestone ends with a README in the style of `tools/ctth-mission/README.md` (what's in the page, what isn't, tabs, storage, the data file table) and a card on `/tools/` under Tabletop Tools.

## 10. Open questions for the user

1. **Name.** "Delve Table" fits the Voyage Chart Table's pattern. Alternatives welcome.
2. **Skills and attributes on the page or in the data file.** The Third Horizon sheets keep them on the page. Same here?
3. **Which side owns the roll ranges** for the three band tables (6.2 and the skeleton notes).
4. **`launch-tables.json`.** Keep it in the public repo, move it out, or leave it? (Section 7.)
5. **Splitting the crew.** Leave as v2?

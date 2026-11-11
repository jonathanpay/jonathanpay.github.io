# Great Dark Sheets

Editable, printable sheets for *Coriolis: The Great Dark*: Explorer, Ship, NPC, Delve and
Voyage log. Opened at `/tools/ctgd-sheets/`. Plain HTML, CSS and JavaScript, no build
step, no dependencies beyond Google Fonts and two shared scripts. Everything runs and is
saved in the browser.

It mirrors the Third Horizon sheets at `/tools/ctth-sheets/` (model, app and stylesheet
split; one archive; export, backup and import; a shared campaign), with its own storage
and its own campaign.

Not affiliated with, sponsored or endorsed by Free League Publishing (Fria Ligan AB).
*Coriolis: The Great Dark* and its names are theirs.

## What's in the page, and what isn't

The page carries layout and arithmetic only:

- the six attribute labels (there are no skills in this game, so there is no skill list),
  rated 2 to 6 with a gentle warning outside that range;
- Health = Strength + Agility, Hope = Logic + Empathy, Heart = Insight + Perception,
  worked out as you type;
- the six condition labels, one per attribute, as check boxes;
- supply, as individually markable boxes (you set how many);
- the field layout and the A4 landscape print layout.

Nothing else from the books ships with the page. Talent, gear and archetype lists come
from a **tables file** you write and keep yourself, imported in the sidebar and stored in
that browser. It is never uploaded. Without one, every sheet works fully and those fields
are free text; with one, they offer your list as suggestions, and an Explorer whose
archetype matches shows that archetype's key talents, specialties and starting kit.

Ship sheets do not carry ship presets either. Pick a Greatship or Slipstream Cruiser and
the sheet reads Hull, Morale, speeds, crew type, captain, route and upgrades from the
voyage tool's Fleet record in the same browser: the named ship, then your data file's
fleet section, then your own edits on the Fleet tab, exactly as the voyage tool merges
them. Those fields refresh each time the sheet opens and are read-only while linked;
current Hull and Morale stay on the sheet. Unlink to fill the ship in by hand.

## Sheet types

- **Explorer.** Identity, attributes with Health, Hope and Heart, what has been taken,
  Despair and Blight, conditions, supply boxes, talents, weapons, gear, delving suit with
  its Blight protection, Bird, notes.
- **Ship.** Fleet link, stats, current Hull and Morale, upgrades, crew, cargo.
- **NPC.** A cast sheet of up to 100 NPC cards with attributes and the same three maxima.
- **Delve.** One delve for printing and for the campaign: era, purpose, fate, type, depth
  band, markers, entrances, glyph, quirks, dangers, key locations with shards, a supply
  and hazard log, finds, and a map area.
- **Voyage log.** A week-by-week page matching the voyage tool's schedule.

Every type can be created, edited, duplicated, deleted, exported and printed.

## Saving, backup and import

Edits save to this browser as you type (`ctgd-sheets-v1`). **Export sheet** and **Back up
archive** download JSON in format `ctgd-sheets-backup/1`. **Import sheets** checks the
whole file before adding anything, keeps your existing sheets, gives imported sheets new
ids and drops any campaign links. Only plain strings, numbers and booleans are accepted,
with size limits and prototype-key checks. A broken archive in storage is left untouched
and the page says so.

## Print

Print / Save PDF gives A4 landscape, black on white in both themes. Inputs print as
wrapping text, supply and condition boxes print as ☐ and ☒, and the sidebar and buttons
are left off.

## The campaign

Sheets share `ctgd-campaign-v1` through `/tools/ctgd-campaign.js`, a separate store from
the Third Horizon campaign.

| Sheet | Campaign kind |
|---|---|
| Explorer, NPC | `npc` (a `sheet` field tells them apart) |
| Ship | `ship` |
| Delve | `site` |
| Voyage log | `voyage` |

**Share** writes the sheet; linked sheets update from the campaign and back. An Explorer's
supply is stored as `supplyMax` (a count) and `supplyMarks` (a string of 0 and 1, one per
box), so the Delve tool can read and write it. **Import** brings a campaign entity in as
a new sheet, **Unlink** cuts the tie, and **Back up campaign** downloads the whole store.

## The tables file

Format `ctgd-sheets-tables/1`, a JSON file. Only names are read; everything else is
dropped, lists are capped, and a wrong format is refused with a message. A sample with
invented words is in `data/sample.json`, and **Download template** writes one to start
from.

```json
{
  "format": "ctgd-sheets-tables/1",
  "name": "My tables",
  "talents": [{ "n": "Alpha knack", "levels": "0-3", "type": "general" }],
  "archetypes": [{ "n": "Sample Wanderer", "key": "log",
    "keyTalents": ["Alpha knack"], "equipment": ["Sample satchel"],
    "specialties": [{ "n": "Sample specialty", "talent": "Alpha knack" }] }],
  "gear": { "Sample group": ["Sample rope"] },
  "weapons": { "Sample ranged": [{ "n": "Sample sling" }] },
  "armor": [{ "n": "Sample jacket" }],
  "birds": [{ "n": "Sample finch" }],
  "roles": ["Sample role"]
}
```

`professions`, `birdTypes` and `crewRoles` are accepted as other names for `archetypes`,
`birds` and `roles`. **Real data files must not be committed.** `*.private.json` and
`/private/` are git-ignored, and a test fails if any tracked JSON under `tools/` other
than a file called `sample.json` declares a `ctgd-*` format.

## Files

- `index.html`, `app.js`, `sheets.css`: the page.
- `model.js`: field layouts, arithmetic, validation, the fleet merge. No DOM, so it is
  tested directly in `tests/ctgd-sheets.test.mjs`.
- `data/sample.json`: invented-words sample tables.
- `/tools/ctgd-campaign.js`, `/tools/ctgd-sphere.js`: the shared store and the Charted
  Sphere (the sheets use its fleet list for names).

## Storage keys

`ctgd-sheets-v1` (archive), `ctgd-sheets-tables-v1` (your tables file),
`ctgd-campaign-v1`. The voyage tool's `gd-*` keys are only ever read
(`gd-data`, `gd-db`, `gd-spoil`), never written.

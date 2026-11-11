# Atlas

An unofficial map maker for *Coriolis: The Third Horizon*, at `/tools/ctth-atlas/`.
Start from a blank page, place star systems, link them with portals, flag unstable
portals and dangerous areas, build out each system's bodies, and save it all to the
campaign. Plain HTML and ES modules, no build step. Not affiliated with Free League
Publishing (Fria Ligan AB); it carries no book text, only the maps you make.

It draws in the same holographic style as the System and Mission tools, and reads star
colours from `/tools/ctth-horizon.js`. The Horizon's own map stays where it is; this
is for the maps you invent.

## Tabs

- **Map.** Tools: *Select* (drag systems and region labels, click to edit), *Add system*
  (click empty space) and *Link* (click two systems). Per system: name, one to three
  stars with their classes, kind of space, core, major spaceport and **unstable
  portals** (red etching, as on the Horizon map; it belongs to the system, since every
  jump into or out of it uses one). Per link: **dangerous area**. Arrow keys nudge a
  focused system (Shift for 1 px steps). Checks flag duplicate names, systems with no
  route to the rest, and systems with no bodies. A route finder lights the fewest-jumps
  path, preferring fewer unstable portals and dangerous links, as the Mission tool does.
- **Systems.** Name each star, set the portals' distance and portal station, then add
  bodies (planet, moon, gas giant, asteroid belt, station, comet or region) with their
  AD, the star they orbit and optional world details (size, atmosphere, temperature,
  geosphere, population, spaceport, orbit, factions, other, hooks). The system chart
  draws as you type, square-root spaced, like the System tool's.
- **Campaign.** Save, reopen and remove maps, or export and import a file.

## The campaign

Saving writes one campaign **map** entity (layout, links, flags; `ctth-atlas`) and one
campaign **system** entity per system (name, star text, notes, bodies in the fields
Coriolis Sheets uses), tied together with `contains` links. Saving again updates them in
place. Because they are ordinary campaign systems, they appear in the System tool's
lists (where the Worlds tab can roll for them) and in Coriolis Sheets. Opening a map
from the campaign reads each system's bodies and name back, so edits made in Sheets
arrive.

A system you take off the map is left in the campaign (it may be in use elsewhere) and
the save message says so. Removing a map from the campaign offers "map only" or "map and
its systems". `map` is a new campaign kind in `/tools/ctth-campaign.js`.

## Storage

Working copies live in `localStorage` under `ctth-atlas-v1` (up to 30 maps), saved as
you edit. Export files are `"format": "ctth-atlas-map/1"`; an import is checked and
clamped field by field, and arrives as a copy with no campaign links.

## Known limits

The System tool charts campaign systems with default star colours and no portal links;
it doesn't draw custom maps. Sheets' body kind menu has three options, so moons,
stations and comets saved from here show as blank there until changed.

## Files

`model.js` (rules, validation, campaign hand-off; tested in `tests/ctth-atlas.test.mjs`),
`chart.js` (drawing), `app.js` (page), `index.html`.

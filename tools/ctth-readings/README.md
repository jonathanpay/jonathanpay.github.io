# Icon Readings

An optional way to build a non-player character for *Coriolis: The Third Horizon* by
drawing from the Icon deck and reading the cards like a tarot spread. Opened at
`/tools/ctth-readings/`. One self-contained HTML file, no build step, no dependencies
beyond Google Fonts.

Not affiliated with, sponsored or endorsed by Free League Publishing (Fria Ligan AB).
The Icons and the thirty-six card titles are theirs. The method, the glosses and the
card designs are mine.

## The method

An NPC keeps the set Icon they were born under; the cards never change it. Five cards
are drawn, one for each position:

| Position | Question | Use it for |
|---|---|---|
| Serves | Which Icon they act for in this story | A narrative prompt, not their set Icon |
| Surface | How the town or port sees them | The opening rumour |
| Want | What they are trying to get | The hook |
| Secret | What they are hiding | The complication |
| Owed | Who they owe, or who owes them | A debt or favour, and a link to another NPC |

A three-card version (Serves, Want, Secret) is there for a quick NPC.

**Layouts.** Line (the default), Pentagon (Serves at the top, the rest clockwise, so
Owed sits beside Serves) with an optional sixth card face down at the centre as the
turning point, or Free, where cards can be dragged anywhere on the cloth.

**Shadows and echoes.** When two cards share an Icon, the later position is the shadow
of the earlier: the NPC acts for that Icon openly and in secret at once. On the
pentagon, neighbours are a shadow and cards two places apart are an echo. On a line,
cards further apart are read as a pair across the spread. The page marks them on the
cloth and in the reading.

## Three readings

The same deck reads three things. **Reading for** chooses which set of positions is
used:

| Target | Five cards | Three cards |
|---|---|---|
| An NPC | Serves, Surface, Want, Secret, Owed | Serves, Want, Secret |
| A twist | The turn, The tell, The silence, The cost, The after | The turn, The tell, The cost |
| The story | Opening, Pressure, Turn, Secret, Reckoning | Opening, Turn, Reckoning |

Each position has its own question and a note on what to do with it, and the reading
and the Markdown copy follow the target. The set Icon belongs to NPCs only; for a
twist or a story the cloth names the job or the arc instead. The target is kept with
the spread, and spreads saved before there were targets read as NPCs.

**A twist is not a mission.** Table 18 in the Atlas Compendium builds the job, and the
complications tables already hand you a third party, a double agent, bad intel or a
scapegoat. What no table says is what the job turns out to have been, so this reading
takes that layer: the turn re-reads the job rather than adding to it, the tell makes
the turn fair when it lands, the silence names who knew, the cost is what no fee
covers, and the after is the state of things once it lands. Read it beside a job you
have already rolled and take whichever card contradicts what you had. Spreads marked
`mission` before this reading was renamed stay readable and open as a twist.

## The campaign

Coriolis Sheets and the Mission Board keep a campaign in the same browser, on the same
origin. **Send to the campaign** writes the spread there as an NPC, a mission or a
story to match the reading target: the cards, the positions they fell in, and the
reading as plain text. Coriolis Sheets shows that text as the NPC's Icon spread, and
its "Draw a spread" link opens this page with that NPC already named.

**From the campaign** lists what is saved and loads it back: the target, the name, the
set Icon where there is one, and the saved reading as a starting point. Drawing new
cards replaces that reading. The page also takes `?npc=`, `?mission=` or `?story=` with
a campaign id, so a link can open the right entry.

Nothing is sent anywhere. The campaign is one `localStorage` record in this browser,
shared only by the tools on this site, and without the campaign script the rest of the
page works as it did before.

## Tabs

- **Spread.** Name the NPC, set their Icon, choose what the reading is for and the
  spread and layout, then shuffle and draw. Cards can be dealt face down and turned
  one at a time. Each card can be redrawn or chosen by hand. Save the NPC, send it to
  the campaign, or copy it as Markdown.
- **The deck.** All thirty-six cards with their glosses, grouped by Icon.
- **NPCs.** Saved spreads, with notes. The Owed card can name another saved NPC.
- **Your cards.** Load your own card scans, a folder at a time or file by file. Files
  are matched by the number in their name (11 to 66), or failing that by the card's
  title; a file with "back" in its name becomes the card back. Images are
  kept in the browser's IndexedDB and never uploaded.
- **About.** The method written out for a reader who has not used the tool: the five
  positions, the three-card cut, shadows and echoes, the mission and story spreads,
  what saving does, and who owns what. Reached at `#about`, so it can be linked to
  directly.

## The design

The cards are drawn in SVG, with my own art: an arched window on a girih star pattern,
a rosette of two squares holding each Icon's sigil, the Icon's name at the top and the
dotted number and title at the foot. The Faceless cards are an empty window, nothing
in it but the lattice. The suits run green, blue, ochre and red, as on the deck.
The back is a nine-pointed star, one point for each Icon with its sigil beyond it,
over the enneagram's long lines, and a scarab at its heart: the mark on the six of the
dice, the roll that counts, neither lucky nor unlucky.
The cloth is a night-blue girih field with a horoscope wheel:
thirty-six decans, one per card, lit as cards are drawn, and the nine Icon sigils
in their houses. The sigils are my own: the scales, the turning S and crescent, the
coin, the navigator's star, the tear, the die, the wings, the road under a star, and
an empty circle for the Faceless.

## Storage

`localStorage`: `is-spread` (the current spread), `is-npcs` (saved NPCs),
`is-use-scans`. IndexedDB database `icon-spreads` holds loaded card images. A backup
is JSON with `"format": "icon-spreads-backup/1"`.

The shared campaign lives in `ctth-campaign-v1`, the same record Coriolis Sheets
and the Mission Board use. This page only reads and writes `npc`, `mission` and
`story` entities, and only when `/tools/ctth-campaign.js` is present.

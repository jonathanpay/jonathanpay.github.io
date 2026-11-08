# Icon Spreads

An optional way to build a non-player character for *Coriolis: The Third Horizon* by
drawing from the Icon deck and reading the cards like a tarot spread. Opened at
`/tools/icon-spreads/`. One self-contained HTML file, no build step, no dependencies
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

## Tabs

- **Spread.** Name the NPC, set their Icon, choose the spread and layout, then
  shuffle and draw. Cards can be dealt face down and turned one at a time. Each card
  can be redrawn or chosen by hand. Save the NPC, or copy it as Markdown.
- **The deck.** All thirty-six cards with their glosses, grouped by Icon.
- **NPCs.** Saved spreads, with notes. The Owed card can name another saved NPC.
- **Your cards.** Load your own card scans. Files are matched by the number in their
  name (11 to 66); a file with "back" in its name becomes the card back. Images are
  kept in the browser's IndexedDB and never uploaded.

## The design

The cards are drawn in SVG on the printed deck's plan, with my own art: a dark rounded
card, a twelve-point tile star in the suit colour, a pale halo holding the Icon's sigil
where the deck has a figure, the Icon's name in a banner at the top, and the dotted
number and italic title in a banner at the foot. The suits run green, blue, ochre and
violet, as on the deck. The cloth is a night-blue girih field with a horoscope wheel:
thirty-six decans, one per card, lit as cards are drawn, and the nine Icon sigils
in their houses. The sigils are my own: the scales, the turning S and crescent, the
coin, the navigator's star, the tear, the die, the wings, the road under a star, and
an empty circle for the Faceless.

## Storage

`localStorage`: `is-spread` (the current spread), `is-npcs` (saved NPCs),
`is-use-scans`. IndexedDB database `icon-spreads` holds loaded card images. A backup
is JSON with `"format": "icon-spreads-backup/1"`.

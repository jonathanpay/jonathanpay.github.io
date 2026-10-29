# Paste-up

Browser collage tool, opened at `/tools/paste-up/`. A desktop answer to Pinterest's
Shuffles: find images, cut them out precisely with a mouse or trackpad, arrange them,
and export a PNG that carries every source image's credit. Everything runs client-side
from one file. The only external scripts are Fabric.js (canvas) and, on demand, the
background-removal model.

## Sources

- **Art Institute of Chicago**: public-domain works only. No key.
- **Cleveland Museum of Art**: CC0 open-access works only. No key.
- **Wikimedia Commons**: public domain by default. A checkbox adds attribution and
  share-alike licences; non-commercial and no-derivatives licences are always filtered out,
  since neither suits collage.
- **Pexels** and **Unsplash**: need API keys, entered in Settings. Keys live in the
  browser's localStorage only, so nothing secret is ever committed to this repo.
  Unsplash also needs the registered application name, which goes into the attribution
  links (`utm_source`) as their API guidelines require, and the tool pings each photo's
  `download_location` when it's used, which the guidelines also require.

## Cutting out

The cut-out editor works on a mask over the source image (capped at 2400px on the long side).

- **Lasso** (`L`): drag for freehand, or click point by point for straight edges and close
  with a click on the first point, a double-click, or `Enter`. Modes: Keep (keep only the
  inside), Remove, Add.
- **Erase / Restore** brushes (`E` / `R`), `[` and `]` for size.
- **Hand** (`H`), or hold `Space`. Scroll pans; pinch or Cmd/Ctrl+scroll zooms.
- **Remove background automatically** loads `@imgly/background-removal` from jsDelivr on
  first use (about 40 MB of model, cached afterwards) and runs it in the browser. The result
  is intersected with the current mask, so a lasso done first still counts.
- **Soften edges** blurs the mask inward only, so edges don't grow a halo.

Each placed layer keeps its source image and mask, so "Edit cut-out" reopens it and the
layer stays aligned to the same source pixels afterwards.

## Credits

Every layer carries a `credit` object (title, creator, source, licence, links). Hidden
layers drop out of the credits; duplicates of the same source are listed once. Export gives:

- the PNG, with credits embedded as iTXt chunks (Title, Author, Description, Comment) and an
  XMP packet (dc:title, dc:creator, dc:description);
- an optional `-credits.txt` file with the full credits;
- a short or full credit block to copy into a post, since most platforms strip metadata.

## Projects

Work autosaves to IndexedDB. "Save project" downloads a `.pasteup.json` file (images
embedded as data URLs, so files can be large); "Open" restores one.

## Licence note

`@imgly/background-removal` is AGPL-3.0. Fine for an open tool in a public repo; it would
need revisiting if this were ever sold.

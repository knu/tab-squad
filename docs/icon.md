# TabSquad icon

`icon.svg` is the single source of truth; `scripts/generate-icons.mjs`
rasterises it via sharp into `public/icon/{16,32,48,128}.png` which WXT
picks up automatically.

This document captures the intent behind the design so future tweaks
stay aligned with the goals rather than the pixels.

## What the icon should communicate

1. **A squad of services kept together.**  TabSquad's core idea is
   "a tab group is a squad of tabs that belong together".  The icon
   shows four tiles -- mail, single bubble, overlapping bubbles, cloud
   -- representing the kinds of services (email, messaging, chat,
   cloud storage) people often pin into a dedicated tab group.

2. **A single, interlocking unit.**  The four tiles share edges and
   are bound by a common outline, so the squad reads as one entity,
   not four loose icons.  The tab handles on every tile poke up into
   the tile above (lower row wins), which gives a "LEGO-brick"
   interlock feel: there is no slot for a stray tab to wedge into
   the middle.

3. **Browser tabs, not generic tiles.**  Each tile has a trapezoidal
   handle on top so the icon reads as tabs, not random app icons.
   The handle uses a *gentle convex* curve at the top corners
   (rx=5) and a *sharper concave* curve where it meets the body
   (rx=2); this asymmetry is what most browser tab shapes share, and
   reversing the two reads as a generic rounded rectangle instead of
   a tab.

## Design rules to preserve when tweaking

- **Brand colour.**  Background is the same accent blue
  (`#2563eb`) that the options page uses for primary buttons.  The
  outline and symbol silhouettes are the same blue on white tiles, so
  the icon is two-colour at small sizes.

- **Symmetric layout.**  The four tiles must be congruent.  All
  position values flow from a single tile shape (`#tile` in the SVG)
  used four times via `<use>`.  Keep the tile path symmetric around
  its centre x; the handle should sit on the tile's centre.

- **Lower row wins.**  Draw the bottom row after the top row, so the
  lower tab handles paint over the upper tile's body and outline.
  This is what conveys "they lock together" rather than "they are a
  2x2 grid with a divider".

- **Symbols sit inside the body, never the handle.**  Centre each
  symbol on the body rectangle, not on the whole tile including the
  handle.  Make sure the symbol does not collide with the lower row's
  handle that pokes into the upper tile.

- **Frame fits inside the rounded square.**  The whole 2x2 patch
  must stay inside the rounded blue square (rx=24 at viewBox 128) with
  enough margin that no tile corner pokes out, including the stroke
  width.  As a rough guard: the distance from the rounded square's
  corner centre (104, 104 at viewBox 128) to any tile outer corner
  should stay below 24.

- **Three reads at every size.**  At 128 the four symbols are clearly
  legible.  At 48 they read as four distinct shapes even if the
  details soften.  At 16 the icon collapses to "two-by-two tabs in a
  blue rounded square"; that is enough.  Do not optimise small sizes
  by adding details -- always remove them.

## Tunable knobs in the current SVG

Inside `<defs><path id="tile">`:

- Tile width and body height -- change the `v 38` rise of the body
  side and the `h ±44` body bottom together, then update the `use`
  translations and the symbol translates so everything stays centred.
- Handle width -- the `h N` on the handle top edge.  Pair with the
  inner `h N` on the body top edge (left/right) so the handle stays
  centred and the body top stays the right length.
- Handle corner shape -- the two arcs on each side.  The convex (rx
  5) and concave (rx 2) radii give the "tab" feel; keep convex
  larger than concave.
- Symbol size -- currently 32x32 boxes.  Resize together with the
  body so the symbol does not crowd the handle from the row below.

The current numbers (viewBox 128, tile 56x57, body 50 tall, handle 18
wide) leave enough margin to the rounded blue square that the four
tiles read as a centred squad with the tiles roughly 3:4:3 left
:handle:right.

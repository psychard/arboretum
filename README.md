# The Painted Arboretum

A garden game for phones, painted as if in oils. Buy trees and decorations,
tap the meadow to plant them, and sell $25 tickets to the visitors who come to
look. Trees grow while you play, the four seasons turn slowly (and keep turning,
more slowly still, while you're away), and the nursery's stock changes with
them. There is a grey cat.

Play it at **[arboretum.psychard.com](https://arboretum.psychard.com/)**.

## What's here

TypeScript, bundled by [Vite](https://vite.dev/). The game is plain three.js
(r128, from npm) and DOM, with no framework.

- `index.html`: the page markup (HUD, shop, intro card).
- `src/main.ts`: checks for WebGL, then loads `src/game.ts`, which holds the
  loop and boot. Each other module in `src/` is one part of the game:
  `world` (the meadow, pond, hedge and season palettes), `trees`, `decor`,
  `people` (visitors), `animals` (the cat and the ducks), `water` (pond
  obstacles and walking), `camera` (joystick, drag, pinch), `shop`
  (buying and placing), `thumbs` (the shop's rotating 3D trees), `hud`, `ui`
  (toasts), `render` (renderer and the painterly post shader) and `mp`
  (visiting other gardens; see History), `share` and `sharing` (share links
  and backups; see **Saves**), and `photo` (the 📷 chip: see **Photos**).
- `src/data.ts`: every species and decoration, their prices and seasons.
- `src/saveformat.ts` and `src/save.ts`: the save. See **Saves** below.
- In `npm run dev`, the console's `arb` holds every module as the game loaded
  it (`arb.save.state`, `arb.render.renderer.info`, ...).
- `tests/`: tests for the save format, share links and backups, with one
  fixture save per save version.
- `public/`: icons, `manifest.json` (so Share → **Add to Home Screen** installs
  it as *Arboretum*, full screen) and the Architects Daughter typeface (SIL Open
  Font License), served from here so the game makes no third-party requests.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm test` runs the tests, and `npm run build`
typechecks and writes the site to `dist/` (`npm run preview` serves that).

## Saves

Progress saves to `localStorage` under `painted-arboretum-v1`, so it belongs to
the browser and the origin. That key never changes. To change the save's
shape, bump `SAVE_V`, add a step to `migrate()` and add a fixture to
`tests/saves/`. To rename a species or decoration id, add it to `RENAMED`.
A save entry this version can't build is kept in `orphans`, never dropped.

The shop's footer has three ways for a garden to leave the browser (see
`src/share.ts` for the formats and `src/sharing.ts` for the buttons):

- **Share** makes a link, `arboretum.psychard.com/#g=…`, carrying the trees,
  decorations and season, compressed (a garden of 20 trees is about 350
  characters). Opening it is a read-only visit, like visiting another
  player, and works with nobody else online.
- **Back up** saves the whole save as a JSON file (on a phone, through the
  share sheet, so it can go to Files or AirDrop).
- **Restore** reads such a file and, after a confirming tap, replaces this
  garden with it. The garden it replaces is kept under
  `painted-arboretum-v1.replaced`. This is also the way to move a garden from
  Safari into the Home Screen app, which on iOS has storage of its own.

## Photos

The 📷 chip clears the screen down to the garden, a shutter and a Done
button. The shutter paints the view again at about twice the screen's size
(up to 4096 px on the long side), with sharper shadows for that one frame,
and shows it mounted on paper with the season and date written under it; the
paper frame can be turned off. Save goes to the share sheet on a phone (Save
Image puts it in Photos) and to downloads elsewhere.

The painterly pass in `render.ts` takes a `scale` uniform, the number of
picture pixels per screen pixel, so a big picture gets the same brushwork as
the screen rather than strokes a fraction of the size. Anything drawn in the
scene only as UI should set `userData.ui = true` to stay out of photos.

## Deploys

Push to `main` and [`pages.yml`](.github/workflows/pages.yml) runs the tests
and the build, then publishes `dist/` to GitHub Pages, served at the custom
domain `arboretum.psychard.com` (set in the repo's Pages settings; DNS is a
CNAME to `psychard.github.io`). Pull requests get the same tests and build
from `ci.yml`.

## History

It began as a claude.ai artifact, and the first nine commits replay that chat:
each one is the file as it stood after one request, with the request quoted in
the message. Visiting other players' gardens was built on claude.ai's artifact
runtime (`window.claude`), which this host doesn't have, so that code is
guarded and stays dormant here. It was then hosted for a day at
www.psychard.com/arboretum/, in
[psychard.github.io](https://github.com/psychard/psychard.github.io), before
moving to its own repo and subdomain, where it was split from one `index.html`
into the modules above.

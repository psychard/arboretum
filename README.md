# The Painted Arboretum

A garden game for phones, painted as if in oils. Buy trees and decorations,
tap the meadow to plant them, and sell $25 tickets to the visitors who come to
look. Trees grow while you play, the four seasons turn slowly (and keep turning,
more slowly still, while you're away), and the nursery's stock changes with
them. There is a grey cat.

Play it at **[arboretum.psychard.com](https://arboretum.psychard.com/)**.

## What's here

The whole game is [`index.html`](index.html): markup, styles and one inline
script. No build step and no dependencies to install.

- `vendor/` — three.js r128 (MIT) and the Architects Daughter typeface (SIL Open
  Font License), served from here rather than cdnjs and Google Fonts so the game
  works offline and makes no third-party requests.
- `icons/`, `manifest.json` — so Share → **Add to Home Screen** installs it as
  *Arboretum*, full screen.
- `tools/check.mjs` — parses the inline script without running it. CI and the
  deploy both gate on it.

Progress saves to `localStorage`, so it belongs to the browser and the origin.

## Running it

Any static server from the repo root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` straight from disk mostly
works too, but the manifest and absolute `/icons/` paths want a server.

## Deploys

Push to `main` and [`pages.yml`](.github/workflows/pages.yml) runs the check
and publishes the repo root to GitHub Pages, served at the custom domain
`arboretum.psychard.com` (set in the repo's Pages settings; DNS is a CNAME to
`psychard.github.io`). Pull requests get the same check from `ci.yml`.

## History

It began as a claude.ai artifact, and the first nine commits replay that chat:
each one is the file as it stood after one request, with the request quoted in
the message. Visiting other players' gardens was built on claude.ai's artifact
runtime (`window.claude`), which this host doesn't have, so that code is
guarded and stays dormant here. It was then hosted for a day at
www.psychard.com/arboretum/, in
[psychard.github.io](https://github.com/psychard/psychard.github.io), before
moving to its own repo and subdomain.

# Notes for AI assistants

These are project-specific notes that override generic conventions
when working in this repository.  Read them before changing anything
substantial.

## Build

- WXT 0.20 + React 19 + TypeScript, package-manager pnpm.
- Useful scripts: `pnpm compile`, `pnpm lint`, `pnpm format:check`,
  `pnpm build`, `pnpm build:edge`, `pnpm icons`.
- After touching code: run `pnpm compile && pnpm lint &&
  pnpm format:check`, then `pnpm build` and `pnpm build:edge` to
  confirm both manifests build.

## Icon

The toolbar / store icon is generated from `assets/icon.svg` via
`scripts/generate-icons.mjs` into `public/icon/{16,32,48,128}.png`.
See [docs/icon.md](docs/icon.md) for the design intent (squad of
services, interlocking lower-row-wins tabs, convex>concave handle
radii) before tweaking the SVG.

Regenerate PNGs with `pnpm icons` whenever `assets/icon.svg` changes.

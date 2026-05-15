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

## Release

Two-step flow on `main`:

1. `pnpm bump <patch|minor|major>` -- bumps `package.json` and
   commits `Bump version to vX.Y.Z`.  No tag, no CHANGELOG.
2. `pnpm release` -- runs the full check + build, regenerates
   `CHANGELOG.md` for the new tag, commits `Release vX.Y.Z`, and
   creates the tag.  Aborts if the working tree is dirty, the tag
   already exists, or `git-cliff` would produce an empty entry.

Then push manually:

```sh
git push origin main
git push origin vX.Y.Z   # triggers the Release workflow
```


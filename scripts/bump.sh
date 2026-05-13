#!/bin/sh
# Bump the package version, run the full check + build, and regenerate
# CHANGELOG.md so the maintainer can review, commit, tag, and push the
# release manually.

set -eu

kind="${1:-}"
case "$kind" in
  patch | minor | major) ;;
  *)
    echo "Usage: pnpm bump <patch|minor|major>" >&2
    exit 1
    ;;
esac

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree has uncommitted changes; commit or stash them first." >&2
  git status --short >&2
  exit 1
fi

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
  printf 'Current branch is %s, not main.  Continue? [y/N] ' "$branch"
  read -r reply
  case "$reply" in
    y | Y | yes | YES) ;;
    *) exit 1 ;;
  esac
fi

pnpm install --frozen-lockfile
pnpm compile
pnpm lint
pnpm format:check
pnpm build
pnpm build:edge

pnpm version --no-git-tag-version "$kind" >/dev/null
new_version=$(node -p "require('./package.json').version")
tag="v$new_version"

pnpm exec git-cliff --tag "$tag" --output CHANGELOG.md
git add package.json CHANGELOG.md

cat <<EOF

Staged version bump to $new_version and regenerated CHANGELOG.md.

Next steps:
  1. Review the staged changes:
       git diff --cached
  2. Commit and tag:
       git commit -m "Release $tag"
       git tag $tag
  3. Push when ready:
       git push origin main
       git push origin $tag
EOF

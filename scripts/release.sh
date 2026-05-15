#!/bin/sh
# Verify the working tree, run the full check + build, regenerate
# CHANGELOG.md, commit, and tag the release.  Push the resulting
# commit and tag manually after reviewing.

set -eu

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

version=$(node -p "require('./package.json').version")
tag="v$version"

if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
    echo "Tag $tag already exists.  Bump the version first with 'pnpm bump'." >&2
    exit 1
fi

# Refuse to release without a real changelog entry so a missed
# git-cliff skip rule (or a no-op since the last tag) cannot ship
# an empty release.
unreleased=$(pnpm exec git-cliff --unreleased --strip header)
if ! printf '%s\n' "$unreleased" | grep -qE '^- '; then
    echo "git-cliff produced no entries for $tag." >&2
    echo "Check cliff.toml skip rules or commit something user-visible first." >&2
    printf '%s\n' "$unreleased" >&2
    exit 1
fi

pnpm install --frozen-lockfile
pnpm compile
pnpm lint
pnpm format:check
pnpm build
pnpm build:edge

pnpm exec git-cliff --tag "$tag" --output CHANGELOG.md
git add CHANGELOG.md
git commit -m "Release $tag"
git tag "$tag"

cat <<EOF

Committed and tagged $tag.

Push when ready:
  git push origin main
  git push origin $tag
EOF

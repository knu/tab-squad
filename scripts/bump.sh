#!/bin/sh
# Bump the package version and commit the change.  Run `pnpm release`
# afterwards to update CHANGELOG.md, tag the commit, and finish the
# release.

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

pnpm version --no-git-tag-version "$kind" >/dev/null
new_version=$(node -p "require('./package.json').version")
tag="v$new_version"

git add package.json
git commit -m "Bump version to $tag"

cat <<EOF

Committed version bump to $new_version.

Next step:
  pnpm release
EOF

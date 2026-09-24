#!/usr/bin/env bash
#
# Release preparation for create-vandslab-app.
#
# This script does NOT publish. Publishing happens in GitHub Actions when a
# release is created (.github/workflows/publish.yml), so that the package is
# always built from a clean checkout with an audited log — and so that npm
# credentials live in one place instead of on a developer machine.
#
# What this does: verify the tree is releasable, build, run the packaging smoke
# suite, bump the version, tag it, and push. Then you create the GitHub release.

set -euo pipefail

RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; DIM=$'\033[2m'; OFF=$'\033[0m'
info()  { printf '%s\n' "$*"; }
ok()    { printf '%s✓%s %s\n' "$GREEN" "$OFF" "$*"; }
warn()  { printf '%s!%s %s\n' "$YELLOW" "$OFF" "$*"; }
die()   { printf '%s✗%s %s\n' "$RED" "$OFF" "$*" >&2; exit 1; }

cd "$(dirname "$0")"

# ---------- 1. the tree must be releasable ----------
info "Checking the working tree..."

git rev-parse --git-dir >/dev/null 2>&1 || die "Not a git repository."

[ -z "$(git status --porcelain)" ] || die "Working tree is dirty. Commit or stash first:
$(git status --short | sed 's/^/    /')"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  warn "You are on '$BRANCH', not 'main'."
  read -r -p "  Continue anyway? (y/N): " reply
  [ "$reply" = "y" ] || die "Aborted."
fi

git fetch --quiet origin "$BRANCH" 2>/dev/null || warn "Could not reach origin; skipping the sync check."
if git rev-parse --verify --quiet "origin/$BRANCH" >/dev/null; then
  BEHIND=$(git rev-list --count "HEAD..origin/$BRANCH")
  [ "$BEHIND" -eq 0 ] || die "Branch is $BEHIND commit(s) behind origin/$BRANCH. Pull first."
fi
ok "Tree is clean and up to date."

# ---------- 2. it must build and pass the smoke suite ----------
info ""
info "Building..."
pnpm build >/dev/null || die "Build failed."
ok "Build succeeded."

info ""
info "Running the packaging smoke suite..."
info "${DIM}  (packs a real tarball and generates projects from it — this is the${OFF}"
info "${DIM}   check that the published package is actually usable)${OFF}"
pnpm test || die "Smoke suite failed. Fix it before releasing."
ok "Smoke suite passed."

# ---------- 3. version ----------
CURRENT=$(node -p "require('./package.json').version")
info ""
info "Current version: $CURRENT"
info "  1) patch  — bug fixes only"
info "  2) minor  — new templates, dependency majors, anything that changes generated projects"
info "  3) major  — breaking change to the CLI itself"
info "  4) skip   — keep $CURRENT (only useful if you already bumped)"
read -r -p "Choose (1-4): " choice

case "$choice" in
  1) npm version patch  >/dev/null ;;
  2) npm version minor  >/dev/null ;;
  3) npm version major  >/dev/null ;;
  4) info "Keeping $CURRENT." ;;
  *) die "Invalid choice." ;;
esac

NEW=$(node -p "require('./package.json').version")
[ "$NEW" = "$CURRENT" ] && [ "$choice" != "4" ] && die "Version did not change."
ok "Version: $NEW"

# ---------- 4. push ----------
info ""
read -r -p "Push commit and tag v$NEW to origin? (y/N): " confirm
[ "$confirm" = "y" ] || die "Aborted. Nothing was pushed (the local commit and tag remain)."

git push --follow-tags
ok "Pushed."

# ---------- 5. hand over to CI ----------
REPO=$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')
info ""
info "Now create the GitHub release — that is what publishes to npm:"
info ""
info "  https://github.com/$REPO/releases/new?tag=v$NEW"
info ""
info "The workflow will build, run the smoke suite again on a clean checkout,"
info "and publish $NEW to npm."
info ""
info "Afterwards, verify with:  npm view create-vandslab-app version"

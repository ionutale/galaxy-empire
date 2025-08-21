#!/usr/bin/env bash
# Remove committed build artifacts and local DB from the repository index
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

echo "Removing app/build, app/.svelte-kit and app/local.db from git tracking (but keeping files locally)..."
git rm -r --cached app/build || true
git rm -r --cached app/.svelte-kit || true
git rm --cached app/local.db || true

echo "Committing removal and updating .gitignore (ensure .gitignore contains these entries)"
git add .gitignore
git commit -m "chore: stop tracking build artifacts and local DB (added to .gitignore)" || true

echo "Done. Push the changes to apply to remote"

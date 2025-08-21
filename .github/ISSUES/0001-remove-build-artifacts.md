Title: Remove committed build artifacts and `local.db` and add them to `.gitignore`

Problem:
The repository contains generated/build artifacts (`app/build/`, `app/.svelte-kit/`) and a local SQLite DB (`app/local.db`). These increase repo size, cause noise in diffs, and can leak local state.

Suggested fix:
1. Add entries to `.gitignore` (already present in repo, verify):
   - `/app/build/`
   - `/app/.svelte-kit/`
   - `/app/local.db`
2. Stop tracking them and commit the change:
   ```bash
   git rm -r --cached app/build app/.svelte-kit
   git rm --cached app/local.db
   git commit -m "chore: stop tracking build artifacts and local DB"
   ```
3. Optionally purge history with `git filter-repo` if you need to shrink repo size.

Labels: cleanup, housekeeping, low priority

Title: Reduce `any` usage and add stronger TS typing for game data/state

Problem:
Many files use `any` (e.g., `app/src/lib/data/gameData.ts`, route handlers) reducing type safety.

Suggested fix (incremental):
1. Add `@typescript-eslint/no-explicit-any` as a warning in ESLint.
2. Create `app/src/lib/types.ts` with `PlayerState`, `Building`, `Fleet`, `GameState` and use them in `gameData.ts`.
3. Convert one API route to fully typed and add unit tests.

Labels: tech debt, typescript, high priority

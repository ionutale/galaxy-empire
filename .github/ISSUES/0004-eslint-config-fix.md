Title: Correct ESLint/TypeScript ESLint setup and dependencies

Problem:
The code previously imported a non-standard `typescript-eslint` package. Use the supported `@typescript-eslint` packages.

Suggested fix:
1. Ensure `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` are in devDependencies (done).
2. Update `app/eslint.config.js` to use the parser and plugin (done) and run `npm run lint`.

Labels: tooling, bug, medium priority

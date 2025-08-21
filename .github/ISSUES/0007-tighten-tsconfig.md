Title: Tighten `tsconfig` and eliminate `allowJs`/`checkJs` in source

Problem:
`allowJs` and `checkJs` are enabled in `app/tsconfig.json`, allowing JS to bypass typing.

Suggested fix:
1. Create a migration plan to convert JS files to TS and disable `allowJs`/`checkJs`.
2. Keep `strict: true` and use overrides for legacy folders if needed.

Labels: tech debt, typescript, medium priority

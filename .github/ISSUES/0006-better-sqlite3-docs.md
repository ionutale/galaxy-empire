Title: Document and handle native dependency `better-sqlite3` for CI/developers

Problem:
`better-sqlite3` is native and can break installs in CI or on different developer machines.

Suggested fix:
- Move to `optionalDependencies` or document native build steps in README.
- For CI, either use an image with the dependency preinstalled or add system package installs.

Labels: docs, dependencies, low priority

Title: Add unit/integration tests for API routes under `app/src/routes/api`

Problem:
API routes appear untested and manipulate JSON/state files.

Suggested fix:
- Add Vitest unit tests for handlers with file-system mocks or temp dirs.
- Add Playwright E2E tests for main flows.

Labels: tests, enhancement, medium priority

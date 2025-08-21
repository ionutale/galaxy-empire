Title: Replace console.log in server code with structured logger

Problem:
`console.log` is used in server-side code (some places) which is noisy and unstructured.

Suggested fix:
- Introduce a structured logger (`pino`) configured for dev pretty output and production JSON.
- Replace `console.log` with `logger.info/debug/error` in `app/src/hooks.server.ts` and `app/src/lib/server/worker.ts`.
- Add `LOG_LEVEL` env handling.

Labels: enhancement, logging, medium priority

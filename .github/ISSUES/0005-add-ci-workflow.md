Title: Add GitHub Actions CI for lint/test/build

Problem:
No CI currently present to run lint/test/build on PRs.

Suggested fix:
- Add `.github/workflows/ci.yml` to run install, `npm run lint`, `npm run test`, and `npm run build`.
- Cache node modules and run on Node 18/20 matrix.

Labels: ci, enhancement, medium priority

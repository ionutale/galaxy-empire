CI Setup notes

This document outlines the minimal steps to wire the provided CI templates for Unity client and a generic server.

Unity CI
- Add repo secrets:
  - UNITY_VERSION (e.g., 2021.3.0f1)
  - UNITY_LICENSE or UNITY_SERIAL/UNITY_EMAIL/UNITY_PASSWORD depending on your activation method
- The `webbertakken/unity-builder` action shown is a template; adapt to `game-ci/unity-builder` or your company's preferred action.
- Consider using Unity Cloud Build or a self-hosted runner with Unity installed if licensing is an issue.

Server CI
- The `server-ci.yml` assumes a Node.js-based server. Ensure `package.json` provides `test` and `lint` scripts.
- Add secrets (DB connection string, API keys) via GitHub repository secrets and a staging environment for integration tests.

General
- Protect `main` branch and require CI checks to pass before merge.
- Add deployment workflows (CD) using environment protections for staging and production.

If you want, I can:
- generate example `package.json` and minimal server test to validate the server CI,
- convert the CSV into GitHub Issues via a ticket generator script,
- or produce a runnable Unity CI using a self-hosted runner template.

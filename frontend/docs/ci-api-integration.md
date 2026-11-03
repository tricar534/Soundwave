# Sprint 4 - Frontend API Integration Validation (CI/CD)

## Purpose

Verify the Soundwave frontend's API service (`src/services/api.js`) against
predictable HTTP responses, with automatic enforcement in the existing
GitHub Actions **Frontend CI** job.

## What the tests exercise

`src/services/api.integration.test.js` starts an ephemeral HTTP server on
`127.0.0.1` and makes **real HTTP requests** using the existing `getHealth`,
`getTracks`, and `login` functions. The fixture returns only synthetic data.

| Scenario | Expected behavior |
| --- | --- |
| GET /health returns 200 and JSON | Health data is parsed |
| GET /api/tracks returns 200 and JSON | Catalog data is parsed |
| POST /api/auth/login returns 200 | JSON body uses identifier/password and safe URL |
| Catalog returns 500 | API request rejects |
| Health returns 503 | Health request rejects |
| Login returns 401 | Friendly invalid-credentials message |
| Login returns 503 | Generic message, no internal details |
| Connection is interrupted | Friendly service-unavailable message |
| Login returns malformed JSON | Invalid-response error |
| Login returns HTTP 200 with an error object | Invalid-response error |
| Catalog or health returns malformed JSON | Request rejects |

## Run locally

From `frontend/`:

```bash
npx vitest run src/services/api.integration.test.js
npm test
npm run lint
npm run build
```

## How it runs in CI

The existing `.github/workflows/ci.yml` **Frontend CI** job already installs
frontend dependencies and runs `npm test` for pull requests targeting `main`.
Vitest discovers `src/services/api.integration.test.js` automatically, so no
workflow modification or CI secrets are needed. An assertion failure causes
`npm test` to exit nonzero, which fails the frontend CI job.

The focused Vitest command can be used for local
verification and PR evidence. The GitHub Actions job continues to use `npm test`.

## Scope and limits

This verifies the frontend-to-HTTP boundary using a local fixture server, **not**
the deployed backend, authentication service, or PostgreSQL database. The
login contract is provisionally `POST /api/auth/login` with
`{ "identifier": "...", "password": "..." }` until the backend owner confirms it.

No production API code or CI workflow files are changed by this task. Do not
capture passwords, tokens, or request bodies in screenshots. Capture the test
results and GitHub Actions status instead.

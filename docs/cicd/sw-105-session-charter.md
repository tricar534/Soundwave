# SW-105: Manual negative API test session charter

- Mission: find how the Sprint 4 backend handles bad input, missing resources and unsupported requests, using curl.
- Scope: /health, /api/tracks, /api/tracks/:id, /api/search, and unknown routes on localhost:4000.
- Out of scope: auth (not merged), load and performance.
- Environment: main branch code (run from the SW-230 evidence branch, which only adds docs), Helmet not included, PostgreSQL 18 via docker compose with 4 seeded tracks. Tester: Tanu, 2026-10-31.
- Time box: 45 minutes plus environment setup.
- Method: valid baseline first, then malformed input, missing resources, unsupported requests, auth (N/A).
- Evidence: sw-105-negative-session-output.txt (curl output with status codes).

## Results summary
- First run: 19 requests, 5 invalid because backend/.env was missing and the database was unreachable (catalog routes returned 500). Repeated after fixing the setup.
- Re-run: 7 requests, all as expected.
- Valid requests: 21. Behaved as expected: 16. Defects: 2 (affecting 5 requests).
- Valid baseline confirmed first: /health 200, /api/tracks 200, /api/search 200.
- Malformed input: bad track ids (letters, negative, decimal, overflow, null byte) all 400 JSON; empty, missing and 2000-character search queries all 400 JSON; SQL-style search text safely treated as plain text (200, empty).
- Missing resource: id 999999 returns 404 JSON.
- Auth negative case: not available in this candidate.

## Defects
- D1: Invalid JSON body returns an HTML error page with a stack trace and local file paths (information disclosure). Jira: SW-___
- D2: Unknown routes and unsupported methods return an HTML 404 ("Cannot GET ...") instead of JSON, and unsupported methods return 404 instead of 405. Jira: SW-___
- Setup finding: backend/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) is required but not documented. Not a code defect.

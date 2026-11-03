# SW-120: Catalog search endpoint verification

Verification only. The endpoint was already on main; no code changed in this PR.

| Acceptance criterion | Result | Evidence |
|---|---|---|
| GET /api/search route exists | Met | backend/src/routes/search.routes.ts, mounted in backend/src/app.ts |
| q parameter validated | Met | Must be a string of 1 to 100 characters after trimming, otherwise 400 |
| Matching catalog records returned | Partly met | Matches on title only (see findings). Manual check: q=neon returned "Neon Sky" (sw-105-negative-session-output.txt) |
| Empty or invalid query gets a defined response | Met | 400 {"error":"Search query must be between 1 and 100 characters"} for missing, empty and 2000-character queries (sw-105 output; tests/search.routes.test.ts) |
| Parameterized SQL used | Met | WHERE title ILIKE $1 with the pattern passed as a parameter; SQL-style input returned an empty 200 (sw-105 output) |
| Database failures use standardized errors | Partly met | 500 {"error":"Internal server error"}, tested in tests/search.routes.test.ts. No app-wide error handler exists yet (SW-103). |

## Findings
1. Only the title column is searched. The ticket says "available catalog fields", so artist and album names are not searchable.
2. The query has no is_available filter, so unavailable tracks can be returned.
3. The % and _ characters in q are not escaped, so q=% matches every track.

## Evidence
- Tests: backend/tests/search.routes.test.ts and backend/tests/negativeRoutes.test.ts
- Manual session against the real database: docs/cicd/sw-105-negative-session-output.txt

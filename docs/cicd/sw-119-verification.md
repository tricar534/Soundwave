# SW-119: Database-backed track catalog endpoint verification

Verification only. The change was already on main (extracted into a service in SW-214); no code changed in this PR.

| Acceptance criterion | Result | Evidence |
|---|---|---|
| GET /api/tracks queries PostgreSQL instead of returning [] unconditionally | Met | `getCatalogTracks()` in backend/src/services/track.service.ts runs `SELECT ... FROM tracks ORDER BY id ASC` through the pg Pool. The route calls it. |
| Response contains persisted track records | Met | Returns id, albumId, title, trackNumber, durationMs and isAvailable from the tracks table. Manual check against the seeded database returned 4 tracks (docs/cicd/sw-121-manual-check.txt, included in this PR). |
| Query failure uses standardized error handling | Partly met | The route catches the error, logs it server-side and returns 500 `{"error":"Internal server error"}` with no internal details (tests/routes.test.ts, tests/errorShape.test.ts). This follows the per-route convention. No app-wide error handler exists yet (SW-103). |
| Existing /api/tracks route contract preserved | Met | Response shape is still `{ "tracks": [...], "count": n }`, tested in tests/routes.test.ts. SW-121 later adds optional limit and offset without changing the shape. |
| No Prisma client migration introduced | Met | backend/package.json has no Prisma dependency and the service imports only the pg Pool from backend/src/db. Prisma exists only under database/ for schema migrations. |

## Findings
1. Error handling is per route, not shared. It matches the existing convention but is not a standardized handler (see SW-103).
2. The catalog query returns unavailable tracks too (no is_available filter). The ticket does not require filtering, but it should be decided explicitly.

## Evidence
- Code: backend/src/services/track.service.ts, backend/src/routes/track.routes.ts
- Tests: backend/tests/routes.test.ts, backend/tests/errorShape.test.ts
- Manual check against the real database: docs/cicd/sw-121-manual-check.txt (GET /api/tracks returned 4 seeded tracks, HTTP 200)

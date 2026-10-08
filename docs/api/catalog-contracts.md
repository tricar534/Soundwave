# Soundwave Catalog API Contracts

**Sprint:** 3  
**Owner:** Role E - Integration / Quality Automation  
**Scope:** Frontend <-> backend catalog API agreement  
**Status:** Existing behavior recorded; future DTOs/routes proposed for team review

## 1. Purpose

I am documenting the catalog request and response formats so the frontend and backend can integrate against a consistent contract. This document deliberately separates **currently implemented** endpoints from **proposed** Sprint 3 endpoints. The proposed responses are not claims about running functionality. Role B must confirm the actual API behavior, Role C must confirm database-field mapping, and Role A must confirm client data needs before proposed contracts are marked approved.

## 2. Verified baseline (from the current repository)

| Method | Route | Status | Behavior in source |
| --- | --- | --- | --- |
| `GET` | `/health` | **Implemented** | Returns HTTP 200 and `{"status":"ok","service":"soundwave-backend"}`. This checks the Express application, not PostgreSQL connectivity. |
| `GET` | `/api/tracks` | **Implemented (placeholder)** | Returns HTTP 200 and `{"tracks":[],"count":0}`. The handler does not query PostgreSQL. |
| `GET` | `/api/tracks/:id` | **Not implemented** | No track lookup handler is registered. |
| `GET` | `/api/artists` and `/api/artists/:id` | **Not implemented** | No artist routes are registered. |
| `GET` | `/api/albums` and `/api/albums/:id` | **Not implemented** | No album routes are registered. |
| `GET` | `/api/search` | **Not implemented** | The React Search page filters local mock data; this is not a backend search endpoint. |

Source references in this repository:

- `backend/src/app.ts`: actual route registration and `/health` response.
- `backend/src/routes/track.routes.ts`: current empty track-list response.
- `backend/tests/routes.test.ts`: current route-level assertions.
- `frontend/src/services/api.js`: frontend API URL handling and `getTracks()` request.
- `frontend/src/pages/SearchPage.jsx`: placeholder catalog UI and mock-data fallback.
- `database/prisma/schema.prisma`: catalog data model (separate from the current API response).

### 2.1 Implemented contract: `GET /api/tracks`

**Path:** `/api/tracks`  
**Method:** `GET`  
**Parameters:** none currently handled  
**Current success status:** `200 OK`  
**Current success body:**

```json
{
  "tracks": [],
  "count": 0
}
```

Confirmed response shape: `tracks` is an array; `count` is a number matching the array length. **No track-item field names or types can be verified yet** because the handler returns an empty array. The exact existing shape is modeled by `CurrentTracksResponse` in `shared/contracts/catalog.ts`.

### 2.2 Implemented contract: `GET /health` (supporting reference)

```json
{
  "status": "ok",
  "service": "soundwave-backend"
}
```

`GET /health` does **not** prove database connectivity and should not be documented as a catalog/data-readiness test.

## 3. Database-to-API mapping considerations

The Prisma schema already defines `Artist`, `Album`, `Track`, `TrackArtist`, and `AlbumArtist`. These are database models, **not** currently published API DTOs. Any transformation must be agreed with Role B before use.

| Prisma field/relationship | Meaning | Proposed JSON representation |
| --- | --- | --- |
| `Track.id`, `Artist.id`, `Album.id` (`BigInt`) | Database primary keys | Decimal **string** IDs, e.g. `"12"`, to avoid JSON BigInt serialization errors. |
| `Track.title` | Track title | `title: string` |
| `Track.durationMs` | Duration in milliseconds | `durationMs: number` (not seconds). |
| `Track.trackNumber` | Optional album position | `trackNumber: number \| null` |
| `Track.albumId` | Optional album | `albumId: string \| null` |
| `Track.isAvailable` | Availability flag | `isAvailable: boolean` |
| `Track.trackArtists` | Many-to-many track/artists | `artists: ArtistSummary[]`; **not** a single `artistId`. |
| `Album.albumArtists` | Many-to-many album/artists | `artists: ArtistSummary[]`. |
| `Album.releaseDate` (`DateTime?`, SQL `DATE`) | Optional release date | `releaseDate: "YYYY-MM-DD" \| null`. |

The frontend currently uses **JavaScript/JSX**, not TypeScript. The proposed `shared/contracts/catalog.ts` is a future-facing, standalone contract definition; no frontend import changes are required for this task.

## 4. Proposed catalog contracts (NOT yet implemented)

These are recommended DTO shapes and routes for review, not runtime guarantees. A proposed route must not be described as supported until Role B implements and reviews it.

### 4.1 Proposed `GET /api/tracks` populated response

The existing envelope (`tracks`, `count`) should remain stable. Proposed track fields, when real records are returned:

```json
{
  "tracks": [
    {
      "id": "1",
      "title": "Midnight Drive",
      "albumId": "1",
      "trackNumber": 1,
      "durationMs": 214000,
      "isAvailable": true,
      "artists": [
        { "id": "1", "name": "The Night Waves" }
      ]
    }
  ],
  "count": 1
}
```

**Illustration only:** the sample data reflects names/values from `database/prisma/seed.ts`, but the numeric IDs shown here are examples, not guaranteed values after reseeding. This format is modeled as `ProposedTracksResponse` and `CatalogTrack`.

### 4.2 Proposed `GET /api/tracks/:id`

- Path parameter: `id` as a decimal string.
- `200 OK`: `CatalogTrack` object.
- `400 Bad Request`: invalid ID format (proposal).
- `404 Not Found`: no matching track (proposal).
- No lookup route currently exists; Role B owns its implementation.

### 4.3 Proposed `GET /api/artists` and `GET /api/artists/:id`

- Suggested artist fields: `id: string`, `name: string`, `bio: string | null`.
- Artist list envelope proposal: `{ "artists": [ ... ], "count": 1 }`.
- Single-artist response proposal: `CatalogArtist` object.
- Routes and response formats require Role B/Role A approval.

### 4.4 Proposed `GET /api/albums` and `GET /api/albums/:id`

- Suggested album fields: `id: string`, `title: string`, `releaseDate: string | null`, `artists: ArtistSummary[]`.
- Album list envelope proposal: `{ "albums": [ ... ], "count": 1 }`.
- Single-album response proposal: `CatalogAlbum` object.
- Routes and response formats require Role B/Role A approval.

### 4.5 Proposed `GET /api/search?q=<query>`

- Proposed query parameter: `q` (nonblank string).
- Proposed success body: `{ "query": "midnight", "tracks": [], "artists": [], "albums": [] }` with matching DTOs in each array.
- Proposed negative behavior: blank input -> `400`; valid query with no matches -> `200` and empty arrays.
- This route is **not currently implemented**. `SearchPage.jsx` filters local mock data instead.

### 4.6 Proposed error envelope (requires team approval)

```json
{
  "error": {
    "code": "TRACK_NOT_FOUND",
    "message": "The requested track was not found."
  }
}
```

Proposed status conventions: `200` success, `400` invalid query/ID, `404` missing resource, `500` unexpected server failure. The backend **does not currently implement a common JSON catalog error handler**, so these are decisions for Role B rather than observed behavior. Do not expose SQL details, credentials, stack traces, or server file paths in client errors.

## 5. Integration agreement and handoff

Before accepting the proposed definitions as implemented contracts:

1. **Role B (Backend):** confirm paths, ID serialization, response envelopes, status codes, error formats, and actual route payloads.
2. **Role C (Database):** verify mappings for nullable fields, `BigInt` IDs, track/artist junctions, and album/artist junctions.
3. **Role A (Frontend):** confirm fields needed to display cards, search results, album/artist labels, and error states; the current UI uses local mock content.
4. **Role E (this task):** update this document to match agreed details and mark each route implemented only when its source handler exists.
5. **Role D (CI/CD):** no work required for this task; future CI execution remains Role D's responsibility.

## 6. Completion checklist

- [x] Inspect registered Express endpoints and current response envelopes.
- [x] Inspect frontend API calls and Search page integration behavior.
- [x] Inspect Prisma catalog entities and their relationship types.
- [x] Record current endpoint behavior distinctly from proposals.
- [x] Draft shared DTO interfaces for team review.
- [ ] Obtain Role A/B/C review of proposed field names, paths, and statuses.
- [ ] Update proposals as needed and obtain PR approval.
- [ ] Merge documentation and standalone contract definitions through a reviewed PR.

## 7. Follow-on work

- Role B: build populated database-backed catalog APIs and approved JSON error behavior.
- Role A: map actual DTOs into UI components and replace/mock fallback behavior when ready.
- Role E Testing: automated backend/database smoke and negative-path checks.
- Role E CI/CD: reusable integration runner, CI-safe configuration, result output.

# Soundwave Backend

The Soundwave backend is a Node.js, TypeScript, and Express API server that provides music catalog functionality, PostgreSQL connectivity, input validation, and automated testing.

The backend supports the Soundwave frontend by providing track metadata, track-title search, and application health information.

## 1. Getting Started

### Requirements

Before running the backend, install:

- Node.js 24 (used by the current GitHub Actions workflow)
- npm
- Docker and Docker Compose
- The Soundwave repository

PostgreSQL is managed through the project's `database` directory.

### Install Dependencies

From the `backend` directory:

```bash
npm ci
```

Use `npm install` when intentionally modifying project dependencies.

### Configure Environment Variables

Create a local environment file:

```bash
cp .env.example .env
```

Example configuration:

```env
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_USER=soundwaves_dev
DB_PASSWORD=change_me
DB_NAME=soundwaves
```

Update the credentials to match your local PostgreSQL configuration.

Do not commit `.env` or private credentials.

### Start PostgreSQL

From the `database` directory:

```bash
docker compose up -d
docker compose ps
```

For a new database, apply the committed Prisma migrations and seed data according to the database project's documentation.

### Start the Backend

From the `backend` directory:

```bash
npm run dev
```

By default, the backend runs at:

http://localhost:4000/

## 2. Backend API Directory

The backend provides a simple HTML homepage for development and API exploration.

**URL:** http://localhost:4000/

The homepage contains clickable links to the implemented GET endpoints:

| Endpoint | Description |
|---|---|
| `GET /health` | Backend server health |
| `GET /ready` | PostgreSQL readiness |
| `GET /api/tracks` | Track catalog |
| `GET /api/tracks/:id` | Individual track details |
| `GET /api/search?q=...` | Track-title search |

This directory makes API functionality easier to access during frontend integration, development, testing, and demonstrations.

The homepage is a lightweight API reference and does not replace the Soundwave frontend, which runs separately through Vite.

## 3. Backend API Contract

All currently documented endpoints use the HTTP GET method.

API responses are returned as JSON, except for the HTML homepage.

### 3.1 GET /health

**Purpose:** Verify that the Express backend server is running.

**Parameters:** None.

**Example request:**

```bash
curl -i http://localhost:4000/health
```

**Success — HTTP 200:**

```json
{
  "status": "ok",
  "service": "soundwave-backend"
}
```

**Limitations:** This endpoint does not verify PostgreSQL connectivity. Use `/ready` for database readiness.

### 3.2 GET /ready

**Purpose:** Verify that the backend can successfully communicate with PostgreSQL.

**Parameters:** None.

**Example request:**

```bash
curl -i http://localhost:4000/ready
```

**Success — HTTP 200:**

```json
{
  "status": "ready",
  "database": "connected"
}
```

**Database unavailable — HTTP 503:**

```json
{
  "status": "not_ready",
  "database": "unavailable"
}
```

The endpoint executes a database connectivity check and returns a safe error response when PostgreSQL is unavailable.

Internal database errors and credentials are not exposed.

### 3.3 GET /api/tracks

**Purpose:** Retrieve track metadata from the PostgreSQL catalog.

**Parameters:** None.

**Example request:**

```bash
curl -i http://localhost:4000/api/tracks
```

**Success — HTTP 200:**

```json
{
  "tracks": [
    {
      "id": "17",
      "albumId": "3",
      "title": "Midnight Drive",
      "trackNumber": 1,
      "durationMs": 210000,
      "isAvailable": true
    }
  ],
  "count": 1
}
```

*Example values are illustrative. Actual values depend on the current database.*

**Behavior:**

- Retrieves track metadata from PostgreSQL.
- Returns records ordered by track ID ascending.
- Returns the number of retrieved records in `count`.
- Uses string values for PostgreSQL BIGINT identifiers.
- Returns an empty array and count of zero when no tracks are present.

**Database error — HTTP 500:**

```json
{
  "error": "Internal server error"
}
```

**Limitations:** This endpoint returns metadata and does not stream music files.

### 3.4 GET /api/tracks/:id

**Purpose:** Retrieve one track using its PostgreSQL identifier.

**Path parameter:** `id` — a valid positive PostgreSQL BIGINT identifier.

**Example request:**

```bash
curl -i http://localhost:4000/api/tracks/17
```

**Success — HTTP 200:**

```json
{
  "track": {
    "id": "17",
    "albumId": "3",
    "title": "Midnight Drive",
    "trackNumber": 1,
    "durationMs": 210000,
    "isAvailable": true
  }
}
```

*Example values are illustrative.*

**Invalid identifier — HTTP 400:**

```json
{
  "error": "Invalid track ID"
}
```

**Track not found — HTTP 404:**

```json
{
  "error": "Track not found"
}
```

**Database error — HTTP 500:**

```json
{
  "error": "Internal server error"
}
```

**Validation behavior:**

- Accepts positive numeric string IDs.
- Rejects zero and negative values.
- Rejects malformed identifiers.
- Rejects leading zeros.
- Rejects identifiers exceeding `9223372036854775807`.
- Uses a parameterized SQL query.

**Limitations:** The endpoint retrieves track metadata, not the audio file.

### 3.5 GET /api/search

**Purpose:** Search track titles using PostgreSQL.

**Query parameter:** `q` — a search string containing 1–100 characters after trimming whitespace.

**Example request:**

```bash
curl -i "http://localhost:4000/api/search?q=midnight"
```

**Success — HTTP 200:**

```json
{
  "tracks": [
    {
      "id": "17",
      "albumId": "3",
      "title": "Midnight Drive",
      "trackNumber": 1,
      "durationMs": 210000,
      "isAvailable": true
    }
  ],
  "count": 1
}
```

*Example values are illustrative.*

**Behavior:**

- Searches track titles using PostgreSQL `ILIKE`.
- Matching is case-insensitive.
- Uses parameterized SQL.
- Returns up to 50 matching tracks.
- Orders results by title, then track ID.
- Returns an empty array when no records match.

**Invalid query — HTTP 400:**

```json
{
  "error": "Search query must be between 1 and 100 characters"
}
```

**Database error — HTTP 500:**

```json
{
  "error": "Internal server error"
}
```

**Invalid inputs include:**

- Missing query parameter.
- Empty query.
- Whitespace-only query.
- Query longer than 100 characters.

**Limitations:** The endpoint currently searches track titles only. Artist, album, and full-text search capabilities are outside this implementation.

## 4. Backend Architecture

The backend uses separate layers to keep HTTP handling, database queries, validation, and infrastructure responsibilities organized.

**Request flow:**

API Client → Express Route → Service Function → PostgreSQL → JSON Response

### Express Routes

`src/routes/track.routes.ts`

Handles track catalog and individual track retrieval.

`src/routes/search.routes.ts`

Handles search-query validation and track-title search.

`src/routes/readiness.routes.ts`

Checks PostgreSQL connectivity and reports readiness.

### Service Layer

`src/services/track.service.ts`

Provides reusable database functions:

- `getCatalogTracks()`
- `getTrackById(id)`
- `searchTracks(query)`

The service layer uses the existing `pg` connection pool and parameterized SQL queries.

### Validation Utilities

`src/utils/validateTrackId.ts`

Provides track ID validation, including PostgreSQL BIGINT validation.

`src/utils/normalizeTrackId.ts`

Provides existing track ID normalization functionality.

### Request Diagnostics

`src/middleware/requestDiagnostics.ts`

Provides request diagnostics for HTTP activity.

The middleware is registered in `app.ts` before the API routes.

### Database Responsibilities

The backend uses `pg` for application-level database access.

The separate `database` project uses Prisma for schema management, migration deployment, and seeding.

## 5. Backend Project Structure

```text
backend/
├── src/
│   ├── middleware/
│   │   └── requestDiagnostics.ts
│   ├── routes/
│   │   ├── readiness.routes.ts
│   │   ├── search.routes.ts
│   │   └── track.routes.ts
│   ├── services/
│   │   └── track.service.ts
│   ├── utils/
│   │   ├── normalizeTrackId.ts
│   │   └── validateTrackId.ts
│   ├── app.ts
│   ├── db.ts
│   └── index.ts
├── scripts/
├── tests/
├── .env.example
├── .env.integration.example
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

Generated build files and local environment files are excluded from this overview.

## 6. Testing and Validation

### Standard Backend Commands

Run from the `backend` directory:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
npm test
```

### Testing Tools

- Vitest — Unit and backend tests.
- Supertest — Express API route testing.
- TypeScript — Static typechecking and compilation.
- ESLint — Code-quality validation.

### Automated Test Coverage

The backend test suite includes:

- Health endpoint behavior.
- Track catalog retrieval.
- Individual track retrieval.
- Track ID normalization and validation.
- PostgreSQL BIGINT boundary testing.
- Track-title search.
- Missing and malformed request handling.
- Nonexistent track responses.
- Simulated PostgreSQL failures.
- Safe HTTP 500 responses.
- SQL parameterization.

The standard automated tests use mocked database responses where appropriate.

### Verified Sprint 3 Local Results

| Check | Result |
|---|---|
| Dependency installation | PASS |
| Backend build | PASS |
| Backend lint | PASS |
| TypeScript typecheck | PASS |
| Backend tests | 35 passed |
| Active test files | 5 passed |
| Skipped integration tests | 3 |
| TODO test cases | 2 |

Database integration testing is not fully executed by the default `npm test` command.

### Optional Database Integration Testing

The backend provides an additional integration test command that requires a running, migrated, and seeded PostgreSQL database.

```bash
npm run ci:integration
```

**Verified result:** 3 integration tests passed, with 2 additional test cases marked TODO.

Additional integration environment validation and reporting scripts are available in `backend/package.json`. These require a separately configured integration environment, as described by `.env.integration.example`, and are not part of the standard local validation process.

## 7. CI/CD

Soundwave uses GitHub Actions to validate changes submitted through pull requests and updates to `main`.

The backend validation pipeline includes:

- **Backend CI:** Installs dependencies, compiles the TypeScript backend, runs automated tests, and uploads the compiled build artifact.
- **Backend Lint:** Runs ESLint validation.
- **Backend Database Integration Smoke Test:** Starts PostgreSQL, applies migrations, builds and starts the backend, and verifies application health.
- **CI Validation Summary:** Reports the outcome of required CI jobs.

Developers should ensure relevant automated checks pass before merging backend changes.

## 8. Known Limitations and Future Work

The Sprint 3 backend provides foundational track catalog and search functionality.

The following capabilities are not included in the reviewed API implementation:

- Artist-specific retrieval endpoints.
- Album-specific retrieval endpoints.
- User authentication and authorization APIs.
- Audio streaming and media delivery endpoints.
- Playlist or personal music library endpoints.
- Advanced catalog search beyond track titles.

Additional considerations:

- The API returns track metadata rather than audio content.
- Search responses are limited to 50 records.
- The local PostgreSQL environment must be configured correctly for database-backed requests.
- Some dedicated database integration tests remain skipped or incomplete under the standard test command.
- The backend HTML homepage is a developer-oriented endpoint directory, not the complete Soundwave application.

The backend will continue supporting frontend integration, database development, testing, and future media-streaming functionality.

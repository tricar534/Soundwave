# Soundwave Backend

Backend API server for the Soundwave music streaming application.

## Quick Start

### Requirements

Before running the backend, make sure you have:

- Node.js
- npm
- PostgreSQL running through the Soundwave database setup
- the Soundwave repository cloned locally

The backend currently connects to PostgreSQL using the `pg` Node.js package.

### 1. Install Dependencies

From the `backend` directory:

```bash
npm ci
```

Use `npm install` when intentionally adding or updating dependencies.

### 2. Configure Environment Variables

Copy the example environment file from the repository root:

```bash
cd backend
cp .env.example .env
```

Then update `.env` if your local database settings are different.

Example configuration:

```env
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_USER=soundwaves_dev
DB_PASSWORD=change_me
DB_NAME=soundwaves
```

Do not commit private credentials in `.env`.

The `database` project has its own environment configuration for Docker, PostgreSQL, and Prisma.

### 3. Start the Database

From the `database` directory:

```bash
docker compose up -d
```

Verify that PostgreSQL is running:

```bash
docker compose ps
```

### 4. Start the Backend

Return to the backend directory and run:

```bash
npm run dev
```

The backend runs on:

`http://localhost:4000`

unless another PORT is configured.

### 5. Verify the Backend

Health endpoint:

```bash
curl http://localhost:4000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "soundwave-backend"
}
```

Current track endpoint:

```bash
curl http://localhost:4000/api/tracks
```

Current response:

```json
{
  "tracks": [],
  "count": 0
}
```

The track endpoint currently provides the API response structure but does not yet retrieve track records from PostgreSQL.

### 6. Run Backend Validation

Before submitting backend work, run:

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

Current backend tests use Vitest and Supertest.
The current test suite covers:

- backend health endpoint;
- track-list response structure;
- track ID normalization;
- track ID validation.

## Backend Overview

The Soundwave backend is built with Node.js, TypeScript, and Express.
Its current responsibilities include:

- running the Soundwave HTTP API
- providing backend health status
- providing the initial track/catalog API structure
- supporting PostgreSQL connectivity
- validating and normalizing track identifiers
- supporting automated backend tests

## Current Technology Stack

- Node.js — backend runtime
- TypeScript — backend language and type checking
- Express — API routing and HTTP server
- PostgreSQL — application database
- pg — PostgreSQL driver used by the backend
- dotenv — environment variable loading
- cors — frontend/backend request support
- Vitest — automated testing
- Supertest — API route testing
- ESLint — linting and code-quality checks
- tsx — TypeScript development server

The separate database project uses Prisma for schema management, migrations, seeding, and database validation.

## Project Structure

```plain text
backend/
├── src/
│   ├── routes/
│   │   └── track.routes.ts
│   ├── utils/
│   │   ├── normalizeTrackId.ts
│   │   └── validateTrackId.ts
│   ├── app.ts
│   ├── db.ts
│   └── index.ts
├── tests/
│   ├── normalizeTrackId.test.ts
│   ├── routes.test.ts
│   └── validateTrackId.test.ts
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Current Status and Planned Work

Currently implemented:

- Express/TypeScript backend
- /health endpoint
- /api/tracks response structure
- PostgreSQL connection setup
- track ID normalization and validation
- Vitest and Supertest coverage
- ESLint and TypeScript build validation

## Planned Sprint 3 work

- connect track/catalog routes to PostgreSQL
- return real track data
- add track detail functionality
- expand artist and album API functionality
- add validation and controlled error responses
- expand backend route testing
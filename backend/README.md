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
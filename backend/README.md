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

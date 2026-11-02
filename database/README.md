# Soundwaves Database

This directory contains the PostgreSQL development database, Prisma schema, migrations, seed data, and database validation tools for the Soundwave music-streaming application.

The database stores music catalog metadata, user accounts, roles, session information, and references to media files. The backend is responsible for accessing the database and providing data to the frontend through API endpoints.

## Technology

- PostgreSQL 18.6 — Relational database
- Docker Compose — Local PostgreSQL environment
- Prisma 7 — Schema management, migrations, and development data access
- Node.js `pg` — PostgreSQL connectivity used by the backend
- TypeScript — Database scripts and automated tests
- UTF-8 encoding and UTC timezone — Development environment configuration

## Database Architecture

Soundwave follows a client-server architecture.

Frontend → Backend API → PostgreSQL Database

The backend uses the Node.js `pg` library to execute SQL queries for existing API functionality. Prisma manages the database schema and migrations and is also used by database seed and validation scripts.

The frontend does not connect directly to PostgreSQL.

## Database Schema

The current Prisma schema defines 12 models organized into three main areas.

**Music Catalog**
- `Artist` — Artist information
- `Album` — Albums and associated artwork
- `Track` — Music track metadata
- `Genre` — Music genres
- `TrackArtist` — Track-to-artist relationships
- `AlbumArtist` — Album-to-artist relationships
- `TrackGenre` — Track-to-genre relationships

**Media References**
- `Artwork` — Artwork metadata and file paths
- `MediaFile` — Audio file metadata and file paths

**Authentication and Accounts**
- `Role` — User roles
- `User` — Accounts, password hashes, and account status
- `Session` — Session token hashes, expiration, and revocation information

The database uses primary keys, foreign keys, unique indexes, and SQL check constraints to protect data integrity.

Detailed table descriptions and relationships are available in the [Data Dictionary](../docs/database/data_dictionary.md) and [Entity Relationship Diagram](../docs/database/ERD.png).

## Local Development Setup

### 1. Configure the environment

From the `database/` directory, create a local environment file using the provided example.

```bash
cp .env.example .env
```

Review the environment configuration before starting PostgreSQL. Do not commit `.env` files or database credentials.

### 2. Start PostgreSQL

```bash
docker compose up -d
```

Check container status:

```bash
docker compose ps
```

### 3. Install database dependencies

```bash
npm ci
```

### 4. Validate the Prisma schema

```bash
npm run db:validate
```

### 5. Apply existing migrations

For a newly initialized development database:

```bash
npm run db:deploy
```

Check migration status:

```bash
npm run db:status
```

### 6. Generate Prisma Client

```bash
npm run db:generate
```

## Prisma and Database Commands

| Command | Purpose |
|---|---|
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:format` | Format the Prisma schema |
| `npm run db:status` | Check migration status |
| `npm run db:migrate` | Create and apply development migrations |
| `npm run db:deploy` | Apply existing migration files |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Reset and populate development data |
| `npm run typecheck` | Validate TypeScript types |
| `npm run test:db` | Execute database validation tests |

Schema changes should be coordinated with the team and submitted through pull requests and peer review.

## Database Migrations

Prisma migrations are located in `prisma/migrations/`.

The repository currently contains four migration directories covering the baseline schema, music catalog structures, user access tables, and relationship/search indexes.

Migrations are version-controlled so database changes can be reproduced across development and testing environments.

A migration reproducibility script is available at:

`tests/migration-reproducibility.sh`

The script creates a temporary PostgreSQL database, applies existing migrations, verifies that the 12 expected tables exist, and removes the temporary database during cleanup.

This script requires suitable PostgreSQL credentials and database creation permissions. It should only be executed against an approved development or CI PostgreSQL server.

## Development Seed Data

The seed script is located at `prisma/seed.ts`.

It provides development data for:
- User and administrator roles
- Demonstration user accounts
- Artists, albums, and genres
- Music tracks and relationships
- Artwork and media file references

**Warning:** Running `npm run db:seed` deletes existing records from the application's tables before recreating development data. Only execute it against a disposable or intentionally resettable development database.

Demo account password-hash values are placeholders and are not suitable for real authentication.

## Database Testing

Automated tests are located in `tests/`.

**Database Integration Tests**

`database-validation.test.ts`

Contains tests for PostgreSQL connectivity, unique constraints, foreign keys, catalog data integrity, media relationships, and seed data.

**Schema Inspection Tests**

`schema-constraints.test.ts`

Checks selected Prisma model definitions for required uniqueness constraints.

To execute the database test suite:

```bash
npm run test:db
```

Use an appropriately configured development or test database. The integration tests perform database inserts and deletes and require compatible seed data.

A separate migration reproducibility script verifies database initialization using a temporary database.

See [Migration Testing Guide](./migrations-test-guide.md) for additional migration testing information.

## Database Security and Integrity

The database includes:
- Unique constraints for usernames, emails, role names, and session token hashes
- Foreign key relationships between users, roles, and sessions
- Session expiration and revocation fields
- SQL check constraints for invalid or empty values
- Password-hash storage instead of a plaintext-password field

Password hashing, authentication validation, authorization, and session enforcement are backend responsibilities. The existence of these database structures does not independently establish that authentication is implemented.

PostgreSQL credentials should remain in local environment configuration and must not be committed to the repository.

Development database network access should be restricted to trusted interfaces. The actual exposed ports depend on the active Docker Compose configuration.

## Related Documentation

Detailed database design and implementation documents are available in `docs/database/`:

- [Database Requirements](../docs/database/database_requirements.md)
- [Database Design Decisions](../docs/database/database_decisions.md)
- [Data Dictionary](../docs/database/data_dictionary.md)
- [Entity Relationship Diagram](../docs/database/ERD.png)
- [Local Database Setup](../docs/database/local_setup.md)
- [Database Validation Documentation](../docs/database/database_validation_tests.md)

These documents describe the original database requirements, design decisions, and validation approach. The Prisma schema and migrations should be consulted for the current implemented structure.

## Current Implementation Notes

The database includes existing authentication-related models, but backend authentication functionality is being developed separately.

Additional features such as playlists, playback history, and user preferences may require future schema development according to project priorities.

Changes to database models, migrations, or configuration should be tested and reviewed before integration into `main`.
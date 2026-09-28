## Requirements

- Docker
- Docker Compose
- Node.js
- npm

## Database Technology

Soundwaves uses PostgreSQL for its relational database.

The local development database runs through Docker Compose so all
developers use the same database environment.

Prisma is used for database schema management, migrations, seeding, and
database access during development.

## Initial Setup

From the `database` directory, copy the example environment file:

```bash
cp .env.example .env
````

Update the values in `.env` if necessary.

The `DATABASE_URL` environment variable must contain the PostgreSQL
connection string used by Prisma.

Credentials must be configured using `.env`.

Real credentials should never be committed to GitHub.

## Install Database Dependencies

From the `database` directory, install the project dependencies:

```bash
npm install
```

## Start the Database

Start the PostgreSQL container:

```bash
docker compose up -d postgres
```

## Check Container Status

Check that PostgreSQL is running:

```bash
docker compose ps
```

The PostgreSQL container should report a healthy status.

## View Logs

To view PostgreSQL container logs:

```bash
docker compose logs postgres
```

## Prisma Client Generation

Generate the Prisma client after installing dependencies or there are
changes are made to the Prisma schema:

```bash
npx prisma generate
```

The generated Prisma client is stored in the configured
`generated/prisma` directory.

## Apply Database Migrations

Apply the version-controlled migrations with:

```bash
npx prisma migrate deploy
```

This creates the database tables, relationships, indexes, and
constraints defined by the project migrations.

## Seed the Database

After migrations have been applied, populate the database with
deterministic development data:

```bash
npx prisma db seed
```

The seed script is located at:

```text
prisma/seed.ts
```

The seed data provides known development records required for testing
and local development.

## Run Database Validation Tests

Run the (Sprint 1) database validation suite with:

```bash
npm run test:db
```

The validation suite checks:

* Database connectivity
* Duplicate username rejection
* Duplicate email rejection
* Foreign-key enforcement
* Positive track duration enforcement
* Required track title enforcement
* Duplicate track-artist relationship prevention

A successful test run should report:

```text
tests 7
suites 1
pass 7
fail 0
```

## Connect to PostgreSQL

To connect directly to the PostgreSQL database using `psql`:

```bash
docker compose exec postgres psql \
  -U soundwaves_dev \
  -d soundwaves
```

## Verify PostgreSQL

Inside `psql`, run:

```sql
SELECT version();
```

Check the configured time zone:

```sql
SHOW timezone;
```

Check the database encoding:

```sql
SHOW server_encoding;
```

Expected values:

* Time zone: UTC
* Encoding: UTF8

## Database Configuration

Default development values:

| Setting   | Value      |
| --------- | ---------- |
| Host      | localhost  |
| Port      | 5432       |
| Database  | soundwaves |
| Time zone | UTC        |
| Encoding  | UTF-8      |

Database credentials are supplied through the `.env` file and must not
be hard-coded into application source files.

## Complete Setup From a Clean Environment

A developer setting up the Soundwaves database for the first time can
use the following sequence from the `database` directory:

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run test:db
```

After these commands complete successfully, the local Soundwaves
database is ready for development.

## Stop the Database

Stop the running database containers:

```bash
docker compose down
```

## Stop and Delete Database Data

Remember, his deletes the local development database and its stored
Docker volume.

```bash
docker compose down -v
```

Use this only when a completely clean local database is required.

## Reset and Rebuild the Development Database

To recreate the database from a clean state:

```bash
docker compose down -v
docker compose up -d postgres
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run test:db
```

This process:

1. Deletes the existing local PostgreSQL data.
2. Starts a fresh PostgreSQL container.
3. Applies all database migrations.
4. Generates the Prisma client.
5. Loads the development seed data.
6. Runs the database validation test suite.

If all validation tests pass, the recreated database is ready for use.

## Schema Creation and Updates

The Docker environment only creates the PostgreSQL service.

The Soundwaves database schema is created and updated using the
project's Prisma migration system.

Database schema changes should be represented by version-controlled
migration files rather than manual changes made directly to the local
database.

## Related Files

Important database files include:

```text
database/
├── docs/
│   ├── local_setup.md
│   └── database_validation.md
├── generated/
│   └── prisma/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   └── database-validation.test.ts
├── package.json
└── package-lock.json
```

## Usage Summary

For normal local development:

```bash
docker compose up -d postgres
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run test:db
```

To stop the environment:

```bash
docker compose down
```

To completely reset the database:

```bash
docker compose down -v
```

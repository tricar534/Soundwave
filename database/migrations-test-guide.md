# DB-06 - Prisma Migration Framework

This folder configures Prisma ORM 7 with PostgreSQL for Soundwaves database migrations.
The application schema is intentionally deferred to DB-07 and DB-08.

## 1. Prerequisites

- The Task 5 PostgreSQL Docker container is running and healthy.
- Node.js is installed.
- A local `.env` exists in this `database/` folder.

From `database/`:

```bash
docker compose up -d
docker compose ps
```

## 2. Merge environment values

If `.env` already exists from Task 5, add this line to it using the same username,
password, port, and database name:

```env
DATABASE_URL="postgresql://soundwaves_dev:change_me@localhost:5432/soundwaves?schema=public"
```

Do not commit `.env`.

## 3. Install Prisma

From `database/`:

```bash
npm install
```

Commit the generated `package-lock.json` so every developer resolves the same dependency tree.

## 4. Validate the Prisma configuration

```bash
npm run db:validate
```

## 5. Check migration status

```bash
npm run db:status
```

On a clean database, the baseline migration should be pending.

## 6. Apply committed migrations

For a clean/reproducible environment, use:

```bash
npm run db:deploy
```

Prisma will create its `_prisma_migrations` history table and record the baseline migration.

Verify in PostgreSQL:

```bash
docker compose exec postgres psql \
  -U soundwaves_dev \
  -d soundwaves \
  -c 'SELECT migration_name, finished_at FROM "_prisma_migrations" ORDER BY started_at;'
```

## 7. Creating future migrations

Starting with DB-07, edit `prisma/schema.prisma`, then create and apply a development migration:

```bash
npm run db:migrate -- --name create_catalog_schema
```

Examples of later migration names:

- `create_catalog_schema`
- `create_user_access_schema`
- `add_catalog_indexes`

Never manually modify an already-merged migration that other developers may have applied.
Create a new migration instead.

## 8. Generate Prisma Client

After models are added in DB-07:

```bash
npm run db:generate
```

Generated client code is written to `generated/prisma/` and is ignored by Git.

## 9. Clean-database verification

Only do this when local data can be deleted:

```bash
docker compose down -v
docker compose up -d
npm run db:deploy
npm run db:status
```

The migration history should rebuild from committed files only.

## 10. Task 6 definition of done

- Prisma configuration is committed.
- Migration files are version controlled.
- `npm run db:validate` succeeds.
- `npm run db:deploy` succeeds against a clean PostgreSQL database.
- `_prisma_migrations` records the baseline migration.
- `npm run db:status` reports the database as up to date.
- `.env` remains untracked.
- `package-lock.json` is committed after `npm install`.

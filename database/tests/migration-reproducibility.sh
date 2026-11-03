
#!/usr/bin/env bash
set -euo pipefail

# SW-152: Support PostgreSQL CLI locally and in GitHub Actions.
psql() {
  if [ -n "$(type -P psql)" ]; then
    command psql "$@"
  else
    docker exec -i \
      -e PGPASSWORD="$PGPASSWORD" \
      soundwaves-postgres psql "$@"
  fi
}

# SW-144: Database Migration Reproducibility Test
# Runs against a disposable PostgreSQL database in CI.

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DATABASE_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
DB_USER="${PGUSER:-soundwaves_dev}"

: "${PGPASSWORD:?PGPASSWORD must be set}"

TEST_DB="soundwaves_migration_$(date +%s)_$$_${RANDOM}"

CREATED=false

cleanup() {
  if [ "$CREATED" = true ]; then
    echo "Removing temporary database: ${TEST_DB}"

    psql \
      -h "$DB_HOST" \
      -p "$DB_PORT" \
      -U "$DB_USER" \
      -d postgres \
      -v ON_ERROR_STOP=1 \
      -c "DROP DATABASE \"${TEST_DB}\" WITH (FORCE);"
  fi
}

trap cleanup EXIT

echo "Creating temporary database: ${TEST_DB}"

psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d postgres \
  -v ON_ERROR_STOP=1 \
  -c "CREATE DATABASE \"${TEST_DB}\";"

CREATED=true

export TEST_DB

export DATABASE_URL="$(node -e '
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = "/" + process.env.TEST_DB;
  url.searchParams.set("schema", "public");
  process.stdout.write(url.toString());
')"
# SW-152: Prevent migrations and seeding against the development database.
node -e '
  const url = new URL(process.env.DATABASE_URL);
  const database = decodeURIComponent(url.pathname.slice(1));

  if (
    database !== process.env.TEST_DB ||
    !database.startsWith("soundwaves_migration_")
  ) {
    console.error("ERROR: Unsafe database target. Stopping.");
    process.exit(1);
  }

  console.log("Verified temporary database target:", database);
'

echo "Applying Prisma migrations..."

cd "$DATABASE_DIR"

npm run db:deploy

echo "Checking migration status..."

npm run db:status

echo "Verifying required database tables..."

TABLE_COUNT=$(psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$TEST_DB" \
  -v ON_ERROR_STOP=1 \
  -tAc "
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'artists',
        'albums',
        'tracks',
        'genres',
        'artwork',
        'media_files',
        'track_artists',
        'album_artists',
        'track_genres',
        'roles',
        'users',
        'sessions'
      );
  ")

echo "Found ${TABLE_COUNT} of 12 required tables"

if [ "$TABLE_COUNT" -ne 12 ]; then
  echo "ERROR: Database schema validation failed."
  exit 1
fi


# --------------------------------------------------
# Sprint 4 - SW-152: Clean Database Initialization
# --------------------------------------------------

# Load demo data into the temporary database.
# DATABASE_URL already points to the disposable test database.
echo "Loading Soundwaves seed data..."

npm run db:seed

# Verify that the expected seed records were created.
echo "Verifying initialized seed data..."

SEED_OK=$(psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$TEST_DB" \
  -v ON_ERROR_STOP=1 \
  -tAc "
    SELECT
      (SELECT COUNT(*) FROM roles WHERE name IN ('USER', 'ADMIN')) = 2
      AND (SELECT COUNT(*) FROM users) = 2
      AND (SELECT COUNT(*) FROM artists) = 3
      AND (SELECT COUNT(*) FROM genres) = 3
      AND (SELECT COUNT(*) FROM albums) = 2
      AND (SELECT COUNT(*) FROM tracks) = 15
      AND (SELECT COUNT(*) FROM media_files) = 4;
  ")

if [ "$SEED_OK" != "t" ]; then
  echo "ERROR: Database seed verification failed."
  exit 1
fi

echo "Seed initialization verification passed."


echo "Migration reproducibility test passed."

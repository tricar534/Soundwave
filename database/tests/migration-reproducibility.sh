
#!/usr/bin/env bash
set -euo pipefail

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

export DATABASE_URL="postgresql://${DB_USER}:${PGPASSWORD}@${DB_HOST}:${DB_PORT}/${TEST_DB}?schema=public"

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

echo "Migration reproducibility test passed."

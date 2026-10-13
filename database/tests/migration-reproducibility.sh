#!/usr/bin/env bash
set -euo pipefail

# Sprint 3 - SW-144
# Verify Soundwave migrations against a clean test database.

TEST_DB="soundwaves_migration_test"

export PGPASSWORD="${PGPASSWORD:?PGPASSWORD is required}"

cleanup() {
  echo "Cleaning up temporary migration test database..."

  psql -h localhost -U soundwaves_dev -d postgres \
    -c "DROP DATABASE IF EXISTS ${TEST_DB} WITH (FORCE);" || true
}

trap cleanup EXIT

echo "Creating clean migration test database..."

psql -h localhost -U soundwaves_dev -d postgres \
  -c "CREATE DATABASE ${TEST_DB};"

export DATABASE_URL="postgresql://soundwaves_dev:${PGPASSWORD}@localhost:5432/${TEST_DB}?schema=public"

echo "Applying Soundwave migrations..."

cd database
npm run db:deploy

echo "Checking migration status..."

npm run db:status

echo "Verifying required database tables..."

TABLE_COUNT=$(psql -h localhost -U soundwaves_dev -d "${TEST_DB}" -tAc "
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

test "${TABLE_COUNT}" -eq 12

echo "Migration reproducibility test passed."
# Soundwaves Local Database Setup

## Requirements

- Docker
- Docker Compose

## Database Technology

Soundwaves uses PostgreSQL for its relational database.

The local development database runs through Docker Compose so all
developers use the same database environment.

## Initial Setup

Copy the example environment file:

cp .env.example .env

Update the values in `.env` if necessary.

## Start the Database

docker compose up -d postgres

## Check Container Status

docker compose ps

The PostgreSQL container should report a healthy status.

## View Logs

docker compose logs postgres

## Connect to PostgreSQL

docker compose exec postgres psql \
  -U soundwaves_dev \
  -d soundwaves

## Stop the Database

docker compose down

## Stop and Delete Database Data

WARNING: This deletes the local development database.

docker compose down -v

## Verify PostgreSQL

Inside psql:

SELECT version();

SHOW timezone;

SHOW server_encoding;

Expected values:

- Time zone: UTC
- Encoding: UTF8

## Database Configuration

Default development values:

| Setting | Value |
|---|---|
| Host | localhost |
| Port | 5432 |
| Database | soundwaves |
| Time zone | UTC |
| Encoding | UTF-8 |

Credentials must be configured using `.env`.

Real credentials must never be committed to GitHub.

## Schema Creation

The Docker environment only creates the PostgreSQL service.

The Soundwaves database schema is created and updated using the
project's migration system.

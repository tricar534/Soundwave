# Soundwaves Sprint 1 Database Validation

## Purpose

This document records validation performed against the Soundwaves
Sprint 1 PostgreSQL database implementation.

The goal of the validation is to verify that the implemented database
schema, migrations, constraints, and seed data behave according to the
Sprint 1 database requirements.

## Environment

- Database: PostgreSQL
- ORM / migration framework: Prisma
- Local environment: Docker Compose
- Test file: `tests/database-validation.test.ts`
- Seed file: `prisma/seed.ts`

## Test Procedure

Database validation is performed against the local PostgreSQL
development database.

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
npx prisma migrate deploy
npx prisma db seed
npm run test:db
(recent local test)
| Test                                | Expected Result                                      | Result |
| ----------------------------------- | ---------------------------------------------------- | ------ |
| Database connection                 | PostgreSQL accepts connection                        | PASS   |
| Duplicate username                  | Database rejects duplicate username                  | PASS   |
| Duplicate email                     | Database rejects duplicate email                     | PASS   |
| Invalid album foreign key           | Database rejects track referencing nonexistent album | PASS   |
| Negative track duration             | Database rejects invalid duration                    | PASS   |
| NULL required track title           | Database rejects missing required title              | PASS   |
| Duplicate track/artist relationship | Database rejects duplicate relationship              | PASS   |


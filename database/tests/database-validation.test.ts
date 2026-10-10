
import "dotenv/config";
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

describe("Soundwaves database validation", () => {
  before(async () => {
    await prisma.$connect();
  });

  after(async () => {
    await prisma.$disconnect();
  });

  test("database connection works", async () => {
    const result = await prisma.$queryRaw`
      SELECT 1 AS connected
    `;

    assert.ok(result);
  });

  test("duplicate usernames are rejected", async () => {
    const suffix = Date.now();
    const username = `test_user_${suffix}`;
    const email1 = `test1_${suffix}@example.com`;
    const email2 = `test2_${suffix}@example.com`;

    const roles = await prisma.$queryRaw<Array<{ id: bigint }>>`
      SELECT id
      FROM roles
      WHERE name = 'USER'
      LIMIT 1
    `;

    assert.equal(roles.length, 1);

    const roleId = roles[0].id;

    try {
      await prisma.$executeRaw`
        INSERT INTO users
          (role_id, username, email, password_hash, is_active, created_at, updated_at)
        VALUES
          (${roleId}, ${username}, ${email1}, 'test_hash', TRUE, NOW(), NOW())
      `;

      await assert.rejects(async () => {
        await prisma.$executeRaw`
          INSERT INTO users
            (role_id, username, email, password_hash, is_active, created_at, updated_at)
          VALUES
            (${roleId}, ${username}, ${email2}, 'test_hash', TRUE, NOW(), NOW())
        `;
      });
    } finally {
      await prisma.$executeRaw`
        DELETE FROM users
        WHERE username = ${username}
      `;
    }
  });

  test("duplicate emails are rejected", async () => {
    const suffix = Date.now();
    const email = `duplicate_${suffix}@example.com`;

    const roles = await prisma.$queryRaw<Array<{ id: bigint }>>`
      SELECT id
      FROM roles
      WHERE name = 'USER'
      LIMIT 1
    `;

    assert.equal(roles.length, 1);

    const roleId = roles[0].id;

    try {
      await prisma.$executeRaw`
        INSERT INTO users
          (role_id, username, email, password_hash, is_active, created_at, updated_at)
        VALUES
          (${roleId}, ${`user_a_${suffix}`}, ${email}, 'test_hash', TRUE, NOW(), NOW())
      `;

      await assert.rejects(async () => {
        await prisma.$executeRaw`
          INSERT INTO users
            (role_id, username, email, password_hash, is_active, created_at, updated_at)
          VALUES
            (${roleId}, ${`user_b_${suffix}`}, ${email}, 'test_hash', TRUE, NOW(), NOW())
        `;
      });
    } finally {
      await prisma.$executeRaw`
        DELETE FROM users
        WHERE email = ${email}
      `;
    }
  });

  test("track cannot reference a nonexistent album", async () => {
    await assert.rejects(async () => {
      await prisma.$executeRaw`
        INSERT INTO tracks
          (album_id, title, duration_ms, is_available, created_at, updated_at)
        VALUES
          (999999999, 'Invalid FK Test', 180000, TRUE, NOW(), NOW())
      `;
    });
  });

  test("track duration must be positive", async () => {
    await assert.rejects(async () => {
      await prisma.$executeRaw`
        INSERT INTO tracks
          (title, duration_ms, is_available, created_at, updated_at)
        VALUES
          ('Invalid Duration Test', -1000, TRUE, NOW(), NOW())
      `;
    });
  });

  test("required track title cannot be null", async () => {
    await assert.rejects(async () => {
      await prisma.$executeRawUnsafe(`
        INSERT INTO tracks
          (title, duration_ms, is_available, created_at, updated_at)
        VALUES
          (NULL, 180000, TRUE, NOW(), NOW())
      `);
    });
  });

  test("duplicate track-artist relationships are rejected", async () => {
    const suffix = Date.now();

    const artists = await prisma.$queryRaw<Array<{ id: bigint }>>`
      INSERT INTO artists
        (name, created_at, updated_at)
      VALUES
        (${`Validation Artist ${suffix}`}, NOW(), NOW())
      RETURNING id
    `;

    const tracks = await prisma.$queryRaw<Array<{ id: bigint }>>`
      INSERT INTO tracks
        (title, duration_ms, is_available, created_at, updated_at)
      VALUES
        (${`Validation Track ${suffix}`}, 180000, TRUE, NOW(), NOW())
      RETURNING id
    `;

    const artistId = artists[0].id;
    const trackId = tracks[0].id;

    try {
      await prisma.$executeRaw`
        INSERT INTO track_artists
          (track_id, artist_id, artist_order)
        VALUES
          (${trackId}, ${artistId}, 1)
      `;

      await assert.rejects(async () => {
        await prisma.$executeRaw`
          INSERT INTO track_artists
            (track_id, artist_id, artist_order)
          VALUES
            (${trackId}, ${artistId}, 1)
        `;
      });
    } finally {
      await prisma.$executeRaw`
        DELETE FROM track_artists
        WHERE track_id = ${trackId}
      `;

      await prisma.$executeRaw`
        DELETE FROM tracks
        WHERE id = ${trackId}
      `;

      await prisma.$executeRaw`
        DELETE FROM artists
        WHERE id = ${artistId}
      `;
    }
  });

  // --------------------------------------------------
  // Sprint 3 - Role C: Additional Database Tests
  // --------------------------------------------------

  test("media file cannot reference a nonexistent track", async () => {
    const suffix = Date.now();
    const filePath = `/test/invalid-track-${suffix}.flac`;

    await assert.rejects(async () => {
      await prisma.$executeRaw`
        INSERT INTO media_files
          (track_id, file_path, file_name, media_type, file_size, created_at)
        VALUES
          (999999999, ${filePath}, 'invalid-track.flac',
           'audio/flac', 1000, NOW())
      `;
    });
  });

  test("deleting a track cascades to its media files", async () => {
    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const filePath = `/test/cascade-${suffix}.flac`;

    const tracks = await prisma.$queryRaw<Array<{ id: bigint }>>`
      INSERT INTO tracks
        (title, duration_ms, is_available, created_at, updated_at)
      VALUES
        (${`Cascade Test Track ${suffix}`}, 180000, TRUE, NOW(), NOW())
      RETURNING id
    `;

    const trackId = tracks[0].id;

    try {
      await prisma.$executeRaw`
        INSERT INTO media_files
          (track_id, file_path, file_name, media_type, file_size, created_at)
        VALUES
          (${trackId}, ${filePath}, 'cascade-test.flac',
           'audio/flac', 1000, NOW())
      `;

      const beforeDelete = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id
        FROM media_files
        WHERE file_path = ${filePath}
      `;

      assert.equal(beforeDelete.length, 1);

      await prisma.$executeRaw`
        DELETE FROM tracks
        WHERE id = ${trackId}
      `;

      const afterDelete = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id
        FROM media_files
        WHERE file_path = ${filePath}
      `;

      assert.equal(afterDelete.length, 0);
    } finally {
      await prisma.$executeRaw`
        DELETE FROM tracks
        WHERE id = ${trackId}
      `;
    }
  });
});

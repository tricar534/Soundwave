
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { pool } from '../../src/db';
import { findUserByEmail } from '../../src/services/authDatabase';

afterAll(async () => {
  await pool.end();
});

describe('SW-234 Authentication Database Operations', () => {
  it('finds a user by email with the correct role', async () => {
    // Unique values prevent conflicts with existing test data.
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
    const roleName = `TEST_SW234_${uniqueId}`;
    const username = `sw234_${uniqueId}`;
    const email = `sw234-${uniqueId}@example.invalid`;

    let roleId: string | null = null;
    let userId: string | null = null;

    try {
      // Create an isolated test role.
      const roleResult = await pool.query<{ id: string }>(
        `INSERT INTO roles (name, description)
         VALUES ($1, $2)
         RETURNING id::text AS id`,
        [roleName, 'Temporary authentication test role']
      );

      roleId = roleResult.rows[0].id;

      // Create a temporary test user.
      const userResult = await pool.query<{ id: string }>(
        `INSERT INTO users
            (role_id, username, email, password_hash, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id::text AS id`,
        [roleId, username, email, 'test-placeholder-not-real-hash']
      );

      userId = userResult.rows[0].id;

      // Test the authentication lookup function.
      const foundUser = await findUserByEmail(email);

      expect(foundUser).not.toBeNull();
      expect(foundUser?.id).toBe(userId);
      expect(foundUser?.username).toBe(username);
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.roleId).toBe(roleId);
      expect(foundUser?.roleName).toBe(roleName);
      expect(foundUser?.isActive).toBe(true);

      // Verify that an unknown email returns null.
      const missingUser = await findUserByEmail(
        `missing-${uniqueId}@example.invalid`
      );

      expect(missingUser).toBeNull();
    } finally {
      // Remove only the records created by this test.
      if (userId) {
        await pool.query(
          'DELETE FROM users WHERE id = $1::bigint',
          [userId]
        );
      }

      if (roleId) {
        await pool.query(
          'DELETE FROM roles WHERE id = $1::bigint',
          [roleId]
        );
      }
    }
  });
});

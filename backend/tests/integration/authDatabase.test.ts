
import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { pool } from '../../src/db';
import {
  findUserByEmail,
  createUser,
  updateUserProfile,
  deactivateUser,
} from '../../src/services/authDatabase';

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

  it('creates a user with the default USER role', async () => {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
    const username = `sw234_${uniqueId}`;
    const email = `sw234-${uniqueId}@example.invalid`;
    const testPasswordHash = 'test-placeholder-not-real-hash';

    let userId: string | null = null;

    try {
      // Create a temporary user through the new service.
      userId = await createUser({
        username,
        email,
        passwordHash: testPasswordHash
      });

      expect(userId).toBeTruthy();

      // Retrieve the user to confirm the account was saved.
      const createdUser = await findUserByEmail(email);

      expect(createdUser).not.toBeNull();
      expect(createdUser?.id).toBe(userId);
      expect(createdUser?.username).toBe(username);
      expect(createdUser?.email).toBe(email);
      expect(createdUser?.roleName).toBe('USER');
      expect(createdUser?.isActive).toBe(true);
      expect(createdUser?.passwordHash).toBe(testPasswordHash);
    } finally {
      // Remove only the user created by this test.
      if (userId) {
        await pool.query(
          'DELETE FROM users WHERE id = $1::bigint',
          [userId]
        );
      }
    }
  });

  it('updates an existing user profile', async () => {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);

    const originalUsername = `sw234_${uniqueId}`;
    const originalEmail = `sw234-${uniqueId}@example.invalid`;

    const updatedUsername = `updated_${uniqueId}`;
    const updatedEmail = `updated-${uniqueId}@example.invalid`;

    let userId: string | null = null;

    try {
      // Create an isolated test account.
      userId = await createUser({
        username: originalUsername,
        email: originalEmail,
        passwordHash: 'test-placeholder-not-real-hash'
      });

      // Update the user's username and email.
      const updated = await updateUserProfile(userId, {
        username: updatedUsername,
        email: updatedEmail
      });

      expect(updated).toBe(true);

      // Verify the updated values were saved.
      const updatedUser = await findUserByEmail(updatedEmail);

      expect(updatedUser).not.toBeNull();
      expect(updatedUser?.id).toBe(userId);
      expect(updatedUser?.username).toBe(updatedUsername);
      expect(updatedUser?.email).toBe(updatedEmail);
      expect(updatedUser?.roleName).toBe('USER');
      expect(updatedUser?.isActive).toBe(true);

      // Verify the original email no longer matches.
      const oldEmailResult = await findUserByEmail(originalEmail);

      expect(oldEmailResult).toBeNull();
    } finally {
      // Clean up only the user created by this test.
      if (userId) {
        await pool.query(
          'DELETE FROM users WHERE id = $1::bigint',
          [userId]
        );
      }
    }
  });

  it('deactivates an existing user account', async () => {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
    const username = `sw234_${uniqueId}`;
    const email = `sw234-${uniqueId}@example.invalid`;

    let userId: string | null = null;

    try {
      // Create an isolated test account.
      userId = await createUser({
        username,
        email,
        passwordHash: 'test-placeholder-not-real-hash'
      });

      // Confirm the account starts as active.
      const activeUser = await findUserByEmail(email);
      expect(activeUser?.isActive).toBe(true);

      // Deactivate the account.
      const deactivated = await deactivateUser(userId);
      expect(deactivated).toBe(true);

      // Verify the change was saved to PostgreSQL.
      const inactiveUser = await findUserByEmail(email);

      expect(inactiveUser).not.toBeNull();
      expect(inactiveUser?.id).toBe(userId);
      expect(inactiveUser?.isActive).toBe(false);

      // Confirm that account information was preserved.
      expect(inactiveUser?.username).toBe(username);
      expect(inactiveUser?.email).toBe(email);
      expect(inactiveUser?.roleName).toBe('USER');
    } finally {
      // Remove only the temporary test account.
      if (userId) {
        await pool.query(
          'DELETE FROM users WHERE id = $1::bigint',
          [userId]
        );
      }
    }
  });

});

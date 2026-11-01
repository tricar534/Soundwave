
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it } from 'vitest';
import { pool } from '../../src/db';
import {
  findUserByEmail, createUser,
  updateUserProfile, deactivateUser,
  findRoleByName, assignUserRole,
  createSession, findActiveSession,
  revokeSession, revokeUserSessions
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

  it('retrieves an existing role by name', async () => {
    const role = await findRoleByName('USER');

    expect(role).not.toBeNull();
    expect(role?.id).toBeTruthy();
    expect(role?.name).toBe('USER');

    // Nonexistent roles should return null.
    const missingRole = await findRoleByName(
      'NONEXISTENT_SW234_ROLE'
    );

    expect(missingRole).toBeNull();
  });

  it('assigns an existing role to a user', async () => {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
    const username = `sw234_${uniqueId}`;
    const email = `sw234-${uniqueId}@example.invalid`;
    const roleName = `TEST_SW234_${uniqueId}`;

    let userId: string | null = null;
    let roleId: string | null = null;

    try {
      // Create an isolated test role.
      const roleResult = await pool.query<{ id: string }>(
        `
        INSERT INTO roles (name, description)
        VALUES ($1, $2)
        RETURNING id::text AS id
        `,
        [roleName, 'Temporary role assignment test']
      );

      roleId = roleResult.rows[0].id;

      // Create a user with the default USER role.
      userId = await createUser({
        username,
        email,
        passwordHash: 'test-placeholder-not-real-hash'
      });

      const originalUser = await findUserByEmail(email);
      expect(originalUser?.roleName).toBe('USER');

      // Assign the temporary role.
      const assigned = await assignUserRole(userId, roleName);
      expect(assigned).toBe(true);

      // Verify the new role was saved.
      const updatedUser = await findUserByEmail(email);

      expect(updatedUser?.roleName).toBe(roleName);
      expect(updatedUser?.roleId).toBe(roleId);
      expect(updatedUser?.id).toBe(userId);
    } finally {
      // Clean up the temporary user before its role.
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

  it('creates a session for an active user', async () => {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
    const username = `sw234_${uniqueId}`;
    const email = `sw234-${uniqueId}@example.invalid`;

    // Generate a unique hashed token for testing.
    const tokenHash = createHash('sha256')
      .update(randomBytes(32))
      .digest('hex');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    let userId: string | null = null;
    let sessionId: string | null = null;

    try {
      // Create an isolated test account.
      userId = await createUser({
        username,
        email,
        passwordHash: 'test-placeholder-not-real-hash'
      });

      // Create a session using the database service.
      sessionId = await createSession({
        userId,
        tokenHash,
        expiresAt
      });

      expect(sessionId).toBeTruthy();

      // Verify the saved session directly in PostgreSQL.
      const result = await pool.query<{
        userId: string;
        tokenHash: string;
        expiresAt: Date;
        revokedAt: Date | null;
      }>(
        `
        SELECT
          user_id::text AS "userId",
          token_hash AS "tokenHash",
          expires_at AS "expiresAt",
          revoked_at AS "revokedAt"
        FROM sessions
        WHERE id = $1::bigint
        `,
        [sessionId]
      );

      expect(result.rows).toHaveLength(1);

      const session = result.rows[0];

      expect(session.userId).toBe(userId);
      expect(session.tokenHash).toBe(tokenHash);
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(session.revokedAt).toBeNull();
    } finally {
      // Clean up only records created by this test.
      if (sessionId) {
        await pool.query(
          'DELETE FROM sessions WHERE id = $1::bigint',
          [sessionId]
        );
      }

      if (userId) {
        await pool.query(
          'DELETE FROM users WHERE id = $1::bigint',
          [userId]
        );
      }
    }
  });

  it('finds an active session and rejects inactive users', async () => {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
    const username = `sw234_${uniqueId}`;
    const email = `sw234-${uniqueId}@example.invalid`;

    const tokenHash = createHash('sha256')
      .update(randomBytes(32))
      .digest('hex');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    let userId: string | null = null;
    let sessionId: string | null = null;

    try {
      // Create a temporary active user.
      userId = await createUser({
        username,
        email,
        passwordHash: 'test-placeholder-not-real-hash'
      });

      // Create a valid session.
      sessionId = await createSession({
        userId,
        tokenHash,
        expiresAt
      });

      // Verify that the session can be retrieved.
      const activeSession = await findActiveSession(tokenHash);

      expect(activeSession).not.toBeNull();
      expect(activeSession?.id).toBe(sessionId);
      expect(activeSession?.userId).toBe(userId);
      expect(activeSession?.expiresAt.getTime()).toBeGreaterThan(
        Date.now()
      );

      // Unknown tokens should not match a session.
      const missingSession = await findActiveSession(
        'nonexistent-session-token-hash'
      );

      expect(missingSession).toBeNull();

      // Deactivate the user.
      await deactivateUser(userId);

      // Existing sessions must no longer be usable.
      const inactiveSession = await findActiveSession(tokenHash);

      expect(inactiveSession).toBeNull();
    } finally {
      // Remove only records created by this test.
      if (sessionId) {
        await pool.query(
          'DELETE FROM sessions WHERE id = $1::bigint',
          [sessionId]
        );
      }

      if (userId) {
        await pool.query(
          'DELETE FROM users WHERE id = $1::bigint',
          [userId]
        );
      }
    }
  });

  it('revokes an existing user session', async () => {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
    const username = `sw234_${uniqueId}`;
    const email = `sw234-${uniqueId}@example.invalid`;

    const tokenHash = createHash('sha256')
      .update(randomBytes(32))
      .digest('hex');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    let userId: string | null = null;
    let sessionId: string | null = null;

    try {
      // Create a temporary user.
      userId = await createUser({
        username,
        email,
        passwordHash: 'test-placeholder-not-real-hash'
      });

      // Create an active session.
      sessionId = await createSession({
        userId,
        tokenHash,
        expiresAt
      });

      // Verify the session is initially active.
      const activeSession = await findActiveSession(tokenHash);
      expect(activeSession?.id).toBe(sessionId);

      // Revoke the session.
      const revoked = await revokeSession(sessionId, userId);
      expect(revoked).toBe(true);

      // Revoked sessions must no longer be active.
      const revokedSession = await findActiveSession(tokenHash);
      expect(revokedSession).toBeNull();

      // Verify revocation was saved in PostgreSQL.
      const result = await pool.query<{ revokedAt: Date | null }>(
        `
        SELECT revoked_at AS "revokedAt"
        FROM sessions
        WHERE id = $1::bigint
        `,
        [sessionId]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].revokedAt).not.toBeNull();

      // Revoking the same session again should return false.
      const revokedAgain = await revokeSession(sessionId, userId);
      expect(revokedAgain).toBe(false);
    } finally {
      // Clean up only the records created by this test.
      if (sessionId) {
        await pool.query(
          'DELETE FROM sessions WHERE id = $1::bigint',
          [sessionId]
        );
      }

      if (userId) {
        await pool.query(
          'DELETE FROM users WHERE id = $1::bigint',
          [userId]
        );
      }
    }
  });

  it('revokes all sessions belonging to a user', async () => {
    const uniqueId = randomUUID().replace(/-/g, '').slice(0, 12);
    const username = `sw234_${uniqueId}`;
    const email = `sw234-${uniqueId}@example.invalid`;

    const tokenHash1 = createHash('sha256')
      .update(randomBytes(32))
      .digest('hex');

    const tokenHash2 = createHash('sha256')
      .update(randomBytes(32))
      .digest('hex');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    let userId: string | null = null;

    try {
      // Create a temporary user.
      userId = await createUser({
        username,
        email,
        passwordHash: 'test-placeholder-not-real-hash'
      });

      // Create two active sessions for the same user.
      await createSession({
        userId,
        tokenHash: tokenHash1,
        expiresAt
      });

      await createSession({
        userId,
        tokenHash: tokenHash2,
        expiresAt
      });

      // Confirm both sessions are initially active.
      expect(await findActiveSession(tokenHash1)).not.toBeNull();
      expect(await findActiveSession(tokenHash2)).not.toBeNull();

      // Revoke all sessions belonging to this user.
      const revokedCount = await revokeUserSessions(userId);

      expect(revokedCount).toBe(2);

      // Neither session should remain active.
      expect(await findActiveSession(tokenHash1)).toBeNull();
      expect(await findActiveSession(tokenHash2)).toBeNull();

      // Verify the revocation timestamps were saved.
      const result = await pool.query<{ count: number }>(
        `
        SELECT COUNT(*)::int AS count
        FROM sessions
        WHERE user_id = $1::bigint
          AND revoked_at IS NOT NULL
        `,
        [userId]
      );

      expect(result.rows[0].count).toBe(2);

      // Calling the operation again should revoke nothing.
      const revokedAgain = await revokeUserSessions(userId);

      expect(revokedAgain).toBe(0);
    } finally {
      // Clean up only this test's session records and user.
      if (userId) {
        await pool.query(
          'DELETE FROM sessions WHERE user_id = $1::bigint',
          [userId]
        );

        await pool.query(
          'DELETE FROM users WHERE id = $1::bigint',
          [userId]
        );
      }
    }
  });

});

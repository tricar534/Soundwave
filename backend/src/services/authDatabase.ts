
import { pool } from '../db';

// Internal database record used for authentication operations.
// Never include passwordHash in public API responses.
export interface AuthUserRecord {
  id: string;
  roleId: string;
  username: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  roleName: string;
}

// Find a user by email and retrieve their assigned role.
// Returns null when no matching user exists.
export async function findUserByEmail(
  email: string
): Promise<AuthUserRecord | null> {
  const result = await pool.query<AuthUserRecord>(
    `
    SELECT
      u.id::text AS "id",
      u.role_id::text AS "roleId",
      u.username,
      u.email,
      u.password_hash AS "passwordHash",
      u.is_active AS "isActive",
      r.name AS "roleName"
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.email = $1
    LIMIT 1
    `,
    [email]
  );

  return result.rows[0] ?? null;
}

export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
}

// Create a new account with the standard USER role.
// The password must already be hashed before calling this function.
export async function createUser(
  input: CreateUserInput
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
    INSERT INTO users (
      role_id,
      username,
      email,
      password_hash,
      updated_at
    )
    SELECT
      id,
      $1,
      $2,
      $3,
      NOW()
    FROM roles
    WHERE name = 'USER'
    RETURNING id::text AS id
    `,
    [input.username, input.email, input.passwordHash]
  );

  if (!result.rows[0]) {
    throw new Error('Default USER role not found');
  }

  return result.rows[0].id;
}

export interface UpdateUserProfileInput {
  username?: string;
  email?: string;
}

// Update an existing user's profile information.
// Returns false if the user does not exist.
export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput
): Promise<boolean> {
  if (input.username === undefined && input.email === undefined) {
    throw new Error('No profile changes provided');
  }

  const result = await pool.query(
    `
    UPDATE users
    SET
      username = COALESCE($2, username),
      email = COALESCE($3, email),
      updated_at = NOW()
    WHERE id = $1::bigint
    `,
    [userId, input.username ?? null, input.email ?? null]
  );

  return result.rowCount === 1;
}


 // Deactivate an existing user account without deleting its data.
 // Returns false if the user does not exist.
export async function deactivateUser(
  userId: string
): Promise<boolean> {
  const result = await pool.query(
    `
    UPDATE users
    SET
      is_active = FALSE,
      updated_at = NOW()
    WHERE id = $1::bigint
    `,
    [userId]
  );

  return result.rowCount === 1;
}

export interface AuthRoleRecord {
  id: string;
  name: string;
  description: string | null;
}

// Retrieve a role by its name.
// Returns null if the role does not exist.
export async function findRoleByName(
  roleName: string
): Promise<AuthRoleRecord | null> {
  const result = await pool.query<AuthRoleRecord>(
    `
    SELECT
      id::text AS id,
      name,
      description
    FROM roles
    WHERE name = $1
    LIMIT 1
    `,
    [roleName]
  );

  return result.rows[0] ?? null;
}

// Assign an existing role to an existing user.
// This operation must only be called by authorized backend logic.
// Returns false if the user or role does not exist.
export async function assignUserRole(
  userId: string,
  roleName: string
): Promise<boolean> {
  const result = await pool.query(
    `
    UPDATE users AS u
    SET
      role_id = r.id,
      updated_at = NOW()
    FROM roles AS r
    WHERE u.id = $1::bigint
      AND r.name = $2
    `,
    [userId, roleName]
  );

  return result.rowCount === 1;
}

export interface CreateSessionInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

// Create a session for an active user.
// The token must already be securely hashed before calling this function.
// Returns the new session ID.
export async function createSession(
  input: CreateSessionInput
): Promise<string> {
  const result = await pool.query<{ id: string }>(
    `
    INSERT INTO sessions (
      user_id,
      token_hash,
      expires_at
    )
    SELECT
      u.id,
      $2,
      $3::timestamptz
    FROM users AS u
    WHERE u.id = $1::bigint
      AND u.is_active = TRUE
      AND $3::timestamptz > NOW()
    RETURNING id::text AS id
    `,
    [input.userId, input.tokenHash, input.expiresAt]
  );

  if (!result.rows[0]) {
    throw new Error(
      'Session creation requires an active user and future expiration'
    );
  }

  return result.rows[0].id;
}

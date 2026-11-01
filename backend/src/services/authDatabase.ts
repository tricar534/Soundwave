
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


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

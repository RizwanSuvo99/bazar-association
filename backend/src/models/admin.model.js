import { query } from '../config/db.js';

/** Columns safe to return to the client — never the password hash. */
const PUBLIC_COLUMNS = 'id, name, email, role, is_active, last_login_at, created_at';

export async function findAdminByEmail(email) {
  const { rows } = await query('SELECT * FROM admins WHERE email = $1 LIMIT 1', [email]);
  return rows[0] || null;
}

export async function findAdminById(id) {
  const { rows } = await query('SELECT * FROM admins WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function touchLastLogin(id) {
  await query('UPDATE admins SET last_login_at = now() WHERE id = $1', [id]);
}

export async function listAdmins() {
  const { rows } = await query(
    `SELECT ${PUBLIC_COLUMNS} FROM admins ORDER BY role DESC, created_at ASC`,
  );
  return rows;
}

export async function createAdmin({ name, email, passwordHash, role }) {
  const { rows } = await query(
    `INSERT INTO admins (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING ${PUBLIC_COLUMNS}`,
    [name, email, passwordHash, role],
  );
  return rows[0];
}

/** Partial update of name / role / is_active. Returns null when nothing was provided. */
export async function updateAdmin(id, fields) {
  const sets = [];
  const values = [];
  for (const key of ['name', 'role', 'is_active']) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      sets.push(`${key} = $${values.length}`);
    }
  }
  if (!sets.length) return null;
  values.push(id);
  const { rows } = await query(
    `UPDATE admins SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING ${PUBLIC_COLUMNS}`,
    values,
  );
  return rows[0] || null;
}

/**
 * Stamping password_changed_at invalidates every existing JWT (see requireAdmin, which
 * compares it exactly against the token's `pv` claim). Returns the new value so the
 * caller can mint a replacement token for the device that made the change.
 */
export async function updateAdminPassword(id, passwordHash) {
  const { rows } = await query(
    `UPDATE admins SET password_hash = $1, password_changed_at = now()
      WHERE id = $2 RETURNING password_changed_at`,
    [passwordHash, id],
  );
  return rows[0]?.password_changed_at ?? null;
}

/** Epoch-ms form of password_changed_at — the value carried in a token's `pv` claim. */
export function passwordVersion(passwordChangedAt) {
  return passwordChangedAt ? new Date(passwordChangedAt).getTime() : 0;
}

export async function deleteAdmin(id) {
  const { rowCount } = await query('DELETE FROM admins WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function emailTaken(email, exceptId) {
  const { rows } = await query(
    'SELECT 1 FROM admins WHERE email = $1 AND ($2::bigint IS NULL OR id <> $2) LIMIT 1',
    [email, exceptId ?? null],
  );
  return rows.length > 0;
}

/** Used to refuse removing/demoting/deactivating the last usable superadmin. */
export async function countActiveSuperadmins(exceptId) {
  const { rows } = await query(
    `SELECT count(*)::int AS n FROM admins
      WHERE role = 'superadmin' AND is_active = true AND ($1::bigint IS NULL OR id <> $1)`,
    [exceptId ?? null],
  );
  return rows[0].n;
}

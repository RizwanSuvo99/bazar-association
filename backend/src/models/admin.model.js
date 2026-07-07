import { query } from '../config/db.js';

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

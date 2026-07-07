import { query } from '../config/db.js';

export async function createContactMessage({ name, email, phone, subject, message }) {
  const { rows } = await query(
    `INSERT INTO contact_messages (name, email, phone, subject, message)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email || null, phone || null, subject || null, message],
  );
  return rows[0];
}

export async function listContactMessages() {
  const { rows } = await query('SELECT * FROM contact_messages ORDER BY created_at DESC');
  return rows;
}

export async function markMessageRead(id, isRead = true) {
  const { rows } = await query(
    'UPDATE contact_messages SET is_read = $2 WHERE id = $1 RETURNING *',
    [id, isRead],
  );
  return rows[0] || null;
}

export async function countUnread() {
  const { rows } = await query('SELECT count(*)::int AS unread FROM contact_messages WHERE is_read = false');
  return rows[0].unread;
}

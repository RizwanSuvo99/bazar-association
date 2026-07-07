import { query } from '../config/db.js';

export async function listNotices({ publishedOnly = false } = {}) {
  const where = publishedOnly ? 'WHERE is_published = true' : '';
  const { rows } = await query(`SELECT * FROM notices ${where} ORDER BY created_at DESC`);
  return rows;
}

export async function getNoticeById(id) {
  const { rows } = await query('SELECT * FROM notices WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createNotice(data) {
  const { rows } = await query(
    `INSERT INTO notices (title_bn, title_en, file_url, file_public_id, file_resource_type, file_name, is_published)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'auto'), $6, COALESCE($7, true)) RETURNING *`,
    [
      data.title_bn, data.title_en || null, data.file_url, data.file_public_id || null,
      data.file_resource_type, data.file_name || null, data.is_published,
    ],
  );
  return rows[0];
}

export async function updateNotice(id, data) {
  const fields = ['title_bn', 'title_en', 'is_published'];
  const cols = fields.filter((c) => data[c] !== undefined);
  if (cols.length === 0) return getNoticeById(id);
  const setSql = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const values = cols.map((c) => data[c]);
  values.push(id);
  const { rows } = await query(`UPDATE notices SET ${setSql} WHERE id = $${values.length} RETURNING *`, values);
  return rows[0] || null;
}

export async function deleteNotice(id) {
  const { rows } = await query('DELETE FROM notices WHERE id = $1 RETURNING *', [id]);
  return rows[0] || null;
}

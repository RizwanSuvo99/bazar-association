import { query } from '../config/db.js';

export async function listGallery({ publishedOnly = false } = {}) {
  const where = publishedOnly ? 'WHERE is_published = true' : '';
  const { rows } = await query(`SELECT * FROM gallery_images ${where} ORDER BY sort_order ASC, id ASC`);
  return rows;
}

export async function getGalleryImageById(id) {
  const { rows } = await query('SELECT * FROM gallery_images WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createGalleryImage({ image_url, cloudinary_public_id, caption_bn, caption_en, sort_order, is_published }) {
  const { rows } = await query(
    `INSERT INTO gallery_images (image_url, cloudinary_public_id, caption_bn, caption_en, sort_order, is_published)
     VALUES ($1, $2, $3, $4, COALESCE($5, 0), COALESCE($6, true)) RETURNING *`,
    [image_url, cloudinary_public_id || null, caption_bn || null, caption_en || null, sort_order, is_published],
  );
  return rows[0];
}

export async function updateGalleryImage(id, data) {
  const fields = ['caption_bn', 'caption_en', 'sort_order', 'is_published', 'image_url'];
  const cols = fields.filter((c) => data[c] !== undefined);
  if (cols.length === 0) return getGalleryImageById(id);
  const setSql = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const values = cols.map((c) => data[c]);
  values.push(id);
  const { rows } = await query(`UPDATE gallery_images SET ${setSql} WHERE id = $${values.length} RETURNING *`, values);
  return rows[0] || null;
}

export async function reorderGallery(items) {
  // items: [{ id, sort_order }]
  for (const it of items) {
    await query('UPDATE gallery_images SET sort_order = $1 WHERE id = $2', [it.sort_order, it.id]);
  }
  return listGallery();
}

export async function deleteGalleryImage(id) {
  const { rows } = await query('DELETE FROM gallery_images WHERE id = $1 RETURNING *', [id]);
  return rows[0] || null;
}

import { query } from '../config/db.js';

export async function listPages() {
  const { rows } = await query('SELECT * FROM page_content ORDER BY page_key');
  return rows;
}

export async function getPage(pageKey) {
  const { rows } = await query('SELECT * FROM page_content WHERE page_key = $1 LIMIT 1', [pageKey]);
  return rows[0] || null;
}

export async function upsertPage(pageKey, data) {
  const { rows } = await query(
    `INSERT INTO page_content (page_key, title_bn, title_en, subtitle_bn, subtitle_en, body_bn, body_en, extra)
     VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, '{}'::jsonb))
     ON CONFLICT (page_key) DO UPDATE SET
       title_bn = EXCLUDED.title_bn, title_en = EXCLUDED.title_en,
       subtitle_bn = EXCLUDED.subtitle_bn, subtitle_en = EXCLUDED.subtitle_en,
       body_bn = EXCLUDED.body_bn, body_en = EXCLUDED.body_en, extra = EXCLUDED.extra
     RETURNING *`,
    [
      pageKey, data.title_bn ?? null, data.title_en ?? null, data.subtitle_bn ?? null,
      data.subtitle_en ?? null, data.body_bn ?? null, data.body_en ?? null,
      data.extra ? JSON.stringify(data.extra) : null,
    ],
  );
  return rows[0];
}

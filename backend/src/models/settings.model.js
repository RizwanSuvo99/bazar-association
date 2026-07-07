import { query } from '../config/db.js';

const WRITABLE = [
  'org_name_bn', 'org_name_en', 'bkash_number', 'registration_fee', 'active_theme',
  'logo_url', 'contact_email', 'contact_phone', 'contact_address_bn', 'contact_address_en', 'facebook_url',
  'hero_images',
];

export async function getSettings() {
  const { rows } = await query('SELECT * FROM site_settings WHERE id = 1 LIMIT 1');
  return rows[0] || null;
}

export async function updateSettings(data) {
  const cols = WRITABLE.filter((c) => data[c] !== undefined);
  if (cols.length === 0) return getSettings();
  const setSql = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  // hero_images is JSONB — serialize it (node-postgres would otherwise treat the array as a PG array).
  const values = cols.map((c) => (c === 'hero_images' ? JSON.stringify(data[c]) : data[c]));
  const { rows } = await query(
    `UPDATE site_settings SET ${setSql} WHERE id = 1 RETURNING *`,
    values,
  );
  return rows[0];
}

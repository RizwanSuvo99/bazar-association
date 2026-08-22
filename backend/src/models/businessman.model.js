import { query } from '../config/db.js';
import { normalizeDigits } from '../utils/digits.js';

// Columns a client may write. Generated columns (six_digit_id, unique_id) are excluded.
export const WRITABLE_COLUMNS = [
  'full_name', 'mobile_number', 'father_name', 'mother_name', 'blood_group',
  'village', 'post_office', 'municipality_or_union', 'upazila', 'district',
  'current_business_name_address', 'business_type', 'trade_license_no', 'tin_no',
  'market_name', 'owner_name', 'ward_no', 'holding_no', 'voter_type',
  'nid_no', 'nominee_name', 'nominee_relation', 'nominee_mobile', 'profile_photo_url', 'status',
];

// Every sort carries an `id` tiebreaker. Without one, members sharing a created_at
// (seeded or approved in the same statement) have an undefined relative order, and
// Postgres can return them differently once an UPDATE rewrites the row — so editing a
// member appeared to move it in the list.
// The association's calendar day. The database session runs in UTC, so date-range bounds
// must be anchored explicitly rather than inheriting the server's zone.
const APP_TZ = 'Asia/Dhaka';

const SORTS = {
  newest: 'created_at DESC, id DESC',
  oldest: 'created_at ASC, id ASC',
  name_asc: 'full_name ASC, id ASC',
  name_desc: 'full_name DESC, id DESC',
};

/** Build the WHERE clause + params from filter options. */
function buildWhere(filters, { publicOnly }) {
  const clauses = [];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    clauses.push(sql.replace('$?', `$${params.length}`));
  };

  if (publicOnly) {
    clauses.push(`status = 'active'`);
  } else if (filters.status) {
    add('status = $?', filters.status);
  }

  if (filters.q) {
    params.push(`%${filters.q}%`);
    const p = `$${params.length}`;
    // Member IDs and phone numbers are read off a printed card or form, where the site
    // renders them in Bengali numerals — but the columns store Western digits. Match those
    // columns against a normalised copy so "২৩৫১৯২" finds NBA-235192, while the text
    // columns keep matching exactly what was typed.
    params.push(`%${normalizeDigits(filters.q)}%`);
    const d = `$${params.length}`;
    const idColumns = [
      `six_digit_id ILIKE ${d}`,
      `unique_id ILIKE ${d}`,
      `mobile_number ILIKE ${d}`,
      // Admins work from the paper form, which carries the full NID. Never exposed
      // publicly: matching it there would let anyone test whether an NID is a member.
      ...(publicOnly ? [] : [`nid_no ILIKE ${d}`]),
    ];
    clauses.push(
      `(full_name ILIKE ${p} OR market_name ILIKE ${p} OR business_type ILIKE ${p}
        OR owner_name ILIKE ${p} OR current_business_name_address ILIKE ${p}
        OR ${idColumns.join(' OR ')})`,
    );
  }
  if (filters.name) add('full_name ILIKE $?', `%${filters.name}%`);
  if (filters.market) add('market_name ILIKE $?', `%${filters.market}%`);
  if (filters.business_type) add('business_type ILIKE $?', `%${filters.business_type}%`);
  if (filters.union) add('municipality_or_union ILIKE $?', `%${filters.union}%`);
  if (filters.ward) add('ward_no = $?', filters.ward);
  if (filters.district) add('district ILIKE $?', `%${filters.district}%`);
  if (filters.blood_group) add('blood_group = $?', filters.blood_group);
  if (filters.mobile) add('mobile_number ILIKE $?', `%${filters.mobile}%`);

  // Registration date range, evaluated against the association's own calendar day.
  //
  // Two things are deliberate here. The bounds are anchored to APP_TZ rather than the
  // database session, which is UTC: a member registered at 02:00 Dhaka is stored as 20:00
  // the previous day UTC, so a plain `$?::date` bound would file them under the wrong day
  // and "from the 26th" would miss them. And the upper bound is EXCLUSIVE at the next
  // midnight rather than `<= to`, which would stop at the start of that day and drop
  // everyone added during it.
  //
  // created_at stays bare on the left of both comparisons so the index remains usable;
  // wrapping it (e.g. `created_at AT TIME ZONE ...::date BETWEEN`) would force a seq scan.
  if (filters.from) add(`created_at >= ($?::date)::timestamp AT TIME ZONE '${APP_TZ}'`, filters.from);
  if (filters.to) add(`created_at < (($?::date) + 1)::timestamp AT TIME ZONE '${APP_TZ}'`, filters.to);

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, params };
}

export async function listBusinessmen(filters = {}, { page = 1, limit = 12, sort = 'newest', publicOnly = false } = {}) {
  const { where, params } = buildWhere(filters, { publicOnly });
  const orderBy = SORTS[sort] || SORTS.newest;
  const offset = (page - 1) * limit;

  const totalRes = await query(`SELECT count(*)::int AS total FROM businessmen ${where}`, params);
  const total = totalRes.rows[0].total;

  const listParams = [...params, limit, offset];
  const rows = (
    await query(
      `SELECT * FROM businessmen ${where} ORDER BY ${orderBy} LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    )
  ).rows;

  return { rows, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getBusinessmanBySixDigits(sixDigits) {
  const { rows } = await query('SELECT * FROM businessmen WHERE six_digit_id = $1 LIMIT 1', [sixDigits]);
  return rows[0] || null;
}

/** Look up a member by their random public token (ID-card QR target). */
export async function getBusinessmanByToken(token) {
  const { rows } = await query('SELECT * FROM businessmen WHERE public_token = $1 LIMIT 1', [token]);
  return rows[0] || null;
}

/**
 * Active members for bulk ID-card sheets, optionally narrowed by the same filters the admin
 * list uses (date range, search, market...). `publicOnly` pins status = 'active', so an
 * incoming status filter can never cause cards to be printed for a deactivated member.
 */
export async function listActiveForCards(filters = {}) {
  const { where, params } = buildWhere(filters, { publicOnly: true });
  const { rows } = await query(
    `SELECT * FROM businessmen ${where} ORDER BY six_digit_id ASC`,
    params,
  );
  return rows;
}

export async function getBusinessmanById(id) {
  const { rows } = await query('SELECT * FROM businessmen WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function createBusinessman(data, client = null) {
  const cols = WRITABLE_COLUMNS.filter((c) => data[c] !== undefined);
  const values = cols.map((c) => data[c]);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO businessmen (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`;
  const runner = client || { query };
  const { rows } = await runner.query(sql, values);
  return rows[0];
}

export async function updateBusinessman(id, data) {
  const cols = WRITABLE_COLUMNS.filter((c) => data[c] !== undefined);
  if (cols.length === 0) return getBusinessmanById(id);
  const setSql = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const values = cols.map((c) => data[c]);
  values.push(id);
  const { rows } = await query(
    `UPDATE businessmen SET ${setSql} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  return rows[0] || null;
}

export async function deactivateBusinessman(id) {
  const { rows } = await query(
    `UPDATE businessmen SET status = 'inactive' WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0] || null;
}

export async function deleteBusinessman(id) {
  const { rowCount } = await query('DELETE FROM businessmen WHERE id = $1', [id]);
  return rowCount > 0;
}

export async function getFacets() {
  const q = (col) =>
    query(
      `SELECT DISTINCT ${col} AS value FROM businessmen
       WHERE status = 'active' AND ${col} IS NOT NULL AND ${col} <> '' ORDER BY value`,
    );
  const [types, markets, wards, unions] = await Promise.all([
    q('business_type'), q('market_name'), q('ward_no'), q('municipality_or_union'),
  ]);
  return {
    business_types: types.rows.map((r) => r.value),
    markets: markets.rows.map((r) => r.value),
    wards: wards.rows.map((r) => r.value),
    unions: unions.rows.map((r) => r.value),
  };
}

export async function countByStatus() {
  const { rows } = await query(
    `SELECT count(*)::int AS total,
            count(*) FILTER (WHERE status = 'active')::int AS active,
            count(*) FILTER (WHERE status = 'inactive')::int AS inactive
     FROM businessmen`,
  );
  return rows[0];
}

/* ---------------- Signed registration form ----------------
   Deliberately kept out of WRITABLE_COLUMNS: these are managed only through the
   dedicated signed-form endpoints, so a normal member edit can never clobber them. */

export async function setSignedForm(id, { url, publicId, mime }) {
  const { rows } = await query(
    `UPDATE businessmen
        SET signed_form_url = $1, signed_form_public_id = $2, signed_form_mime = $3,
            signed_form_uploaded_at = now(), signed_form_visible = true
      WHERE id = $4 RETURNING *`,
    [url, publicId || null, mime, id],
  );
  return rows[0] || null;
}

export async function setSignedFormVisible(id, visible) {
  const { rows } = await query(
    'UPDATE businessmen SET signed_form_visible = $1 WHERE id = $2 RETURNING *',
    [visible, id],
  );
  return rows[0] || null;
}

export async function clearSignedForm(id) {
  const { rows } = await query(
    `UPDATE businessmen
        SET signed_form_url = NULL, signed_form_public_id = NULL, signed_form_mime = NULL,
            signed_form_uploaded_at = NULL, signed_form_visible = true
      WHERE id = $1 RETURNING *`,
    [id],
  );
  return rows[0] || null;
}

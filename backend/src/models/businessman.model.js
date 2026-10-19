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

/**
 * ক্রমিক — the member's position in the register, oldest first, 1-based.
 *
 * Derived on every query instead of being stored in a column: a stored number would have to
 * be assigned on insert and patched on delete, and the two would drift the first time a row
 * was removed. The window function cannot drift, and over a register of this size (hundreds,
 * not millions) it costs nothing. Ties on created_at — members approved in the same
 * statement — break on id, the same tiebreaker every sort uses, so the numbering is stable
 * between requests.
 *
 * `id AS member_id` rather than plain `id`: the join below would otherwise make a bare `id`
 * in an ORDER BY ambiguous.
 */
const RANKED_CTE = `WITH ranked AS (
    SELECT id AS member_id, row_number() OVER (ORDER BY created_at ASC, id ASC)::int AS serial_no
      FROM businessmen
  )`;
const RANKED_FROM = 'FROM businessmen b JOIN ranked r ON r.member_id = b.id';

/**
 * Build the WHERE clause + params from filter options.
 *
 * `withSerial` is only ever true for admin queries, which run against RANKED_CTE — the public
 * list has no serial column to match against, and the serial is not shown publicly anyway.
 * Returns the placeholder of the parsed serial (or null) so the caller can float an exact
 * match to the top.
 */
function buildWhere(filters, { publicOnly, withSerial = false }) {
  const clauses = [];
  const params = [];
  let serialParam = null;
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
    // Typing the ক্রমিক from the list (or the exported sheet) jumps to that member. Matched
    // exactly, never as a substring: "12" must not also drag in 112, 120 and 212. Capped at
    // nine digits so a long NID typed into the box can't overflow int4 and error the query.
    const asSerial = normalizeDigits(filters.q).trim();
    if (withSerial && /^\d{1,9}$/.test(asSerial)) {
      params.push(Number(asSerial));
      serialParam = `$${params.length}`;
      idColumns.push(`serial_no = ${serialParam}`);
    }
    clauses.push(
      `(full_name ILIKE ${p} OR market_name ILIKE ${p} OR business_type ILIKE ${p}
        OR owner_name ILIKE ${p} OR current_business_name_address ILIKE ${p}
        OR ${idColumns.join(' OR ')})`,
    );
  }
  // A pasted list of member IDs, kept or dropped as a set. Matched on six_digit_id rather
  // than unique_id so "314538" and "NBA-314538" behave the same — the validator has already
  // stripped the prefix. Note six_digit_id is no longer unique (NBA-129582 is shared by two
  // members), so one id here can match, or hide, both of them.
  if (filters.ids?.length) {
    add(
      filters.ids_mode === 'exclude' ? 'NOT (six_digit_id = ANY($?))' : 'six_digit_id = ANY($?)',
      filters.ids,
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
  // A bound may be a bare date or carry HH:mm. Note `$?::date` would SILENTLY TRUNCATE a
  // time, so the timed path has to cast to ::timestamp instead — and `(x::date) + 1` does
  // not transfer either, since `timestamp + 1` is invalid and needs an explicit interval.
  const hasTime = (v) => /[ T]\d{2}:\d{2}/.test(String(v));

  if (filters.from) {
    add(
      hasTime(filters.from)
        ? `created_at >= ($?::timestamp) AT TIME ZONE '${APP_TZ}'`
        : `created_at >= ($?::date)::timestamp AT TIME ZONE '${APP_TZ}'`,
      filters.from,
    );
  }
  if (filters.to) {
    // Both branches are exclusive upper bounds, one past the unit the user picked: the whole
    // day when they gave a date, the whole minute when they gave a time. `<= to` would stop
    // at the start of that day/minute and drop everything inside it.
    add(
      hasTime(filters.to)
        ? `created_at < (($?::timestamp) + interval '1 minute') AT TIME ZONE '${APP_TZ}'`
        : `created_at < (($?::date) + 1)::timestamp AT TIME ZONE '${APP_TZ}'`,
      filters.to,
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  return { where, params, serialParam };
}

export async function listBusinessmen(filters = {}, { page = 1, limit = 12, sort = 'newest', publicOnly = false } = {}) {
  // Admins see the ক্রমিক and can search by it; the public list stays the plain query it was.
  const withSerial = !publicOnly;
  const { where, params, serialParam } = buildWhere(filters, { publicOnly, withSerial });
  const orderBy = SORTS[sort] || SORTS.newest;
  // An exact ক্রমিক hit goes first, so typing 437 lands on member 437 rather than burying
  // them among the NIDs and mobile numbers that happen to contain "437".
  const order = serialParam ? `(serial_no = ${serialParam}) DESC, ${orderBy}` : orderBy;
  const offset = (page - 1) * limit;

  const countSql = withSerial
    ? `${RANKED_CTE} SELECT count(*)::int AS total ${RANKED_FROM} ${where}`
    : `SELECT count(*)::int AS total FROM businessmen ${where}`;
  const listSql = withSerial
    ? `${RANKED_CTE} SELECT b.*, r.serial_no ${RANKED_FROM} ${where}`
    : `SELECT * FROM businessmen ${where}`;

  const totalRes = await query(countSql, params);
  const total = totalRes.rows[0].total;

  const listParams = [...params, limit, offset];
  const rows = (
    await query(
      `${listSql} ORDER BY ${order} LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams,
    )
  ).rows;

  return { rows, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** Look up a member by the slug used in /profiles/<slug>. */
export async function getBusinessmanBySlug(slug) {
  const { rows } = await query('SELECT * FROM businessmen WHERE profile_slug = $1 LIMIT 1', [slug]);
  return rows[0] || null;
}

/**
 * Look up a member by the six-digit NID tail. Only for redirecting the legacy
 * /profiles/<last6> links that search engines already indexed: the tail is no longer unique,
 * so a shared one resolves to whichever member was created first.
 */
export async function getBusinessmanBySixDigits(sixDigits) {
  const { rows } = await query(
    'SELECT * FROM businessmen WHERE six_digit_id = $1 ORDER BY id ASC LIMIT 1',
    [sixDigits],
  );
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
  // withSerial so that printing after a ক্রমিক search covers the member the admin was
  // looking at — the button prints whatever the list is showing.
  const { where, params } = buildWhere(filters, { publicOnly: true, withSerial: true });
  const { rows } = await query(
    // id tiebreaker: six_digit_id is no longer unique, so ties would otherwise print in an
    // undefined order that can shift between runs.
    `${RANKED_CTE} SELECT b.* ${RANKED_FROM} ${where} ORDER BY six_digit_id ASC, id ASC`,
    params,
  );
  return rows;
}

/**
 * Every member matching the admin list's filters, unpaginated, for the Excel export.
 * Separate from listBusinessmen because an export is never paginated — it must not be
 * capped by the page size — and separate from listActiveForCards because the office
 * exports the register as it is, deactivated members included, unless they filter.
 * Oldest first, so the serial numbers in the sheet stay stable and a new member is
 * appended at the bottom rather than shifting everyone down.
 */
export async function listForExport(filters = {}, sort = 'oldest') {
  const { where, params } = buildWhere(filters, { publicOnly: false, withSerial: true });
  const orderBy = SORTS[sort] || SORTS.oldest;
  // serial_no comes from the whole register, not from this result set: a filtered sheet then
  // carries the same ক্রমিক the admin list shows, instead of restarting at 1.
  const { rows } = await query(
    `${RANKED_CTE} SELECT b.*, r.serial_no ${RANKED_FROM} ${where} ORDER BY ${orderBy}`,
    params,
  );
  return rows;
}

/**
 * Of the member IDs pasted into the admin filter, the ones that match nobody — so a typo or a
 * stale number is reported back instead of quietly shrinking the result.
 */
export async function findUnknownMemberIds(ids = []) {
  if (!ids.length) return [];
  const { rows } = await query(
    'SELECT DISTINCT six_digit_id FROM businessmen WHERE six_digit_id = ANY($1)',
    [ids],
  );
  const known = new Set(rows.map((r) => r.six_digit_id));
  return ids.filter((id) => !known.has(id));
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

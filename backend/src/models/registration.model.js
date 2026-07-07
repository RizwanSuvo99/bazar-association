import { query } from '../config/db.js';

export const REQUEST_WRITABLE_COLUMNS = [
  'full_name', 'mobile_number', 'father_name', 'mother_name', 'blood_group',
  'village', 'post_office', 'municipality_or_union', 'upazila', 'district',
  'current_business_name_address', 'business_type', 'trade_license_no', 'tin_no',
  'market_name', 'owner_name', 'ward_no', 'holding_no', 'voter_type',
  'nid_no', 'nominee_name', 'nominee_relation', 'nominee_mobile', 'profile_photo_url',
  'transaction_id',
];

export async function createRequest(data) {
  const cols = REQUEST_WRITABLE_COLUMNS.filter((c) => data[c] !== undefined);
  const values = cols.map((c) => data[c]);
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await query(
    `INSERT INTO registration_requests (${cols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
    values,
  );
  return rows[0];
}

export async function listRequests({ status } = {}) {
  const params = [];
  let where = '';
  if (status) {
    params.push(status);
    where = 'WHERE status = $1';
  }
  const { rows } = await query(
    `SELECT * FROM registration_requests ${where} ORDER BY
       CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC`,
    params,
  );
  return rows;
}

export async function getRequestById(id) {
  const { rows } = await query('SELECT * FROM registration_requests WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function markApproved(client, id, adminId, businessmanId) {
  const { rows } = await client.query(
    `UPDATE registration_requests
     SET status = 'approved', businessman_id = $2, reviewed_by = $3, reviewed_at = now()
     WHERE id = $1 RETURNING *`,
    [id, businessmanId, adminId],
  );
  return rows[0];
}

export async function markRejected(id, adminId, reason) {
  const { rows } = await query(
    `UPDATE registration_requests
     SET status = 'rejected', reject_reason = $2, reviewed_by = $3, reviewed_at = now()
     WHERE id = $1 RETURNING *`,
    [id, reason || null, adminId],
  );
  return rows[0] || null;
}

export async function countByStatus() {
  const { rows } = await query(
    `SELECT count(*) FILTER (WHERE status = 'pending')::int AS pending,
            count(*) FILTER (WHERE status = 'approved')::int AS approved,
            count(*) FILTER (WHERE status = 'rejected')::int AS rejected
     FROM registration_requests`,
  );
  return rows[0];
}

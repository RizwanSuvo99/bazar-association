import { withTransaction } from '../config/db.js';
import { createBusinessman } from '../models/businessman.model.js';
import { markApproved } from '../models/registration.model.js';
import { ApiError } from '../utils/ApiError.js';

const REQUEST_TO_BUSINESSMAN_FIELDS = [
  'full_name', 'mobile_number', 'father_name', 'mother_name', 'blood_group',
  'village', 'post_office', 'municipality_or_union', 'upazila', 'district',
  'current_business_name_address', 'business_type', 'trade_license_no', 'tin_no',
  'market_name', 'owner_name', 'ward_no', 'holding_no', 'voter_type',
  'nid_no', 'nominee_name', 'nominee_relation', 'nominee_mobile', 'profile_photo_url',
];

/**
 * Approve a pending request: create the businessman member and mark the request approved,
 * atomically. Returns { businessman, request }.
 */
export async function approveRequest(requestId, adminId) {
  return withTransaction(async (client) => {
    // Lock the request row so two admins can't approve the same one twice.
    const { rows } = await client.query(
      'SELECT * FROM registration_requests WHERE id = $1 FOR UPDATE',
      [requestId],
    );
    const request = rows[0];
    if (!request) throw ApiError.notFound('আবেদন পাওয়া যায়নি।', 'REQUEST_NOT_FOUND');
    if (request.status === 'approved') {
      throw ApiError.conflict('এই আবেদনটি ইতিমধ্যে অনুমোদিত হয়েছে।', 'ALREADY_APPROVED');
    }

    const data = {};
    for (const f of REQUEST_TO_BUSINESSMAN_FIELDS) data[f] = request[f];
    data.status = 'active';

    const businessman = await createBusinessman(data, client);
    const updatedRequest = await markApproved(client, requestId, adminId, businessman.id);

    return { businessman, request: updatedRequest };
  });
}

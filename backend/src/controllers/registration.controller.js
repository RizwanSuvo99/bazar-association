import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, created } from '../utils/respond.js';
import * as Registration from '../models/registration.model.js';
import { approveRequest } from '../services/approval.service.js';

// ---- Public ----

export const submit = asyncHandler(async (req, res) => {
  const request = await Registration.createRequest(req.body);
  return created(res, {
    id: request.id,
    status: request.status,
    message: 'আপনার আবেদন গ্রহণ করা হয়েছে। অনুমোদনের পর আপনার তথ্য প্রকাশিত হবে।',
  });
});

// ---- Admin ----

export const list = asyncHandler(async (req, res) => {
  const rows = await Registration.listRequests({ status: req.query.status });
  return ok(res, rows);
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await Registration.getRequestById(req.params.id);
  if (!row) throw ApiError.notFound('আবেদন পাওয়া যায়নি।', 'REQUEST_NOT_FOUND');
  return ok(res, row);
});

export const approve = asyncHandler(async (req, res) => {
  const result = await approveRequest(req.params.id, req.admin.id);
  return ok(res, result);
});

export const reject = asyncHandler(async (req, res) => {
  const existing = await Registration.getRequestById(req.params.id);
  if (!existing) throw ApiError.notFound('আবেদন পাওয়া যায়নি।', 'REQUEST_NOT_FOUND');
  if (existing.status === 'approved') {
    throw ApiError.conflict('অনুমোদিত আবেদন প্রত্যাখ্যান করা যাবে না।', 'ALREADY_APPROVED');
  }
  const row = await Registration.markRejected(req.params.id, req.admin.id, req.body.reason);
  return ok(res, row);
});

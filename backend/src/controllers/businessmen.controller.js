import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, created } from '../utils/respond.js';
import { toPublicBusinessman } from '../utils/mask.js';
import { normalizeDigits } from '../utils/digits.js';
import * as Businessman from '../models/businessman.model.js';

// ---- Public ----

export const publicList = asyncHandler(async (req, res) => {
  const { page, limit, sort, ...filters } = req.query;
  const result = await Businessman.listBusinessmen(filters, { page, limit, sort, publicOnly: true });
  return ok(res, result.rows.map(toPublicBusinessman), {
    page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages,
  });
});

export const facets = asyncHandler(async (req, res) => {
  return ok(res, await Businessman.getFacets());
});

export const publicProfile = asyncHandler(async (req, res) => {
  const sixDigits = normalizeDigits(req.params.sixDigits).replace(/\D/g, '');
  if (!/^\d{6}$/.test(sixDigits)) throw ApiError.notFound('প্রোফাইল পাওয়া যায়নি।', 'PROFILE_NOT_FOUND');

  const row = await Businessman.getBusinessmanBySixDigits(sixDigits);
  if (!row || row.status !== 'active') throw ApiError.notFound('প্রোফাইল পাওয়া যায়নি।', 'PROFILE_NOT_FOUND');
  return ok(res, toPublicBusinessman(row));
});

// ---- Admin ----

export const adminList = asyncHandler(async (req, res) => {
  const { page, limit, sort, ...filters } = req.query;
  const result = await Businessman.listBusinessmen(filters, { page, limit, sort, publicOnly: false });
  return ok(res, result.rows, {
    page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages,
  });
});

export const adminGetOne = asyncHandler(async (req, res) => {
  const row = await Businessman.getBusinessmanById(req.params.id);
  if (!row) throw ApiError.notFound('সদস্য পাওয়া যায়নি।', 'BUSINESSMAN_NOT_FOUND');
  return ok(res, row);
});

export const adminCreate = asyncHandler(async (req, res) => {
  const row = await Businessman.createBusinessman(req.body);
  return created(res, row);
});

export const adminUpdate = asyncHandler(async (req, res) => {
  const existing = await Businessman.getBusinessmanById(req.params.id);
  if (!existing) throw ApiError.notFound('সদস্য পাওয়া যায়নি।', 'BUSINESSMAN_NOT_FOUND');
  const row = await Businessman.updateBusinessman(req.params.id, req.body);
  return ok(res, row);
});

export const adminRemove = asyncHandler(async (req, res) => {
  const existing = await Businessman.getBusinessmanById(req.params.id);
  if (!existing) throw ApiError.notFound('সদস্য পাওয়া যায়নি।', 'BUSINESSMAN_NOT_FOUND');

  if (req.query.hard === 'true') {
    await Businessman.deleteBusinessman(req.params.id);
    return ok(res, { message: 'সদস্য মুছে ফেলা হয়েছে।', id: Number(req.params.id) });
  }
  const row = await Businessman.deactivateBusinessman(req.params.id);
  return ok(res, row);
});

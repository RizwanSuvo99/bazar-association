import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/respond.js';
import * as Pages from '../models/pageContent.model.js';

export const listAll = asyncHandler(async (req, res) => {
  const rows = await Pages.listPages();
  // Return as a keyed object for convenient client access.
  const byKey = Object.fromEntries(rows.map((r) => [r.page_key, r]));
  return ok(res, byKey);
});

export const getOne = asyncHandler(async (req, res) => {
  const row = await Pages.getPage(req.params.pageKey);
  if (!row) throw ApiError.notFound('পেজ পাওয়া যায়নি।', 'PAGE_NOT_FOUND');
  return ok(res, row);
});

export const update = asyncHandler(async (req, res) => {
  const row = await Pages.upsertPage(req.params.pageKey, req.body);
  return ok(res, row);
});

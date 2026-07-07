import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, created } from '../utils/respond.js';
import * as Notice from '../models/notice.model.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

export const publicList = asyncHandler(async (req, res) => {
  return ok(res, await Notice.listNotices({ publishedOnly: true }));
});

export const adminList = asyncHandler(async (req, res) => {
  return ok(res, await Notice.listNotices());
});

export const create = asyncHandler(async (req, res) => {
  return created(res, await Notice.createNotice(req.body));
});

export const update = asyncHandler(async (req, res) => {
  const row = await Notice.updateNotice(req.params.id, req.body);
  if (!row) throw ApiError.notFound('নোটিশ পাওয়া যায়নি।', 'NOTICE_NOT_FOUND');
  return ok(res, row);
});

export const remove = asyncHandler(async (req, res) => {
  const row = await Notice.deleteNotice(req.params.id);
  if (!row) throw ApiError.notFound('নোটিশ পাওয়া যায়নি।', 'NOTICE_NOT_FOUND');
  if (row.file_public_id) {
    await deleteFromCloudinary(row.file_public_id, row.file_resource_type || 'raw').catch(() => {});
  }
  return ok(res, { message: 'নোটিশ মুছে ফেলা হয়েছে।', id: Number(req.params.id) });
});

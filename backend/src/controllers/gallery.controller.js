import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, created } from '../utils/respond.js';
import * as Gallery from '../models/gallery.model.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';

export const publicList = asyncHandler(async (req, res) => {
  return ok(res, await Gallery.listGallery({ publishedOnly: true }));
});

export const adminList = asyncHandler(async (req, res) => {
  return ok(res, await Gallery.listGallery());
});

export const create = asyncHandler(async (req, res) => {
  return created(res, await Gallery.createGalleryImage(req.body));
});

export const update = asyncHandler(async (req, res) => {
  const row = await Gallery.updateGalleryImage(req.params.id, req.body);
  if (!row) throw ApiError.notFound('ছবি পাওয়া যায়নি।', 'IMAGE_NOT_FOUND');
  return ok(res, row);
});

export const reorder = asyncHandler(async (req, res) => {
  return ok(res, await Gallery.reorderGallery(req.body.items));
});

export const remove = asyncHandler(async (req, res) => {
  const row = await Gallery.deleteGalleryImage(req.params.id);
  if (!row) throw ApiError.notFound('ছবি পাওয়া যায়নি।', 'IMAGE_NOT_FOUND');
  if (row.cloudinary_public_id) {
    await deleteFromCloudinary(row.cloudinary_public_id).catch(() => {});
  }
  return ok(res, { message: 'ছবি মুছে ফেলা হয়েছে।', id: Number(req.params.id) });
});

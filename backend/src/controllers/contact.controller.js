import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok, created } from '../utils/respond.js';
import * as Contact from '../models/contact.model.js';

export const submit = asyncHandler(async (req, res) => {
  await Contact.createContactMessage(req.body);
  return created(res, { message: 'আপনার বার্তা পাঠানো হয়েছে। ধন্যবাদ!' });
});

export const list = asyncHandler(async (req, res) => {
  return ok(res, await Contact.listContactMessages());
});

export const markRead = asyncHandler(async (req, res) => {
  const row = await Contact.markMessageRead(req.params.id, req.body?.is_read ?? true);
  if (!row) throw ApiError.notFound('বার্তা পাওয়া যায়নি।', 'MESSAGE_NOT_FOUND');
  return ok(res, row);
});

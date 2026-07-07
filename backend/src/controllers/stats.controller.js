import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/respond.js';
import * as Businessman from '../models/businessman.model.js';
import * as Registration from '../models/registration.model.js';
import * as Contact from '../models/contact.model.js';
import { listGallery } from '../models/gallery.model.js';

export const dashboard = asyncHandler(async (req, res) => {
  const [businessmen, requests, unread, gallery] = await Promise.all([
    Businessman.countByStatus(),
    Registration.countByStatus(),
    Contact.countUnread(),
    listGallery(),
  ]);
  return ok(res, {
    businessmen,
    requests,
    unread_messages: unread,
    gallery_count: gallery.length,
  });
});

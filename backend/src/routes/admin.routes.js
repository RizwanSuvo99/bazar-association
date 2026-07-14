import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadImage, uploadPdf } from '../middleware/upload.js';
import {
  businessmanCreateSchema,
  businessmanUpdateSchema,
  businessmanQuerySchema,
} from '../validators/businessman.schema.js';
import { rejectSchema, requestQuerySchema } from '../validators/registration.schema.js';
import { galleryCreateSchema, galleryUpdateSchema, galleryReorderSchema } from '../validators/gallery.schema.js';
import { pageParamSchema, pageUpdateSchema } from '../validators/pageContent.schema.js';
import { settingsUpdateSchema } from '../validators/settings.schema.js';
import * as businessmen from '../controllers/businessmen.controller.js';
import * as registration from '../controllers/registration.controller.js';
import * as gallery from '../controllers/gallery.controller.js';
import * as pages from '../controllers/pageContent.controller.js';
import * as settings from '../controllers/settings.controller.js';
import * as contact from '../controllers/contact.controller.js';
import * as stats from '../controllers/stats.controller.js';
import * as upload from '../controllers/upload.controller.js';
import * as notice from '../controllers/notice.controller.js';
import { businessmanFormPdf } from '../controllers/formPdf.controller.js';
import { businessmanIdCardPdf, bulkIdCardsPdf } from '../controllers/idcard.controller.js';
import { noticeCreateSchema, noticeUpdateSchema } from '../validators/notice.schema.js';

const router = Router();

// Everything below requires a valid admin session.
router.use(requireAdmin);

// Dashboard
router.get('/stats', stats.dashboard);

// ID cards (bulk sheet of all active members — before the :id routes)
router.get('/id-cards.pdf', bulkIdCardsPdf);

// Businessmen CRUD
router.get('/businessmen', validate(businessmanQuerySchema, 'query'), businessmen.adminList);
router.post('/businessmen', validate(businessmanCreateSchema), businessmen.adminCreate);
router.get('/businessmen/:id/form.pdf', businessmanFormPdf);
router.get('/businessmen/:id/id-card.pdf', businessmanIdCardPdf);
router.get('/businessmen/:id', businessmen.adminGetOne);
router.patch('/businessmen/:id', validate(businessmanUpdateSchema), businessmen.adminUpdate);
router.delete('/businessmen/:id', businessmen.adminRemove);

// Registration requests
router.get('/registration-requests', validate(requestQuerySchema, 'query'), registration.list);
router.get('/registration-requests/:id', registration.getOne);
router.post('/registration-requests/:id/approve', registration.approve);
router.post('/registration-requests/:id/reject', validate(rejectSchema), registration.reject);

// Gallery
router.get('/gallery', gallery.adminList);
router.post('/gallery', validate(galleryCreateSchema), gallery.create);
router.patch('/gallery/reorder', validate(galleryReorderSchema), gallery.reorder);
router.patch('/gallery/:id', validate(galleryUpdateSchema), gallery.update);
router.delete('/gallery/:id', gallery.remove);

// Page content (bilingual CMS)
router.put('/pages/:pageKey', validate(pageParamSchema, 'params'), validate(pageUpdateSchema), pages.update);

// Site settings
router.put('/settings', validate(settingsUpdateSchema), settings.update);

// Contact inbox
router.get('/contact-messages', contact.list);
router.patch('/contact-messages/:id', contact.markRead);

// Notices (PDF files)
router.get('/notices', notice.adminList);
router.post('/notices', validate(noticeCreateSchema), notice.create);
router.patch('/notices/:id', validate(noticeUpdateSchema), notice.update);
router.delete('/notices/:id', notice.remove);

// Uploads -> Cloudinary or local fallback
router.post('/uploads/image', uploadImage, upload.uploadAdminImage);
router.post('/uploads/pdf', uploadPdf, upload.uploadNoticePdf);

export default router;

import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { uploadImage } from '../middleware/upload.js';
import { publicSubmitLimiter, uploadLimiter } from '../middleware/rateLimit.js';
import { businessmanQuerySchema } from '../validators/businessman.schema.js';
import { registrationSchema } from '../validators/registration.schema.js';
import { pageParamSchema } from '../validators/pageContent.schema.js';
import { contactSchema } from '../validators/contact.schema.js';
import * as businessmen from '../controllers/businessmen.controller.js';
import * as registration from '../controllers/registration.controller.js';
import * as gallery from '../controllers/gallery.controller.js';
import * as pages from '../controllers/pageContent.controller.js';
import * as settings from '../controllers/settings.controller.js';
import * as contact from '../controllers/contact.controller.js';
import * as upload from '../controllers/upload.controller.js';
import * as notice from '../controllers/notice.controller.js';
import * as publicForm from '../controllers/publicForm.controller.js';

const router = Router();

// Site
router.get('/settings', settings.getPublic);
router.get('/pages', pages.listAll);
router.get('/pages/:pageKey', validate(pageParamSchema, 'params'), pages.getOne);
router.get('/gallery', gallery.publicList);
router.get('/notices', notice.publicList);

// Businessmen directory
router.get('/businessmen/facets', businessmen.facets);
router.get('/businessmen', validate(businessmanQuerySchema, 'query'), businessmen.publicList);
router.get('/profiles/:sixDigits', businessmen.publicProfile);

// Member form (ID-card QR target) — keyed by the member's random public token
router.get('/members/:token/form.png', publicForm.publicMemberFormImage);
router.get('/members/:token/form.pdf', publicForm.publicMemberFormPdf);
router.get('/members/:token', publicForm.publicMemberMeta);

// Public submissions
router.post('/registration-requests', publicSubmitLimiter, validate(registrationSchema), registration.submit);
router.post('/contact-messages', publicSubmitLimiter, validate(contactSchema), contact.submit);

// Public image upload (for the required registration photo)
router.post('/uploads/registration-photo', uploadLimiter, uploadImage, upload.uploadRegistrationPhoto);

export default router;

import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'শুধুমাত্র JPG, PNG বা WEBP ছবি আপলোড করা যাবে।', 'INVALID_FILE_TYPE'));
  },
}).single('image');

// A member's hand-signed registration form: usually a phone photo, sometimes a PDF scan.
export const uploadSignedForm = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB — phone photos of A4 pages get large
  fileFilter: (req, file, cb) => {
    if ([...ALLOWED, 'application/pdf'].includes(file.mimetype)) return cb(null, true);
    cb(new ApiError(400, 'শুধুমাত্র ছবি (JPG, PNG, WEBP) বা PDF ফাইল আপলোড করা যাবে।', 'INVALID_FILE_TYPE'));
  },
}).single('file');

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new ApiError(400, 'শুধুমাত্র PDF ফাইল আপলোড করা যাবে।', 'INVALID_FILE_TYPE'));
  },
}).single('file');

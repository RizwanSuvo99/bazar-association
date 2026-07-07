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

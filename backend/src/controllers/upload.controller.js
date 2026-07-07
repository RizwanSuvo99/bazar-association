import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/respond.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const EXT = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const ALLOWED_FOLDERS = new Set(['profiles', 'gallery', 'hero', 'misc']);

async function handleUpload(req, res, folder) {
  if (!req.file) throw ApiError.badRequest('কোনো ছবি পাওয়া যায়নি।', 'NO_FILE');

  // Preferred path: Cloudinary.
  if (isCloudinaryConfigured) {
    const result = await uploadBufferToCloudinary(req.file.buffer, folder);
    return ok(res, result);
  }

  // Fallback: store on local disk and serve via /uploads/*.
  const dir = path.join(UPLOADS_DIR, folder);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}${EXT[req.file.mimetype] || ''}`;
  fs.writeFileSync(path.join(dir, filename), req.file.buffer);
  const url = `${req.protocol}://${req.get('host')}/uploads/${folder}/${filename}`;
  return ok(res, { url, public_id: null, storage: 'local' });
}

export const uploadRegistrationPhoto = asyncHandler((req, res) => handleUpload(req, res, 'profiles'));

export const uploadAdminImage = asyncHandler((req, res) => {
  const folder = ALLOWED_FOLDERS.has(req.query.folder) ? req.query.folder : 'misc';
  return handleUpload(req, res, folder);
});

// PDF upload for notices -> stored on local disk and served via /uploads/notices/*.
// Cloudinary is intentionally NOT used for PDFs: most Cloudinary accounts block PDF *delivery*
// by default (a security setting), which would make public view/download fail. Local storage
// always works. (To use Cloudinary instead, enable "Allow delivery of PDF and ZIP files" in the
// Cloudinary console and switch this handler to uploadBufferToCloudinary(..., 'auto').)
export const uploadNoticePdf = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('কোনো ফাইল পাওয়া যায়নি।', 'NO_FILE');
  const originalName = req.file.originalname || 'notice.pdf';

  const dir = path.join(UPLOADS_DIR, 'notices');
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.pdf`;
  fs.writeFileSync(path.join(dir, filename), req.file.buffer);
  const url = `${req.protocol}://${req.get('host')}/uploads/notices/${filename}`;
  return ok(res, { url, public_id: null, resource_type: 'raw', file_name: originalName, storage: 'local' });
});

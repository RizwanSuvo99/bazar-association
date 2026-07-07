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
const ALLOWED_FOLDERS = new Set(['profiles', 'gallery', 'misc']);

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

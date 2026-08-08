import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/respond.js';
import {
  getBusinessmanById,
  setSignedForm,
  setSignedFormVisible,
  clearSignedForm,
} from '../models/businessman.model.js';
import { isCloudinaryConfigured, uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DIR = path.join(__dirname, '../../uploads/signed-forms');
const LOCAL_URL_PREFIX = '/uploads/signed-forms/';

const EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

/** What the admin panel needs to render the widget. */
function signedFormOf(row) {
  if (!row?.signed_form_url) return null;
  return {
    url: row.signed_form_url,
    mime: row.signed_form_mime,
    is_pdf: row.signed_form_mime === 'application/pdf',
    visible: row.signed_form_visible,
    uploaded_at: row.signed_form_uploaded_at,
  };
}

function storeLocally(buffer, mime, req) {
  fs.mkdirSync(LOCAL_DIR, { recursive: true });
  const filename = `${crypto.randomUUID()}${EXT[mime] || ''}`;
  fs.writeFileSync(path.join(LOCAL_DIR, filename), buffer);
  // Absolute URL so the value works when embedded straight into a page.
  return { url: `${req.protocol}://${req.get('host')}${LOCAL_URL_PREFIX}${filename}`, publicId: null };
}

/** Remove whatever the previous upload left behind, wherever it was stored. */
async function discardStored(row) {
  if (row?.signed_form_public_id) {
    await deleteFromCloudinary(row.signed_form_public_id).catch(() => {});
    return;
  }
  const url = row?.signed_form_url;
  if (!url || !url.includes(LOCAL_URL_PREFIX)) return;
  // Only ever touch a basename inside our own directory — never a path from the URL.
  const name = path.basename(url.split('?')[0]);
  fs.promises.unlink(path.join(LOCAL_DIR, name)).catch(() => {});
}

async function loadMember(id) {
  const b = await getBusinessmanById(id);
  if (!b) throw ApiError.notFound('সদস্য পাওয়া যায়নি।', 'BUSINESSMAN_NOT_FOUND');
  return b;
}

/** POST /admin/businessmen/:id/signed-form — attach the scanned/photographed signed copy. */
export const upload = asyncHandler(async (req, res) => {
  const before = await loadMember(req.params.id);
  if (!req.file) throw ApiError.badRequest('কোনো ফাইল পাওয়া যায়নি।', 'NO_FILE');

  const mime = req.file.mimetype;
  let stored;
  if (mime === 'application/pdf' || !isCloudinaryConfigured) {
    // PDFs always go to disk: Cloudinary blocks PDF delivery by default, which would
    // make the public view/download fail. Images fall back here only without Cloudinary.
    stored = storeLocally(req.file.buffer, mime, req);
  } else {
    const r = await uploadBufferToCloudinary(req.file.buffer, 'signed-forms');
    stored = { url: r.url, publicId: r.public_id };
  }

  const row = await setSignedForm(before.id, { url: stored.url, publicId: stored.publicId, mime });
  await discardStored(before); // replacing: drop the file this one supersedes
  return ok(res, { signed_form: signedFormOf(row) });
});

/** PATCH /admin/businessmen/:id/signed-form — choose signed vs generated for the public page. */
export const setVisibility = asyncHandler(async (req, res) => {
  const b = await loadMember(req.params.id);
  if (!b.signed_form_url) {
    throw ApiError.badRequest('এই সদস্যের কোনো স্বাক্ষরিত ফরম আপলোড করা হয়নি।', 'NO_SIGNED_FORM');
  }
  const row = await setSignedFormVisible(b.id, req.body.visible);
  return ok(res, { signed_form: signedFormOf(row) });
});

/** DELETE /admin/businessmen/:id/signed-form */
export const remove = asyncHandler(async (req, res) => {
  const before = await loadMember(req.params.id);
  if (!before.signed_form_url) {
    throw ApiError.badRequest('এই সদস্যের কোনো স্বাক্ষরিত ফরম আপলোড করা হয়নি।', 'NO_SIGNED_FORM');
  }
  await clearSignedForm(before.id);
  await discardStored(before);
  return ok(res, { message: 'স্বাক্ষরিত ফরম মুছে ফেলা হয়েছে।', signed_form: null });
});

export { signedFormOf };

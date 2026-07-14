import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getBusinessmanBySixDigits } from '../models/businessman.model.js';
import { runPython, fetchPhotoBase64 } from './idcard.helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORM_SCRIPT = path.join(__dirname, '../form/render_form.py');

// The QR on an ID card points here. Public (no auth): anyone who scans the physical card
// can view that member's registration form. Only active members are exposed.
async function renderMemberForm(six, format) {
  const b = await getBusinessmanBySixDigits(six);
  if (!b || b.status !== 'active') throw ApiError.notFound('সদস্য পাওয়া যায়নি।', 'MEMBER_NOT_FOUND');
  const photo_b64 = await fetchPhotoBase64(b.profile_photo_url);
  const buf = await runPython(FORM_SCRIPT, { ...b, photo_b64, format });
  return { b, buf };
}

export const publicMemberFormImage = asyncHandler(async (req, res) => {
  const { buf } = await renderMemberForm(req.params.six, 'png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(buf);
});

export const publicMemberFormPdf = asyncHandler(async (req, res) => {
  const { b, buf } = await renderMemberForm(req.params.six, 'pdf');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="registration-form-${b.unique_id}.pdf"`);
  res.send(buf);
});

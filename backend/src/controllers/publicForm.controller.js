import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ok } from '../utils/respond.js';
import { getBusinessmanByToken } from '../models/businessman.model.js';
import { runPython, fetchPhotoBase64 } from './idcard.helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FORM_SCRIPT = path.join(__dirname, '../form/render_form.py');

// The QR on an ID card points here, keyed by the member's random public token (unguessable).
// Public (no auth): anyone who scans the physical card can view that member's registration form.
async function loadActiveMember(token) {
  const b = await getBusinessmanByToken(token);
  if (!b || b.status !== 'active') throw ApiError.notFound('সদস্য পাওয়া যায়নি।', 'MEMBER_NOT_FOUND');
  return b;
}

async function renderMemberForm(token, format) {
  const b = await loadActiveMember(token);
  const photo_b64 = await fetchPhotoBase64(b.profile_photo_url);
  const buf = await runPython(FORM_SCRIPT, { ...b, photo_b64, format });
  return { b, buf };
}

/** Basic (non-sensitive) member info for the public form page header. */
export const publicMemberMeta = asyncHandler(async (req, res) => {
  const b = await loadActiveMember(req.params.token);
  return ok(res, { full_name: b.full_name, unique_id: b.unique_id });
});

export const publicMemberFormImage = asyncHandler(async (req, res) => {
  const { buf } = await renderMemberForm(req.params.token, 'png');
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.send(buf);
});

export const publicMemberFormPdf = asyncHandler(async (req, res) => {
  const { b, buf } = await renderMemberForm(req.params.token, 'pdf');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="registration-form-${b.unique_id}.pdf"`);
  res.send(buf);
});

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

/**
 * Basic (non-sensitive) member info for the public form page header.
 *
 * signed_form is returned ONLY when a signed copy exists and the admin has it switched on;
 * otherwise it is absent and the page falls back to the generated form. Deciding that here
 * rather than in the frontend means a hidden copy's URL never reaches the browser.
 */
export const publicMemberMeta = asyncHandler(async (req, res) => {
  const b = await loadActiveMember(req.params.token);
  const showSigned = Boolean(b.signed_form_url) && b.signed_form_visible;
  return ok(res, {
    full_name: b.full_name,
    unique_id: b.unique_id,
    signed_form: showSigned
      ? { url: b.signed_form_url, is_pdf: b.signed_form_mime === 'application/pdf' }
      : null,
  });
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

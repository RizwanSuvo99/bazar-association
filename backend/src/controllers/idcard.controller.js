import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getBusinessmanById, listActiveForCards } from '../models/businessman.model.js';
import { runPython, fetchPhotoBase64, makeQrBase64, memberFormUrl, mapConcurrent } from './idcard.helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IDCARD_SCRIPT = path.join(__dirname, '../form/render_idcard.py');
const IDCARDS_SCRIPT = path.join(__dirname, '../form/render_idcards.py');

function cardPayload(b, photo_b64, qr_b64) {
  return {
    six_digit_id: b.six_digit_id,
    full_name: b.full_name,
    business_type: b.business_type,
    mobile_number: b.mobile_number,
    blood_group: b.blood_group,
    photo_b64,
    qr_b64,
  };
}

/** Single member's ID card (portrait badge) as a PDF. */
export const businessmanIdCardPdf = asyncHandler(async (req, res) => {
  const b = await getBusinessmanById(req.params.id);
  if (!b) throw ApiError.notFound('সদস্য পাওয়া যায়নি।', 'BUSINESSMAN_NOT_FOUND');

  const [photo_b64, qr_b64] = await Promise.all([
    fetchPhotoBase64(b.profile_photo_url),
    makeQrBase64(memberFormUrl(b.public_token)),
  ]);
  const pdf = await runPython(IDCARD_SCRIPT, cardPayload(b, photo_b64, qr_b64));

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="id-card-${b.unique_id}.pdf"`);
  res.send(pdf);
});

/** All active members' ID cards on A4 sheets (grid, for printing) as one PDF. */
export const bulkIdCardsPdf = asyncHandler(async (req, res) => {
  const members = await listActiveForCards();
  if (!members.length) throw ApiError.notFound('কোনো সক্রিয় সদস্য নেই।', 'NO_MEMBERS');

  req.setTimeout?.(0);
  res.setTimeout?.(0);

  const cards = await mapConcurrent(members, 6, async (b) => {
    const [photo_b64, qr_b64] = await Promise.all([
      fetchPhotoBase64(b.profile_photo_url),
      makeQrBase64(memberFormUrl(b.public_token)),
    ]);
    return cardPayload(b, photo_b64, qr_b64);
  });

  const pdf = await runPython(IDCARDS_SCRIPT, { cards: cards.filter(Boolean) });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="id-cards-all.pdf"');
  res.send(pdf);
});

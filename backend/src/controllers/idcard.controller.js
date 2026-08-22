import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { getBusinessmanById, listActiveForCards } from '../models/businessman.model.js';
import { runPython, fetchPhotoBase64, makeQrBase64, memberFormUrl, mapConcurrent } from './idcard.helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IDCARD_SCRIPT = path.join(__dirname, '../form/render_idcard.py');
const IDCARDS_SCRIPT = path.join(__dirname, '../form/render_idcards.py');
const MAX_BULK_CARDS = 800;

function cardPayload(b, photo_b64, qr_b64) {
  return {
    six_digit_id: b.six_digit_id,
    full_name: b.full_name,
    business_type: b.business_type,
    current_business_name_address: b.current_business_name_address,
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
  // Honour the same filters as the admin list (date range, search, market...) so the office can
  // print just the latest batch. page/limit/sort are dropped: a print run is never paginated,
  // and listActiveForCards always pins status = 'active'.
  const { page, limit, sort, ...filters } = req.query;
  const members = await listActiveForCards(filters);
  if (!members.length) {
    throw ApiError.notFound('এই ফিল্টারে কোনো সক্রিয় সদস্য পাওয়া যায়নি।', 'NO_MEMBERS');
  }
  // Every card's photo and QR are base64-encoded into a single JSON string for python's
  // stdin — roughly 400 KB per member. Past a few hundred that string approaches V8's limit
  // and an OOM would take the whole API down, so fail with something actionable instead.
  if (members.length > MAX_BULK_CARDS) {
    throw ApiError.badRequest(
      `একসাথে সর্বোচ্চ ${MAX_BULK_CARDS} জনের কার্ড তৈরি করা যায়। তারিখ দিয়ে ফিল্টার করে ছোট ভাগে ডাউনলোড করুন।`,
      'TOO_MANY_CARDS',
    );
  }

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
  // Name the file after the range so printing several batches doesn't yield "(1)", "(2)"...
  // Sanitised because a bound may now carry a time: the space and colon in "2026-08-22 14:30"
  // would break the Content-Disposition token, and colons are illegal in Windows filenames.
  const span =
    [filters.from, filters.to].filter(Boolean).join('_to_').replace(/[^0-9A-Za-z_-]+/g, '-') || 'all';
  res.setHeader('Content-Disposition', `attachment; filename="id-cards-${span}.pdf"`);
  res.send(pdf);
});

import writeXlsxFile from 'write-excel-file/node';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { listForExport } from '../models/businessman.model.js';
import { mapConcurrent } from './idcard.helpers.js';
import { isAllowedPhotoUrl } from '../utils/photoUrl.js';

// The association's own calendar day — the database session runs in UTC, so a member added
// at 02:00 Dhaka would otherwise be dated to the previous day in the sheet.
const APP_TZ = 'Asia/Dhaka';

const dhakaDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

// `height` is pinned rather than left to auto-fit: a photo is positioned from the stored row
// heights, so a header row that silently grows to fit two lines of wrapped text would push
// every picture out of line with its row.
const headerCell = (value) => ({
  value,
  fontWeight: 'bold',
  backgroundColor: '#E8EFE6',
  align: 'center',
  alignVertical: 'center',
  wrap: true,
  height: 34,
  borderStyle: 'thin',
  borderColor: '#B7C7B2',
});

/**
 * Plain text cell. Everything is written as text on purpose: NID, mobile, TIN, trade licence,
 * ward and holding numbers are identifiers, not quantities. Left as numbers, Excel would
 * drop a leading zero from a mobile number and show a 17-digit NID as 5.98613E+16.
 */
const text = (value) => ({ value: value || null, type: String, alignVertical: 'center' });

/* ------------------------------- member photos -------------------------------
   Photos sit on the sheet's image layer, anchored to a cell in the ছবি column rather than
   stored inside it — that is all .xlsx offers. They follow their row when rows are inserted
   or deleted, but sorting or filtering the sheet moves the text and leaves the photos
   behind, so the ক্রমিক column is the thing to trust after a sort. */

const PHOTO = {
  // 4:5, a passport photo's proportion. The cell is sized to exactly these pixels so the
  // picture fills it edge to edge instead of floating in it.
  width: 100,
  height: 125,
  // Excel row height is in points: 125px at 96 dpi is 93.75pt.
  rowHeight: 93.75,
  // Column width is in characters, and the two spreadsheet apps measure it slightly
  // differently: Excel renders 13.54 as 7 × 13.54 + 5 ≈ 100px, LibreOffice (measured, with
  // the default font pinned below) as 7.4 × 13.54 ≈ 100px. Both land on the photo's width.
  columnWidth: 13.54,
};

/**
 * Cloudinary crops and resizes the photo for us, to 320x400 — 3.2x the size it is shown at,
 * which is about 307 dpi once the sheet is printed at 100%, so a printed photo is sharp
 * rather than pixellated. The originals are ~1100x1450 and 2 MB each; sending those would
 * make a 677-member sheet well over a gigabyte, where this is roughly 20 KB per member.
 *
 * `c_fill` crops to the 4:5 frame (rather than squashing), `g_auto` keeps the face in it.
 * Any other host — the local /uploads fallback — is fetched as it is and scaled to fit.
 */
const CLOUDINARY_THUMB = 'c_fill,g_auto,w_320,h_400,f_jpg,q_auto:good';
const PHOTO_TIMEOUT_MS = 15000;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
// 16 in flight rather than a handful: the cost of a photo is almost all round-trip latency,
// and measured against the live register 16 fetched 677 photos in 6s where 8 took 27s.
const PHOTO_CONCURRENCY = 16;

function thumbnailUrl(url) {
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/')
    ? url.replace('/image/upload/', `/image/upload/${CLOUDINARY_THUMB}/`)
    : url;
}

/**
 * Intrinsic pixel size of a PNG or JPEG, read from its header. Needed only for photos we
 * did not resize ourselves: without it a portrait would be stretched into the 44x55 box.
 * Returns null for anything unrecognised, which drops that one photo rather than the sheet.
 */
function imageSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }; // PNG IHDR
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    // Walk the JPEG segments to the start-of-frame header, which carries the dimensions.
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2; // standalone markers, no length field
        continue;
      }
      // SOF0..SOF15, except the three markers in that range that are not frame headers.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Largest size that fits the photo box without distorting the picture. */
function fitBox({ width, height }) {
  const scale = Math.min(PHOTO.width / width, PHOTO.height / height, 1);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/**
 * One member's photo, ready to anchor. A member without a photo, an image host that is slow
 * or down, a file that is not an image — any of those yields null and an empty cell, because
 * the register as a whole is worth more than one picture.
 */
async function fetchPhoto(member) {
  // The URL came from the applicant's own registration form, so it is only fetched when it
  // points at an allowed photo origin, and a redirect away from that origin fails the fetch
  // rather than following it. See utils/photoUrl.js.
  if (!isAllowedPhotoUrl(member.profile_photo_url)) return null;
  try {
    const res = await fetch(thumbnailUrl(member.profile_photo_url), {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'error',
      signal: AbortSignal.timeout(PHOTO_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const content = Buffer.from(await res.arrayBuffer());
    if (!content.length || content.length > MAX_PHOTO_BYTES) return null;
    const size = imageSize(content);
    if (!size) return null;
    const isPng = content.readUInt32BE(0) === 0x89504e47;
    return { content, contentType: isPng ? 'image/png' : 'image/jpeg', ...fitBox(size) };
  } catch {
    return null; // timeout, DNS, socket — never fail the whole export over one photo
  }
}

/**
 * One column per field of the printed registration form, in the same order as the paper,
 * so the sheet can be read side by side with a form. Serial, status and registration date
 * are office columns and sit outside that block (first and last).
 */
const COLUMNS = [
  // serial_no, not the row index: a filtered sheet then shows the same ক্রমিক as the admin
  // list rather than renumbering its own rows from 1.
  // `height` here sets the whole row's height — the tallest cell in a row wins — which is
  // what gives the photo in the last column room to sit in.
  { header: headerCell('ক্রমিক'), width: 8, cell: (b) => ({ value: b.serial_no, type: Number, align: 'center', alignVertical: 'center', height: PHOTO.rowHeight }) },
  { header: headerCell('আইডি নং'), width: 14, cell: (b) => text(b.unique_id) },
  { header: headerCell('সদস্যের নাম'), width: 24, cell: (b) => text(b.full_name) },
  { header: headerCell('মোবাইল নং'), width: 14, cell: (b) => text(b.mobile_number) },
  { header: headerCell('পিতার নাম'), width: 22, cell: (b) => text(b.father_name) },
  { header: headerCell('মাতার নাম'), width: 22, cell: (b) => text(b.mother_name) },
  { header: headerCell('গ্রাম'), width: 18, cell: (b) => text(b.village) },
  { header: headerCell('ডাকঘর'), width: 16, cell: (b) => text(b.post_office) },
  { header: headerCell('পৌরসভা/ইউনিয়ন'), width: 18, cell: (b) => text(b.municipality_or_union) },
  { header: headerCell('উপজেলা'), width: 14, cell: (b) => text(b.upazila) },
  { header: headerCell('জেলা'), width: 14, cell: (b) => text(b.district) },
  { header: headerCell('বর্তমান প্রতিষ্ঠানের নাম ও ঠিকানা'), width: 32, cell: (b) => text(b.current_business_name_address) },
  { header: headerCell('ব্যবসার ধরণ'), width: 18, cell: (b) => text(b.business_type) },
  { header: headerCell('ভোটারের ধরণ'), width: 14, cell: (b) => text(b.voter_type) },
  { header: headerCell('ট্রেড লাইসেন্স নং'), width: 16, cell: (b) => text(b.trade_license_no) },
  { header: headerCell('টিআইএন নং'), width: 16, cell: (b) => text(b.tin_no) },
  { header: headerCell('মার্কেটের নাম'), width: 20, cell: (b) => text(b.market_name) },
  { header: headerCell('মালিকের নাম'), width: 20, cell: (b) => text(b.owner_name) },
  { header: headerCell('পৌরসভা ওয়ার্ড নং'), width: 12, cell: (b) => text(b.ward_no) },
  { header: headerCell('দোকানের হোল্ডিং নং'), width: 14, cell: (b) => text(b.holding_no) },
  { header: headerCell('জাতীয় পরিচয়পত্র নং'), width: 20, cell: (b) => text(b.nid_no) },
  { header: headerCell('রক্তের গ্রুপ'), width: 11, cell: (b) => ({ ...text(b.blood_group), align: 'center' }) },
  { header: headerCell('নমিনীর নাম'), width: 22, cell: (b) => text(b.nominee_name) },
  { header: headerCell('নমিনীর সাথে সম্পর্ক'), width: 16, cell: (b) => text(b.nominee_relation) },
  { header: headerCell('নমিনীর মোবাইল নং'), width: 14, cell: (b) => text(b.nominee_mobile) },
  { header: headerCell('অবস্থা'), width: 11, cell: (b) => text(b.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়') },
  { header: headerCell('যোগের তারিখ'), width: 14, cell: (b) => ({ ...text(dhakaDate.format(b.created_at)), align: 'center' }) },
  // Empty on purpose: the picture is drawn on the image layer, anchored to this cell.
  { header: headerCell('ছবি'), width: PHOTO.columnWidth, cell: () => null },
];

/** All members' registration details as one .xlsx sheet. */
export const membersExcel = asyncHandler(async (req, res) => {
  // Same filters as the admin list (search, date range, market, status...) so the office can
  // export just one batch. page/limit are dropped: an export covers the whole filtered set,
  // not the page being viewed.
  // sort is dropped too: the register is always serial (oldest first), whatever order the
  // list happens to be showing.
  const { page, limit, sort, ...filters } = req.query;
  const members = await listForExport(filters);
  if (!members.length) {
    throw ApiError.notFound('এই ফিল্টারে কোনো সদস্য পাওয়া যায়নি।', 'NO_MEMBERS');
  }

  // Several hundred photos to fetch, so take the response off the default socket timeout —
  // the same thing the bulk ID-card sheet does.
  req.setTimeout?.(0);
  res.setTimeout?.(0);

  const photos = await mapConcurrent(members, PHOTO_CONCURRENCY, fetchPhoto);
  const photoColumn = COLUMNS.length; // ছবি is the last column
  const images = [];
  photos.forEach((photo, i) => {
    if (!photo) return;
    images.push({
      content: photo.content,
      contentType: photo.contentType,
      width: photo.width,
      height: photo.height,
      dpi: 96,
      // Row 1 is the header, so the first member sits in row 2.
      anchor: { row: i + 2, column: photoColumn },
      // Zero for a Cloudinary photo, which is already cropped to the cell's exact 4:5 shape —
      // it fills the cell completely. A photo from anywhere else keeps its own proportions
      // and is centred in the cell instead of being stretched to fit.
      offsetX: Math.round((PHOTO.width - photo.width) / 2),
      offsetY: Math.round((PHOTO.height - photo.height) / 2),
      title: members[i].full_name,
    });
  });

  const buffer = await writeXlsxFile(members, {
    columns: COLUMNS,
    sheet: 'সদস্য তালিকা',
    // Keeps the header visible while scrolling 500+ rows.
    stickyRowsCount: 1,
    images,
  }, {
    // Pinned, because a column's width is measured in characters of the default font: left
    // unset, each app picks its own and the photo column stops matching the photo.
    fontFamily: 'Calibri',
    fontSize: 11,
  }).toBuffer();

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  // Named after the filtered range, or the export date when unfiltered, so repeated
  // downloads don't pile up as "(1)", "(2)". Sanitised because a bound may carry a time:
  // its space and colon would break the Content-Disposition token and are illegal in
  // Windows filenames.
  const span =
    [filters.from, filters.to].filter(Boolean).join('_to_').replace(/[^0-9A-Za-z_-]+/g, '-') ||
    new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Disposition', `attachment; filename="members-${span}.xlsx"`);
  res.send(buffer);
});

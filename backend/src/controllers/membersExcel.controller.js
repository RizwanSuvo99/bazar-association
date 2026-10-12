import writeXlsxFile from 'write-excel-file/node';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { listForExport } from '../models/businessman.model.js';

// The association's own calendar day — the database session runs in UTC, so a member added
// at 02:00 Dhaka would otherwise be dated to the previous day in the sheet.
const APP_TZ = 'Asia/Dhaka';

const dhakaDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TZ,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const headerCell = (value) => ({
  value,
  fontWeight: 'bold',
  backgroundColor: '#E8EFE6',
  align: 'center',
  alignVertical: 'center',
  wrap: true,
  borderStyle: 'thin',
  borderColor: '#B7C7B2',
});

/**
 * Plain text cell. Everything is written as text on purpose: NID, mobile, TIN, trade licence,
 * ward and holding numbers are identifiers, not quantities. Left as numbers, Excel would
 * drop a leading zero from a mobile number and show a 17-digit NID as 5.98613E+16.
 */
const text = (value) => ({ value: value || null, type: String });

/**
 * One column per field of the printed registration form, in the same order as the paper,
 * so the sheet can be read side by side with a form. Serial, status and registration date
 * are office columns and sit outside that block (first and last).
 */
const COLUMNS = [
  { header: headerCell('ক্রমিক'), width: 8, cell: (_b, i) => ({ value: i + 1, type: Number, align: 'center' }) },
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
  { header: headerCell('ছবির লিংক'), width: 36, cell: (b) => text(b.profile_photo_url) },
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

  const buffer = await writeXlsxFile(members, {
    columns: COLUMNS,
    sheet: 'সদস্য তালিকা',
    // Keeps the header visible while scrolling 500+ rows.
    stickyRowsCount: 1,
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

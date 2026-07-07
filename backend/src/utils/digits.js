// Bengali (০-৯) and Arabic-Indic (٠-٩) digit code points mapped to Western 0-9.
const DIGIT_MAP = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

/** Convert any Bengali/Arabic-Indic digits in a string to Western digits. */
export function normalizeDigits(value) {
  if (value === null || value === undefined) return value;
  return String(value).replace(/[০-৯٠-٩]/g, (d) => DIGIT_MAP[d] ?? d);
}

/**
 * Normalize an NID: convert to Western digits and strip everything that is not a digit
 * (spaces, dashes, etc.), so the last-6 derivation and the profile route stay deterministic.
 */
export function sanitizeNid(value) {
  return normalizeDigits(value).replace(/\D/g, '');
}

/** Last 6 digits of a (sanitized) NID. */
export function sixDigitsOfNid(nid) {
  const clean = sanitizeNid(nid);
  return clean.slice(-6);
}

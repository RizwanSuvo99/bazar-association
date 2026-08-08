// Masking for sensitive identifiers on the PUBLIC profile page.
// Admin responses use the raw values; only public projections are masked.

/** Show only the last `visible` characters, replacing the rest with bullets. */
function maskTail(value, visible = 6) {
  if (!value) return value;
  const str = String(value);
  if (str.length <= visible) return str;
  const hiddenLen = str.length - visible;
  return '•'.repeat(Math.min(hiddenLen, 8)) + str.slice(-visible);
}

export function maskNid(nid) {
  return maskTail(nid, 6);
}

export function maskTin(tin) {
  if (!tin) return tin;
  return maskTail(tin, 4);
}

/**
 * Trade licence numbers here run only 5-8 characters ("00216", "00588-01"), so the 4-character
 * tail used for a 12-digit TIN would leave most of the value readable. Two is the smallest
 * tail that still lets a member recognise their own record.
 */
export function maskTradeLicense(value) {
  if (!value) return value;
  return maskTail(value, 2);
}

/** Given a full businessman row, return a public-safe copy with NID/TIN masked. */
export function toPublicBusinessman(row) {
  if (!row) return row;
  // Never leak the private ID-card token or the member's nominee (next-of-kin)
  // details through the public profile API. The signed registration form is stripped too:
  // it is served only from the token page, and only when the admin has enabled it there,
  // so its URL must not ride along on the public directory/profile responses.
  const {
    public_token,
    nominee_name,
    nominee_relation,
    nominee_mobile,
    signed_form_url,
    signed_form_public_id,
    signed_form_mime,
    signed_form_uploaded_at,
    signed_form_visible,
    ...rest
  } = row;
  return {
    ...rest,
    nid_no: maskNid(row.nid_no),
    tin_no: row.tin_no ? maskTin(row.tin_no) : row.tin_no,
    trade_license_no: row.trade_license_no ? maskTradeLicense(row.trade_license_no) : row.trade_license_no,
  };
}

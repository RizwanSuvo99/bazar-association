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

/** Given a full businessman row, return a public-safe copy with NID/TIN masked. */
export function toPublicBusinessman(row) {
  if (!row) return row;
  // Never leak the private ID-card token through the (guessable) public profile API.
  const { public_token, ...rest } = row;
  return {
    ...rest,
    nid_no: maskNid(row.nid_no),
    tin_no: row.tin_no ? maskTin(row.tin_no) : row.tin_no,
  };
}

/** Parse optional page/limit query params.
 *  Returns null when neither is present (caller keeps legacy full-list behaviour). */
export function pageParams(query, defaultLimit = 20) {
  if (query.page === undefined && query.limit === undefined) return null;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit };
}

export function toMeta({ total, page, limit, totalPages }) {
  return { page, limit, total, totalPages };
}

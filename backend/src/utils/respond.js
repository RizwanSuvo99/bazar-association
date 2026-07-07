export function ok(res, data, meta) {
  const body = { success: true, data };
  if (meta !== undefined) body.meta = meta;
  return res.json(body);
}

export function created(res, data) {
  return res.status(201).json({ success: true, data });
}

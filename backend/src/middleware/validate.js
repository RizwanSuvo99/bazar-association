import { ApiError } from '../utils/ApiError.js';

/**
 * Validate and coerce req[source] against a zod schema.
 * On success the parsed value replaces req[source]. On failure -> 400 VALIDATION_ERROR.
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    return next(ApiError.badRequest('প্রদত্ত তথ্য সঠিক নয়।', 'VALIDATION_ERROR', details));
  }
  // req.query / req.params can be read-only getters in Express 5-style setups; assign defensively.
  try {
    req[source] = result.data;
  } catch {
    req.validated = req.validated || {};
    req.validated[source] = result.data;
  }
  next();
};

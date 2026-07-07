import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export function notFound(req, res, next) {
  next(ApiError.notFound(`রুট পাওয়া যায়নি: ${req.method} ${req.originalUrl}`, 'ROUTE_NOT_FOUND'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'সার্ভারে একটি সমস্যা হয়েছে।';
  let details;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'প্রদত্ত তথ্য সঠিক নয়।';
    details = err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
  } else if (err && err.code === '23505') {
    // unique_violation
    statusCode = 409;
    code = 'DUPLICATE';
    message = err.constraint && err.constraint.includes('six_digit')
      ? 'এই এনআইডি-র শেষ ৬ সংখ্যা দিয়ে ইতিমধ্যে একজন সদস্য নিবন্ধিত আছেন।'
      : 'এই তথ্য দিয়ে ইতিমধ্যে একটি রেকর্ড আছে।';
  } else if (err && err.code === '23503') {
    statusCode = 400;
    code = 'FK_VIOLATION';
    message = 'সম্পর্কিত রেকর্ড পাওয়া যায়নি।';
  } else if (err && (err.code === '22P02' || err.code === '23514')) {
    statusCode = 400;
    code = 'INVALID_INPUT';
    message = 'প্রদত্ত তথ্য গ্রহণযোগ্য নয়।';
  } else if (err && err.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'ফাইল বা তথ্যের আকার অনেক বড়।';
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  const body = { success: false, error: { message, code } };
  if (details) body.error.details = details;
  if (!env.isProd && statusCode >= 500) body.error.stack = err.stack;

  res.status(statusCode).json(body);
}

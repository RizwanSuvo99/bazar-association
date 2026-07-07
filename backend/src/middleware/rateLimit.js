import rateLimit from 'express-rate-limit';

const message = {
  success: false,
  error: { message: 'অনেক বেশি অনুরোধ। কিছুক্ষণ পর আবার চেষ্টা করুন।', code: 'RATE_LIMITED' },
};

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const publicSubmitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

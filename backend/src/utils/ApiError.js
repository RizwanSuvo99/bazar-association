export class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message, code = 'BAD_REQUEST', details) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'অনুমোদিত নয়।', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'নিষিদ্ধ।', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'পাওয়া যায়নি।', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message, code = 'CONFLICT', details) {
    return new ApiError(409, message, code, details);
  }
}

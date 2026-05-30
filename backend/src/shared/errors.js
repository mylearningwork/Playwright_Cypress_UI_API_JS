export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new AppError(message, 400, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Authentication required') =>
  new AppError(message, 401, 'UNAUTHORIZED');
export const forbidden = (message = 'Insufficient permissions') =>
  new AppError(message, 403, 'FORBIDDEN');
export const notFound = (resource = 'Resource') => new AppError(`${resource} not found`, 404, 'NOT_FOUND');
export const conflict = (message, details) => new AppError(message, 409, 'CONFLICT', details);
export const upstreamUnavailable = (message, details) =>
  new AppError(message, 502, 'UPSTREAM_UNAVAILABLE', details);

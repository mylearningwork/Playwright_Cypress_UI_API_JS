import { AppError } from '../shared/errors.js';

export function errorHandler(error, req, res, _next) {
  const isTrusted = error instanceof AppError;
  const statusCode = isTrusted ? error.statusCode : 500;

  req.log?.error({ err: error, requestId: req.id }, 'request failed');

  res.status(statusCode).json({
    error: {
      code: isTrusted ? error.code : 'INTERNAL_ERROR',
      message: isTrusted ? error.message : 'Unexpected server error',
      requestId: req.id,
      details: isTrusted ? error.details : undefined
    }
  });
}

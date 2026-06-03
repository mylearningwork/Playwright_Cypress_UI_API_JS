import { env } from '../config/env.js';
import { AppError } from '../shared/errors.js';

const problemTypes = {
  BAD_REQUEST: 'bad-request',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not-found',
  CONFLICT: 'conflict',
  UPSTREAM_UNAVAILABLE: 'upstream-unavailable',
  INTERNAL_ERROR: 'internal-error'
};

export function errorHandler(err, req, res, _next) {
  const isTrusted = err instanceof AppError;
  const statusCode = isTrusted ? err.statusCode : 500;
  const code = isTrusted ? err.code : 'INTERNAL_ERROR';

  if (!isTrusted) req.log?.error({ err }, 'Unhandled error');

  const problem = {
    type: `${env.API_BASE_URL}/problems/${problemTypes[code] ?? 'internal-error'}`,
    title: err.message || 'Internal Server Error',
    status: statusCode,
    detail: err.message || 'Internal Server Error',
    instance: req.originalUrl,
    code,
    requestId: req.id
  };

  if (isTrusted && err.details) problem.errors = err.details;

  res.status(statusCode).type('application/problem+json').json(problem);
}

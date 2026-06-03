import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { forbidden, unauthorized } from '../shared/errors.js';

export function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(unauthorized());

  try {
    const payload = jwt.verify(header.slice('Bearer '.length), env.JWT_SECRET);
    if (payload.type && payload.type !== 'access') return next(unauthorized('Access token required'));
    req.user = payload;
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}

export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };

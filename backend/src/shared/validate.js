import { badRequest } from './errors.js';

export const validate =
  ({ body, params, query }) =>
  (req, _res, next) => {
    const result = {};

    if (body) {
      const parsed = body.safeParse(req.body);
      if (!parsed.success) return next(badRequest('Invalid request body', parsed.error.flatten()));
      result.body = parsed.data;
    }

    if (params) {
      const parsed = params.safeParse(req.params);
      if (!parsed.success) return next(badRequest('Invalid route params', parsed.error.flatten()));
      result.params = parsed.data;
    }

    if (query) {
      const parsed = query.safeParse(req.query);
      if (!parsed.success) return next(badRequest('Invalid query string', parsed.error.flatten()));
      result.query = parsed.data;
    }

    req.validated = result;
    next();
  };

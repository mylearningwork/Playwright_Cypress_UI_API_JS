import { DEFAULT_TENANT_ID } from '../shared/constants.js';

export function resolveTenantId(req) {
  return req.user?.tenantId ?? req.headers['x-tenant-id'] ?? DEFAULT_TENANT_ID;
}

export function tenantContext(req, _res, next) {
  req.tenantId = resolveTenantId(req);
  next();
}

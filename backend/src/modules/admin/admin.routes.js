import { Router } from 'express';
import { store } from '../../db/in-memory-store.js';
import { authenticate, requireRole } from '../../middleware/authenticate.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireRole('admin'));

adminRouter.get('/metrics', (_req, res) => {
  res.json({
    users: store.users.size,
    customers: store.customers.size,
    products: store.products.size,
    orders: store.orders.size,
    auditLogs: store.auditLogs.length,
    uptimeSeconds: Math.round(process.uptime())
  });
});

adminRouter.get('/audit-logs', (_req, res) => {
  res.json({ data: store.auditLogs.slice(-100).reverse(), meta: { total: store.auditLogs.length } });
});

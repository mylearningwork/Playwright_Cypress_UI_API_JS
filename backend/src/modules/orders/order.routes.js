import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { idempotency } from '../../middleware/idempotency.js';
import { tenantContext } from '../../middleware/tenant.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { validate } from '../../shared/validate.js';
import * as orderService from './order.service.js';

export const orderRouter = Router();

const idParam = z.object({ id: z.string().uuid() });

orderRouter.use(authenticate, tenantContext);

orderRouter.get(
  '/',
  validate({
    query: z.object({
      customerId: z.string().uuid().optional(),
      status: z.enum(['confirmed', 'cancelled']).optional(),
      limit: z.coerce.number().int().positive().max(100).default(20),
      cursor: z.string().optional()
    })
  }),
  asyncHandler(async (req, res) => {
    res.json(await orderService.listOrders(req.tenantId, req.validated.query));
  })
);

orderRouter.get(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    res.json({ data: await orderService.getOrder(req.tenantId, req.validated.params.id) });
  })
);

orderRouter.post(
  '/',
  requireRole('admin', 'manager'),
  idempotency,
  validate({
    body: z.object({
      customerId: z.string().uuid(),
      paymentMethod: z.enum(['visa', 'mastercard', 'upi', 'declined-card']),
      items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() })).min(1)
    })
  }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: await orderService.createOrder(req.tenantId, req.validated.body, req.user) });
  })
);

orderRouter.post(
  '/:id/cancel',
  requireRole('admin', 'manager'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    res.json({ data: await orderService.cancelOrder(req.tenantId, req.validated.params.id, req.user) });
  })
);

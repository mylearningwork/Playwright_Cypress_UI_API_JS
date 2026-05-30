import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { validate } from '../../shared/validate.js';
import * as customerService from './customer.service.js';

export const customerRouter = Router();

const idParam = z.object({ id: z.string().uuid() });
const customerInput = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze')
});

customerRouter.use(authenticate);

customerRouter.get(
  '/',
  validate({
    query: z.object({
      status: z.enum(['active', 'inactive']).optional(),
      tier: z.enum(['bronze', 'silver', 'gold', 'platinum']).optional(),
      limit: z.coerce.number().int().positive().max(100).default(20),
      offset: z.coerce.number().int().min(0).default(0)
    })
  }),
  (req, res) => res.json(customerService.listCustomers(req.validated.query))
);

customerRouter.get('/:id', validate({ params: idParam }), (req, res) => {
  res.json({ data: customerService.getCustomer(req.validated.params.id) });
});

customerRouter.post(
  '/',
  requireRole('admin', 'manager'),
  validate({ body: customerInput }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: customerService.createCustomer(req.validated.body, req.user) });
  })
);

customerRouter.patch(
  '/:id',
  requireRole('admin', 'manager'),
  validate({ params: idParam, body: customerInput.partial() }),
  (req, res) => {
    res.json({ data: customerService.updateCustomer(req.validated.params.id, req.validated.body, req.user) });
  }
);

customerRouter.delete('/:id', requireRole('admin'), validate({ params: idParam }), (req, res) => {
  res.json({ data: customerService.deactivateCustomer(req.validated.params.id, req.user) });
});

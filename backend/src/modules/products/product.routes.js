import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { tenantContext } from '../../middleware/tenant.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { validate } from '../../shared/validate.js';
import * as productService from './product.service.js';

export const productRouter = Router();

productRouter.use(authenticate, tenantContext);

productRouter.get(
  '/',
  validate({
    query: z.object({
      status: z.enum(['active', 'inactive']).optional(),
      q: z.string().optional(),
      lowStock: z.coerce.boolean().optional(),
      limit: z.coerce.number().int().positive().max(100).default(20),
      cursor: z.string().optional()
    })
  }),
  asyncHandler(async (req, res) => {
    res.json(await productService.listProducts(req.tenantId, req.validated.query));
  })
);

productRouter.get(
  '/:id',
  validate({ params: z.object({ id: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    res.json({ data: await productService.getProduct(req.tenantId, req.validated.params.id) });
  })
);

productRouter.post(
  '/',
  requireRole('admin', 'manager'),
  validate({
    body: z.object({
      sku: z.string().min(3).max(40),
      name: z.string().min(2).max(160),
      price: z.number().int().positive(),
      stock: z.number().int().min(0)
    })
  }),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: await productService.createProduct(req.tenantId, req.validated.body, req.user) });
  })
);

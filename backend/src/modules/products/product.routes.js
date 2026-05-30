import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { validate } from '../../shared/validate.js';
import * as productService from './product.service.js';

export const productRouter = Router();

productRouter.use(authenticate);

productRouter.get(
  '/',
  validate({
    query: z.object({
      status: z.enum(['active', 'inactive']).optional(),
      q: z.string().optional(),
      lowStock: z.coerce.boolean().optional()
    })
  }),
  (req, res) => res.json(productService.listProducts(req.validated.query))
);

productRouter.get('/:id', validate({ params: z.object({ id: z.string().uuid() }) }), (req, res) => {
  res.json({ data: productService.getProduct(req.validated.params.id) });
});

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
    res.status(201).json({ data: productService.createProduct(req.validated.body, req.user) });
  })
);

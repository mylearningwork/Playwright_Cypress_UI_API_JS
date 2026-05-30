import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../shared/async-handler.js';
import { validate } from '../../shared/validate.js';
import * as jsonPlaceholder from './json-placeholder.service.js';

export const integrationRouter = Router();

integrationRouter.use(authenticate);

integrationRouter.get(
  '/jsonplaceholder/users/:userId',
  validate({ params: z.object({ userId: z.coerce.number().int().positive().max(10) }) }),
  asyncHandler(async (req, res) => {
    res.json(await jsonPlaceholder.getExternalUser(req.validated.params.userId));
  })
);

integrationRouter.get(
  '/jsonplaceholder/users/:userId/posts',
  validate({ params: z.object({ userId: z.coerce.number().int().positive().max(10) }) }),
  asyncHandler(async (req, res) => {
    res.json(await jsonPlaceholder.getExternalUserPosts(req.validated.params.userId));
  })
);

integrationRouter.get('/cache-stats', (_req, res) => {
  res.json(jsonPlaceholder.cacheStats());
});

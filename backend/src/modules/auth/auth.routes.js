import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../shared/async-handler.js';
import { validate } from '../../shared/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import * as authService from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  validate({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8)
    })
  }),
  asyncHandler(async (req, res) => {
    const session = await authService.login(req.validated.body);
    res.json(session);
  })
);

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

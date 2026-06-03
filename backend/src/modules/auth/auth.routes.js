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
      password: z.string().min(8),
      tenantId: z.string().uuid().optional()
    })
  }),
  asyncHandler(async (req, res) => {
    const { email, password, tenantId } = req.validated.body;
    const session = await authService.login({ email, password }, tenantId);
    res.json(session);
  })
);

authRouter.post(
  '/refresh',
  validate({ body: z.object({ refreshToken: z.string().uuid() }) }),
  asyncHandler(async (req, res) => {
    res.json(await authService.refresh(req.validated.body.refreshToken));
  })
);

authRouter.post(
  '/logout',
  validate({ body: z.object({ refreshToken: z.string().uuid().optional() }) }),
  asyncHandler(async (req, res) => {
    res.json(await authService.logout(req.validated.body.refreshToken));
  })
);

authRouter.post(
  '/forgot-password',
  validate({ body: z.object({ email: z.string().email(), tenantId: z.string().uuid().optional() }) }),
  asyncHandler(async (req, res) => {
    const { email, tenantId } = req.validated.body;
    res.json(await authService.forgotPassword({ email }, tenantId));
  })
);

authRouter.post(
  '/reset-password',
  validate({ body: z.object({ token: z.string().uuid(), password: z.string().min(8) }) }),
  asyncHandler(async (req, res) => {
    res.json(await authService.resetPassword(req.validated.body));
  })
);

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

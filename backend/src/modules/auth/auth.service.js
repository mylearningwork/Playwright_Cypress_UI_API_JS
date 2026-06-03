import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { getRedis } from '../../infra/redis.js';
import { getRepository } from '../../repositories/index.js';
import { DEFAULT_TENANT_ID } from '../../shared/constants.js';
import { badRequest, unauthorized } from '../../shared/errors.js';

async function issueTokens(user) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId, type: 'access' },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );

  const refreshToken = randomUUID();
  const redis = await getRedis();
  await redis.set(
    `refresh:${refreshToken}`,
    JSON.stringify({ userId: user.id, tenantId: user.tenantId }),
    7 * 24 * 60 * 60
  );

  return {
    accessToken,
    token: accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId }
  };
}

export async function login({ email, password }, tenantId = DEFAULT_TENANT_ID) {
  const repo = await getRepository();
  const user = await repo.findUserByEmail(tenantId, email);
  if (!user) throw unauthorized('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw unauthorized('Invalid credentials');

  return issueTokens(user);
}

export async function refresh(refreshToken) {
  const redis = await getRedis();
  const stored = await redis.get(`refresh:${refreshToken}`);
  if (!stored) throw unauthorized('Invalid refresh token');

  const { userId } = JSON.parse(stored);
  const repo = await getRepository();
  const user = await repo.findUserById(userId);
  if (!user) throw unauthorized('Invalid refresh token');

  await redis.del(`refresh:${refreshToken}`);
  return issueTokens(user);
}

export async function logout(refreshToken) {
  if (!refreshToken) return { success: true };
  const redis = await getRedis();
  await redis.del(`refresh:${refreshToken}`);
  return { success: true };
}

export async function forgotPassword({ email }, tenantId = DEFAULT_TENANT_ID) {
  const repo = await getRepository();
  const user = await repo.findUserByEmail(tenantId, email);
  if (!user) return { message: 'If the account exists, a reset link was sent.' };

  const token = randomUUID();
  const redis = await getRedis();
  await redis.set(`reset:${token}`, JSON.stringify({ userId: user.id, tenantId }), 3600);
  return { message: 'If the account exists, a reset link was sent.', resetToken: token };
}

export async function resetPassword({ token, password }) {
  const redis = await getRedis();
  const stored = await redis.get(`reset:${token}`);
  if (!stored) throw badRequest('Invalid or expired reset token');

  const { userId } = JSON.parse(stored);
  const passwordHash = await bcrypt.hash(password, 10);
  await redis.del(`reset:${token}`);

  const repo = await getRepository();
  await repo.updateUserPassword(userId, passwordHash);

  return { message: 'Password updated successfully' };
}

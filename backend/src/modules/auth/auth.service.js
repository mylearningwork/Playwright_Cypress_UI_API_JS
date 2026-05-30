import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { store } from '../../db/in-memory-store.js';
import { unauthorized } from '../../shared/errors.js';

export async function login({ email, password }) {
  const user = [...store.users.values()].find((candidate) => candidate.email === email);
  if (!user) throw unauthorized('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) throw unauthorized('Invalid credentials');

  const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
    expiresIn: '2h'
  });

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role }
  };
}

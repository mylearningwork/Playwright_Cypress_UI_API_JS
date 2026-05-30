import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';

const now = () => new Date().toISOString();

export function createStore() {
  const users = new Map();
  const customers = new Map();
  const products = new Map();
  const orders = new Map();
  const auditLogs = [];

  const adminId = randomUUID();
  users.set(adminId, {
    id: adminId,
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('Admin@12345', 10),
    role: 'admin',
    createdAt: now()
  });

  const managerId = randomUUID();
  users.set(managerId, {
    id: managerId,
    email: 'manager@example.com',
    passwordHash: bcrypt.hashSync('Manager@12345', 10),
    role: 'manager',
    createdAt: now()
  });

  for (const customer of [
    { name: 'Aarav Sharma', email: 'aarav@example.com', tier: 'gold' },
    { name: 'Meera Iyer', email: 'meera@example.com', tier: 'silver' }
  ]) {
    const id = randomUUID();
    customers.set(id, { id, ...customer, status: 'active', createdAt: now(), updatedAt: now() });
  }

  for (const product of [
    { sku: 'BOOK-JS-BE', name: 'Backend JavaScript Handbook', price: 1299, stock: 25 },
    { sku: 'COURSE-API-ARCH', name: 'API Architecture Workshop', price: 4999, stock: 8 },
    { sku: 'MENTOR-SR-BE', name: 'Senior Backend Mentorship Session', price: 8999, stock: 4 }
  ]) {
    const id = randomUUID();
    products.set(id, { id, ...product, status: 'active', createdAt: now(), updatedAt: now() });
  }

  return { users, customers, products, orders, auditLogs };
}

export const store = createStore();

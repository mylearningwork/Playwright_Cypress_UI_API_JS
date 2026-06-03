import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { query } from './pool.js';

const DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000001';

async function seed() {
  await query(
    `INSERT INTO tenants (id, slug, name)
     VALUES ($1, 'default', 'Default Tenant')
     ON CONFLICT (slug) DO NOTHING`,
    [DEFAULT_TENANT_ID]
  );

  const users = [
    { email: 'admin@example.com', password: 'Admin@12345', role: 'admin' },
    { email: 'manager@example.com', password: 'Manager@12345', role: 'manager' }
  ];

  for (const user of users) {
    await query(
      `INSERT INTO users (id, tenant_id, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, email) DO NOTHING`,
      [randomUUID(), DEFAULT_TENANT_ID, user.email, bcrypt.hashSync(user.password, 10), user.role]
    );
  }

  const customers = [
    { name: 'Aarav Sharma', email: 'aarav@example.com', tier: 'gold' },
    { name: 'Meera Iyer', email: 'meera@example.com', tier: 'silver' }
  ];

  for (const customer of customers) {
    await query(
      `INSERT INTO customers (id, tenant_id, name, email, tier, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
       ON CONFLICT (tenant_id, email) DO NOTHING`,
      [randomUUID(), DEFAULT_TENANT_ID, customer.name, customer.email, customer.tier]
    );
  }

  const products = [
    { sku: 'BOOK-JS-BE', name: 'Backend JavaScript Handbook', price: 1299, stock: 25 },
    { sku: 'COURSE-API-ARCH', name: 'API Architecture Workshop', price: 4999, stock: 8 },
    { sku: 'MENTOR-SR-BE', name: 'Senior Backend Mentorship Session', price: 8999, stock: 4 }
  ];

  for (const product of products) {
    await query(
      `INSERT INTO products (id, tenant_id, sku, name, price, stock, version, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, 'active', NOW(), NOW())
       ON CONFLICT (tenant_id, sku) DO NOTHING`,
      [randomUUID(), DEFAULT_TENANT_ID, product.sku, product.name, product.price, product.stock]
    );
  }

  console.log('Seed completed for tenant: default');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

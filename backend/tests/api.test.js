import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const app = createApp();

async function loginAsAdmin() {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@example.com', password: 'Admin@12345' })
    .expect(200);

  return response.body.token;
}

describe('backend training API', () => {
  it('reports health', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body.status).toBe('ok');
  });

  it('authenticates seeded users', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@example.com', password: 'Manager@12345' })
      .expect(200);

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.role).toBe('manager');
  });

  it('protects customer APIs', async () => {
    await request(app).get('/api/v1/customers').expect(401);
  });

  it('creates customers and products with admin auth', async () => {
    const token = await loginAsAdmin();

    const customer = await request(app)
      .post('/api/v1/customers')
      .set('authorization', `Bearer ${token}`)
      .send({ name: 'Test Customer', email: `test-${Date.now()}@example.com`, tier: 'gold' })
      .expect(201);

    const product = await request(app)
      .post('/api/v1/products')
      .set('authorization', `Bearer ${token}`)
      .send({ sku: `SKU-${Date.now()}`, name: 'Test Product', price: 999, stock: 3 })
      .expect(201);

    expect(customer.body.data.status).toBe('active');
    expect(product.body.data.stock).toBe(3);
  });

  it('creates orders idempotently', async () => {
    const token = await loginAsAdmin();
    const customers = await request(app).get('/api/v1/customers').set('authorization', `Bearer ${token}`);
    const products = await request(app).get('/api/v1/products').set('authorization', `Bearer ${token}`);

    const payload = {
      customerId: customers.body.data[0].id,
      paymentMethod: 'upi',
      items: [{ productId: products.body.data[0].id, quantity: 1 }]
    };

    const first = await request(app)
      .post('/api/v1/orders')
      .set('authorization', `Bearer ${token}`)
      .set('idempotency-key', 'test-order-1')
      .send(payload)
      .expect(201);

    const replay = await request(app)
      .post('/api/v1/orders')
      .set('authorization', `Bearer ${token}`)
      .set('idempotency-key', 'test-order-1')
      .send(payload)
      .expect(201);

    expect(replay.headers['x-idempotent-replay']).toBe('true');
    expect(replay.body.data.id).toBe(first.body.data.id);
  });
});

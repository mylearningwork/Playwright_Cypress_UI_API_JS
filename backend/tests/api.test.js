import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { setRepository } from '../src/repositories/index.js';
import { memoryRepository, resetMemoryState } from '../src/repositories/memory-repository.js';

const app = createApp();

beforeEach(() => {
  resetMemoryState();
  setRepository(memoryRepository);
});

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

  it('reports liveness and readiness', async () => {
    await request(app).get('/health/live').expect(200);
    const ready = await request(app).get('/health/ready');
    expect([200, 503]).toContain(ready.status);
  });

  it('exposes metrics and openapi docs', async () => {
    const metrics = await request(app).get('/metrics').expect(200);
    expect(metrics.text).toContain('http_requests_total');
    await request(app).get('/openapi.json').expect(200);
  });

  it('authenticates seeded users and refreshes tokens', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'manager@example.com', password: 'Manager@12345' })
      .expect(200);

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
    expect(response.body.user.role).toBe('manager');

    const refreshed = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: response.body.refreshToken })
      .expect(200);

    expect(refreshed.body.accessToken).toEqual(expect.any(String));
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

  it('returns RFC7807 problem responses', async () => {
    const response = await request(app).get('/api/v1/customers');
    expect(response.headers['content-type']).toContain('application/problem+json');
    expect(response.body.code).toBe('UNAUTHORIZED');
  });
});

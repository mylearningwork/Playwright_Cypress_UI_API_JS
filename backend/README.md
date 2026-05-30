# Backend Heavy JavaScript Project

This is a dedicated backend training project for becoming strong in JavaScript backend development. It is intentionally more backend-heavy than a basic CRUD app.

## Stack

- Node.js 20+
- Express REST API
- Zod validation
- JWT auth and role authorization
- In-memory store, structured like a real persistence boundary
- External API integration with JSONPlaceholder
- Vitest and Supertest API tests
- Docker

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Health check:

```bash
curl http://localhost:4000/health
```

## Demo Users

```text
admin@example.com / Admin@12345
manager@example.com / Manager@12345
```

Login:

```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@12345"}'
```

Use the returned token:

```bash
TOKEN="paste-token-here"
curl http://localhost:4000/api/v1/products \
  -H "authorization: Bearer $TOKEN"
```

## Main APIs

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/customers`
- `POST /api/v1/customers`
- `PATCH /api/v1/customers/:id`
- `DELETE /api/v1/customers/:id`
- `GET /api/v1/products`
- `POST /api/v1/products`
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `POST /api/v1/orders/:id/cancel`
- `GET /api/v1/integrations/jsonplaceholder/users/:userId`
- `GET /api/v1/integrations/jsonplaceholder/users/:userId/posts`
- `GET /api/v1/admin/metrics`
- `GET /api/v1/admin/audit-logs`

## External API

The integration module calls `https://jsonplaceholder.typicode.com`, a public sample REST API. Calls are wrapped with:

- request timeout
- error mapping
- TTL cache
- authenticated local endpoint

## Order Creation Example

First list customers and products, then use one customer id and product id:

```bash
curl -X POST http://localhost:4000/api/v1/orders \
  -H "authorization: Bearer $TOKEN" \
  -H "content-type: application/json" \
  -H "idempotency-key: order-001" \
  -d '{
    "customerId": "replace-customer-id",
    "paymentMethod": "upi",
    "items": [
      { "productId": "replace-product-id", "quantity": 1 }
    ]
  }'
```

## Tests

```bash
npm test
```

## Docker

```bash
docker compose up --build
```

## Project Structure

```text
src/
  app.js
  server.js
  config/
  db/
  middleware/
  modules/
    auth/
    customers/
    products/
    orders/
    integrations/
    admin/
  shared/
```

## Next Steps

Read `docs/senior-backend-roadmap.md` and implement the exercises one by one.

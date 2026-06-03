# Backend Heavy JavaScript Project

Production-style backend training API demonstrating senior-level patterns: PostgreSQL, Redis, outbox workers, observability, OpenAPI, CI, and load testing.

## Stack

- Node.js 20+ / Express REST API
- PostgreSQL with SQL migrations and transactional order flow
- Redis for cache, idempotency, refresh tokens, distributed rate limiting
- Outbox worker for async domain event processing
- JWT auth with refresh token rotation
- Multi-tenant isolation (`tenantId` on all resources)
- Cursor pagination, RFC 7807 errors, circuit breaker
- Prometheus metrics, health probes, OpenAPI docs
- Vitest + Supertest, GitHub Actions CI, k6 load tests, Docker Compose

## Quick Start (Docker — full stack)

```bash
cd backend
docker compose up --build
```

Services:
- API: http://localhost:4000
- Docs: http://localhost:4000/docs
- Metrics: http://localhost:4000/metrics
- Health: http://localhost:4000/health/ready

## Quick Start (Local dev — in-memory)

```bash
cd backend
npm install
USE_IN_MEMORY=true npm run dev
npm test
```

## Quick Start (Local dev — PostgreSQL + Redis)

```bash
cd backend
docker compose up postgres redis -d
cp .env.example .env
npm install
npm run migrate
npm run seed
npm run dev
npm run relay    # terminal 2 — outbox → BullMQ
npm run worker   # terminal 3 — BullMQ consumer
```

## Demo Users

```text
admin@example.com / Admin@12345
manager@example.com / Manager@12345
```

## Main APIs

### Platform
- `GET /health`, `/health/live`, `/health/ready`
- `GET /metrics` (Prometheus)
- `GET /docs`, `/openapi.json`

### Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

### Domain
- Customers, Products, Orders (cursor pagination, tenant scoped)
- Integrations (JSONPlaceholder + circuit breaker + Redis cache)
- Admin metrics and audit logs

## Architecture Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [docs/adr/](./docs/adr/)
- [docs/senior-backend-roadmap.md](./docs/senior-backend-roadmap.md)
- [load-tests/](./load-tests/)

## Tests & CI

```bash
npm test
npm run lint
```

GitHub Actions runs lint, tests, and Docker build on every push/PR.

## Project Structure

```text
src/
  app.js, server.js, worker.js
  config/
  db/              # migrations, pool, seed
  repositories/    # postgres + memory adapters
  infra/           # redis, metrics
  middleware/
  modules/
  openapi/
  shared/
docs/adr/
load-tests/
```

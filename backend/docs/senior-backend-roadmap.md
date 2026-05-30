# Senior Backend Roadmap For This Project

Use this project like a backend gym. The goal is not only to write endpoints, but to practice the operational, architectural, and failure-mode thinking expected from a senior backend developer.

## What This Project Covers

- REST resource design with versioned routes.
- Layered code: routes, middleware, services, store, shared utilities.
- Auth with JWT, role-based authorization, and protected routes.
- Input validation with Zod.
- Centralized error handling with stable error codes.
- Request IDs, structured logs, and basic admin metrics.
- Rate limiting.
- Idempotency for write endpoints.
- External API integration using JSONPlaceholder.
- Timeout handling, response caching, and upstream error mapping.
- Order workflow: inventory reservation, payment authorization, rollback on failure.
- Audit logs for sensitive actions.
- API tests with Supertest and Vitest.
- Docker packaging.

## Senior-Level Exercises

1. Replace the in-memory store with PostgreSQL.
2. Add migrations with Prisma, Drizzle, or Knex.
3. Add optimistic locking to products so stock updates do not race.
4. Move payment authorization into an outbox-based async worker.
5. Add OpenAPI documentation and generate API clients.
6. Add refresh tokens, token rotation, and password reset.
7. Add multi-tenant isolation with `tenantId` on every resource.
8. Add pagination cursors instead of offset pagination.
9. Add distributed tracing with OpenTelemetry.
10. Add contract tests for the JSONPlaceholder integration.
11. Add circuit breaker states: closed, open, half-open.
12. Add database transaction boundaries around order creation.
13. Add background jobs for cancelled-order reconciliation.
14. Add CI with lint, tests, Docker build, and dependency audit.
15. Add load testing with k6 and document bottlenecks.

## Suggested Learning Flow

1. Run the API and call every endpoint manually.
2. Read middleware first, then modules, then tests.
3. Implement PostgreSQL persistence.
4. Add OpenAPI docs.
5. Add a message queue.
6. Add observability.
7. Add deployment automation.

## Architecture Decisions To Discuss In Interviews

- Why validation belongs at the boundary.
- Why idempotency matters for payment/order APIs.
- Why timeout handling is mandatory for external APIs.
- How to avoid overselling JWT as a complete auth system.
- How in-memory rate limiting breaks with multiple server instances.
- Why order creation should eventually use database transactions.
- How audit logs differ from normal application logs.

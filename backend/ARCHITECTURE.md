# Architecture Overview

## System Context

This service is an order-management API for a multi-tenant commerce platform. It handles authentication, customer/product catalog, order placement with inventory reservation, payment authorization, and operational visibility.

## Runtime Topology

```text
Client -> API (Express)
           |-> PostgreSQL (source of truth + outbox table)
           |-> Redis (cache, idempotency, BullMQ queue)
           |-> JSONPlaceholder (external dependency)

Relay  -> reads outbox (pending) -> publishes to BullMQ (queued)
Worker -> consumes BullMQ jobs -> processes side effects (processed)
```

## Core Design Decisions

1. **Repository adapter pattern** — PostgreSQL in production, in-memory for fast tests.
2. **Transactional order creation** — stock reservation + order insert + outbox write in one DB transaction.
3. **Optimistic locking** — product `version` column prevents lost stock updates.
4. **Outbox pattern** — domain events persisted with the aggregate, processed asynchronously by worker.
5. **Multi-tenancy** — every resource scoped by `tenantId`; JWT carries tenant context.
6. **Idempotency** — write endpoints accept `Idempotency-Key`, stored in Redis with TTL.
7. **Resilience** — circuit breaker + timeout + cache for external API calls.
8. **Operability** — structured logs, request IDs, Prometheus metrics, liveness/readiness probes.

## Failure Handling

| Scenario | Behavior |
|----------|----------|
| Payment declined | Order not created; stock not reserved (transaction rollback in PG mode) |
| Duplicate order request | Idempotency key returns original response |
| External API down | Circuit opens; upstream errors mapped to 502 problem response |
| Worker failure | Outbox retries up to 5 times, then marks event failed |
| Stock race | Optimistic lock conflict returns 409 |

## SLO Targets (documented)

- Order create success rate: 99.9%
- Read API p95 latency: < 200ms (excluding external integrations)
- Readiness probe must fail if DB/Redis unavailable

## Deployment

Use `docker compose up --build` for local full stack. CI validates lint, tests, and image build.

## Evolution Path

- OpenTelemetry tracing
- Kafka/NATS instead of DB outbox polling
- Read replicas and CQRS projections
- Multi-region active-active with conflict resolution

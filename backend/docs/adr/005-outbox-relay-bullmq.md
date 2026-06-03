# ADR 005: Outbox Relay to BullMQ

## Status
Accepted

## Context
Direct outbox polling in the worker couples event discovery with processing and makes scaling consumers harder.

## Decision
Split async processing into two processes:
1. **Relay** — polls PostgreSQL outbox (`pending` → `queued`) and publishes to BullMQ (Redis)
2. **Worker** — BullMQ consumer that processes jobs and marks outbox `processed`

Job ID equals outbox event ID for publish idempotency.

## Consequences
- Can scale workers independently of relay
- BullMQ provides retries, backoff, and failed job inspection
- Requires Redis; without Redis, worker falls back to legacy direct outbox polling
- Relay + queue adds operational components but matches production architectures

## Flow

```text
API transaction → outbox (pending)
Relay → BullMQ queue (queued)
Worker → side effects → outbox (processed)
```

# ADR 003: Redis for Cross-Instance Concerns

## Status
Accepted

## Context
In-memory rate limiting, idempotency, and token storage break with multiple API instances.

## Decision
Use Redis for idempotency keys, refresh/reset tokens, integration cache, and distributed rate limiting. Fall back to in-memory implementation when Redis is unavailable (local tests).

## Consequences
- Production-ready multi-instance behavior
- Additional infrastructure dependency
- Readiness probe validates Redis connectivity

# ADR 001: PostgreSQL as System of Record

## Status
Accepted

## Context
In-memory storage is useful for learning but cannot demonstrate transactions, concurrency control, or operational persistence.

## Decision
Use PostgreSQL with explicit SQL migrations. Order creation runs in a transaction with row locks and optimistic locking on product stock.

## Consequences
- Requires Docker/local Postgres for full stack
- Tests use in-memory repository adapter for speed
- Enables realistic senior-level failure and consistency discussions

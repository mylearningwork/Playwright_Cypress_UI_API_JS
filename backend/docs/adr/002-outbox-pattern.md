# ADR 002: Outbox Pattern for Async Side Effects

## Status
Accepted

## Context
Order creation should stay fast and reliable even when downstream notification/analytics processing fails.

## Decision
Persist domain events in an `outbox_events` table within the same transaction as the aggregate write. A dedicated worker polls and processes pending events with retry and dead-letter behavior.

## Consequences
- At-least-once event delivery semantics
- Worker can be scaled independently
- Avoids dual-write inconsistency between DB and queue

# ADR 004: Multi-Tenant Isolation

## Status
Accepted

## Context
SaaS APIs must prevent cross-tenant data access.

## Decision
Add `tenant_id` to all tenant-owned tables. JWT includes `tenantId`; middleware resolves tenant context on every authenticated request.

## Consequences
- All repository queries must include tenant filter
- Enables future per-tenant billing and policy enforcement
- Requires migration for existing single-tenant data

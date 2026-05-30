import { randomUUID } from 'node:crypto';
import { store } from '../../db/in-memory-store.js';
import { conflict, notFound } from '../../shared/errors.js';

const now = () => new Date().toISOString();

export function listCustomers({ status, tier, limit = 20, offset = 0 }) {
  let data = [...store.customers.values()];
  if (status) data = data.filter((customer) => customer.status === status);
  if (tier) data = data.filter((customer) => customer.tier === tier);
  return { data: data.slice(offset, offset + limit), meta: { total: data.length, limit, offset } };
}

export function getCustomer(id) {
  const customer = store.customers.get(id);
  if (!customer) throw notFound('Customer');
  return customer;
}

export function createCustomer(input, actor) {
  const duplicate = [...store.customers.values()].find((customer) => customer.email === input.email);
  if (duplicate) throw conflict('Customer email already exists', { email: input.email });

  const customer = {
    id: randomUUID(),
    ...input,
    status: 'active',
    createdAt: now(),
    updatedAt: now()
  };
  store.customers.set(customer.id, customer);
  store.auditLogs.push({ at: now(), actor: actor.email, action: 'customer.created', targetId: customer.id });
  return customer;
}

export function updateCustomer(id, input, actor) {
  const existing = getCustomer(id);
  const updated = { ...existing, ...input, updatedAt: now() };
  store.customers.set(id, updated);
  store.auditLogs.push({ at: now(), actor: actor.email, action: 'customer.updated', targetId: id });
  return updated;
}

export function deactivateCustomer(id, actor) {
  const existing = getCustomer(id);
  const updated = { ...existing, status: 'inactive', updatedAt: now() };
  store.customers.set(id, updated);
  store.auditLogs.push({ at: now(), actor: actor.email, action: 'customer.deactivated', targetId: id });
  return updated;
}

import { getRepository } from '../../repositories/index.js';

export async function listCustomers(tenantId, filters) {
  const repo = await getRepository();
  return repo.listCustomers(tenantId, filters);
}

export async function getCustomer(tenantId, id) {
  const repo = await getRepository();
  return repo.getCustomer(tenantId, id);
}

export async function createCustomer(tenantId, input, actor) {
  const repo = await getRepository();
  return repo.createCustomer(tenantId, input, actor);
}

export async function updateCustomer(tenantId, id, input, actor) {
  const repo = await getRepository();
  return repo.updateCustomer(tenantId, id, input, actor);
}

export async function deactivateCustomer(tenantId, id, actor) {
  const repo = await getRepository();
  return repo.deactivateCustomer(tenantId, id, actor);
}

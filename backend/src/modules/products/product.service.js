import { getRepository } from '../../repositories/index.js';

export async function listProducts(tenantId, filters) {
  const repo = await getRepository();
  return repo.listProducts(tenantId, filters);
}

export async function getProduct(tenantId, id) {
  const repo = await getRepository();
  return repo.getProduct(tenantId, id);
}

export async function createProduct(tenantId, input, actor) {
  const repo = await getRepository();
  return repo.createProduct(tenantId, input, actor);
}

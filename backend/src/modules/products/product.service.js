import { randomUUID } from 'node:crypto';
import { store } from '../../db/in-memory-store.js';
import { badRequest, conflict, notFound } from '../../shared/errors.js';

const now = () => new Date().toISOString();

export function listProducts({ status, q, lowStock }) {
  let data = [...store.products.values()];
  if (status) data = data.filter((product) => product.status === status);
  if (q) data = data.filter((product) => product.name.toLowerCase().includes(q.toLowerCase()));
  if (lowStock === true) data = data.filter((product) => product.stock <= 5);
  return { data, meta: { total: data.length } };
}

export function getProduct(id) {
  const product = store.products.get(id);
  if (!product) throw notFound('Product');
  return product;
}

export function createProduct(input, actor) {
  const duplicate = [...store.products.values()].find((product) => product.sku === input.sku);
  if (duplicate) throw conflict('Product SKU already exists', { sku: input.sku });
  const product = { id: randomUUID(), ...input, status: 'active', createdAt: now(), updatedAt: now() };
  store.products.set(product.id, product);
  store.auditLogs.push({ at: now(), actor: actor.email, action: 'product.created', targetId: product.id });
  return product;
}

export function reserveStock(items) {
  for (const item of items) {
    const product = getProduct(item.productId);
    if (product.stock < item.quantity) {
      throw badRequest('Insufficient stock', { productId: product.id, available: product.stock });
    }
  }

  for (const item of items) {
    const product = getProduct(item.productId);
    store.products.set(product.id, { ...product, stock: product.stock - item.quantity, updatedAt: now() });
  }
}

export function restoreStock(items) {
  for (const item of items) {
    const product = getProduct(item.productId);
    store.products.set(product.id, { ...product, stock: product.stock + item.quantity, updatedAt: now() });
  }
}

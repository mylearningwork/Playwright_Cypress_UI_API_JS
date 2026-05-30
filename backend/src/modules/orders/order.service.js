import { randomUUID } from 'node:crypto';
import { store } from '../../db/in-memory-store.js';
import { badRequest, notFound } from '../../shared/errors.js';
import * as productService from '../products/product.service.js';
import { authorizePayment } from './payment.service.js';

const now = () => new Date().toISOString();

export function listOrders({ customerId, status }) {
  let data = [...store.orders.values()];
  if (customerId) data = data.filter((order) => order.customerId === customerId);
  if (status) data = data.filter((order) => order.status === status);
  return { data, meta: { total: data.length } };
}

export function getOrder(id) {
  const order = store.orders.get(id);
  if (!order) throw notFound('Order');
  return order;
}

export async function createOrder(input, actor) {
  const customer = store.customers.get(input.customerId);
  if (!customer || customer.status !== 'active') throw badRequest('Active customer is required');

  const pricedItems = input.items.map((item) => {
    const product = productService.getProduct(item.productId);
    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity
    };
  });

  const total = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  productService.reserveStock(input.items);
  try {
    const payment = await authorizePayment({ amount: total, paymentMethod: input.paymentMethod });
    const order = {
      id: randomUUID(),
      customerId: customer.id,
      items: pricedItems,
      total,
      status: 'confirmed',
      payment,
      createdAt: now(),
      updatedAt: now()
    };
    store.orders.set(order.id, order);
    store.auditLogs.push({ at: now(), actor: actor.email, action: 'order.created', targetId: order.id });
    return order;
  } catch (error) {
    productService.restoreStock(input.items);
    throw error;
  }
}

export function cancelOrder(id, actor) {
  const order = getOrder(id);
  if (order.status === 'cancelled') return order;
  if (order.status !== 'confirmed') throw badRequest('Only confirmed orders can be cancelled');

  productService.restoreStock(order.items);
  const updated = { ...order, status: 'cancelled', updatedAt: now() };
  store.orders.set(id, updated);
  store.auditLogs.push({ at: now(), actor: actor.email, action: 'order.cancelled', targetId: id });
  return updated;
}

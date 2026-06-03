import { getRepository } from '../../repositories/index.js';
import { badRequest } from '../../shared/errors.js';
import * as productService from '../products/product.service.js';
import { authorizePayment } from './payment.service.js';
import { orderOperationsTotal } from '../../infra/metrics.js';

export async function listOrders(tenantId, filters) {
  const repo = await getRepository();
  return repo.listOrders(tenantId, filters);
}

export async function getOrder(tenantId, id) {
  const repo = await getRepository();
  return repo.getOrder(tenantId, id);
}

export async function createOrder(tenantId, input, actor) {
  const repo = await getRepository();

  const pricedItems = await Promise.all(
    input.items.map(async (item) => {
      const product = await productService.getProduct(tenantId, item.productId);
      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal: product.price * item.quantity
      };
    })
  );

  const total = pricedItems.reduce((sum, item) => sum + item.lineTotal, 0);

  try {
    const payment = await authorizePayment({ amount: total, paymentMethod: input.paymentMethod });
    const order = await repo.createOrderTransaction(tenantId, {
      customerId: input.customerId,
      items: input.items,
      pricedItems,
      total,
      payment,
      actor
    });
    orderOperationsTotal.inc({ operation: 'create', status: 'success' });
    return order;
  } catch (error) {
    orderOperationsTotal.inc({ operation: 'create', status: 'failure' });
    throw error;
  }
}

export async function cancelOrder(tenantId, id, actor) {
  const repo = await getRepository();
  const order = await repo.getOrder(tenantId, id);
  if (order.status === 'cancelled') return order;
  if (order.status !== 'confirmed') throw badRequest('Only confirmed orders can be cancelled');

  const updated = await repo.cancelOrder(tenantId, id, actor);
  orderOperationsTotal.inc({ operation: 'cancel', status: 'success' });
  return updated;
}

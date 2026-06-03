import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { DEFAULT_TENANT_ID } from '../shared/constants.js';
import { buildCursorMeta, decodeCursor } from '../shared/pagination.js';
import { conflict, notFound } from '../shared/errors.js';

const now = () => new Date().toISOString();

function createMemoryState() {
  const tenants = new Map([[DEFAULT_TENANT_ID, { id: DEFAULT_TENANT_ID, slug: 'default', name: 'Default Tenant' }]]);
  const users = new Map();
  const customers = new Map();
  const products = new Map();
  const orders = new Map();
  const auditLogs = [];
  const outboxEvents = [];

  const adminId = randomUUID();
  users.set(adminId, {
    id: adminId,
    tenantId: DEFAULT_TENANT_ID,
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('Admin@12345', 10),
    role: 'admin',
    createdAt: now()
  });

  const managerId = randomUUID();
  users.set(managerId, {
    id: managerId,
    tenantId: DEFAULT_TENANT_ID,
    email: 'manager@example.com',
    passwordHash: bcrypt.hashSync('Manager@12345', 10),
    role: 'manager',
    createdAt: now()
  });

  for (const customer of [
    { name: 'Aarav Sharma', email: 'aarav@example.com', tier: 'gold' },
    { name: 'Meera Iyer', email: 'meera@example.com', tier: 'silver' }
  ]) {
    const id = randomUUID();
    customers.set(id, { id, tenantId: DEFAULT_TENANT_ID, ...customer, status: 'active', createdAt: now(), updatedAt: now() });
  }

  for (const product of [
    { sku: 'BOOK-JS-BE', name: 'Backend JavaScript Handbook', price: 1299, stock: 25 },
    { sku: 'COURSE-API-ARCH', name: 'API Architecture Workshop', price: 4999, stock: 8 },
    { sku: 'MENTOR-SR-BE', name: 'Senior Backend Mentorship Session', price: 8999, stock: 4 }
  ]) {
    const id = randomUUID();
    products.set(id, { id, tenantId: DEFAULT_TENANT_ID, ...product, version: 1, status: 'active', createdAt: now(), updatedAt: now() });
  }

  return { tenants, users, customers, products, orders, auditLogs, outboxEvents };
}

const holder = { state: createMemoryState() };

function tenantScope(items, tenantId) {
  return items.filter((item) => item.tenantId === tenantId);
}

function pushAudit(tenantId, actor, action, targetId, metadata) {
  holder.state.auditLogs.push({ id: randomUUID(), tenantId, at: now(), actor, action, targetId, metadata });
}

function pushOutbox(tenantId, aggregateType, aggregateId, eventType, payload) {
  const event = {
    id: randomUUID(),
    tenantId,
    aggregateType,
    aggregateId,
    eventType,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: now(),
    processedAt: null,
    error: null
  };
  holder.state.outboxEvents.push(event);
  return event;
}

export function resetMemoryState() {
  holder.state = createMemoryState();
}

export const memoryRepository = {
  mode: 'memory',

  async getDefaultTenant() {
    return holder.state.tenants.get(DEFAULT_TENANT_ID);
  },

  async findUserByEmail(tenantId, email) {
    return [...holder.state.users.values()].find((user) => user.tenantId === tenantId && user.email === email) ?? null;
  },

  async findUserById(id) {
    return holder.state.users.get(id) ?? null;
  },

  async updateUserPassword(userId, passwordHash) {
    const user = holder.state.users.get(userId);
    if (!user) return false;
    holder.state.users.set(userId, { ...user, passwordHash });
    return true;
  },

  async listCustomers(tenantId, { status, tier, limit = 20, cursor }) {
    let data = tenantScope([...holder.state.customers.values()], tenantId);
    if (status) data = data.filter((c) => c.status === status);
    if (tier) data = data.filter((c) => c.tier === tier);
    data.sort((a, b) => (a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : b.createdAt.localeCompare(a.createdAt)));

    const decoded = decodeCursor(cursor);
    if (decoded) {
      data = data.filter(
        (item) =>
          item.createdAt < decoded.createdAt ||
          (item.createdAt === decoded.createdAt && item.id < decoded.id)
      );
    }

    const meta = buildCursorMeta(data, limit);
    return { data: data.slice(0, limit), meta: { ...meta, limit } };
  },

  async getCustomer(tenantId, id) {
    const customer = holder.state.customers.get(id);
    if (!customer || customer.tenantId !== tenantId) throw notFound('Customer');
    return customer;
  },

  async createCustomer(tenantId, input, actor) {
    const duplicate = tenantScope([...holder.state.customers.values()], tenantId).find((c) => c.email === input.email);
    if (duplicate) throw conflict('Customer email already exists', { email: input.email });
    const customer = { id: randomUUID(), tenantId, ...input, status: 'active', createdAt: now(), updatedAt: now() };
    holder.state.customers.set(customer.id, customer);
    pushAudit(tenantId, actor.email, 'customer.created', customer.id);
    return customer;
  },

  async updateCustomer(tenantId, id, input, actor) {
    const existing = await this.getCustomer(tenantId, id);
    const updated = { ...existing, ...input, updatedAt: now() };
    holder.state.customers.set(id, updated);
    pushAudit(tenantId, actor.email, 'customer.updated', id);
    return updated;
  },

  async deactivateCustomer(tenantId, id, actor) {
    const existing = await this.getCustomer(tenantId, id);
    const updated = { ...existing, status: 'inactive', updatedAt: now() };
    holder.state.customers.set(id, updated);
    pushAudit(tenantId, actor.email, 'customer.deactivated', id);
    return updated;
  },

  async listProducts(tenantId, { status, q, lowStock, limit = 20, cursor }) {
    let data = tenantScope([...holder.state.products.values()], tenantId);
    if (status) data = data.filter((p) => p.status === status);
    if (q) data = data.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (lowStock === true) data = data.filter((p) => p.stock <= 5);
    data.sort((a, b) => (a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : b.createdAt.localeCompare(a.createdAt)));

    const decoded = decodeCursor(cursor);
    if (decoded) {
      data = data.filter(
        (item) =>
          item.createdAt < decoded.createdAt ||
          (item.createdAt === decoded.createdAt && item.id < decoded.id)
      );
    }

    const meta = buildCursorMeta(data, limit);
    return { data: data.slice(0, limit), meta: { ...meta, limit } };
  },

  async getProduct(tenantId, id) {
    const product = holder.state.products.get(id);
    if (!product || product.tenantId !== tenantId) throw notFound('Product');
    return product;
  },

  async createProduct(tenantId, input, actor) {
    const duplicate = tenantScope([...holder.state.products.values()], tenantId).find((p) => p.sku === input.sku);
    if (duplicate) throw conflict('Product SKU already exists', { sku: input.sku });
    const product = { id: randomUUID(), tenantId, ...input, version: 1, status: 'active', createdAt: now(), updatedAt: now() };
    holder.state.products.set(product.id, product);
    pushAudit(tenantId, actor.email, 'product.created', product.id);
    return product;
  },

  async listOrders(tenantId, { customerId, status, limit = 20, cursor }) {
    let data = tenantScope([...holder.state.orders.values()], tenantId);
    if (customerId) data = data.filter((o) => o.customerId === customerId);
    if (status) data = data.filter((o) => o.status === status);
    data.sort((a, b) => (a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : b.createdAt.localeCompare(a.createdAt)));

    const decoded = decodeCursor(cursor);
    if (decoded) {
      data = data.filter(
        (item) =>
          item.createdAt < decoded.createdAt ||
          (item.createdAt === decoded.createdAt && item.id < decoded.id)
      );
    }

    const meta = buildCursorMeta(data, limit);
    return { data: data.slice(0, limit), meta: { ...meta, limit } };
  },

  async getOrder(tenantId, id) {
    const order = holder.state.orders.get(id);
    if (!order || order.tenantId !== tenantId) throw notFound('Order');
    return order;
  },

  async createOrderTransaction(tenantId, { customerId, items, pricedItems, total, payment, actor }) {
    const customer = await this.getCustomer(tenantId, customerId);
    if (customer.status !== 'active') throw conflict('Active customer is required');

    for (const item of items) {
      const product = await this.getProduct(tenantId, item.productId);
      if (product.stock < item.quantity) {
        throw conflict('Insufficient stock', { productId: product.id, available: product.stock });
      }
      holder.state.products.set(product.id, {
        ...product,
        stock: product.stock - item.quantity,
        version: product.version + 1,
        updatedAt: now()
      });
    }

    const order = {
      id: randomUUID(),
      tenantId,
      customerId,
      items: pricedItems,
      total,
      status: 'confirmed',
      payment,
      createdAt: now(),
      updatedAt: now()
    };
    holder.state.orders.set(order.id, order);
    pushAudit(tenantId, actor.email, 'order.created', order.id);
    pushOutbox(tenantId, 'order', order.id, 'order.created', { orderId: order.id, total });
    return order;
  },

  async cancelOrder(tenantId, id, actor) {
    const order = await this.getOrder(tenantId, id);
    if (order.status === 'cancelled') return order;

    for (const item of order.items) {
      const product = await this.getProduct(tenantId, item.productId);
      holder.state.products.set(product.id, {
        ...product,
        stock: product.stock + item.quantity,
        version: product.version + 1,
        updatedAt: now()
      });
    }

    const updated = { ...order, status: 'cancelled', updatedAt: now() };
    holder.state.orders.set(id, updated);
    pushAudit(tenantId, actor.email, 'order.cancelled', id);
    pushOutbox(tenantId, 'order', id, 'order.cancelled', { orderId: id });
    return updated;
  },

  async getMetrics(tenantId) {
    return {
      users: tenantScope([...holder.state.users.values()], tenantId).length,
      customers: tenantScope([...holder.state.customers.values()], tenantId).length,
      products: tenantScope([...holder.state.products.values()], tenantId).length,
      orders: tenantScope([...holder.state.orders.values()], tenantId).length,
      auditLogs: holder.state.auditLogs.filter((log) => log.tenantId === tenantId).length,
      outboxPending: holder.state.outboxEvents.filter((event) => event.tenantId === tenantId && event.status === 'pending').length,
      outboxQueued: holder.state.outboxEvents.filter((event) => event.tenantId === tenantId && event.status === 'queued').length
    };
  },

  async listAuditLogs(tenantId, limit = 100) {
    const data = holder.state.auditLogs.filter((log) => log.tenantId === tenantId).slice(-limit).reverse();
    return { data, meta: { total: data.length } };
  },

  async claimOutboxForRelay(limit = 10) {
    const pending = holder.state.outboxEvents.filter((event) => event.status === 'pending').slice(0, limit);
    for (const event of pending) event.status = 'publishing';
    return pending;
  },

  async markOutboxQueued(id) {
    const event = holder.state.outboxEvents.find((entry) => entry.id === id);
    if (event) event.status = 'queued';
  },

  async markOutboxRelayFailed(id, error) {
    const event = holder.state.outboxEvents.find((entry) => entry.id === id);
    if (event) {
      event.attempts += 1;
      event.error = error;
      event.status = event.attempts >= 5 ? 'failed' : 'pending';
    }
  },

  async claimOutboxForProcessing(limit = 10) {
    const pending = holder.state.outboxEvents.filter((event) => event.status === 'pending').slice(0, limit);
    for (const event of pending) event.status = 'processing';
    return pending;
  },

  async markOutboxProcessed(id) {
    const event = holder.state.outboxEvents.find((entry) => entry.id === id);
    if (event) {
      event.status = 'processed';
      event.processedAt = now();
    }
  },

  async markOutboxFailed(id, error) {
    const event = holder.state.outboxEvents.find((entry) => entry.id === id);
    if (event) {
      event.attempts += 1;
      event.error = error;
      event.status = event.attempts >= 5 ? 'failed' : 'pending';
    }
  }
};

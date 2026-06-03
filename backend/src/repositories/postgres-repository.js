import { randomUUID } from 'node:crypto';
import { query, withTransaction } from '../db/pool.js';
import { DEFAULT_TENANT_ID } from '../shared/constants.js';
import { buildCursorMeta, decodeCursor } from '../shared/pagination.js';
import { badRequest, conflict, notFound } from '../shared/errors.js';

function mapCustomer(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    email: row.email,
    tier: row.tier,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function mapProduct(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    sku: row.sku,
    name: row.name,
    price: row.price,
    stock: row.stock,
    version: row.version,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

async function mapOrder(row, client = null) {
  const runner = client ?? { query };
  const items = await runner.query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY name', [row.id]);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    items: items.rows.map((item) => ({
      productId: item.product_id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total
    })),
    total: row.total,
    status: row.status,
    payment: row.payment,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function mapOutboxRow(row) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    payload: row.payload,
    attempts: row.attempts
  };
}

async function pushAudit(client, tenantId, actor, action, targetId, metadata = null) {
  await client.query(
    'INSERT INTO audit_logs (tenant_id, actor, action, target_id, metadata) VALUES ($1, $2, $3, $4, $5)',
    [tenantId, actor, action, targetId, metadata]
  );
}

async function pushOutbox(client, tenantId, aggregateType, aggregateId, eventType, payload) {
  await client.query(
    `INSERT INTO outbox_events (id, tenant_id, aggregate_type, aggregate_id, event_type, payload)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), tenantId, aggregateType, aggregateId, eventType, JSON.stringify(payload)]
  );
}

export const postgresRepository = {
  mode: 'postgres',

  async getDefaultTenant() {
    const result = await query('SELECT * FROM tenants WHERE id = $1', [DEFAULT_TENANT_ID]);
    const row = result.rows[0];
    if (!row) return null;
    return { id: row.id, slug: row.slug, name: row.name };
  },

  async findUserByEmail(tenantId, email) {
    const result = await query('SELECT * FROM users WHERE tenant_id = $1 AND email = $2', [tenantId, email]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at.toISOString()
    };
  },

  async findUserById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at.toISOString()
    };
  },

  async updateUserPassword(userId, passwordHash) {
    const result = await query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id', [passwordHash, userId]);
    return Boolean(result.rows[0]);
  },

  async listCustomers(tenantId, filters) {
    const { status, tier, limit = 20, cursor } = filters;
    const params = [tenantId];
    const clauses = ['tenant_id = $1'];
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    if (tier) {
      params.push(tier);
      clauses.push(`tier = $${params.length}`);
    }
    const decoded = decodeCursor(cursor);
    if (decoded) {
      params.push(decoded.createdAt, decoded.id);
      clauses.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    params.push(limit + 1);
    const result = await query(
      `SELECT * FROM customers WHERE ${clauses.join(' AND ')}
       ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
      params
    );
    const mapped = result.rows.map(mapCustomer);
    const meta = buildCursorMeta(mapped, limit);
    return { data: mapped.slice(0, limit), meta: { ...meta, limit } };
  },

  async getCustomer(tenantId, id) {
    const result = await query('SELECT * FROM customers WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!result.rows[0]) throw notFound('Customer');
    return mapCustomer(result.rows[0]);
  },

  async createCustomer(tenantId, input, actor) {
    try {
      const result = await query(
        `INSERT INTO customers (id, tenant_id, name, email, tier, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW()) RETURNING *`,
        [randomUUID(), tenantId, input.name, input.email, input.tier ?? 'bronze']
      );
      const customer = mapCustomer(result.rows[0]);
      await pushAudit({ query }, tenantId, actor.email, 'customer.created', customer.id);
      return customer;
    } catch (error) {
      if (error.code === '23505') throw conflict('Customer email already exists', { email: input.email });
      throw error;
    }
  },

  async updateCustomer(tenantId, id, input, actor) {
    await this.getCustomer(tenantId, id);
    const result = await query(
      `UPDATE customers SET name = COALESCE($3, name), email = COALESCE($4, email), tier = COALESCE($5, tier), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, input.name ?? null, input.email ?? null, input.tier ?? null]
    );
    await pushAudit({ query }, tenantId, actor.email, 'customer.updated', id);
    return mapCustomer(result.rows[0]);
  },

  async deactivateCustomer(tenantId, id, actor) {
    const result = await query(
      `UPDATE customers SET status = 'inactive', updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId]
    );
    if (!result.rows[0]) throw notFound('Customer');
    await pushAudit({ query }, tenantId, actor.email, 'customer.deactivated', id);
    return mapCustomer(result.rows[0]);
  },

  async listProducts(tenantId, filters) {
    const { status, q, lowStock, limit = 20, cursor } = filters;
    const params = [tenantId];
    const clauses = ['tenant_id = $1'];
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      clauses.push(`LOWER(name) LIKE $${params.length}`);
    }
    if (lowStock === true) clauses.push('stock <= 5');
    const decoded = decodeCursor(cursor);
    if (decoded) {
      params.push(decoded.createdAt, decoded.id);
      clauses.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    params.push(limit + 1);
    const result = await query(
      `SELECT * FROM products WHERE ${clauses.join(' AND ')}
       ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
      params
    );
    const mapped = result.rows.map(mapProduct);
    const meta = buildCursorMeta(mapped, limit);
    return { data: mapped.slice(0, limit), meta: { ...meta, limit } };
  },

  async getProduct(tenantId, id) {
    const result = await query('SELECT * FROM products WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!result.rows[0]) throw notFound('Product');
    return mapProduct(result.rows[0]);
  },

  async createProduct(tenantId, input, actor) {
    try {
      const result = await query(
        `INSERT INTO products (id, tenant_id, sku, name, price, stock, version, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 1, 'active', NOW(), NOW()) RETURNING *`,
        [randomUUID(), tenantId, input.sku, input.name, input.price, input.stock]
      );
      const product = mapProduct(result.rows[0]);
      await pushAudit({ query }, tenantId, actor.email, 'product.created', product.id);
      return product;
    } catch (error) {
      if (error.code === '23505') throw conflict('Product SKU already exists', { sku: input.sku });
      throw error;
    }
  },

  async createOrderTransaction(tenantId, { customerId, items, pricedItems, total, payment, actor }) {
    return withTransaction(async (client) => {
      const customerResult = await client.query(
        'SELECT * FROM customers WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
        [customerId, tenantId]
      );
      if (!customerResult.rows[0] || customerResult.rows[0].status !== 'active') {
        throw badRequest('Active customer is required');
      }

      for (const item of items) {
        const productResult = await client.query(
          'SELECT * FROM products WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
          [item.productId, tenantId]
        );
        const product = productResult.rows[0];
        if (!product) throw notFound('Product');
        if (product.stock < item.quantity) {
          throw badRequest('Insufficient stock', { productId: product.id, available: product.stock });
        }

        const updated = await client.query(
          `UPDATE products SET stock = stock - $1, version = version + 1, updated_at = NOW()
           WHERE id = $2 AND tenant_id = $3 AND version = $4 AND stock >= $1
           RETURNING *`,
          [item.quantity, item.productId, tenantId, product.version]
        );
        if (!updated.rows[0]) throw conflict('Stock update conflict, retry request', { productId: item.productId });
      }

      const orderId = randomUUID();
      await client.query(
        `INSERT INTO orders (id, tenant_id, customer_id, total, status, payment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'confirmed', $5, NOW(), NOW())`,
        [orderId, tenantId, customerId, total, JSON.stringify(payment)]
      );

      for (const item of pricedItems) {
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, sku, name, quantity, unit_price, line_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [randomUUID(), orderId, item.productId, item.sku, item.name, item.quantity, item.unitPrice, item.lineTotal]
        );
      }

      await pushAudit(client, tenantId, actor.email, 'order.created', orderId);
      await pushOutbox(client, tenantId, 'order', orderId, 'order.created', { orderId, total });

      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
      return mapOrder(orderResult.rows[0], client);
    });
  },

  async cancelOrder(tenantId, id, actor) {
    return withTransaction(async (client) => {
      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 AND tenant_id = $2 FOR UPDATE', [
        id,
        tenantId
      ]);
      const orderRow = orderResult.rows[0];
      if (!orderRow) throw notFound('Order');
      if (orderRow.status === 'cancelled') return mapOrder(orderRow, client);
      if (orderRow.status !== 'confirmed') throw badRequest('Only confirmed orders can be cancelled');

      const items = await client.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
      for (const item of items.rows) {
        await client.query(
          `UPDATE products SET stock = stock + $1, version = version + 1, updated_at = NOW()
           WHERE id = $2 AND tenant_id = $3`,
          [item.quantity, item.product_id, tenantId]
        );
      }

      await client.query(`UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id]);
      await pushAudit(client, tenantId, actor.email, 'order.cancelled', id);
      await pushOutbox(client, tenantId, 'order', id, 'order.cancelled', { orderId: id });

      const updated = await client.query('SELECT * FROM orders WHERE id = $1', [id]);
      return mapOrder(updated.rows[0], client);
    });
  },

  async listOrders(tenantId, filters) {
    const { customerId, status, limit = 20, cursor } = filters;
    const params = [tenantId];
    const clauses = ['tenant_id = $1'];
    if (customerId) {
      params.push(customerId);
      clauses.push(`customer_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      clauses.push(`status = $${params.length}`);
    }
    const decoded = decodeCursor(cursor);
    if (decoded) {
      params.push(decoded.createdAt, decoded.id);
      clauses.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    params.push(limit + 1);
    const result = await query(
      `SELECT * FROM orders WHERE ${clauses.join(' AND ')}
       ORDER BY created_at DESC, id DESC LIMIT $${params.length}`,
      params
    );
    const mapped = await Promise.all(result.rows.map((row) => mapOrder(row)));
    const meta = buildCursorMeta(mapped, limit);
    return { data: mapped.slice(0, limit), meta: { ...meta, limit } };
  },

  async getOrder(tenantId, id) {
    const result = await query('SELECT * FROM orders WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
    if (!result.rows[0]) throw notFound('Order');
    return mapOrder(result.rows[0]);
  },

  async getMetrics(tenantId) {
    const [users, customers, products, orders, auditLogs, outboxPending, outboxQueued] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM users WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*)::int AS count FROM customers WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*)::int AS count FROM products WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*)::int AS count FROM orders WHERE tenant_id = $1', [tenantId]),
      query('SELECT COUNT(*)::int AS count FROM audit_logs WHERE tenant_id = $1', [tenantId]),
      query(`SELECT COUNT(*)::int AS count FROM outbox_events WHERE tenant_id = $1 AND status = 'pending'`, [
        tenantId
      ]),
      query(`SELECT COUNT(*)::int AS count FROM outbox_events WHERE tenant_id = $1 AND status = 'queued'`, [tenantId])
    ]);
    return {
      users: users.rows[0].count,
      customers: customers.rows[0].count,
      products: products.rows[0].count,
      orders: orders.rows[0].count,
      auditLogs: auditLogs.rows[0].count,
      outboxPending: outboxPending.rows[0].count,
      outboxQueued: outboxQueued.rows[0].count
    };
  },

  async listAuditLogs(tenantId, limit = 100) {
    const result = await query(
      'SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY at DESC LIMIT $2',
      [tenantId, limit]
    );
    return {
      data: result.rows.map((row) => ({
        id: row.id,
        tenantId: row.tenant_id,
        at: row.at.toISOString(),
        actor: row.actor,
        action: row.action,
        targetId: row.target_id,
        metadata: row.metadata
      })),
      meta: { total: result.rows.length }
    };
  },

  async markOutboxProcessed(id) {
    await query(`UPDATE outbox_events SET status = 'processed', processed_at = NOW() WHERE id = $1`, [id]);
  },

  async markOutboxFailed(id, error) {
    await query(
      `UPDATE outbox_events
       SET attempts = attempts + 1, error = $2,
           status = CASE WHEN attempts + 1 >= 5 THEN 'failed' ELSE 'queued' END
       WHERE id = $1`,
      [id, error]
    );
  },

  async claimOutboxForRelay(limit = 10) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE outbox_events SET status = 'publishing'
         WHERE id IN (
           SELECT id FROM outbox_events WHERE status = 'pending'
           ORDER BY created_at ASC LIMIT $1 FOR UPDATE SKIP LOCKED
         )
         RETURNING *`,
        [limit]
      );
      return result.rows.map(mapOutboxRow);
    });
  },

  async markOutboxQueued(id) {
    await query(`UPDATE outbox_events SET status = 'queued' WHERE id = $1 AND status = 'publishing'`, [id]);
  },

  async markOutboxRelayFailed(id, error) {
    await query(
      `UPDATE outbox_events
       SET attempts = attempts + 1, error = $2,
           status = CASE WHEN attempts + 1 >= 5 THEN 'failed' ELSE 'pending' END
       WHERE id = $1 AND status = 'publishing'`,
      [id, error]
    );
  },

  async claimOutboxForProcessing(limit = 10) {
    return withTransaction(async (client) => {
      const result = await client.query(
        `UPDATE outbox_events SET status = 'processing'
         WHERE id IN (
           SELECT id FROM outbox_events WHERE status = 'pending'
           ORDER BY created_at ASC LIMIT $1 FOR UPDATE SKIP LOCKED
         )
         RETURNING *`,
        [limit]
      );
      return result.rows.map(mapOutboxRow);
    });
  }
};

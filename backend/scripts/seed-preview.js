import { memoryRepository } from '../src/repositories/memory-repository.js';

async function main() {
  const repo = memoryRepository;
  const tenant = await repo.getDefaultTenant();
  const customers = await repo.listCustomers(tenant.id, { limit: 10 });
  const products = await repo.listProducts(tenant.id, { limit: 10 });

  console.log(
    JSON.stringify(
      {
        logins: [
          { email: 'admin@example.com', password: 'Admin@12345', role: 'admin' },
          { email: 'manager@example.com', password: 'Manager@12345', role: 'manager' }
        ],
        tenant,
        customers: customers.data,
        products: products.data
      },
      null,
      2
    )
  );
}

main();

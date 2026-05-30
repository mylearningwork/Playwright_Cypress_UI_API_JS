import { store } from '../src/db/in-memory-store.js';

console.log(
  JSON.stringify(
    {
      loginUsers: [
        { email: 'admin@example.com', password: 'Admin@12345', role: 'admin' },
        { email: 'manager@example.com', password: 'Manager@12345', role: 'manager' }
      ],
      customers: [...store.customers.values()],
      products: [...store.products.values()]
    },
    null,
    2
  )
);

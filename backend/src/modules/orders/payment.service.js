import { badRequest } from '../../shared/errors.js';

export async function authorizePayment({ amount, paymentMethod }) {
  await new Promise((resolve) => setTimeout(resolve, 20));

  if (paymentMethod === 'declined-card') {
    throw badRequest('Payment authorization declined');
  }

  return {
    provider: 'mock-payments',
    authorizationId: `auth_${Date.now()}`,
    amount,
    status: 'authorized'
  };
}

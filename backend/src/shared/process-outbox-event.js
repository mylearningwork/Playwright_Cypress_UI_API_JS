import { logger } from '../config/logger.js';

export async function processOutboxEvent(event) {
  switch (event.eventType) {
    case 'order.created':
      logger.info(
        { orderId: event.payload?.orderId ?? event.aggregateId, total: event.payload?.total },
        'Processed order.created side effects'
      );
      break;
    case 'order.cancelled':
      logger.info({ orderId: event.payload?.orderId ?? event.aggregateId }, 'Processed order.cancelled side effects');
      break;
    default:
      logger.info({ eventType: event.eventType, aggregateId: event.aggregateId }, 'Processed domain event');
  }

  await new Promise((resolve) => setTimeout(resolve, 50));
}

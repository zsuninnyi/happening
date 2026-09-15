import { z } from 'zod';
import { apiFetch } from './client';
import { deliverySchema, type Delivery } from './types';

const deliveriesResponseSchema = z.object({ deliveries: z.array(deliverySchema) });

export function listDeliveries(token: string): Promise<Delivery[]> {
  return apiFetch('/api/deliveries', deliveriesResponseSchema, { token }).then(
    (data) => data.deliveries,
  );
}

import {
  FAIL_DESTINATION_PREFIX,
  shouldSimulateFailure,
  type NotificationChannel,
  type NotifyPayload,
} from './types.js';

export const emailChannel: NotificationChannel = {
  type: 'email',
  async send(input: NotifyPayload): Promise<void> {
    if (shouldSimulateFailure(input.destination)) {
      throw new Error(`Simulated email failure for ${input.destination}`);
    }
    console.log('[email]', {
      to: input.destination,
      alert: input.alert.name,
      title: input.event.title,
      category: input.event.category,
      severity: input.event.severity,
    });
  },
};

export { FAIL_DESTINATION_PREFIX };

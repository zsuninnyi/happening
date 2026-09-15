import { shouldSimulateFailure, type NotificationChannel, type NotifyPayload } from './types.js';

export const slackChannel: NotificationChannel = {
  type: 'slack',
  async send(input: NotifyPayload): Promise<void> {
    if (shouldSimulateFailure(input.destination)) {
      throw new Error(`Simulated Slack failure for ${input.destination}`);
    }
    console.log('[slack]', {
      to: input.destination,
      alert: input.alert.name,
      title: input.event.title,
      category: input.event.category,
      severity: input.event.severity,
    });
  },
};

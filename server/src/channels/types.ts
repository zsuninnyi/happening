import type { Alert, Channel, Event } from '../domain/types.js';

export type NotifyPayload = {
  destination: string;
  event: Event;
  alert: Alert;
};

export interface NotificationChannel {
  readonly type: Channel;
  send(input: NotifyPayload): Promise<void>;
}

/** Destinations that start with this prefix force a simulated send failure. */
export const FAIL_DESTINATION_PREFIX = 'fail@';

export function shouldSimulateFailure(destination: string): boolean {
  return destination.startsWith(FAIL_DESTINATION_PREFIX);
}

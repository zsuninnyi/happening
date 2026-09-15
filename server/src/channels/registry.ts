import type { Channel } from '../domain/types.js';
import { emailChannel } from './emailChannel.js';
import { slackChannel } from './slackChannel.js';
import type { NotificationChannel } from './types.js';

const channels: NotificationChannel[] = [emailChannel, slackChannel];

const registry = new Map<Channel, NotificationChannel>(
  channels.map((channel) => [channel.type, channel]),
);

export function getChannel(type: Channel): NotificationChannel | undefined {
  return registry.get(type);
}

export function registerChannel(channel: NotificationChannel): void {
  registry.set(channel.type, channel);
}

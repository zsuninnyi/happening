/**
 * Notification dedupe identity for an event.
 * Prefer externalId when present; otherwise use the event's primary id.
 */
export function buildDedupeKey(event: { id: string; externalId: string | null }): string {
  return event.externalId ?? event.id;
}

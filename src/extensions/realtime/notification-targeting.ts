/**
 * Pure helpers that derive, from a notification entity, who should be notified
 * in real time and what the outgoing event payload looks like. Kept free of any
 * Strapi runtime dependency so they can be unit-tested directly.
 */
import type { EventAudience, RealtimeEvent } from './event-hub';

/** Minimal shape of the notification fields the targeting logic needs. */
export interface NotificationLike {
  readonly id?: number | string;
  readonly documentId?: string;
  readonly type?: string;
  readonly module?: string | null;
  readonly title?: string;
  readonly targetAudience?: string | null;
  readonly isRead?: boolean;
  /** Recipient relation: may be an id, or a populated object with an id. */
  readonly recipient?: number | { id?: number } | null;
}

/** Extracts the numeric recipient id from the (possibly populated) relation. */
export function resolveRecipientId(recipient: NotificationLike['recipient']): number | null {
  if (recipient === undefined || recipient === null) {
    return null;
  }
  if (typeof recipient === 'number') {
    return recipient;
  }
  if (typeof recipient === 'object' && typeof recipient.id === 'number') {
    return recipient.id;
  }
  return null;
}

/**
 * Computes the audience for a notification. A notification with an explicit
 * recipient is delivered only to that user; otherwise it is a broadcast scoped
 * by `targetAudience` (defaulting to everyone).
 */
export function resolveAudience(notification: NotificationLike): EventAudience {
  const userId = resolveRecipientId(notification.recipient);
  if (userId !== null) {
    return { userId };
  }
  return { targetAudience: notification.targetAudience ?? 'all' };
}

/**
 * Builds the real-time event payload for a notification lifecycle action. The
 * payload is intentionally small (an identifier + a few hints): clients use it
 * as a trigger to refresh their data, not as the source of truth.
 */
export function buildNotificationEvent(
  action: 'created' | 'updated' | 'deleted',
  notification: NotificationLike
): RealtimeEvent {
  return {
    event: `notification.${action}`,
    data: {
      id: notification.id ?? null,
      documentId: notification.documentId ?? null,
      type: notification.type ?? null,
      module: notification.module ?? null,
    },
  };
}

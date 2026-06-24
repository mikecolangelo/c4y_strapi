/**
 * Lifecycle hooks for the notification content-type.
 *
 * ADDITIVE: these hooks publish a real-time event to the in-memory SSE hub
 * whenever a notification is created, updated or deleted, so connected clients
 * are refreshed without polling. They never block or mutate the write path —
 * any failure is logged and swallowed.
 */
import { notificationEventHub } from '../../../../extensions/realtime/event-hub';
import {
  buildNotificationEvent,
  resolveAudience,
  type NotificationLike,
} from '../../../../extensions/realtime/notification-targeting';

const UID = 'api::notification.notification';

/**
 * Loads a notification with its `recipient` relation populated, so audience
 * targeting can resolve the recipient id even when the lifecycle result does
 * not include the relation.
 */
async function loadWithRecipient(
  id: number | string | undefined
): Promise<NotificationLike | null> {
  if (id === undefined || id === null) {
    return null;
  }
  try {
    const entity = await strapi.entityService.findOne(UID, id as number, {
      fields: ['id', 'type', 'module', 'title', 'targetAudience', 'isRead'],
      populate: { recipient: { fields: ['id'] } },
    });
    return (entity as NotificationLike) ?? null;
  } catch (error) {
    strapi.log.warn('[realtime] could not load notification for broadcast', error as Error);
    return null;
  }
}

/** Publishes an event to the hub, never throwing into the write path. */
function publish(action: 'created' | 'updated' | 'deleted', notification: NotificationLike): void {
  try {
    const audience = resolveAudience(notification);
    const event = buildNotificationEvent(action, notification);
    notificationEventHub.publish(event, audience);
  } catch (error) {
    strapi.log.warn('[realtime] failed to publish notification event', error as Error);
  }
}

export default {
  async afterCreate(event: { result: { id?: number } }) {
    const notification = await loadWithRecipient(event.result?.id);
    if (notification) {
      publish('created', notification);
    }
  },

  async afterUpdate(event: { result: { id?: number } }) {
    const notification = await loadWithRecipient(event.result?.id);
    if (notification) {
      publish('updated', notification);
    }
  },

  async afterDelete(event: { result?: NotificationLike }) {
    // On delete the row is gone, so reuse the result snapshot Strapi provides.
    const notification = event.result;
    if (notification) {
      publish('deleted', notification);
    }
  },
};

import { describe, expect, it } from 'vitest';
import {
  buildNotificationEvent,
  resolveAudience,
  resolveRecipientId,
} from './notification-targeting';

describe('resolveRecipientId', () => {
  it('returns null when there is no recipient', () => {
    expect(resolveRecipientId(null)).toBeNull();
    expect(resolveRecipientId(undefined)).toBeNull();
  });

  it('reads a numeric recipient id directly', () => {
    expect(resolveRecipientId(42)).toBe(42);
  });

  it('reads the id from a populated recipient object', () => {
    expect(resolveRecipientId({ id: 13 })).toBe(13);
    expect(resolveRecipientId({})).toBeNull();
  });
});

describe('resolveAudience', () => {
  it('targets the single recipient when one is set', () => {
    expect(resolveAudience({ recipient: { id: 5 } })).toEqual({ userId: 5 });
  });

  it('falls back to a broadcast audience when there is no recipient', () => {
    expect(resolveAudience({ targetAudience: 'admins' })).toEqual({ targetAudience: 'admins' });
    expect(resolveAudience({})).toEqual({ targetAudience: 'all' });
  });
});

describe('buildNotificationEvent', () => {
  it('builds a compact created/updated/deleted event payload', () => {
    const event = buildNotificationEvent('created', {
      id: 1,
      documentId: 'abc',
      type: 'announcement',
      module: 'fleet',
    });
    expect(event).toEqual({
      event: 'notification.created',
      data: { id: 1, documentId: 'abc', type: 'announcement', module: 'fleet' },
    });
  });

  it('normalises missing fields to null', () => {
    const event = buildNotificationEvent('deleted', { id: 9 });
    expect(event.event).toBe('notification.deleted');
    expect(event.data).toEqual({ id: 9, documentId: null, type: null, module: null });
  });
});

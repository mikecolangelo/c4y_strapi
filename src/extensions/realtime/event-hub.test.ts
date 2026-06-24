import { describe, expect, it, vi } from 'vitest';
import {
  NotificationEventHub,
  audienceMatchesClient,
  formatSseFrame,
  type HubClient,
} from './event-hub';

function makeClient(userId: number, role: string | null): HubClient & { frames: string[] } {
  const frames: string[] = [];
  return {
    userId,
    role,
    frames,
    send: (frame: string) => frames.push(frame),
  };
}

describe('audienceMatchesClient', () => {
  it('delivers a targeted event only to the named recipient', () => {
    expect(audienceMatchesClient({ userId: 7 }, { userId: 7, role: null })).toBe(true);
    expect(audienceMatchesClient({ userId: 7 }, { userId: 8, role: null })).toBe(false);
  });

  it('treats targetAudience "all" (and empty) as a full broadcast', () => {
    expect(audienceMatchesClient({ targetAudience: 'all' }, { userId: 1, role: 'driver' })).toBe(
      true
    );
    expect(audienceMatchesClient({ targetAudience: '' }, { userId: 1, role: 'admin' })).toBe(true);
    expect(audienceMatchesClient({}, { userId: 1, role: null })).toBe(true);
  });

  it('matches the "admins" audience against admin and super-admin roles only', () => {
    expect(audienceMatchesClient({ targetAudience: 'admins' }, { userId: 1, role: 'admin' })).toBe(
      true
    );
    expect(
      audienceMatchesClient({ targetAudience: 'admins' }, { userId: 1, role: 'super-admin' })
    ).toBe(true);
    expect(audienceMatchesClient({ targetAudience: 'admins' }, { userId: 1, role: 'driver' })).toBe(
      false
    );
  });

  it('matches the "drivers" audience against everyone except admins', () => {
    expect(
      audienceMatchesClient({ targetAudience: 'drivers' }, { userId: 1, role: 'driver' })
    ).toBe(true);
    expect(audienceMatchesClient({ targetAudience: 'drivers' }, { userId: 1, role: 'admin' })).toBe(
      false
    );
  });
});

describe('formatSseFrame', () => {
  it('serialises an event into a spec-compliant SSE frame', () => {
    const frame = formatSseFrame({ event: 'notification.created', data: { id: 5 } });
    expect(frame).toBe('event: notification.created\ndata: {"id":5}\n\n');
  });
});

describe('NotificationEventHub', () => {
  it('registers and unregisters clients, tracking size', () => {
    const hub = new NotificationEventHub();
    const a = makeClient(1, 'admin');
    const unregister = hub.register(a);
    expect(hub.size).toBe(1);
    unregister();
    expect(hub.size).toBe(0);
  });

  it('delivers a targeted event only to the matching client', () => {
    const hub = new NotificationEventHub();
    const target = makeClient(1, 'driver');
    const other = makeClient(2, 'driver');
    hub.register(target);
    hub.register(other);

    const delivered = hub.publish(
      { event: 'notification.created', data: { id: 9 } },
      { userId: 1 }
    );

    expect(delivered).toBe(1);
    expect(target.frames).toHaveLength(1);
    expect(other.frames).toHaveLength(0);
  });

  it('broadcasts to every matching client for an audience event', () => {
    const hub = new NotificationEventHub();
    const admin = makeClient(1, 'admin');
    const driver = makeClient(2, 'driver');
    hub.register(admin);
    hub.register(driver);

    const delivered = hub.publish(
      { event: 'notification.created', data: { id: 9 } },
      { targetAudience: 'admins' }
    );

    expect(delivered).toBe(1);
    expect(admin.frames).toHaveLength(1);
    expect(driver.frames).toHaveLength(0);
  });

  it('drops a client whose send throws and keeps delivering to the rest', () => {
    const hub = new NotificationEventHub();
    const broken: HubClient = {
      userId: 1,
      role: 'admin',
      send: vi.fn(() => {
        throw new Error('socket closed');
      }),
    };
    const healthy = makeClient(2, 'admin');
    hub.register(broken);
    hub.register(healthy);

    const delivered = hub.publish(
      { event: 'notification.updated', data: {} },
      { targetAudience: 'all' }
    );

    expect(delivered).toBe(1);
    expect(healthy.frames).toHaveLength(1);
    expect(hub.size).toBe(1);
  });
});

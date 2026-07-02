import { describe, expect, it, vi } from 'vitest';
import {
  ensureAuthenticatedPermissions,
  NOTIFICATION_STREAM_ACTIONS,
} from '../permissions/authenticated-access';

/**
 * Verifies the SSE stream endpoint is granted to the Authenticated role on
 * bootstrap, mirroring the existing permission-grant test harness.
 */
function makeStrapi(opts: { authRole?: { id: number } | null; existing?: Set<string> }) {
  const created: string[] = [];
  const existing = opts.existing ?? new Set<string>();

  const strapi = {
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    db: {
      query: (model: string) => {
        if (model === 'plugin::users-permissions.role') {
          return { findOne: async () => opts.authRole ?? null };
        }
        return {
          findOne: async ({ where }: { where: { action: string } }) =>
            existing.has(where.action) ? { id: 1 } : null,
          create: async ({ data }: { data: { action: string } }) => {
            created.push(data.action);
            existing.add(data.action);
            return { id: 99 };
          },
        };
      },
    },
  } as unknown as Parameters<typeof ensureAuthenticatedPermissions>[0];

  return { strapi, created };
}

describe('NOTIFICATION_STREAM_ACTIONS', () => {
  it('exposes exactly the SSE stream action', () => {
    expect(NOTIFICATION_STREAM_ACTIONS).toEqual(['api::notification.notification-stream.stream']);
  });

  it('grants the stream action to the Authenticated role when missing', async () => {
    const { strapi, created } = makeStrapi({ authRole: { id: 1 } });

    const granted = await ensureAuthenticatedPermissions(strapi, NOTIFICATION_STREAM_ACTIONS);

    expect(granted).toBe(1);
    expect(created).toEqual(['api::notification.notification-stream.stream']);
  });

  it('is idempotent when the permission already exists', async () => {
    const existing = new Set<string>(NOTIFICATION_STREAM_ACTIONS);
    const { strapi, created } = makeStrapi({ authRole: { id: 1 }, existing });

    const granted = await ensureAuthenticatedPermissions(strapi, NOTIFICATION_STREAM_ACTIONS);

    expect(granted).toBe(0);
    expect(created).toEqual([]);
  });
});

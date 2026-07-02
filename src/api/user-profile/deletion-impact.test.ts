import { describe, expect, it, vi } from 'vitest';
import { computeDeletionImpact } from './deletion-impact';

/**
 * Build a minimal Strapi stub whose `db.query` distinguishes the user-profile
 * model (documentId -> id resolution + userAccount population) from every
 * related model (which only responds to `count`).
 *
 * @param profiles  rows returned for the profile lookup
 * @param counts    map of related model uid -> count to return (default 0)
 */
function makeStrapi(opts: {
  profiles: Array<{ id: number; documentId: string; userAccount?: unknown }>;
  counts?: Record<string, number>;
}) {
  const counts = opts.counts ?? {};
  // Track the where filters each related model received, to assert id-scoping.
  const countCalls: Record<string, unknown> = {};

  const strapi = {
    log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    db: {
      query: (uid: string) => {
        if (uid === 'api::user-profile.user-profile') {
          return {
            findMany: async ({ where }: { where: { documentId: { $in: string[] } } }) =>
              opts.profiles.filter((p) => where.documentId.$in.includes(p.documentId)),
            count: async () => 0,
          };
        }
        return {
          count: async ({ where }: { where: unknown }) => {
            countCalls[uid] = where;
            return counts[uid] ?? 0;
          },
        };
      },
    },
  } as unknown as Parameters<typeof computeDeletionImpact>[0];

  return { strapi, countCalls };
}

describe('computeDeletionImpact', () => {
  it('returns an all-zero shape when no ids are provided', async () => {
    const { strapi } = makeStrapi({ profiles: [] });

    const impact = await computeDeletionImpact(strapi, []);

    expect(impact.contacts).toBe(0);
    expect(impact.accounts).toBe(0);
    expect(impact.totalRelated).toBe(0);
    // Exact contract keys, all zeroed.
    expect(impact.related).toEqual({
      deals: 0,
      clients: 0,
      appointments: 0,
      userComments: 0,
      communicationLogs: 0,
      serviceOrders: 0,
      serviceNotes: 0,
      inventoryNotes: 0,
      notifications: 0,
      driverHistory: 0,
      financings: 0,
      weeklyCollections: 0,
      billingRecords: 0,
      invoices: 0,
      fleetReminders: 0,
      inventoryRequests: 0,
      supplyRequests: 0,
    });
  });

  it('returns an all-zero shape when no documentIds resolve to profiles', async () => {
    const { strapi } = makeStrapi({ profiles: [] });

    const impact = await computeDeletionImpact(strapi, ['missing-1', 'missing-2']);

    expect(impact.contacts).toBe(0);
    expect(impact.accounts).toBe(0);
    expect(impact.totalRelated).toBe(0);
  });

  it('counts contacts, linked accounts and sums every related count', async () => {
    const { strapi, countCalls } = makeStrapi({
      profiles: [
        { id: 10, documentId: 'doc-a', userAccount: { id: 100 } },
        { id: 20, documentId: 'doc-b' }, // lead, no account
      ],
      counts: {
        'api::deal.deal': 3,
        'api::client.client': 2,
        'api::notification.notification': 5,
        'api::supply-request.supply-request': 1,
      },
    });

    const impact = await computeDeletionImpact(strapi, ['doc-a', 'doc-b']);

    expect(impact.contacts).toBe(2);
    expect(impact.accounts).toBe(1); // only doc-a has a userAccount
    expect(impact.related.deals).toBe(3);
    expect(impact.related.clients).toBe(2);
    expect(impact.related.notifications).toBe(5);
    expect(impact.related.supplyRequests).toBe(1);
    expect(impact.totalRelated).toBe(3 + 2 + 5 + 1);

    // Single-field relations filter directly on the resolved numeric ids.
    expect(countCalls['api::deal.deal']).toEqual({ seller: { id: { $in: [10, 20] } } });
    // Multi-field relations are OR-ed so a row is counted once.
    expect(countCalls['api::supply-request.supply-request']).toEqual({
      $or: [{ requester: { id: { $in: [10, 20] } } }, { approvedBy: { id: { $in: [10, 20] } } }],
    });
  });

  it('de-duplicates incoming documentIds before resolving', async () => {
    const { strapi } = makeStrapi({
      profiles: [{ id: 10, documentId: 'doc-a', userAccount: { id: 100 } }],
    });

    const impact = await computeDeletionImpact(strapi, ['doc-a', 'doc-a']);

    expect(impact.contacts).toBe(1);
    expect(impact.accounts).toBe(1);
  });
});

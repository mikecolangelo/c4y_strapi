import { describe, expect, it, vi } from 'vitest';
import {
  ensureAuthenticatedPermissions,
  SERVICE_CATALOG_ACTIONS,
  STOCK_ACTIONS,
  BILLING_ACTIONS,
  CALENDAR_ACTIONS,
} from './authenticated-access';

/**
 * Builds a minimal Strapi stub whose `db.query` differentiates the role and
 * permission models, tracking which permissions get created.
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

describe('ensureAuthenticatedPermissions', () => {
  it('creates every missing permission for the Authenticated role', async () => {
    const { strapi, created } = makeStrapi({ authRole: { id: 1 } });

    const granted = await ensureAuthenticatedPermissions(strapi, SERVICE_CATALOG_ACTIONS);

    expect(granted).toBe(SERVICE_CATALOG_ACTIONS.length);
    expect(created).toEqual([...SERVICE_CATALOG_ACTIONS]);
  });

  it('is idempotent and skips permissions that already exist', async () => {
    const existing = new Set<string>(SERVICE_CATALOG_ACTIONS);
    const { strapi, created } = makeStrapi({ authRole: { id: 1 }, existing });

    const granted = await ensureAuthenticatedPermissions(strapi, SERVICE_CATALOG_ACTIONS);

    expect(granted).toBe(0);
    expect(created).toEqual([]);
  });

  it('returns 0 and warns when the Authenticated role is missing', async () => {
    const { strapi } = makeStrapi({ authRole: null });

    const granted = await ensureAuthenticatedPermissions(strapi, SERVICE_CATALOG_ACTIONS);

    expect(granted).toBe(0);
    expect(strapi.log.warn).toHaveBeenCalled();
  });
});

describe('CRUD action lists for content-types now written via real user JWT', () => {
  it('generates find/findOne/create/update/delete per content-type', () => {
    expect(CALENDAR_ACTIONS).toEqual([
      'api::appointment.appointment.find',
      'api::appointment.appointment.findOne',
      'api::appointment.appointment.create',
      'api::appointment.appointment.update',
      'api::appointment.appointment.delete',
    ]);
  });

  it('covers every stock content-type with 5 actions each', () => {
    expect(STOCK_ACTIONS.length).toBe(8 * 5);
    expect(STOCK_ACTIONS).toContain('api::inventory-note.inventory-note.create');
  });

  it('covers every billing content-type with 5 actions each', () => {
    expect(BILLING_ACTIONS.length).toBe(9 * 5);
    expect(BILLING_ACTIONS).toContain('api::financing.financing.create');
  });
});

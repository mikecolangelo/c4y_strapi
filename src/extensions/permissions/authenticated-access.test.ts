import { describe, expect, it, vi } from 'vitest';
import {
  ensureAuthenticatedPermissions,
  SERVICE_CATALOG_ACTIONS,
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

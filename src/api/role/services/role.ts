/**
 * role service
 *
 * Source of truth for the list of roles (base + custom). Base roles are seeded
 * idempotently on bootstrap as `isSystem:true`; custom roles are created from
 * the Configuración UI. The permission matrix itself lives in role-permission.
 */

import { factories } from '@strapi/strapi';
import { ROLES } from '../../../config/permission-modules';
import { mergeRoleKeys, type RoleRow } from '../role-utils';

const UID = 'api::role.role';

/** Human-readable labels for the base roles when seeding. */
const BASE_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  driver: 'Usuario',
  lead: 'Lead',
};

export default factories.createCoreService(UID, ({ strapi }) => ({
  /**
   * Seed the base roles (admin/driver/lead) as system roles. Idempotent: only
   * creates the ones that are missing.
   */
  async seedBaseRoles(): Promise<number> {
    const existing = await strapi.db.query(UID).findMany({ select: ['key'] });
    const existingKeys = new Set(existing.map((r: RoleRow) => r.key));

    let created = 0;
    for (const key of ROLES) {
      if (existingKeys.has(key)) continue;
      await strapi.db.query(UID).create({
        data: {
          key,
          label: BASE_ROLE_LABELS[key] ?? key,
          isSystem: true,
          isActive: true,
        },
      });
      created += 1;
    }

    if (created > 0) {
      strapi.log.info(`[role] ${created} roles base sembrados`);
    }
    return created;
  },

  /** All stored role rows. */
  async listRoles(): Promise<RoleRow[]> {
    return strapi.db.query(UID).findMany({ orderBy: { id: 'asc' } });
  },

  /**
   * The effective, ordered list of role keys (base first, then custom). Falls
   * back to the static base list if the table has not been seeded yet.
   */
  async getRoleKeys(): Promise<string[]> {
    const rows = await strapi.db.query(UID).findMany({ select: ['key'] });
    return mergeRoleKeys(rows as RoleRow[]);
  },
}));

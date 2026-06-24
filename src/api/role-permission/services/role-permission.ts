/**
 * role-permission service
 *
 * Fuente de verdad de los permisos por rol y módulo. Mantiene una caché en
 * memoria que se invalida al actualizar la matriz.
 */

import { factories } from '@strapi/strapi';
import {
  ACTION_FIELD,
  DEFAULT_MATRIX,
  MODULE_KEYS,
  MODULES,
  type ModulePermission,
  type PermissionAction,
} from '../../../config/permission-modules';

const UID = 'api::role-permission.role-permission';
const ROLE_UID = 'api::role.role';

type FullMatrix = Record<string, Record<string, ModulePermission>>;

let cache: FullMatrix | null = null;

const NONE: ModulePermission = {
  canAccess: false,
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
};

const rowToPermission = (row: any): ModulePermission => ({
  canAccess: !!row.canAccess,
  canRead: !!row.canRead,
  canCreate: !!row.canCreate,
  canUpdate: !!row.canUpdate,
  canDelete: !!row.canDelete,
});

/**
 * Default permission set for a role+module. Base roles use DEFAULT_MATRIX; any
 * custom role defaults to no access (all-false).
 */
const defaultPermissionFor = (role: string, moduleKey: string): ModulePermission =>
  DEFAULT_MATRIX[role as keyof typeof DEFAULT_MATRIX]?.[moduleKey] ?? NONE;

export default factories.createCoreService(UID, ({ strapi }) => ({
  /**
   * Garantiza que exista una fila por cada combinación rol+módulo.
   * Idempotente: solo crea las que faltan, respeta la matriz por defecto.
   */
  async seedDefaults() {
    const roles = await strapi.service(ROLE_UID).getRoleKeys();
    const existing = await strapi.db.query(UID).findMany({});
    const existingKeys = new Set(existing.map((r: any) => `${r.role}::${r.moduleKey}`));

    let created = 0;
    for (const role of roles) {
      for (const moduleKey of MODULE_KEYS) {
        const key = `${role}::${moduleKey}`;
        if (existingKeys.has(key)) continue;
        const perm = defaultPermissionFor(role, moduleKey);
        await strapi.db.query(UID).create({
          data: { role, moduleKey, ...perm },
        });
        created++;
      }
    }

    if (created > 0) {
      strapi.log.info(`[role-permission] ${created} filas de permisos creadas por defecto`);
    }
    cache = null;
    return created;
  },

  /** Devuelve la matriz completa { role: { moduleKey: ModulePermission } }. */
  async getMatrix(): Promise<FullMatrix> {
    if (cache) return cache;

    const roles: string[] = await strapi.service(ROLE_UID).getRoleKeys();
    const rows = await strapi.db.query(UID).findMany({});
    const matrix: FullMatrix = {};
    for (const role of roles) matrix[role] = {};

    for (const row of rows) {
      if (!matrix[row.role]) matrix[row.role] = {};
      matrix[row.role][row.moduleKey] = rowToPermission(row);
    }

    // Rellenar huecos con la matriz por defecto para robustez (custom roles -> none).
    for (const role of roles) {
      for (const moduleKey of MODULE_KEYS) {
        if (!matrix[role][moduleKey]) {
          matrix[role][moduleKey] = defaultPermissionFor(role, moduleKey);
        }
      }
    }

    cache = matrix;
    return matrix;
  },

  /** Verifica si un rol puede ejecutar una acción sobre un módulo. */
  async can(role: string, moduleKey: string, action: PermissionAction): Promise<boolean> {
    const matrix = await this.getMatrix();
    const perm = matrix[role]?.[moduleKey];
    if (!perm) return false;
    const field = ACTION_FIELD[action];
    return !!perm[field];
  },

  /** Verifica si un rol puede ver/entrar a un módulo. */
  async canAccess(role: string, moduleKey: string): Promise<boolean> {
    const matrix = await this.getMatrix();
    return !!matrix[role]?.[moduleKey]?.canAccess;
  },

  /**
   * Reemplaza la matriz con la enviada (upsert por rol+módulo).
   * `payload` = { admin: { users: {canAccess,...}, ... }, driver: {...} }
   */
  async updateMatrix(payload: Record<string, Record<string, Partial<ModulePermission>>>) {
    const roles = new Set<string>(await strapi.service(ROLE_UID).getRoleKeys());
    for (const role of Object.keys(payload)) {
      if (!roles.has(role)) continue;
      for (const moduleKey of Object.keys(payload[role])) {
        if (!MODULE_KEYS.includes(moduleKey)) continue;
        const incoming = payload[role][moduleKey] || {};
        const data = {
          canAccess: !!incoming.canAccess,
          canRead: !!incoming.canRead,
          canCreate: !!incoming.canCreate,
          canUpdate: !!incoming.canUpdate,
          canDelete: !!incoming.canDelete,
        };

        const existing = await strapi.db.query(UID).findOne({
          where: { role, moduleKey },
        });

        if (existing) {
          await strapi.db.query(UID).update({ where: { id: existing.id }, data });
        } else {
          await strapi.db.query(UID).create({ data: { role, moduleKey, ...data } });
        }
      }
    }

    cache = null;
    return this.getMatrix();
  },

  /** Metadatos de módulos para construir la UI. */
  getModules() {
    return MODULES;
  },
}));

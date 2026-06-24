/**
 * menu-config service
 *
 * Persiste el ORDEN de los items del menú (una fila por módulo:
 * { moduleKey, sortIndex }). La visibilidad por rol NO vive aquí: se controla
 * con `role-permission.canAccess` para evitar duplicar la fuente de verdad.
 */

import { factories } from '@strapi/strapi';
import { MODULE_KEYS } from '../../../config/permission-modules';
import {
  resolveMenuOrder,
  buildOrderRows,
  resolveHidden,
  sanitizeHidden,
  type HiddenMap,
} from '../order-utils';

const UID = 'api::menu-config.menu-config';
const ROLE_UID = 'api::role.role';

export interface MenuLayout {
  /** moduleKeys en el orden guardado. */
  order: string[];
  /** { moduleKey: rolesOcultos[] } — visibilidad de menú, no afecta el acceso. */
  hidden: HiddenMap;
}

export default factories.createCoreService(UID, ({ strapi }) => ({
  /** Orden del menú (con fallback al orden por defecto). */
  async getOrder(): Promise<string[]> {
    const rows = await strapi.db.query(UID).findMany({});
    return resolveMenuOrder(rows, MODULE_KEYS);
  },

  /** Layout completo: orden + roles ocultos por módulo. */
  async getLayout(): Promise<MenuLayout> {
    const [rows, roles] = await Promise.all([
      strapi.db.query(UID).findMany({}),
      strapi.service(ROLE_UID).getRoleKeys() as Promise<string[]>,
    ]);
    return {
      order: resolveMenuOrder(rows, MODULE_KEYS),
      hidden: resolveHidden(rows, MODULE_KEYS, roles),
    };
  },

  /**
   * Reemplaza el layout (orden + ocultos). Hace upsert de un sortIndex denso
   * (0..n) por módulo, persiste los roles ocultos y limpia filas de módulos que
   * ya no existen.
   */
  async updateLayout(orderedKeys: string[], hiddenInput: unknown): Promise<MenuLayout> {
    const roles: string[] = await strapi.service(ROLE_UID).getRoleKeys();
    const rows = buildOrderRows(orderedKeys, MODULE_KEYS);
    const hidden = sanitizeHidden(hiddenInput, MODULE_KEYS, roles);

    for (const { moduleKey, sortIndex } of rows) {
      const data = { sortIndex, hiddenForRoles: hidden[moduleKey] ?? [] };
      const existing = await strapi.db.query(UID).findOne({ where: { moduleKey } });
      if (existing) {
        await strapi.db.query(UID).update({ where: { id: existing.id }, data });
      } else {
        await strapi.db.query(UID).create({ data: { moduleKey, ...data } });
      }
    }

    return this.getLayout();
  },
}));

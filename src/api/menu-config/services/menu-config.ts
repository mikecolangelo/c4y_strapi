/**
 * menu-config service
 *
 * Persiste el ORDEN de los items del menú (una fila por módulo:
 * { moduleKey, sortIndex }). La visibilidad por rol NO vive aquí: se controla
 * con `role-permission.canAccess` para evitar duplicar la fuente de verdad.
 */

import { factories } from '@strapi/strapi';
import { MODULE_KEYS } from '../../../config/permission-modules';
import { resolveMenuOrder, buildOrderRows } from '../order-utils';

const UID = 'api::menu-config.menu-config';

export default factories.createCoreService(UID, ({ strapi }) => ({
  /** Lista de moduleKeys en el orden guardado (con fallback al orden por defecto). */
  async getOrder(): Promise<string[]> {
    const rows = await strapi.db.query(UID).findMany({});
    return resolveMenuOrder(rows, MODULE_KEYS);
  },

  /**
   * Reemplaza el orden con la lista enviada. Hace upsert de un sortIndex denso
   * (0..n) por módulo y limpia filas de módulos que ya no existen.
   */
  async updateOrder(orderedKeys: string[]): Promise<string[]> {
    const rows = buildOrderRows(orderedKeys, MODULE_KEYS);

    for (const { moduleKey, sortIndex } of rows) {
      const existing = await strapi.db.query(UID).findOne({ where: { moduleKey } });
      if (existing) {
        await strapi.db.query(UID).update({ where: { id: existing.id }, data: { sortIndex } });
      } else {
        await strapi.db.query(UID).create({ data: { moduleKey, sortIndex } });
      }
    }

    return this.getOrder();
  },
}));

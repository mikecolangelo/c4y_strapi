'use strict';

/**
 * Migración: endurecimiento de permisos del rol "driver" (conductor).
 *
 * El requisito es que el conductor vea casi nada: solo su panel
 * (/dashboard-user), notificaciones y perfil. Las filas sembradas
 * previamente le daban acceso de lectura a flota, facturación y calendario.
 *
 * Esta migración pone todos los flags en false para las filas
 * role='driver' y module_key IN ('fleet','billing','calendar').
 *
 * Es idempotente: un UPDATE directo; si las filas ya están en false no
 * cambia nada.
 */
module.exports = {
  async up(knex) {
    const hasTable = await knex.schema.hasTable('role_permissions');
    if (!hasTable) {
      return;
    }

    const updated = await knex('role_permissions')
      .where({ role: 'driver' })
      .whereIn('module_key', ['fleet', 'billing', 'calendar'])
      .update({
        can_access: false,
        can_read: false,
        can_create: false,
        can_update: false,
        can_delete: false,
      });

    if (updated > 0) {
      strapi.log.info(
        `[migración driver-tighten] ${updated} filas role-permission del conductor restringidas (fleet/billing/calendar)`
      );
    }
  },
};

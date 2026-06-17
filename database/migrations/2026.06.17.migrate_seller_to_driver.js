'use strict';

/**
 * Migración: eliminación del rol "seller" (vendedor).
 *
 * El rol "seller" fue removido del sistema. Cualquier user-profile que aún
 * tenga ese rol se convierte a "driver". Las notificaciones dirigidas a la
 * audiencia "sellers" pasan a "drivers".
 *
 * Es idempotente: si no hay registros con esos valores no hace nada.
 */
module.exports = {
  async up(knex) {
    // user_profiles.role: seller -> driver
    const hasUserProfiles = await knex.schema.hasTable('user_profiles');
    if (hasUserProfiles) {
      const updated = await knex('user_profiles')
        .where({ role: 'seller' })
        .update({ role: 'driver' });
      if (updated > 0) {
        strapi.log.info(`[migración seller→driver] ${updated} user-profiles actualizados a driver`);
      }
    }

    // notifications.target_audience: sellers -> drivers
    const hasNotifications = await knex.schema.hasTable('notifications');
    if (hasNotifications) {
      const cols = await knex('notifications').columnInfo();
      if (cols.target_audience) {
        const updated = await knex('notifications')
          .where({ target_audience: 'sellers' })
          .update({ target_audience: 'drivers' });
        if (updated > 0) {
          strapi.log.info(`[migración seller→driver] ${updated} notifications reasignadas a drivers`);
        }
      }
    }
  },
};

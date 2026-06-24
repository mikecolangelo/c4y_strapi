/**
 * menu-config controller
 *
 * Expone el orden del menú. La lectura es abierta a usuarios autenticados; la
 * escritura exige rol admin (misma defensa en profundidad que role-permission).
 */

import { factories } from '@strapi/strapi';

const UID = 'api::menu-config.menu-config';

const service = (strapi: any) => strapi.service(UID);

export default factories.createCoreController(UID, ({ strapi }) => ({
  /** Devuelve el orden actual del menú: { order: string[] }. */
  async order(ctx) {
    try {
      const order = await service(strapi).getOrder();
      return ctx.send({ data: { order } });
    } catch (error: any) {
      strapi.log.error('Error obteniendo el orden del menú:', error);
      return ctx.internalServerError('Error al obtener el orden del menú');
    }
  },

  /** Guarda un nuevo orden. Solo admin (o API token de servidor). */
  async updateOrder(ctx) {
    const user = ctx.state.user;
    if (user?.email) {
      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
        select: ['role'],
      });
      if (profile?.role !== 'admin') {
        return ctx.forbidden('Solo los administradores pueden reordenar el menú');
      }
    }

    const { order } = ctx.request.body || {};
    if (!Array.isArray(order)) {
      return ctx.badRequest("Se requiere el arreglo 'order' de moduleKeys");
    }

    try {
      const updated = await service(strapi).updateOrder(order);
      return ctx.send({ data: { order: updated } });
    } catch (error: any) {
      strapi.log.error('Error actualizando el orden del menú:', error);
      return ctx.badRequest(error.message || 'Error al actualizar el orden del menú');
    }
  },
}));

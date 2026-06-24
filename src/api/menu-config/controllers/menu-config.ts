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
  /** Devuelve el layout del menú: { order: string[], hidden: { moduleKey: roles[] } }. */
  async order(ctx) {
    try {
      const layout = await service(strapi).getLayout();
      return ctx.send({ data: layout });
    } catch (error: any) {
      strapi.log.error('Error obteniendo el menú:', error);
      return ctx.internalServerError('Error al obtener el menú');
    }
  },

  /** Guarda orden + visibilidad. Solo admin (o API token de servidor). */
  async updateOrder(ctx) {
    const user = ctx.state.user;
    if (user?.email) {
      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
        select: ['role'],
      });
      if (profile?.role !== 'admin') {
        return ctx.forbidden('Solo los administradores pueden configurar el menú');
      }
    }

    const { order, hidden } = ctx.request.body || {};
    if (!Array.isArray(order)) {
      return ctx.badRequest("Se requiere el arreglo 'order' de moduleKeys");
    }

    try {
      const updated = await service(strapi).updateLayout(order, hidden);
      return ctx.send({ data: updated });
    } catch (error: any) {
      strapi.log.error('Error actualizando el menú:', error);
      return ctx.badRequest(error.message || 'Error al actualizar el menú');
    }
  },
}));

/**
 * vehicle-document-category controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::vehicle-document-category.vehicle-document-category', ({ strapi }) => ({
  /**
   * Get active document categories - Requires authentication
   */
  async getActive(ctx) {
    try {
      const categories = await strapi.entityService.findMany('api::vehicle-document-category.vehicle-document-category', {
        filters: { isActive: true },
        sort: { order: 'asc' },
      });

      return ctx.send({ data: categories });
    } catch (error) {
      strapi.log.error('[vehicle-document-category] Error fetching active categories:', error);
      return ctx.internalServerError('Error al obtener las categorías de documentos');
    }
  },

  /**
   * Reorder document categories
   * Expects body: { items: [{ id: number, order: number }] }
   */
  async reorder(ctx) {
    try {
      const { items } = ctx.request.body;

      if (!Array.isArray(items) || items.length === 0) {
        return ctx.badRequest('Se requiere un array de items con id y order');
      }

      const updates = items.map((item: any) => {
        if (typeof item.id !== 'number' || typeof item.order !== 'number') {
          throw new Error('Cada item debe tener id y order numéricos');
        }
        return strapi.entityService.update(
          'api::vehicle-document-category.vehicle-document-category',
          item.id,
          { data: { order: item.order } }
        );
      });

      await Promise.all(updates);

      return ctx.send({ message: 'Orden actualizado correctamente' });
    } catch (error) {
      strapi.log.error('[vehicle-document-category] Error reordering categories:', error);
      return ctx.internalServerError('Error al actualizar el orden de las categorías');
    }
  },
}));

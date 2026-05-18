/**
 * vehicle-state controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::vehicle-state.vehicle-state', ({ strapi }) => ({
  async create(ctx) {
    const { images } = ctx.request.body?.data || {};
    if (images && Array.isArray(images) && images.length > 10) {
      return ctx.badRequest('No se permiten más de 10 imágenes por estado.');
    }
    return await super.create(ctx);
  },

  async update(ctx) {
    const { images } = ctx.request.body?.data || {};
    // Validar límite de 10 imágenes en total (nuevas + existentes)
    if (images && Array.isArray(images) && images.length > 10) {
      return ctx.badRequest('No se permiten más de 10 imágenes por estado.');
    }
    return await super.update(ctx);
  },
}));

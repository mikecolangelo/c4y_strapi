/**
 * fleet-status controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::fleet-status.fleet-status', ({ strapi }) => ({
  async create(ctx) {
    const { data } = ctx.request.body;

    // Validar que authorDocumentId esté presente y no sea null
    if (!data?.authorDocumentId || data.authorDocumentId === null || data.authorDocumentId === undefined) {
      return ctx.badRequest('authorDocumentId es requerido y no puede ser null');
    }

    // Validar que authorDocumentId no esté vacío
    if (typeof data.authorDocumentId === 'string' && data.authorDocumentId.trim() === '') {
      return ctx.badRequest('authorDocumentId no puede estar vacío');
    }

    // Validar que al menos haya imágenes o comentario
    const hasImages = data?.images && Array.isArray(data.images) && data.images.length > 0;
    const hasComment = data?.comment && typeof data.comment === 'string' && data.comment.trim() !== '';

    if (!hasImages && !hasComment) {
      return ctx.badRequest('Debes proporcionar al menos una imagen o un comentario');
    }

    // Llamar al método create del controller base
    return await super.create(ctx);
  },

  async update(ctx) {
    const { data } = ctx.request.body;

    // Si se está actualizando authorDocumentId, validar que no sea null
    if (data?.authorDocumentId !== undefined) {
      if (data.authorDocumentId === null || data.authorDocumentId === undefined) {
        return ctx.badRequest('authorDocumentId no puede ser null');
      }

      // Validar que authorDocumentId no esté vacío
      if (typeof data.authorDocumentId === 'string' && data.authorDocumentId.trim() === '') {
        return ctx.badRequest('authorDocumentId no puede estar vacío');
      }
    }

    // Llamar al método update del controller base
    return await super.update(ctx);
  },
}));

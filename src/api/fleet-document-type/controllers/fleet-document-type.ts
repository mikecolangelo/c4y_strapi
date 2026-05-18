/**
 * fleet-document-type controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::fleet-document-type.fleet-document-type', ({ strapi }) => ({
  /**
   * Get active document types - Public endpoint
   */
  async getActive(ctx) {
    try {
      const documentTypes = await strapi.entityService.findMany('api::fleet-document-type.fleet-document-type', {
        filters: { isActive: true },
        sort: { order: 'asc' },
      });

      return ctx.send({ data: documentTypes });
    } catch (error) {
      console.error('Error fetching document types:', error);
      return ctx.internalServerError('Error al obtener los tipos de documentos');
    }
  },
}));

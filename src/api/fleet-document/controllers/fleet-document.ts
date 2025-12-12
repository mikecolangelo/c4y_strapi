/**
 * fleet-document controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::fleet-document.fleet-document', ({ strapi }) => ({
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

    // Validar que haya archivos
    const hasFiles = data?.files && Array.isArray(data.files) && data.files.length > 0;
    if (!hasFiles) {
      return ctx.badRequest('Debes proporcionar al menos un archivo');
    }

    // Validar tipo de documento
    const validTypes = [
      'poliza_seguro',
      'ficha_tecnica',
      'tarjeta_propiedad',
      'contrato_compraventa',
      'matricula_vehicular',
      'certificado_revisado',
      'otros'
    ];
    if (!data?.documentType || !validTypes.includes(data.documentType)) {
      return ctx.badRequest('Tipo de documento inválido');
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

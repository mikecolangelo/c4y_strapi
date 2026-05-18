/**
 * fleet-document controller
 */

import { factories } from '@strapi/strapi';

// Default document types - used for validation when DB types are not available
const defaultDocumentTypes = [
  { id: 1, documentId: 'poliza-seguro', name: 'Póliza de Seguro del Vehículo', slug: 'poliza-seguro', description: 'Documento de seguro vigente del vehículo', isActive: true, order: 0 },
  { id: 2, documentId: 'factura-compra', name: 'Factura de Compra del Automóvil', slug: 'factura-compra', description: 'Factura de compra del vehículo', isActive: true, order: 1 },
  { id: 3, documentId: 'contrato-compraventa', name: 'Contrato Compraventa', slug: 'contrato-compraventa', description: 'Contrato de compra-venta del vehículo', isActive: true, order: 2 },
  { id: 4, documentId: 'registro-propiedad', name: 'Registro Único de Propiedad Vehicular', slug: 'registro-propiedad', description: 'Registro único de propiedad del vehículo', isActive: true, order: 3 },
  { id: 5, documentId: 'placa', name: 'Placa', slug: 'placa', description: 'Placa o matrícula del vehículo', isActive: true, order: 4 },
  { id: 6, documentId: 'certificado-revisado', name: 'Certificado de Revisado Vehicular', slug: 'certificado-revisado', description: 'Certificado de revisión técnica vehicular', isActive: true, order: 5 },
  { id: 7, documentId: 'revisado', name: 'Revisado', slug: 'revisado', description: 'Documento de revisado del vehículo', isActive: true, order: 6 },
  { id: 8, documentId: 'otros', name: 'Otros', slug: 'otros', description: 'Otros tipos de documentos no listados', isActive: true, order: 7 },
];

function extractRelationId(value: any): number | string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value.connect) && value.connect.length > 0) return value.connect[0].id;
  if (Array.isArray(value.set) && value.set.length > 0) return value.set[0].id;
  return undefined;
}

// Helper to validate document type
async function validateDocumentType(strapi: any, documentTypeId: number | string): Promise<{ valid: boolean; error?: string }> {
  // First try to find in database
  try {
    const documentType = await strapi.entityService.findOne('api::fleet-document-type.fleet-document-type', documentTypeId);
    if (documentType) {
      if (!documentType.isActive) {
        return { valid: false, error: 'El tipo de documento no está activo' };
      }
      return { valid: true };
    }
  } catch (e) {
    // DB lookup failed, fall back to hardcoded types
  }

  // Fallback to hardcoded types
  const typeId = typeof documentTypeId === 'string' ? parseInt(documentTypeId, 10) : documentTypeId;
  const hardcodedType = defaultDocumentTypes.find(t => t.id === typeId);
  
  if (!hardcodedType) {
    return { valid: false, error: 'El tipo de documento no existe' };
  }
  
  if (!hardcodedType.isActive) {
    return { valid: false, error: 'El tipo de documento no está activo' };
  }
  
  return { valid: true };
}

export default factories.createCoreController('api::fleet-document.fleet-document', ({ strapi }) => ({
  
  /**
   * Get document types - Public endpoint
   */
  async getDocumentTypes(ctx) {
    try {
      // Try to get from database first
      const documentTypes = await strapi.entityService.findMany('api::fleet-document-type.fleet-document-type', {
        filters: { isActive: true },
        sort: { order: 'asc' },
      });

      if (documentTypes && documentTypes.length > 0) {
        return ctx.send({ data: documentTypes });
      }

      // Fallback to default types
      return ctx.send({ data: defaultDocumentTypes });
    } catch (error) {
      console.error('Error fetching document types:', error);
      // Return default types on error
      return ctx.send({ data: defaultDocumentTypes });
    }
  },

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

    // Validar que documentType esté presente (ahora es una relación)
    if (!data?.documentType) {
      return ctx.badRequest('El tipo de documento es requerido');
    }

    // Validar que el tipo de documento exista y esté activo
    const documentTypeId = extractRelationId(data.documentType);
    if (!documentTypeId) {
      return ctx.badRequest('Tipo de documento inválido');
    }

    const validation = await validateDocumentType(strapi, documentTypeId);
    if (!validation.valid) {
      return ctx.badRequest(validation.error);
    }

    const vehicleId = extractRelationId(data.vehicle);

    try {
      const entry = await strapi.db.query('api::fleet-document.fleet-document').create({
        data: {
          files: data.files,
          authorDocumentId: data.authorDocumentId,
          otherDescription: data.otherDescription,
          documentType: documentTypeId,
          vehicle: vehicleId,
        },
        populate: {
          files: true,
          documentType: true,
          vehicle: true,
        },
      });
      return ctx.send({ data: entry });
    } catch (error: any) {
      console.error('Error creating fleet-document via db.query:', error);
      return ctx.badRequest(error.message || 'Error creando el documento');
    }
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

    // Si se está actualizando documentType, validar que exista y esté activo
    if (data?.documentType) {
      const documentTypeId = extractRelationId(data.documentType);
      if (documentTypeId) {
        const validation = await validateDocumentType(strapi, documentTypeId);
        if (!validation.valid) {
          return ctx.badRequest(validation.error);
        }

        // Transformar documentType al formato de relación que espera Strapi v5
        ctx.request.body.data.documentType = {
          connect: [{ id: parseInt(documentTypeId as string, 10) || documentTypeId }]
        };
      }
    }

    const vehicleId = data?.vehicle !== undefined && data?.vehicle !== null ? extractRelationId(data.vehicle) : undefined;

    const updateData: any = {};
    if (data?.files !== undefined) updateData.files = data.files;
    if (data?.authorDocumentId !== undefined) updateData.authorDocumentId = data.authorDocumentId;
    if (data?.otherDescription !== undefined) updateData.otherDescription = data.otherDescription;
    if (documentTypeId !== undefined) updateData.documentType = documentTypeId;
    if (vehicleId !== undefined) updateData.vehicle = vehicleId;

    try {
      const { id } = ctx.params;
      const entry = await strapi.db.query('api::fleet-document.fleet-document').update({
        where: { id },
        data: updateData,
        populate: {
          files: true,
          documentType: true,
          vehicle: true,
        },
      });
      if (!entry) {
        return ctx.notFound('Documento no encontrado');
      }
      return ctx.send({ data: entry });
    } catch (error: any) {
      console.error('Error updating fleet-document via db.query:', error);
      return ctx.badRequest(error.message || 'Error actualizando el documento');
    }
  },
}));

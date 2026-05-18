/**
 * vehicle-document controller
 * ZERO FOOTPRINT: Este controlador NUNCA escribe, borra o modifica el content-type fleet.
 */

import { factories } from '@strapi/strapi';

const ALLOWED_FIELDS = [
  'vehicleDocumentId',
  'category',
  'files',
  'photos',
  'expirationDate',
  'description',
];

const FORBIDDEN_FIELDS = [
  'currentDrivers',
  'assignedDrivers',
  'interestedDrivers',
  'responsables',
  'image',
  'imageAlt',
  'nextMaintenanceDate',
  'lastOilChangeMileage',
  'oilChangeInterval',
  'oilChangeNotificationSent',
  'oilChangeWarningSent',
  'currentMileage',
  'placa',
  'stockQuantity',
  'financing',
  'notes',
  'statuses',
  'documents',
  'reminders',
  'vehicleStates',
  'mileageHistory',
  'driverHistory',
];

function sanitizePayload(raw: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};
  for (const key of Object.keys(raw)) {
    if (ALLOWED_FIELDS.includes(key)) {
      sanitized[key] = raw[key];
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[vehicle-document] Campo rechazado por whitelist: ${key}`);
    }
  }
  return sanitized;
}

async function validateVehicleExists(strapiInstance: any, vehicleDocumentId: string) {
  try {
    const vehicle = await strapiInstance.db.query('api::fleet.fleet').findOne({
      where: { documentId: vehicleDocumentId },
    });
    return !!vehicle;
  } catch (error) {
    strapiInstance.log.error('[vehicle-document] Error validando vehículo:', error);
    return false;
  }
}

export default factories.createCoreController('api::vehicle-document.vehicle-document', ({ strapi }) => ({
  async find(ctx) {
    const { vehicleDocumentId } = ctx.query;
    if (!vehicleDocumentId || typeof vehicleDocumentId !== 'string') {
      return ctx.badRequest('vehicleDocumentId es requerido en query params');
    }

    const documents = await strapi.entityService.findMany('api::vehicle-document.vehicle-document', {
      filters: { vehicleDocumentId },
      sort: { createdAt: 'desc' },
      populate: {
        category: true,
        files: true,
        photos: true,
      },
    });

    return ctx.send({ data: documents });
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const document = await strapi.entityService.findOne('api::vehicle-document.vehicle-document', id, {
      populate: {
        category: true,
        files: true,
        photos: true,
      },
    });
    if (!document) {
      return ctx.notFound('Documento no encontrado');
    }
    return ctx.send({ data: document });
  },

  async create(ctx) {
    const { data } = ctx.request.body || {};
    if (!data) {
      return ctx.badRequest('No se proporcionaron datos');
    }

    // Rechazo defensivo de campos prohibidos
    for (const key of Object.keys(data as Record<string, unknown>)) {
      if (FORBIDDEN_FIELDS.includes(key)) {
        return ctx.badRequest(`Campo prohibido detectado en el payload: ${key}`);
      }
    }

    const payload = sanitizePayload(data as Record<string, unknown>);

    if (!payload.vehicleDocumentId || typeof payload.vehicleDocumentId !== 'string') {
      return ctx.badRequest('vehicleDocumentId es requerido');
    }
    if (!payload.category) {
      return ctx.badRequest('La categoría del documento es requerida');
    }

    const vehicleExists = await validateVehicleExists(strapi, payload.vehicleDocumentId as string);
    if (!vehicleExists) {
      return ctx.badRequest('El vehículo especificado no existe');
    }

    ctx.request.body.data = payload;
    return await super.create(ctx);
  },

  async update(ctx) {
    const { data } = ctx.request.body || {};
    if (!data) {
      return ctx.badRequest('No se proporcionaron datos');
    }

    for (const key of Object.keys(data as Record<string, unknown>)) {
      if (FORBIDDEN_FIELDS.includes(key)) {
        return ctx.badRequest(`Campo prohibido detectado en el payload: ${key}`);
      }
    }

    const payload = sanitizePayload(data as Record<string, unknown>);

    if (payload.vehicleDocumentId && typeof payload.vehicleDocumentId === 'string') {
      const vehicleExists = await validateVehicleExists(strapi, payload.vehicleDocumentId);
      if (!vehicleExists) {
        return ctx.badRequest('El vehículo especificado no existe');
      }
    }

    ctx.request.body.data = payload;
    return await super.update(ctx);
  },

  async delete(ctx) {
    return await super.delete(ctx);
  },
}));

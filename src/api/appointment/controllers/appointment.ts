/**
 * appointment controller
 *
 * Controlador custom con filtrado forzoso por owner y whitelist defensiva.
 * Fase C — Hotfix: uso completo de strapi.documents() para evitar
 * "Invalid key owner" del query validator de Strapi v5.
 */

import { factories } from '@strapi/strapi';

const ALLOWED_FIELDS = [
  'title',
  'type',
  'status',
  'scheduledAt',
  'durationMinutes',
  'description',
  'price',
  'notes',
  'location',
  'contactPhone',
  'contactEmail',
  'isAllDay',
  'frequency',
  'clientName',
  'clientPhone',
  'clientEmail',
  'vehicle',
  'service',
  'assignedTo',
  'parentAppointment',
  'serviceOrder',
];

function sanitizeInput(data: Record<string, any> | undefined): Record<string, any> {
  if (!data || typeof data !== 'object') return {};
  const sanitized: Record<string, any> = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in data) {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

function getUserId(ctx: any): number | undefined {
  return ctx.state?.user?.id;
}

export default factories.createCoreController('api::appointment.appointment', ({ strapi }) => ({
  async find(ctx) {
    const userId = getUserId(ctx);
    if (!userId) {
      return ctx.unauthorized('Authentication required');
    }

    const query = ctx.query || {};
    const entries = await strapi.documents('api::appointment.appointment').findMany({
      ...query,
      filters: {
        ...(query.filters as any || {}),
        owner: { id: { $eq: userId } },
      },
    } as any);

    return { data: entries };
  },

  async findOne(ctx) {
    const userId = getUserId(ctx);
    if (!userId) {
      return ctx.unauthorized('Authentication required');
    }

    const documentId = ctx.params.id;
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    const query = ctx.query || {};
    const entry = await strapi.documents('api::appointment.appointment').findOne({
      documentId,
      filters: {
        ...(query.filters as any || {}),
        owner: { id: { $eq: userId } },
      },
      populate: query.populate as any,
      fields: query.fields as any,
    } as any);

    if (!entry) {
      return ctx.notFound();
    }

    return { data: entry };
  },

  async create(ctx) {
    const userId = getUserId(ctx);
    if (!userId) {
      return ctx.unauthorized('Authentication required');
    }

    const rawData = ctx.request.body?.data;
    const sanitized = sanitizeInput(rawData);
    sanitized.owner = userId;

    const query = ctx.query || {};
    const entry = await strapi.documents('api::appointment.appointment').create({
      data: sanitized,
      populate: query.populate as any,
      fields: query.fields as any,
    } as any);

    return { data: entry };
  },

  async update(ctx) {
    const userId = getUserId(ctx);
    if (!userId) {
      return ctx.unauthorized('Authentication required');
    }

    const documentId = ctx.params.id;
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    const existing = await strapi.documents('api::appointment.appointment').findOne({
      documentId,
      filters: { owner: { id: { $eq: userId } } },
    } as any);

    if (!existing) {
      return ctx.forbidden('You do not have permission to update this appointment');
    }

    const rawData = ctx.request.body?.data;
    const sanitized = sanitizeInput(rawData);

    const query = ctx.query || {};
    const entry = await strapi.documents('api::appointment.appointment').update({
      documentId,
      data: sanitized,
      populate: query.populate as any,
      fields: query.fields as any,
    } as any);

    return { data: entry };
  },

  async delete(ctx) {
    const userId = getUserId(ctx);
    if (!userId) {
      return ctx.unauthorized('Authentication required');
    }

    const documentId = ctx.params.id;
    if (!documentId) {
      return ctx.badRequest('Document ID is required');
    }

    const existing = await strapi.documents('api::appointment.appointment').findOne({
      documentId,
      filters: { owner: { id: { $eq: userId } } },
      populate: ['childAppointments'],
    } as any);

    if (!existing) {
      return ctx.forbidden('You do not have permission to delete this appointment');
    }

    const childIds = (existing as any).childAppointments?.map((c: any) => c.documentId).filter(Boolean);
    if (childIds && childIds.length > 0) {
      for (const childId of childIds) {
        try {
          await strapi.documents('api::appointment.appointment').delete({ documentId: childId } as any);
        } catch (err) {
          strapi.log.warn(`Failed to delete child appointment ${childId}: ${err}`);
        }
      }
    }

    await strapi.documents('api::appointment.appointment').delete({ documentId } as any);
    return { data: null };
  },
}));

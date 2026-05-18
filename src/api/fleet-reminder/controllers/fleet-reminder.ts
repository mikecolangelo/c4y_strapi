/**
 * fleet-reminder controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::fleet-reminder.fleet-reminder', ({ strapi }) => ({
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

    // Validar título
    if (!data?.title || typeof data.title !== 'string' || data.title.trim() === '') {
      return ctx.badRequest('El título es requerido');
    }

    // Validar scheduledDate
    if (!data?.scheduledDate) {
      return ctx.badRequest('La fecha programada es requerida');
    }

    // Validar reminderType
    if (!data?.reminderType || !['unique', 'recurring'].includes(data.reminderType)) {
      return ctx.badRequest('Tipo de recordatorio inválido');
    }

    // Si es recurrente, validar recurrencePattern
    if (data.reminderType === 'recurring') {
      if (!data?.recurrencePattern || !['daily', 'weekly', 'biweekly', 'monthly', 'yearly'].includes(data.recurrencePattern)) {
        return ctx.badRequest('Patrón de recurrencia requerido para recordatorios recurrentes');
      }
    }

    // Calcular nextTrigger (inicialmente es igual a scheduledDate)
    if (!data.nextTrigger) {
      data.nextTrigger = data.scheduledDate;
    }

    // Llamar al método create del controller base
    const result = await super.create(ctx);

    // NOTA: La sincronización de notificaciones se maneja en el lifecycle hook
    // del servicio de notificaciones para evitar duplicados

    return result;
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

    // Si se actualiza el tipo a recurrente, validar recurrencePattern
    if (data?.reminderType === 'recurring' && !data?.recurrencePattern) {
      // Si no se proporciona, mantener el existente o usar el del documento actual
      const existingReminder = await strapi.entityService.findOne('api::fleet-reminder.fleet-reminder', ctx.params.id, {
        fields: ['recurrencePattern'],
      });
      if (!existingReminder?.recurrencePattern) {
        return ctx.badRequest('Patrón de recurrencia requerido para recordatorios recurrentes');
      }
    }

    // Llamar al método update del controller base
    const result = await super.update(ctx);

    // NOTA: La sincronización de notificaciones se maneja en el lifecycle hook
    // del servicio de notificaciones para evitar duplicados

    return result;
  },

  async delete(ctx) {
    // Obtener el recordatorio antes de eliminarlo para poder eliminar sus notificaciones
    const reminderId = ctx.params.id;
    let reminderToDelete = null;

    try {
      reminderToDelete = await strapi.entityService.findOne('api::fleet-reminder.fleet-reminder', reminderId);
    } catch (error) {
      strapi.log.error('Error obteniendo recordatorio antes de eliminar:', error);
    }

    // Llamar al método delete del controller base
    const result = await super.delete(ctx);

    // Eliminar notificaciones relacionadas después de eliminar el recordatorio
    if (reminderToDelete) {
      try {
        const notificationService = strapi.service('api::notification.notification');
        if (notificationService && typeof notificationService.deleteReminderNotifications === 'function') {
          await notificationService.deleteReminderNotifications(reminderToDelete.id);
        }
      } catch (error) {
        // Log del error pero no interrumpir la eliminación
        strapi.log.error('Error eliminando notificaciones después de eliminar recordatorio:', error);
      }
    }

    return result;
  },
}));

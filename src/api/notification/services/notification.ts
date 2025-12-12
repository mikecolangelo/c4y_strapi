/**
 * notification service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::notification.notification', ({ strapi }) => ({
  /**
   * Sincroniza un recordatorio con notificaciones para todos los usuarios asignados
   * Crea, actualiza o elimina notificaciones según el estado del recordatorio
   */
  async syncReminderNotifications(reminder: any) {
    try {
      // Obtener el recordatorio completo con usuarios asignados
      const fullReminder: any = await strapi.entityService.findOne(
        'api::fleet-reminder.fleet-reminder',
        reminder.id || reminder.documentId,
        {
          populate: ['assignedUsers', 'vehicle'],
        }
      );

      if (!fullReminder) {
        console.warn(`Recordatorio no encontrado: ${reminder.id || reminder.documentId}`);
        return;
      }

      const assignedUsers: any[] = fullReminder.assignedUsers || [];
      
      if (assignedUsers.length === 0) {
        // Si no hay usuarios asignados, eliminar todas las notificaciones relacionadas
        const reminderId = typeof fullReminder.id === 'number' ? fullReminder.id : Number(fullReminder.id);
        await this.deleteReminderNotifications(reminderId);
        return;
      }

      // Obtener todas las notificaciones existentes para este recordatorio
      const existingNotifications: any[] = await strapi.entityService.findMany(
        'api::notification.notification',
        {
          filters: {
            fleetReminder: {
              id: { $eq: fullReminder.id },
            },
          },
          populate: ['recipient'],
        }
      );

      const vehicleName = (fullReminder.vehicle as any)?.name || 'Vehículo';
      const description = fullReminder.description
        ? `${fullReminder.description} - ${vehicleName}`
        : vehicleName;

      // Determinar si la notificación debe estar marcada como leída
      // Una notificación está leída si:
      // - El recordatorio está completado O
      // - El recordatorio no está activo O
      // - La fecha nextTrigger ya pasó
      const shouldBeRead = 
        fullReminder.isCompleted ||
        !fullReminder.isActive ||
        new Date(fullReminder.nextTrigger) < new Date();

      // Sincronizar notificaciones para cada usuario asignado
      for (const user of assignedUsers) {
        const existingNotification = existingNotifications.find(
          (n: any) => (n.recipient as any)?.id === user.id
        );

        if (existingNotification) {
          // Si el recordatorio está activo y no completado, y la fecha aún no ha pasado,
          // respetar el estado isRead actual (el usuario puede haberlo marcado manualmente)
          // De lo contrario, usar el estado calculado
          const finalIsRead = 
            (fullReminder.isActive && 
             !fullReminder.isCompleted && 
             new Date(fullReminder.nextTrigger) >= new Date())
              ? existingNotification.isRead  // Mantener el estado actual
              : shouldBeRead;  // Usar el estado calculado

          // Actualizar notificación existente
          await strapi.entityService.update(
            'api::notification.notification',
            existingNotification.id,
            {
              data: {
                title: fullReminder.title,
                description,
                type: 'reminder',
                timestamp: fullReminder.nextTrigger,
                isRead: finalIsRead,
                fleetReminder: fullReminder.id,
                recipient: user.id,
              },
            }
          );
        } else {
          // Crear nueva notificación
          await strapi.entityService.create('api::notification.notification', {
            data: {
              title: fullReminder.title,
              description,
              type: 'reminder',
              timestamp: fullReminder.nextTrigger,
              isRead: shouldBeRead,
              fleetReminder: fullReminder.id,
              recipient: user.id,
            },
          });
        }
      }

      // Eliminar notificaciones para usuarios que ya no están asignados
      for (const existingNotification of existingNotifications) {
        const recipient = (existingNotification as any).recipient;
        const userStillAssigned = assignedUsers.some(
          (u: any) => u.id === recipient?.id
        );
        
        if (!userStillAssigned) {
          await strapi.entityService.delete(
            'api::notification.notification',
            existingNotification.id
          );
        }
      }
    } catch (error) {
      console.error('Error sincronizando notificaciones del recordatorio:', error);
      throw error;
    }
  },

  /**
   * Elimina todas las notificaciones relacionadas con un recordatorio
   */
  async deleteReminderNotifications(reminderId: number | string) {
    try {
      const notifications = await strapi.entityService.findMany(
        'api::notification.notification',
        {
          filters: {
            fleetReminder: {
              id: { $eq: reminderId },
            },
          },
        }
      );

      for (const notification of notifications) {
        await strapi.entityService.delete(
          'api::notification.notification',
          notification.id
        );
      }
    } catch (error) {
      console.error('Error eliminando notificaciones del recordatorio:', error);
      throw error;
    }
  },
}));

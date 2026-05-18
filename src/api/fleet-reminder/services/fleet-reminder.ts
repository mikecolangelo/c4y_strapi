/**
 * fleet-reminder service
 */

import { factories } from '@strapi/strapi';

const MAX_PROCESSING_TIME_MS = 4 * 60 * 1000;
const MAX_VEHICLES_PER_BATCH = 50;

export default factories.createCoreService('api::fleet-reminder.fleet-reminder', ({ strapi }) => ({
  /**
   * Verifica el estado del cambio de aceite para un vehículo y genera notificaciones in-app
   * cuando se cruzan los umbrales amarillo (90%) o rojo (100%) del intervalo configurado.
   */
  async checkMileageReminders(vehicleId: number | string, currentMileage: number) {
    try {
      strapi.log.info(`[checkMileageReminders] Iniciando para vehículo ${vehicleId} con kilometraje ${currentMileage}`);

      const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
        where: { id: vehicleId },
        populate: { responsables: true },
      }) as any;

      if (!vehicle) {
        strapi.log.warn(`[checkMileageReminders] Vehículo ${vehicleId} no encontrado`);
        return { checked: 0, triggered: 0, notifications: [] };
      }

      const interval = parseInt(vehicle.oilChangeInterval || 5000, 10);
      const lastOilChange = parseInt(vehicle.lastOilChangeMileage || 0, 10);
      const distance = currentMileage - lastOilChange;
      const warningThreshold = Math.floor(interval * 0.9);

      const notifications: any[] = [];

      // Estado ROJO: intervalo superado
      if (distance >= interval && !vehicle.oilChangeNotificationSent) {
        const redNotifications = await this.createOilNotification(vehicle, currentMileage, 'danger', interval);
        notifications.push(...redNotifications);

        await strapi.db.query('api::fleet.fleet').update({
          where: { id: vehicleId },
          data: { oilChangeNotificationSent: true },
        });
      }

      // Estado AMARILLO: próximo al intervalo (solo si no ya está en rojo notificado)
      if (distance >= warningThreshold && distance < interval && !vehicle.oilChangeWarningSent) {
        const yellowNotifications = await this.createOilNotification(vehicle, currentMileage, 'warning', interval);
        notifications.push(...yellowNotifications);

        await strapi.db.query('api::fleet.fleet').update({
          where: { id: vehicleId },
          data: { oilChangeWarningSent: true },
        });
      }

      // Resetear flags si el vehículo volvió a verde (ej. tras cambio de aceite manual)
      if (distance < warningThreshold && (vehicle.oilChangeWarningSent || vehicle.oilChangeNotificationSent)) {
        await strapi.db.query('api::fleet.fleet').update({
          where: { id: vehicleId },
          data: {
            oilChangeWarningSent: false,
            oilChangeNotificationSent: false,
          },
        });
      }

      return {
        checked: 1,
        triggered: notifications.length,
        notifications,
      };
    } catch (error) {
      strapi.log.error('Error verificando recordatorios por kilometraje:', error);
      throw error;
    }
  },

  /**
   * Crea notificaciones in-app de cambio de aceite para los responsables del vehículo.
   */
  async createOilNotification(vehicle: any, currentMileage: number, level: 'warning' | 'danger', interval: number) {
    try {
      const responsables = vehicle.responsables || [];
      if (responsables.length === 0) {
        strapi.log.info(`[createOilNotification] Vehículo ${vehicle.id} no tiene responsables para notificar`);
        return [];
      }

      const title = level === 'danger'
        ? 'Cambio de aceite urgente'
        : 'Cambio de aceite próximo';

      const message = level === 'danger'
        ? `El vehículo ${vehicle.name} ha superado el intervalo de cambio de aceite (${interval} km). Ya debe realizar el cambio, ¡Consultar Cita Ya!`
        : `El vehículo ${vehicle.name} está próximo a alcanzar el intervalo de cambio de aceite (${interval} km). Debería realizarse pronto un cambio de aceite.`;

      const createdNotifications = [];
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      for (const user of responsables) {
        try {
          // Evitar duplicados en los últimos 5 minutos
          const existing = await strapi.entityService.findMany('api::notification.notification', {
            filters: {
              type: { $eq: 'oil_change_reminder' },
              recipient: { id: { $eq: user.id } },
              fleetVehicle: { id: { $eq: vehicle.id } },
              title: { $eq: title },
              createdAt: { $gte: fiveMinutesAgo.toISOString() },
            },
            limit: 1,
          }) as any[];

          if (existing && existing.length > 0) {
            strapi.log.info(`[createOilNotification] Duplicado evitado para usuario ${user.id}`);
            continue;
          }

          const notification = await strapi.entityService.create('api::notification.notification', {
            data: {
              title,
              description: message,
              type: 'oil_change_reminder',
              module: 'fleet',
              recipient: user.id,
              fleetVehicle: vehicle.id,
              isRead: false,
              timestamp: new Date(),
              publishedAt: new Date(),
            },
          });
          createdNotifications.push(notification);
        } catch (error) {
          strapi.log.error(`[createOilNotification] Error creando notificación para usuario ${user.id}:`, error);
        }
      }

      return createdNotifications;
    } catch (error) {
      strapi.log.error('Error creando notificación de aceite:', error);
      return [];
    }
  },

  /**
   * Verifica todos los vehículos (para cron jobs) con timeout de 4 minutos.
   */
  async checkAllMileageReminders() {
    const startTime = Date.now();
    let totalTriggered = 0;
    let processedVehicles = 0;
    let skippedDueToTimeout = false;

    const isTimeExceeded = () => Date.now() - startTime >= MAX_PROCESSING_TIME_MS;

    try {
      strapi.log.info('[Mileage Reminder] Iniciando verificación masiva de recordatorios...');

      if (isTimeExceeded()) {
        return { vehiclesChecked: 0, triggered: 0, skippedDueToTimeout: true, elapsedTimeMs: 0 };
      }

      const vehicles = await strapi.db.query('api::fleet.fleet').findMany({
        select: ['id', 'currentMileage'],
        limit: MAX_VEHICLES_PER_BATCH,
      }) as any[];

      for (const vehicle of vehicles) {
        if (isTimeExceeded()) {
          skippedDueToTimeout = true;
          break;
        }

        try {
          const currentMileage = parseInt(vehicle.currentMileage || 0, 10);
          const result = await this.checkMileageReminders(vehicle.id, currentMileage);
          if (result.triggered > 0) totalTriggered += result.triggered;
          processedVehicles++;
        } catch (error) {
          strapi.log.error(`[Mileage Reminder] Error procesando vehículo ${vehicle.id}:`, error);
          processedVehicles++;
        }
      }

      const elapsedTime = Date.now() - startTime;
      strapi.log.info(`[Mileage Reminder] Completado. Vehículos: ${processedVehicles}, Notificaciones: ${totalTriggered}, Tiempo: ${elapsedTime}ms`);

      return {
        vehiclesChecked: processedVehicles,
        triggered: totalTriggered,
        skippedDueToTimeout,
        elapsedTimeMs: elapsedTime,
      };
    } catch (error) {
      const elapsedTime = Date.now() - startTime;
      strapi.log.error(`[Mileage Reminder] Error general después de ${elapsedTime}ms:`, error);
      return { vehiclesChecked: processedVehicles, triggered: totalTriggered, skippedDueToTimeout: false, elapsedTimeMs: elapsedTime, error: (error as Error).message };
    }
  },

  async checkMileageRemindersWithTimeout(vehicleId: number | string, currentMileage: number, timeoutMs: number = 30000) {
    const timeoutPromise = new Promise<{ checked: number; triggered: number; notifications: any[]; timeout: boolean }>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout exceeded')), timeoutMs);
    });

    try {
      const result = await Promise.race([
        this.checkMileageReminders(vehicleId, currentMileage),
        timeoutPromise,
      ]);
      return result;
    } catch (error) {
      if ((error as Error).message === 'Timeout exceeded') {
        strapi.log.warn(`[Mileage Reminder] Timeout al verificar recordatorios del vehículo ${vehicleId}`);
        return { checked: 0, triggered: 0, notifications: [], timeout: true };
      }
      throw error;
    }
  },
}));

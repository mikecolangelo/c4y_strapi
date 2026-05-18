"use strict";
/**
 * fleet controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::fleet.fleet', ({ strapi }) => ({
    /**
     * Incrementa el kilometraje de un vehículo y verifica si se debe enviar notificación de cambio de aceite
     * También verifica recordatorios personalizados por kilometraje
     */
    async incrementMileage(ctx) {
        const { documentId } = ctx.params;
        const { increment = 0.5 } = ctx.request.body || {}; // Default 500 metros = 0.5 km
        if (!documentId) {
            return ctx.badRequest('Se requiere el documentId del vehículo');
        }
        try {
            // Buscar el vehículo
            const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
                where: { documentId },
                populate: ['responsables', 'assignedDrivers'],
            });
            if (!vehicle) {
                return ctx.notFound('Vehículo no encontrado');
            }
            // Calcular nuevo kilometraje
            const currentMileage = parseFloat(vehicle.currentMileage || 0);
            const lastOilChangeMileage = parseFloat(vehicle.lastOilChangeMileage || 0);
            const newMileage = currentMileage + parseFloat(increment);
            // Calcular distancia desde el último cambio de aceite
            const distanceSinceLastOilChange = newMileage - lastOilChangeMileage;
            const OIL_CHANGE_THRESHOLD = 5000; // 5,000 Km
            const NOTIFICATION_THRESHOLD = 4500; // Notificar al acercarse a 4,500 Km
            // Verificar si se debe enviar notificación de cambio de aceite
            let oilNotificationSent = false;
            let oilNotificationMessage = null;
            if (distanceSinceLastOilChange >= OIL_CHANGE_THRESHOLD) {
                // Ya se pasó el límite, enviar notificación urgente
                oilNotificationMessage = `⚠️ El vehículo ${vehicle.name} ha superado los 5,000 Km desde el último cambio de aceite. Distancia actual: ${distanceSinceLastOilChange.toFixed(1)} Km. Por favor programe el mantenimiento lo antes posible.`;
                oilNotificationSent = true;
            }
            else if (distanceSinceLastOilChange >= NOTIFICATION_THRESHOLD && !vehicle.oilChangeNotificationSent) {
                // Se acerca al límite, enviar notificación preventiva
                const remaining = OIL_CHANGE_THRESHOLD - distanceSinceLastOilChange;
                oilNotificationMessage = `🔔 El vehículo ${vehicle.name} está próximo a necesitar un cambio de aceite. Restan aproximadamente ${remaining.toFixed(1)} Km. Kilometraje actual desde último cambio: ${distanceSinceLastOilChange.toFixed(1)} Km.`;
                oilNotificationSent = true;
            }
            // Enviar notificaciones de cambio de aceite si es necesario
            if (oilNotificationMessage) {
                const usersToNotify = [];
                // Agregar responsables
                if (vehicle.responsables && vehicle.responsables.length > 0) {
                    usersToNotify.push(...vehicle.responsables.map(r => r.id));
                }
                // Agregar conductores asignados
                if (vehicle.assignedDrivers && vehicle.assignedDrivers.length > 0) {
                    usersToNotify.push(...vehicle.assignedDrivers.map(d => d.id));
                }
                // Eliminar duplicados
                const uniqueUsers = [...new Set(usersToNotify)];
                // Crear notificaciones para cada usuario
                for (const userId of uniqueUsers) {
                    try {
                        await strapi.service('api::notification.notification').create({
                            data: {
                                title: 'Recordatorio de Cambio de Aceite',
                                description: oilNotificationMessage,
                                type: 'oil_change_reminder',
                                module: 'fleet',
                                recipient: userId,
                                fleetVehicle: vehicle.id,
                                isRead: false,
                                timestamp: new Date(),
                                publishedAt: new Date(),
                            },
                        });
                    }
                    catch (error) {
                        console.error('Error creando notificación:', error);
                    }
                }
                // También crear notificación general del vehículo
                try {
                    await strapi.service('api::notification.notification').create({
                        data: {
                            title: 'Recordatorio de Cambio de Aceite',
                            description: oilNotificationMessage,
                            type: 'oil_change_reminder',
                            module: 'fleet',
                            fleetVehicle: vehicle.id,
                            isRead: false,
                            timestamp: new Date(),
                            publishedAt: new Date(),
                        },
                    });
                }
                catch (error) {
                    console.error('Error creando notificación general:', error);
                }
            }
            // Actualizar el vehículo
            const updatedVehicle = await strapi.db.query('api::fleet.fleet').update({
                where: { documentId },
                data: {
                    currentMileage: newMileage,
                    oilChangeNotificationSent: oilNotificationSent || vehicle.oilChangeNotificationSent,
                },
            });
            // VERIFICAR RECORDATORIOS PERSONALIZADOS POR KILOMETRAJE (con timeout de 30 segundos)
            let mileageRemindersResult = null;
            try {
                const fleetReminderService = strapi.service('api::fleet-reminder.fleet-reminder');
                if (fleetReminderService && typeof fleetReminderService.checkMileageRemindersWithTimeout === 'function') {
                    mileageRemindersResult = await fleetReminderService.checkMileageRemindersWithTimeout(vehicle.id, newMileage, 30000 // 30 segundos de timeout
                    );
                }
                else if (fleetReminderService && typeof fleetReminderService.checkMileageReminders === 'function') {
                    // Fallback a método sin timeout si no existe el nuevo método
                    mileageRemindersResult = await fleetReminderService.checkMileageReminders(vehicle.id, newMileage);
                }
            }
            catch (error) {
                console.error('Error verificando recordatorios por kilometraje:', error);
                // No interrumpir la operación principal
                mileageRemindersResult = { checked: 0, triggered: 0, error: true };
            }
            return ctx.send({
                data: {
                    documentId: updatedVehicle.documentId,
                    currentMileage: newMileage,
                    lastOilChangeMileage: lastOilChangeMileage,
                    distanceSinceLastOilChange: newMileage - lastOilChangeMileage,
                    notificationSent: oilNotificationSent,
                    notificationMessage: oilNotificationMessage,
                    mileageReminders: mileageRemindersResult,
                },
            });
        }
        catch (error) {
            console.error('Error incrementando kilometraje:', error);
            return ctx.internalServerError('Error al actualizar el kilometraje');
        }
    },
    /**
     * Resetea el contador de cambio de aceite después de realizar el mantenimiento
     */
    async resetOilChangeCounter(ctx) {
        const { documentId } = ctx.params;
        if (!documentId) {
            return ctx.badRequest('Se requiere el documentId del vehículo');
        }
        try {
            const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
                where: { documentId },
            });
            if (!vehicle) {
                return ctx.notFound('Vehículo no encontrado');
            }
            const currentMileage = parseFloat(vehicle.currentMileage || 0);
            const updatedVehicle = await strapi.db.query('api::fleet.fleet').update({
                where: { documentId },
                data: {
                    lastOilChangeMileage: currentMileage,
                    oilChangeNotificationSent: false,
                },
            });
            return ctx.send({
                data: {
                    documentId: updatedVehicle.documentId,
                    currentMileage: updatedVehicle.currentMileage,
                    lastOilChangeMileage: currentMileage,
                    message: 'Contador de cambio de aceite reiniciado correctamente',
                },
            });
        }
        catch (error) {
            console.error('Error reiniciando contador:', error);
            return ctx.internalServerError('Error al reiniciar el contador');
        }
    },
    /**
     * Endpoint para verificar manualmente los recordatorios de kilometraje de un vehículo
     */
    async checkMileageReminders(ctx) {
        const { documentId } = ctx.params;
        if (!documentId) {
            return ctx.badRequest('Se requiere el documentId del vehículo');
        }
        try {
            // Buscar el vehículo
            const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
                where: { documentId },
            });
            if (!vehicle) {
                return ctx.notFound('Vehículo no encontrado');
            }
            const fleetReminderService = strapi.service('api::fleet-reminder.fleet-reminder');
            if (!fleetReminderService || typeof fleetReminderService.checkMileageReminders !== 'function') {
                return ctx.internalServerError('Servicio de recordatorios no disponible');
            }
            const currentMileage = parseFloat(vehicle.currentMileage || 0);
            const result = await fleetReminderService.checkMileageReminders(vehicle.id, currentMileage);
            return ctx.send({
                data: {
                    documentId,
                    currentMileage,
                    ...result,
                },
            });
        }
        catch (error) {
            console.error('Error verificando recordatorios:', error);
            return ctx.internalServerError('Error al verificar recordatorios');
        }
    },
}));

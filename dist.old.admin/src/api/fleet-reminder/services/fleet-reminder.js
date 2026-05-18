"use strict";
/**
 * fleet-reminder service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
// Constantes de configuración
const MAX_PROCESSING_TIME_MS = 4 * 60 * 1000; // 4 minutos en milisegundos
const MAX_VEHICLES_PER_BATCH = 50; // Límite de vehículos por ejecución
exports.default = strapi_1.factories.createCoreService('api::fleet-reminder.fleet-reminder', ({ strapi }) => ({
    /**
     * Verifica los recordatorios de un vehículo basados en su kilometraje actual
     * y crea notificaciones si se han alcanzado los umbrales
     */
    async checkMileageReminders(vehicleId, currentMileage) {
        try {
            // Obtener los recordatorios del vehículo directamente
            const reminders = await strapi.entityService.findMany('api::fleet-reminder.fleet-reminder', {
                filters: {
                    vehicle: {
                        id: {
                            $eq: vehicleId,
                        },
                    },
                    isActive: true,
                    isCompleted: false,
                    mileageThreshold: {
                        $notNull: true,
                    },
                    mileageNotificationSent: false,
                },
                populate: ['assignedUsers', 'vehicle'],
            });
            if (!reminders || reminders.length === 0) {
                return { checked: 0, notifications: [] };
            }
            // Obtener el vehículo para datos adicionales
            const vehicle = await strapi.entityService.findOne('api::fleet.fleet', vehicleId, {
                populate: ['responsables', 'assignedDrivers'],
            });
            if (!vehicle) {
                return { checked: 0, notifications: [] };
            }
            const notifications = [];
            for (const reminder of reminders) {
                // Verificar si se alcanzó el umbral
                if (currentMileage >= reminder.mileageThreshold) {
                    // Crear notificación
                    const notification = await this.createMileageNotification(reminder, vehicle, currentMileage);
                    if (notification) {
                        notifications.push(notification);
                        // Marcar el recordatorio como notificado
                        await strapi.entityService.update('api::fleet-reminder.fleet-reminder', reminder.id, {
                            data: {
                                mileageNotificationSent: true,
                            },
                        });
                    }
                }
            }
            return {
                checked: reminders.length,
                triggered: notifications.length,
                notifications,
            };
        }
        catch (error) {
            strapi.log.error('Error verificando recordatorios por kilometraje:', error);
            throw error;
        }
    },
    /**
     * Crea una notificación de kilometraje para los usuarios asignados
     */
    async createMileageNotification(reminder, vehicle, currentMileage) {
        try {
            const usersToNotify = [];
            // Agregar usuarios asignados al recordatorio
            if (reminder.assignedUsers && reminder.assignedUsers.length > 0) {
                usersToNotify.push(...reminder.assignedUsers.map((u) => u.id));
            }
            // Agregar responsables del vehículo
            if (vehicle.responsables && vehicle.responsables.length > 0) {
                usersToNotify.push(...vehicle.responsables.map((r) => r.id));
            }
            // Agregar conductores asignados
            if (vehicle.assignedDrivers && vehicle.assignedDrivers.length > 0) {
                usersToNotify.push(...vehicle.assignedDrivers.map((d) => d.id));
            }
            // Eliminar duplicados
            const uniqueUsers = [...new Set(usersToNotify)];
            // Determinar el tipo de notificación y mensaje
            const notificationType = reminder.notificationType || 'other';
            const typeLabels = {
                oil_change: 'Cambio de Aceite',
                maintenance: 'Mantenimiento',
                inspection: 'Inspección',
                tire_rotation: 'Rotación de Neumáticos',
                other: 'Recordatorio',
            };
            const typeLabel = typeLabels[notificationType] || 'Recordatorio';
            const exceededKm = currentMileage - reminder.mileageThreshold;
            const title = `${typeLabel} - Kilometraje Alcanzado`;
            const message = `El vehículo ${vehicle.name} ha alcanzado el kilometraje programado para "${reminder.title}". ` +
                `Kilometraje actual: ${currentMileage.toFixed(1)} Km. ` +
                `Umbral programado: ${reminder.mileageThreshold} Km. ` +
                `${exceededKm > 0 ? `(Superado por ${exceededKm.toFixed(1)} Km)` : ''}`;
            const createdNotifications = [];
            // Crear notificación para cada usuario
            for (const userId of uniqueUsers) {
                try {
                    const notification = await strapi.entityService.create('api::notification.notification', {
                        data: {
                            title,
                            description: message,
                            type: 'oil_change_reminder',
                            module: 'fleet',
                            recipient: userId,
                            fleetVehicle: vehicle.id,
                            fleetReminder: reminder.id,
                            isRead: false,
                            timestamp: new Date(),
                            publishedAt: new Date(),
                        },
                    });
                    createdNotifications.push(notification);
                }
                catch (error) {
                    strapi.log.error(`Error creando notificación para usuario ${userId}:`, error);
                }
            }
            // También crear notificación general del vehículo
            try {
                const generalNotification = await strapi.entityService.create('api::notification.notification', {
                    data: {
                        title,
                        description: message,
                        type: 'oil_change_reminder',
                        module: 'fleet',
                        fleetVehicle: vehicle.id,
                        fleetReminder: reminder.id,
                        isRead: false,
                        timestamp: new Date(),
                        publishedAt: new Date(),
                    },
                });
                createdNotifications.push(generalNotification);
            }
            catch (error) {
                strapi.log.error('Error creando notificación general:', error);
            }
            return createdNotifications;
        }
        catch (error) {
            strapi.log.error('Error creando notificación de kilometraje:', error);
            return null;
        }
    },
    /**
     * Verifica todos los recordatorios de todos los vehículos (para uso en cron jobs)
     * Con protección de timeout: si tarda más de 4 minutos, se interrumpe el proceso
     */
    async checkAllMileageReminders() {
        const startTime = Date.now();
        let totalChecked = 0;
        let totalTriggered = 0;
        let processedVehicles = 0;
        let skippedDueToTimeout = false;
        // Función auxiliar para verificar si se excedió el tiempo
        const isTimeExceeded = () => {
            const elapsed = Date.now() - startTime;
            return elapsed >= MAX_PROCESSING_TIME_MS;
        };
        try {
            strapi.log.info('[Mileage Reminder] Iniciando verificación de recordatorios por kilometraje...');
            strapi.log.info(`[Mileage Reminder] Tiempo máximo permitido: ${MAX_PROCESSING_TIME_MS / 1000} segundos`);
            // Verificar tiempo antes de comenzar
            if (isTimeExceeded()) {
                strapi.log.warn('[Mileage Reminder] Tiempo excedido antes de iniciar. Saltando proceso.');
                return {
                    vehiclesChecked: 0,
                    remindersChecked: 0,
                    notificationsCreated: 0,
                    skippedDueToTimeout: true,
                    elapsedTimeMs: 0,
                };
            }
            // Obtener recordatorios activos con umbral de kilometraje
            const reminders = await strapi.entityService.findMany('api::fleet-reminder.fleet-reminder', {
                filters: {
                    mileageThreshold: {
                        $notNull: true,
                    },
                    isActive: true,
                    isCompleted: false,
                    mileageNotificationSent: false,
                },
                populate: ['vehicle'],
                limit: MAX_VEHICLES_PER_BATCH,
            });
            // Agrupar recordatorios por vehículo
            const vehicleReminders = new Map();
            for (const reminder of reminders) {
                if (reminder.vehicle && reminder.vehicle.id) {
                    const vehicleId = reminder.vehicle.id;
                    if (!vehicleReminders.has(vehicleId)) {
                        vehicleReminders.set(vehicleId, []);
                    }
                    vehicleReminders.get(vehicleId).push(reminder);
                }
            }
            const uniqueVehicleIds = Array.from(vehicleReminders.keys());
            strapi.log.info(`[Mileage Reminder] Se encontraron ${uniqueVehicleIds.length} vehículos con recordatorios (límite: ${MAX_VEHICLES_PER_BATCH})`);
            // Verificar tiempo después de obtener recordatorios
            if (isTimeExceeded()) {
                strapi.log.warn('[Mileage Reminder] Tiempo excedido después de obtener recordatorios. Saltando proceso.');
                return {
                    vehiclesChecked: 0,
                    remindersChecked: 0,
                    notificationsCreated: 0,
                    skippedDueToTimeout: true,
                    elapsedTimeMs: Date.now() - startTime,
                };
            }
            for (const vehicleId of uniqueVehicleIds) {
                // Verificar tiempo antes de procesar cada vehículo
                if (isTimeExceeded()) {
                    strapi.log.warn(`[Mileage Reminder] Tiempo excedido después de procesar ${processedVehicles} vehículos. Deteniendo proceso.`);
                    skippedDueToTimeout = true;
                    break;
                }
                try {
                    // Obtener el vehículo con su kilometraje actual
                    const vehicle = await strapi.entityService.findOne('api::fleet.fleet', vehicleId, {
                        fields: ['currentMileage'],
                    });
                    if (!vehicle) {
                        continue;
                    }
                    const currentMileage = parseFloat(vehicle.currentMileage || 0);
                    const vehicleReminderList = vehicleReminders.get(vehicleId) || [];
                    for (const reminder of vehicleReminderList) {
                        // Verificar tiempo antes de cada recordatorio
                        if (isTimeExceeded()) {
                            strapi.log.warn(`[Mileage Reminder] Tiempo excedido procesando recordatorios. Deteniendo.`);
                            skippedDueToTimeout = true;
                            break;
                        }
                        if (currentMileage >= reminder.mileageThreshold) {
                            // Obtener el vehículo completo para notificaciones
                            const fullVehicle = await strapi.entityService.findOne('api::fleet.fleet', vehicleId, {
                                populate: ['responsables', 'assignedDrivers'],
                            });
                            const notification = await this.createMileageNotification(reminder, fullVehicle, currentMileage);
                            if (notification) {
                                totalTriggered++;
                                // Marcar el recordatorio como notificado
                                await strapi.entityService.update('api::fleet-reminder.fleet-reminder', reminder.id, {
                                    data: {
                                        mileageNotificationSent: true,
                                    },
                                });
                            }
                        }
                        totalChecked++;
                    }
                    processedVehicles++;
                }
                catch (error) {
                    strapi.log.error(`[Mileage Reminder] Error procesando vehículo ${vehicleId}:`, error);
                    processedVehicles++;
                }
            }
            const elapsedTime = Date.now() - startTime;
            if (skippedDueToTimeout) {
                strapi.log.warn(`[Mileage Reminder] Proceso interrumpido por timeout. Procesados: ${processedVehicles}/${uniqueVehicleIds.length} vehículos, Tiempo: ${elapsedTime}ms`);
            }
            else {
                strapi.log.info(`[Mileage Reminder] Verificación completada. Vehículos: ${processedVehicles}, Recordatorios: ${totalChecked}, Notificaciones: ${totalTriggered}, Tiempo: ${elapsedTime}ms`);
            }
            return {
                vehiclesChecked: processedVehicles,
                totalVehiclesAvailable: uniqueVehicleIds.length,
                remindersChecked: totalChecked,
                notificationsCreated: totalTriggered,
                skippedDueToTimeout,
                elapsedTimeMs: elapsedTime,
            };
        }
        catch (error) {
            const elapsedTime = Date.now() - startTime;
            strapi.log.error(`[Mileage Reminder] Error en verificación general después de ${elapsedTime}ms:`, error);
            return {
                vehiclesChecked: processedVehicles,
                remindersChecked: totalChecked,
                notificationsCreated: totalTriggered,
                skippedDueToTimeout: false,
                elapsedTimeMs: elapsedTime,
                error: error.message,
            };
        }
    },
    /**
     * Verifica recordatorios de kilometraje con timeout estricto usando Promise.race
     * Útil para llamadas desde el controlador donde se necesita respuesta rápida
     */
    async checkMileageRemindersWithTimeout(vehicleId, currentMileage, timeoutMs = 30000) {
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout exceeded')), timeoutMs);
        });
        try {
            const result = await Promise.race([
                this.checkMileageReminders(vehicleId, currentMileage),
                timeoutPromise,
            ]);
            return result;
        }
        catch (error) {
            if (error.message === 'Timeout exceeded') {
                strapi.log.warn(`[Mileage Reminder] Timeout al verificar recordatorios del vehículo ${vehicleId}`);
                return {
                    checked: 0,
                    triggered: 0,
                    notifications: [],
                    timeout: true
                };
            }
            throw error;
        }
    },
}));

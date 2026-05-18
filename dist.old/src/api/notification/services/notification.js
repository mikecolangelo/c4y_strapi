"use strict";
/**
 * notification service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreService('api::notification.notification', ({ strapi }) => ({
    /**
     * Sincroniza un recordatorio (notification) con notificaciones individuales para todos los usuarios asignados
     * Crea, actualiza o elimina notificaciones según el estado del recordatorio
     * Ahora trabaja directamente con notifications como fuente principal
     */
    async syncReminderNotifications(reminder) {
        var _a;
        try {
            // Obtener el recordatorio completo con usuarios asignados y relaciones
            // IMPORTANTE: Usar el ID numérico del recordatorio, no el documentId
            // Primero intentar obtener por ID numérico, luego por documentId si es necesario
            let fullReminder = null;
            let reminderId = null;
            if (reminder.id && typeof reminder.id === 'number') {
                // Si ya tenemos el ID numérico, usarlo directamente
                reminderId = reminder.id;
                fullReminder = await strapi.entityService.findOne('api::notification.notification', reminderId, {
                    populate: ['assignedUsers', 'fleetVehicle', 'author'],
                });
            }
            else if (reminder.documentId) {
                // Si solo tenemos documentId, buscar por documentId primero
                // Buscar todas las notificaciones y filtrar por documentId manualmente
                // ya que Strapi puede no soportar filtros directos por documentId en algunos casos
                const allNotifications = await strapi.entityService.findMany('api::notification.notification', {
                    fields: ['id', 'documentId'],
                });
                const foundNotification = allNotifications.find((n) => n.documentId === reminder.documentId);
                if (foundNotification && foundNotification.id) {
                    // Convertir ID a número si es necesario
                    const idValue = typeof foundNotification.id === 'number'
                        ? foundNotification.id
                        : parseInt(String(foundNotification.id), 10);
                    if (!isNaN(idValue)) {
                        reminderId = idValue;
                        fullReminder = await strapi.entityService.findOne('api::notification.notification', reminderId, {
                            populate: ['assignedUsers', 'fleetVehicle', 'author'],
                        });
                    }
                }
            }
            if (!fullReminder || !reminderId) {
                console.warn(`Recordatorio no encontrado:`, { id: reminder.id, documentId: reminder.documentId });
                return;
            }
            // IMPORTANTE: Verificar que este NO sea una notificación individual
            // Si tiene parentReminderId en tags, es una notificación individual y no debe procesarse
            try {
                const reminderTags = typeof fullReminder.tags === 'string'
                    ? JSON.parse(fullReminder.tags)
                    : fullReminder.tags;
                if (reminderTags && reminderTags.parentReminderId) {
                    console.warn(`Intento de sincronizar notificaciones para una notificación individual (tiene parentReminderId). Ignorando.`);
                    return;
                }
            }
            catch {
                // Si hay error parseando tags, continuar (puede ser un recordatorio principal sin tags)
            }
            const assignedUsers = fullReminder.assignedUsers || [];
            if (assignedUsers.length === 0) {
                // Si no hay usuarios asignados, no crear notificaciones individuales
                // El recordatorio principal ya existe
                return;
            }
            // Obtener todas las notificaciones individuales existentes para este recordatorio
            // Buscar por el ID numérico del recordatorio principal usando tags
            // Nota: Strapi almacena JSON como string, necesitamos buscar de manera diferente
            const existingNotifications = await strapi.entityService.findMany('api::notification.notification', {
                filters: {
                    type: { $eq: 'reminder' },
                    module: fullReminder.module ? { $eq: fullReminder.module } : undefined,
                    // Buscar notificaciones que tengan el reminderId en tags
                    // Usamos una búsqueda más flexible ya que tags es JSON
                },
                populate: ['recipient'],
            });
            // Filtrar las notificaciones que realmente pertenecen a este recordatorio
            // IMPORTANTE: Comparar tanto con ID numérico como con documentId para compatibilidad
            // Pero siempre guardar el ID numérico en parentReminderId
            const filteredNotifications = existingNotifications.filter((n) => {
                try {
                    const tags = typeof n.tags === 'string' ? JSON.parse(n.tags) : n.tags;
                    if (!tags || !tags.parentReminderId) {
                        return false;
                    }
                    // Comparar con ID numérico (preferido) o documentId (fallback)
                    return tags.parentReminderId === reminderId ||
                        tags.parentReminderId === fullReminder.documentId ||
                        tags.parentReminderId === reminder.documentId;
                }
                catch {
                    return false;
                }
            });
            // Construir descripción con información del módulo
            let description = fullReminder.description || '';
            if (fullReminder.module === 'fleet' && fullReminder.fleetVehicle) {
                const vehicleName = ((_a = fullReminder.fleetVehicle) === null || _a === void 0 ? void 0 : _a.name) || 'Vehículo';
                description = description ? `${description} - ${vehicleName}` : vehicleName;
            }
            // Determinar si la notificación debe estar marcada como leída
            const shouldBeRead = fullReminder.isCompleted ||
                !fullReminder.isActive ||
                (fullReminder.nextTrigger && new Date(fullReminder.nextTrigger) < new Date());
            // Sincronizar notificaciones individuales para cada usuario asignado
            for (const user of assignedUsers) {
                // Validar que el usuario tenga un ID válido
                if (!user || !user.id) {
                    console.warn('Usuario asignado sin ID válido, saltando:', user);
                    continue;
                }
                const existingNotification = filteredNotifications.find((n) => { var _a; return ((_a = n.recipient) === null || _a === void 0 ? void 0 : _a.id) === user.id; });
                // IMPORTANTE: Siempre usar el ID numérico del recordatorio principal en parentReminderId
                // Esto asegura consistencia en las búsquedas y evita duplicados
                const notificationData = {
                    title: fullReminder.title,
                    description,
                    type: 'reminder',
                    module: fullReminder.module,
                    timestamp: fullReminder.nextTrigger || fullReminder.scheduledDate,
                    tags: {
                        parentReminderId: reminderId, // SIEMPRE usar ID numérico
                        module: fullReminder.module,
                    },
                    reminderType: fullReminder.reminderType,
                    scheduledDate: fullReminder.scheduledDate,
                    recurrencePattern: fullReminder.recurrencePattern,
                    recurrenceEndDate: fullReminder.recurrenceEndDate,
                    nextTrigger: fullReminder.nextTrigger,
                    isActive: fullReminder.isActive,
                    isCompleted: fullReminder.isCompleted,
                    recipient: user.id, // SIEMPRE requerido para notificaciones individuales
                };
                // Agregar relación con el vehículo si es módulo fleet
                if (fullReminder.module === 'fleet' && fullReminder.fleetVehicle) {
                    notificationData.fleetVehicle = fullReminder.fleetVehicle.id;
                }
                // Agregar authorDocumentId y author si existen en el recordatorio principal
                if (fullReminder.authorDocumentId) {
                    notificationData.authorDocumentId = fullReminder.authorDocumentId;
                }
                if (fullReminder.author && fullReminder.author.id) {
                    notificationData.author = fullReminder.author.id;
                }
                if (existingNotification) {
                    // Si el recordatorio está activo y no completado, y la fecha aún no ha pasado,
                    // respetar el estado isRead actual
                    const finalIsRead = (fullReminder.isActive &&
                        !fullReminder.isCompleted &&
                        fullReminder.nextTrigger &&
                        new Date(fullReminder.nextTrigger) >= new Date())
                        ? existingNotification.isRead
                        : shouldBeRead;
                    notificationData.isRead = finalIsRead;
                    // Actualizar notificación existente
                    await strapi.entityService.update('api::notification.notification', existingNotification.id, {
                        data: notificationData,
                    });
                }
                else {
                    // Crear nueva notificación individual
                    // VALIDACIÓN CRÍTICA: Asegurar que siempre tenga recipient y parentReminderId
                    if (!notificationData.recipient) {
                        console.error('ERROR: Intento de crear notificación individual sin recipient. Saltando usuario:', user);
                        continue;
                    }
                    if (!notificationData.tags || !notificationData.tags.parentReminderId) {
                        console.error('ERROR: Intento de crear notificación individual sin parentReminderId. Saltando usuario:', user);
                        continue;
                    }
                    notificationData.isRead = shouldBeRead;
                    await strapi.entityService.create('api::notification.notification', {
                        data: notificationData,
                    });
                }
            }
            // Eliminar notificaciones para usuarios que ya no están asignados
            for (const existingNotification of filteredNotifications) {
                const recipient = existingNotification.recipient;
                const userStillAssigned = assignedUsers.some((u) => u.id === (recipient === null || recipient === void 0 ? void 0 : recipient.id));
                if (!userStillAssigned) {
                    await strapi.entityService.delete('api::notification.notification', existingNotification.id);
                }
            }
        }
        catch (error) {
            console.error('Error sincronizando notificaciones del recordatorio:', error);
            throw error;
        }
    },
    /**
     * Elimina todas las notificaciones relacionadas con un recordatorio
     */
    async deleteReminderNotifications(reminderId) {
        try {
            // Obtener el recordatorio para asegurar que tenemos el ID numérico
            let numericId = null;
            if (typeof reminderId === 'number') {
                numericId = reminderId;
            }
            else {
                // Si es documentId, buscar el ID numérico
                // Buscar todas las notificaciones y filtrar por documentId manualmente
                const allNotifications = await strapi.entityService.findMany('api::notification.notification', {
                    fields: ['id', 'documentId'],
                });
                const foundNotification = allNotifications.find((n) => n.documentId === reminderId);
                if (foundNotification && foundNotification.id) {
                    // Convertir ID a número si es necesario
                    const idValue = typeof foundNotification.id === 'number'
                        ? foundNotification.id
                        : parseInt(String(foundNotification.id), 10);
                    if (!isNaN(idValue)) {
                        numericId = idValue;
                    }
                }
            }
            if (!numericId) {
                console.warn(`No se pudo encontrar el ID numérico para: ${reminderId}`);
                return;
            }
            // Obtener todas las notificaciones de tipo reminder y filtrar por tags
            const allNotifications = await strapi.entityService.findMany('api::notification.notification', {
                filters: {
                    type: { $eq: 'reminder' },
                },
            });
            // Filtrar las que pertenecen a este recordatorio
            // Comparar tanto con ID numérico como con documentId para compatibilidad
            const notifications = allNotifications.filter((n) => {
                try {
                    const tags = typeof n.tags === 'string' ? JSON.parse(n.tags) : n.tags;
                    if (!tags || !tags.parentReminderId) {
                        return false;
                    }
                    // Comparar con ID numérico (preferido) o documentId (fallback)
                    return tags.parentReminderId === numericId ||
                        tags.parentReminderId === reminderId;
                }
                catch {
                    return false;
                }
            });
            for (const notification of notifications) {
                await strapi.entityService.delete('api::notification.notification', notification.id);
            }
        }
        catch (error) {
            console.error('Error eliminando notificaciones del recordatorio:', error);
            throw error;
        }
    },
}));

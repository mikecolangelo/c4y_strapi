/**
 * notification controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::notification.notification', ({ strapi }) => ({
  /**
   * Override del método create para manejar recordatorios automáticamente
   */
  async create(ctx) {
    const { data } = ctx.request.body;

    // Log inicial para verificar que el método se ejecuta
    strapi.log.info('🚀 [notification.create] Método create ejecutado');
    
    // Log para depuración
    strapi.log.info('🔍 [notification.create] Datos recibidos:', {
      type: data?.type,
      hasReminderType: !!data?.reminderType,
      hasModule: !!data?.module,
      reminderType: data?.reminderType,
      module: data?.module,
      title: data?.title,
      hasRecipient: !!data?.recipient,
      hasScheduledDate: !!data?.scheduledDate,
    });

    // Si es un recordatorio completo (type='reminder' Y tiene reminderType o module),
    // aplicar validaciones y lógica especial
    // Si solo tiene type='reminder' sin estos campos, tratarlo como notificación manual
    // Verificar explícitamente que los campos no sean undefined, null o string vacío
    const reminderTypeValue = data?.reminderType;
    const moduleValue = data?.module;
    const hasReminderType = reminderTypeValue !== undefined && 
                            reminderTypeValue !== null && 
                            typeof reminderTypeValue === 'string' && 
                            reminderTypeValue.trim() !== '';
    const hasModule = moduleValue !== undefined && 
                      moduleValue !== null && 
                      typeof moduleValue === 'string' && 
                      moduleValue.trim() !== '';
    const isCompleteReminder = data?.type === 'reminder' && (hasReminderType || hasModule);
    
    strapi.log.info('🔍 [notification.create] Evaluación de recordatorio completo:', {
      isCompleteReminder,
      type: data?.type,
      typeIsReminder: data?.type === 'reminder',
      hasReminderType,
      hasModule,
      reminderTypeValue: reminderTypeValue,
      reminderTypeType: typeof reminderTypeValue,
      moduleValue: moduleValue,
      moduleType: typeof moduleValue,
      rawData: JSON.stringify(data),
    });
    
    if (isCompleteReminder) {
      strapi.log.info('⚠️ [notification.create] Entrando en validación de recordatorio completo');
      // Validaciones básicas
      if (!data?.title || typeof data.title !== 'string' || data.title.trim() === '') {
        return ctx.badRequest('El título es requerido');
      }

      if (!data?.scheduledDate) {
        strapi.log.error('❌ [notification.create] Error: scheduledDate requerido pero no presente', {
          type: data?.type,
          reminderType: data?.reminderType,
          module: data?.module,
          hasScheduledDate: !!data?.scheduledDate,
        });
        return ctx.badRequest('La fecha programada es requerida');
      }

      if (!data?.module || !['fleet', 'inventory', 'billing', 'deal', 'client', 'service'].includes(data.module)) {
        return ctx.badRequest('El módulo es requerido y debe ser uno de: fleet, inventory, billing, deal, client, service');
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

      // VALIDACIÓN CRÍTICA: Verificar que no sea una notificación individual
      // Las notificaciones individuales tienen parentReminderId en tags y recipient
      // Los recordatorios principales NO deben tener estos campos
      const hasParentReminderId = data.tags && typeof data.tags === 'object' && data.tags.parentReminderId;
      const hasRecipient = data.recipient !== undefined && data.recipient !== null;
      
      if (hasParentReminderId || hasRecipient) {
        // Si tiene parentReminderId o recipient, es una notificación individual
        // Las notificaciones individuales solo deben crearse a través de syncReminderNotifications
        strapi.log.warn('Intento de crear notificación individual directamente. Esto no está permitido. Campos detectados:', {
          hasParentReminderId,
          hasRecipient,
          tags: data.tags
        });
        
        // Eliminar estos campos para evitar crear notificaciones individuales incorrectamente
        if (data.tags && typeof data.tags === 'object' && data.tags.parentReminderId) {
          delete data.tags.parentReminderId;
        }
        if (data.recipient !== undefined) {
          delete data.recipient;
        }
      }

      // IMPORTANTE: Asegurar que el recordatorio principal NO tenga parentReminderId en tags
      // Solo las notificaciones individuales creadas por syncReminderNotifications deben tenerlo
      if (data.tags && typeof data.tags === 'object' && data.tags.parentReminderId) {
        // Si aún tiene parentReminderId después de la validación anterior, eliminarlo
        delete data.tags.parentReminderId;
      }

      // Establecer valores por defecto
      data.timestamp = data.nextTrigger || data.scheduledDate;
      data.isActive = data.isActive !== undefined ? data.isActive : true;
      data.isCompleted = data.isCompleted !== undefined ? data.isCompleted : false;
      data.isRead = false;
    }

    // VERIFICACIÓN FINAL: Antes de crear, verificar una última vez que no existe un duplicado
    // Esto previene condiciones de carrera donde dos peticiones pasan las validaciones anteriores
    // IMPORTANTE: También verificar por vehículo si es módulo fleet
    // Solo verificar duplicados para recordatorios completos
    if (isCompleteReminder && data?.title && data?.module) {
      try {
        const filters: any = {
          type: { $eq: 'reminder' },
          title: { $eq: data.title },
          module: { $eq: data.module },
        };
        
        // Si es módulo fleet y tiene fleetVehicle, agregar filtro por vehículo
        if (data.module === 'fleet' && data.fleetVehicle) {
          const vehicleId = typeof data.fleetVehicle === 'object' 
            ? data.fleetVehicle.id || data.fleetVehicle 
            : data.fleetVehicle;
          if (vehicleId) {
            filters.fleetVehicle = { id: { $eq: vehicleId } };
          }
        }
        
        const existingReminders = await strapi.entityService.findMany(
          'api::notification.notification',
          {
            filters,
            fields: ['id', 'title', 'tags'],
            sort: { createdAt: 'desc' },
            limit: 5,
          }
        );

        // Filtrar solo recordatorios principales (sin parentReminderId)
        const mainReminders = existingReminders.filter((reminder: any) => {
          try {
            const tags = typeof reminder.tags === 'string' 
              ? JSON.parse(reminder.tags) 
              : reminder.tags;
            return !tags || !tags.parentReminderId;
          } catch {
            return true;
          }
        });

        // Si hay un recordatorio principal con el mismo título y módulo creado en los últimos 5 segundos,
        // probablemente es un duplicado de una petición simultánea
        const recentDuplicates = mainReminders.filter((reminder: any) => {
          if (!reminder.createdAt) return false;
          const createdAt = new Date(reminder.createdAt);
          const now = new Date();
          const diffSeconds = (now.getTime() - createdAt.getTime()) / 1000;
          return diffSeconds < 5; // Creado en los últimos 5 segundos
        });

        if (recentDuplicates.length > 0) {
          const duplicate = recentDuplicates[0];
          strapi.log.warn('⚠️ Duplicado detectado antes de crear, retornando el existente:', {
            existingId: duplicate.id,
            title: duplicate.title,
            module: data.module,
            createdAt: duplicate.createdAt,
          });
          
          // Retornar el recordatorio existente en lugar de crear uno nuevo
          const existingReminder = await strapi.entityService.findOne(
            'api::notification.notification',
            duplicate.id,
            {
              populate: ['assignedUsers', 'fleetVehicle', 'author'],
            }
          );
          
          if (existingReminder) {
            return { data: existingReminder };
          }
        }
      } catch (error) {
        // Si hay error en la verificación, continuar con la creación
        strapi.log.warn('Error verificando duplicados antes de crear, continuando con creación:', error);
      }
    }

    // Crear la notificación/recordatorio usando el método base
    const result = await super.create(ctx);

    // NOTA: La sincronización de notificaciones individuales se maneja en el 
    // lifecycle hook del servicio de notificaciones para evitar duplicados

    return result;
  },

  /**
   * Override del método update para manejar actualizaciones de recordatorios
   */
  async update(ctx) {
    const { data } = ctx.request.body;

    // Si es un recordatorio (type='reminder'), aplicar validaciones y lógica especial
    if (data?.type === 'reminder') {
      // Si se actualiza isCompleted o isActive, sincronizar notificaciones individuales después
      const shouldSync = data.isCompleted !== undefined || data.isActive !== undefined;
      
      // Actualizar usando el método base
      const result = await super.update(ctx);

      // Si se actualizó isCompleted o isActive, sincronizar notificaciones individuales
      if (shouldSync && result?.data) {
        try {
          const notificationService = strapi.service('api::notification.notification');
          if (notificationService && typeof notificationService.syncReminderNotifications === 'function') {
            await notificationService.syncReminderNotifications(result.data);
          }
        } catch (error) {
          strapi.log.error('Error sincronizando notificaciones después de actualizar recordatorio:', error);
        }
      }

      return result;
    }

    // Para otros tipos de notificaciones, usar el método base sin cambios
    return await super.update(ctx);
  },

  /**
   * Override del método delete para eliminar notificaciones individuales relacionadas
   * y también eliminar recordatorios duplicados (mismo título y vehículo)
   */
  async delete(ctx) {
    // Obtener la notificación antes de eliminarla para verificar si es un recordatorio principal
    const notificationId = ctx.params.id;
    let notificationToDelete = null;

    strapi.log.info(`🗑️ DELETE: Iniciando eliminación de notificación ID: ${notificationId}`);

    try {
      // Intentar encontrar por ID numérico primero
      const numericId = /^\d+$/.test(String(notificationId)) ? parseInt(String(notificationId), 10) : null;
      
      if (numericId) {
        notificationToDelete = await strapi.entityService.findOne(
          'api::notification.notification',
          numericId,
          {
            fields: ['id', 'type', 'tags', 'title', 'module'],
            populate: ['fleetVehicle'],
          }
        );
      } else {
        // Si no es numérico, buscar por documentId manualmente
        // documentId no se puede usar directamente en filtros ni en fields de Strapi v5
        // Necesitamos obtener todas las notificaciones y filtrar manualmente
        const allNotifications = await strapi.entityService.findMany(
          'api::notification.notification',
          {
            fields: ['id', 'type', 'tags', 'title', 'module'],
            populate: ['fleetVehicle'],
            pagination: {
              page: 1,
              pageSize: 1000, // Buscar en las primeras 1000 notificaciones
            },
          }
        ) as any[];
        
        // Filtrar manualmente por documentId (documentId está disponible en el objeto aunque no esté en fields)
        notificationToDelete = allNotifications.find(
          (n: any) => n.documentId === notificationId
        ) || null;
        
        // Si no se encontró en las primeras 1000, buscar en más páginas
        if (!notificationToDelete && allNotifications.length === 1000) {
          let page = 2;
          let hasMore = true;
          
          while (hasMore && page <= 10) { // Buscar en máximo 10 páginas (10,000 notificaciones)
            const pageNotifications = await strapi.entityService.findMany(
              'api::notification.notification',
              {
                fields: ['id', 'type', 'tags', 'title', 'module'],
                populate: ['fleetVehicle'],
                pagination: {
                  page,
                  pageSize: 1000,
                },
              }
            ) as any[];
            
            notificationToDelete = pageNotifications.find(
              (n: any) => n.documentId === notificationId
            ) || null;
            
            if (notificationToDelete || pageNotifications.length < 1000) {
              hasMore = false;
            } else {
              page++;
            }
          }
        }
        
        // Si encontramos la notificación por documentId, obtenerla completa con populate
        if (notificationToDelete && notificationToDelete.id) {
          notificationToDelete = await strapi.entityService.findOne(
            'api::notification.notification',
            notificationToDelete.id,
            {
              fields: ['id', 'type', 'tags', 'title', 'module'],
              populate: ['fleetVehicle'],
            }
          );
        }
      }

      if (notificationToDelete) {
        strapi.log.info(`✅ DELETE: Notificación encontrada:`, {
          id: notificationToDelete.id,
          type: notificationToDelete.type,
          title: notificationToDelete.title,
        });
      } else {
        strapi.log.warn(`⚠️ DELETE: Notificación no encontrada con ID: ${notificationId}`);
      }
    } catch (error) {
      strapi.log.error('❌ DELETE: Error obteniendo notificación antes de eliminar:', error);
    }

    // Si es un recordatorio principal (type='reminder' y no tiene parentReminderId en tags),
    // eliminar también las notificaciones individuales relacionadas Y los duplicados
    if (notificationToDelete && notificationToDelete.type === 'reminder') {
      try {
        const tags = typeof notificationToDelete.tags === 'string' 
          ? JSON.parse(notificationToDelete.tags) 
          : notificationToDelete.tags;
        
        // Si NO tiene parentReminderId, es un recordatorio principal
        if (!tags || !tags.parentReminderId) {
          const notificationService = strapi.service('api::notification.notification');
          
          // 1. Eliminar notificaciones individuales relacionadas
          if (notificationService && typeof notificationService.deleteReminderNotifications === 'function') {
            const reminderId = notificationToDelete.id;
            await notificationService.deleteReminderNotifications(reminderId);
            strapi.log.info(`Notificaciones individuales eliminadas para el recordatorio principal ID: ${reminderId}`);
          }
          
          // 2. Buscar y eliminar TODOS los recordatorios duplicados (mismo título y vehículo)
          if (notificationToDelete.title && notificationToDelete.module === 'fleet' && notificationToDelete.fleetVehicle) {
            const vehicleId = typeof notificationToDelete.fleetVehicle === 'object' 
              ? notificationToDelete.fleetVehicle.id 
              : notificationToDelete.fleetVehicle;
            
            if (vehicleId) {
              // Buscar todos los recordatorios con el mismo título y vehículo
              const allReminders = await strapi.entityService.findMany(
                'api::notification.notification',
                {
                  filters: {
                    type: { $eq: 'reminder' },
                    title: { $eq: notificationToDelete.title },
                    module: { $eq: 'fleet' },
                    fleetVehicle: { id: { $eq: vehicleId } },
                  },
                  fields: ['id', 'title', 'tags'],
                }
              );
              
              // Filtrar solo recordatorios principales (sin parentReminderId)
              const duplicateMainReminders = allReminders.filter((reminder: any) => {
                try {
                  const reminderTags = typeof reminder.tags === 'string' 
                    ? JSON.parse(reminder.tags) 
                    : reminder.tags;
                  return !reminderTags || !reminderTags.parentReminderId;
                } catch {
                  return true;
                }
              });
              
              strapi.log.info(`🗑️ Encontrados ${duplicateMainReminders.length} recordatorio(s) duplicado(s) con título "${notificationToDelete.title}" y vehículo ID: ${vehicleId}`);
              
              // Verificar si el recordatorio que se está eliminando está en la lista
              const currentReminderInList = duplicateMainReminders.find((r: any) => r.id === notificationToDelete.id);
              
              // Eliminar todos los duplicados (incluyendo el que se está eliminando)
              for (const duplicate of duplicateMainReminders) {
                try {
                  strapi.log.info(`🔄 DELETE: Eliminando recordatorio duplicado ID: ${duplicate.id}`);
                  
                  // Eliminar notificaciones individuales de cada duplicado
                  if (notificationService && typeof notificationService.deleteReminderNotifications === 'function') {
                    await notificationService.deleteReminderNotifications(duplicate.id);
                    strapi.log.info(`✅ DELETE: Notificaciones individuales eliminadas para ID: ${duplicate.id}`);
                  }
                  
                  // Eliminar el recordatorio principal duplicado
                  const deleteResult = await strapi.entityService.delete(
                    'api::notification.notification',
                    duplicate.id
                  );
                  
                  strapi.log.info(`✅ DELETE: Recordatorio duplicado eliminado: ID ${duplicate.id}`, {
                    deleteResult,
                  });
                  
                  // Verificar que realmente se eliminó
                  try {
                    const verifyDeleted = await strapi.entityService.findOne(
                      'api::notification.notification',
                      duplicate.id,
                      { fields: ['id'] }
                    );
                    if (verifyDeleted) {
                      strapi.log.error(`❌ DELETE: El recordatorio ID ${duplicate.id} aún existe después de eliminarlo`);
                    } else {
                      strapi.log.info(`✅ DELETE: Verificación confirmada - recordatorio ID ${duplicate.id} eliminado`);
                    }
                  } catch (verifyError: any) {
                    // Si findOne lanza error, probablemente significa que fue eliminado
                    if (verifyError?.status === 404 || verifyError?.message?.includes('not found')) {
                      strapi.log.info(`✅ DELETE: Verificación confirmada - recordatorio ID ${duplicate.id} eliminado (404 en verificación)`);
                    } else {
                      strapi.log.warn(`⚠️ DELETE: Error verificando eliminación de ID ${duplicate.id}:`, verifyError);
                    }
                  }
                } catch (error) {
                  strapi.log.error(`❌ DELETE: Error eliminando recordatorio duplicado ID ${duplicate.id}:`, error);
                }
              }
              
              // Si ya eliminamos todos los duplicados (incluyendo el actual), retornar éxito
              // sin llamar a super.delete porque ya se eliminaron todos
              if (currentReminderInList) {
                strapi.log.info(`✅ DELETE: Todos los recordatorios duplicados eliminados (incluyendo el solicitado ID: ${notificationToDelete.id})`);
                return { data: null };
              }
            }
          }
        }
      } catch (error) {
        // Log del error pero no interrumpir la eliminación
        strapi.log.error('Error eliminando notificaciones individuales y duplicados después de eliminar recordatorio principal:', error);
      }
    }

    // Eliminar directamente usando entityService en lugar de super.delete
    // super.delete puede no funcionar correctamente con el token de API
    if (notificationToDelete && notificationToDelete.id) {
      try {
        strapi.log.info(`🔄 DELETE: Eliminando notificación directamente con entityService para ID: ${notificationToDelete.id}`);
        
        // Eliminar notificaciones individuales relacionadas si es un recordatorio principal
        if (notificationToDelete.type === 'reminder') {
          try {
            const tags = typeof notificationToDelete.tags === 'string' 
              ? JSON.parse(notificationToDelete.tags) 
              : notificationToDelete.tags;
            
            // Si NO tiene parentReminderId, es un recordatorio principal
            if (!tags || !tags.parentReminderId) {
              const notificationService = strapi.service('api::notification.notification');
              if (notificationService && typeof notificationService.deleteReminderNotifications === 'function') {
                await notificationService.deleteReminderNotifications(notificationToDelete.id);
                strapi.log.info(`✅ DELETE: Notificaciones individuales eliminadas para ID: ${notificationToDelete.id}`);
              }
            }
          } catch (error) {
            strapi.log.error('Error eliminando notificaciones individuales:', error);
          }
        }
        
        // Eliminar el recordatorio principal
        const deleteResult = await strapi.entityService.delete(
          'api::notification.notification',
          notificationToDelete.id
        );
        
        strapi.log.info(`✅ DELETE: Notificación eliminada con entityService para ID: ${notificationToDelete.id}`, {
          deleteResult,
        });
        
        // Verificar que realmente se eliminó
        try {
          await new Promise(resolve => setTimeout(resolve, 100)); // Pequeño delay para que Strapi procese
          const verifyDeleted = await strapi.entityService.findOne(
            'api::notification.notification',
            notificationToDelete.id,
            { fields: ['id'] }
          );
          if (verifyDeleted) {
            strapi.log.error(`❌ DELETE: El recordatorio ID ${notificationToDelete.id} aún existe después de entityService.delete`);
          } else {
            strapi.log.info(`✅ DELETE: Verificación confirmada - recordatorio ID ${notificationToDelete.id} eliminado`);
          }
        } catch (verifyError: any) {
          // Si findOne lanza error, probablemente significa que fue eliminado
          if (verifyError?.status === 404 || verifyError?.message?.includes('not found')) {
            strapi.log.info(`✅ DELETE: Verificación confirmada - recordatorio ID ${notificationToDelete.id} eliminado (404 en verificación)`);
          } else {
            strapi.log.warn(`⚠️ DELETE: Error verificando eliminación de ID ${notificationToDelete.id}:`, verifyError);
          }
        }
        
        return { data: null };
      } catch (error) {
        strapi.log.error(`❌ DELETE: Error eliminando notificación con entityService para ID ${notificationToDelete.id}:`, error);
        throw error;
      }
    } else {
      // Si no encontramos la notificación, intentar con super.delete como fallback
      strapi.log.warn(`⚠️ DELETE: Notificación no encontrada, usando super.delete como fallback para ID: ${notificationId}`);
      return await super.delete(ctx);
    }
  },

  /**
   * Cleanup duplicates endpoint
   * Solución 1: Elimina notificaciones duplicadas sin usar sudo
   * Timeout: 4 minutos
   */
  async cleanupDuplicates(ctx) {
    const startTime = Date.now();
    const TIMEOUT_MS = 240000; // 4 minutos
    const BATCH_SIZE = 100;

    try {
      // Verificar timeout
      const checkTimeout = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed > TIMEOUT_MS - 10000) {
          throw new Error(`Timeout: Proceso excede los 4 minutos (${elapsed}ms)`);
        }
      };

      strapi.log.info('🧹 [cleanupDuplicates] Iniciando limpieza de notificaciones duplicadas...');

      // Paso 1: Obtener todas las notificaciones manuales (no recordatorios)
      checkTimeout();
      const allNotifications: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        checkTimeout();

        const notifications = await strapi.entityService.findMany(
          'api::notification.notification',
          {
            filters: {
              type: { $ne: 'reminder' },
            },
            fields: ['id', 'title', 'description', 'type', 'createdAt'],
            populate: { recipient: true },
            sort: { createdAt: 'desc' },
            start: (page - 1) * BATCH_SIZE,
            limit: BATCH_SIZE,
          }
        );

        if (!notifications || notifications.length === 0) {
          hasMore = false;
        } else {
          allNotifications.push(...notifications);
          strapi.log.info(`  📄 [cleanupDuplicates] Página ${page}: ${notifications.length} notificaciones`);
          page++;
        }

        // Safety check: máximo 50 páginas
        if (page > 50) {
          strapi.log.warn('⚠️ [cleanupDuplicates] Límite de páginas alcanzado');
          hasMore = false;
        }
      }

      strapi.log.info(`📊 [cleanupDuplicates] Total notificaciones: ${allNotifications.length}`);
      checkTimeout();

      // Paso 2: Identificar duplicados
      const duplicatesMap = new Map();
      
      for (const notification of allNotifications) {
        checkTimeout();
        const recipientId = notification.recipient?.documentId || notification.recipient?.id || 'no-recipient';
        const key = `${notification.title}|${notification.description || ''}|${notification.type}|${recipientId}`;
        
        if (!duplicatesMap.has(key)) {
          duplicatesMap.set(key, []);
        }
        duplicatesMap.get(key).push(notification);
      }

      // Filtrar grupos con duplicados
      const duplicateGroups: any[] = [];
      for (const [key, notifications] of duplicatesMap.entries()) {
        if (notifications.length > 1) {
          duplicateGroups.push({
            key: key.substring(0, 100),
            count: notifications.length,
            notifications: notifications.sort((a: any, b: any) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ),
          });
        }
      }

      strapi.log.info(`🔴 [cleanupDuplicates] Grupos duplicados: ${duplicateGroups.length}`);

      if (duplicateGroups.length === 0) {
        return ctx.send({
          success: true,
          message: '✅ No se encontraron duplicados',
          cleaned: 0,
          duration: Date.now() - startTime,
        });
      }

      // Mostrar resumen
      let totalToDelete = 0;
      for (const group of duplicateGroups.slice(0, 10)) {
        strapi.log.info(`  📌 "${group.key}..." - ${group.count} copias`);
        totalToDelete += group.count - 1;
      }
      strapi.log.info(`🗑️ [cleanupDuplicates] Total a eliminar: ${totalToDelete}`);
      checkTimeout();

      // Paso 3: Eliminar duplicados
      let deletedCount = 0;
      let errorCount = 0;

      for (const group of duplicateGroups) {
        checkTimeout();
        const toDelete = group.notifications.slice(1); // Mantener el primero

        for (const notification of toDelete) {
          try {
            await strapi.entityService.delete(
              'api::notification.notification',
              notification.id
            );
            deletedCount++;
            
            if (deletedCount % 10 === 0) {
              strapi.log.info(`  ✅ [cleanupDuplicates] Eliminadas ${deletedCount}/${totalToDelete}...`);
            }
          } catch (error) {
            errorCount++;
            if (errorCount <= 5) {
              strapi.log.warn(`  ⚠️ [cleanupDuplicates] Error eliminando ${notification.id}:`, error);
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      strapi.log.info('📈 [cleanupDuplicates] RESUMEN:');
      strapi.log.info(`  ✅ Eliminadas: ${deletedCount}`);
      strapi.log.info(`  ❌ Errores: ${errorCount}`);
      strapi.log.info(`  ⏱️ Duración: ${duration}ms`);

      return ctx.send({
        success: true,
        message: '🏁 Limpieza completada',
        summary: {
          totalScanned: allNotifications.length,
          duplicateGroups: duplicateGroups.length,
          deleted: deletedCount,
          errors: errorCount,
          duration: `${duration}ms`,
        },
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      if (error.message?.includes('Timeout')) {
        strapi.log.error(`⏱️ [cleanupDuplicates] ${error.message}`);
        return ctx.send({
          success: false,
          message: '⏱️ Proceso interrumpido por timeout (4 minutos)',
          error: error.message,
          duration: `${duration}ms`,
        });
      }
      
      strapi.log.error('❌ [cleanupDuplicates] Error:', error);
      return ctx.internalServerError('Error en limpieza', {
        error: error.message,
        duration: `${duration}ms`,
      });
    }
  },
}));

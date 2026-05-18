/**
 * Script de limpieza de notificaciones duplicadas
 * Elimina notificaciones duplicadas manteniendo solo la más reciente por destinatario
 * Timeout: 4 minutos (240000 ms)
 */

const axios = require('axios');
const qs = require('qs');

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const API_TOKEN = process.env.API_TOKEN; // Opcional, si el endpoint es público

const TIMEOUT_MS = 240000; // 4 minutos
const BATCH_SIZE = 100; // Procesar en lotes para no sobrecargar

// Función para ejecutar con timeout
async function withTimeout(promise, timeoutMs, errorMessage) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage || 'Timeout')), timeoutMs)
    )
  ]);
}

async function cleanupDuplicates() {
  console.log('🧹 Iniciando limpieza de notificaciones duplicadas...');
  const startTime = Date.now();
  
  try {
    // Verificar tiempo transcurrido
    const checkTimeout = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed > TIMEOUT_MS - 10000) { // 10 segundos de margen
        throw new Error(`⏱️ Timeout: Proceso excede los 4 minutos (${elapsed}ms transcurridos)`);
      }
    };

    // Paso 1: Obtener TODAS las notificaciones manuales (no recordatorios)
    console.log('📥 Obteniendo notificaciones...');
    checkTimeout();

    const allNotifications = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      checkTimeout();
      
      const query = qs.stringify({
        filters: {
          type: {
            $ne: 'reminder' // Solo notificaciones manuales
          }
        },
        fields: ['id', 'documentId', 'title', 'description', 'type', 'createdAt', 'recipient'],
        populate: {
          recipient: {
            fields: ['id', 'documentId']
          }
        },
        pagination: {
          page: page,
          pageSize: BATCH_SIZE
        },
        sort: ['createdAt:desc']
      });

      try {
        const response = await withTimeout(
          axios.get(`${STRAPI_URL}/api/notifications?${query}`),
          30000, // 30 segundos por petición
          'Timeout obteniendo notificaciones'
        );

        const notifications = response.data?.data || [];
        
        if (notifications.length === 0) {
          hasMore = false;
        } else {
          allNotifications.push(...notifications);
          console.log(`  📄 Página ${page}: ${notifications.length} notificaciones`);
          page++;
        }
      } catch (error) {
        console.error(`❌ Error en página ${page}:`, error.message);
        hasMore = false;
      }
    }

    console.log(`📊 Total notificaciones obtenidas: ${allNotifications.length}`);
    checkTimeout();

    // Paso 2: Identificar duplicados
    console.log('🔍 Identificando duplicados...');
    
    const duplicatesMap = new Map(); // Key: "title|description|type|recipientId" -> notifications[]
    
    for (const notification of allNotifications) {
      checkTimeout();
      
      const recipientId = notification.recipient?.documentId || notification.recipient?.id || 'no-recipient';
      const key = `${notification.title}|${notification.description}|${notification.type}|${recipientId}`;
      
      if (!duplicatesMap.has(key)) {
        duplicatesMap.set(key, []);
      }
      duplicatesMap.get(key).push(notification);
    }

    // Filtrar solo los que tienen duplicados (más de 1)
    const duplicateGroups = [];
    for (const [key, notifications] of duplicatesMap.entries()) {
      if (notifications.length > 1) {
        duplicateGroups.push({
          key,
          count: notifications.length,
          notifications: notifications.sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
          ) // Ordenar por fecha, más reciente primero
        });
      }
    }

    console.log(`🔴 Grupos duplicados encontrados: ${duplicateGroups.length}`);
    
    if (duplicateGroups.length === 0) {
      console.log('✅ No hay duplicados para limpiar');
      return {
        success: true,
        message: 'No se encontraron duplicados',
        cleaned: 0,
        duration: Date.now() - startTime
      };
    }

    // Mostrar resumen de duplicados
    let totalToDelete = 0;
    for (const group of duplicateGroups) {
      console.log(`  📌 "${group.key.substring(0, 50)}..." - ${group.count} copias`);
      totalToDelete += group.count - 1; // Mantener 1, eliminar el resto
    }
    console.log(`🗑️ Total a eliminar: ${totalToDelete} notificaciones`);

    checkTimeout();

    // Paso 3: Eliminar duplicados (mantener el más reciente de cada grupo)
    console.log('🗑️ Eliminando duplicados...');
    
    let deletedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const group of duplicateGroups) {
      checkTimeout();
      
      // Mantener el primero (más reciente), eliminar el resto
      const toDelete = group.notifications.slice(1);
      
      for (const notification of toDelete) {
        try {
          await withTimeout(
            axios.delete(`${STRAPI_URL}/api/notifications/${notification.documentId || notification.id}`),
            10000, // 10 segundos por eliminación
            `Timeout eliminando notificación ${notification.id}`
          );
          
          deletedCount++;
          
          // Log progreso cada 10 eliminaciones
          if (deletedCount % 10 === 0) {
            console.log(`  ✅ Eliminadas ${deletedCount}/${totalToDelete}...`);
          }
          
        } catch (error) {
          errorCount++;
          errors.push({
            id: notification.id,
            error: error.message
          });
          
          if (errorCount <= 5) {
            console.warn(`  ⚠️ Error eliminando ${notification.id}:`, error.message);
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    
    console.log('\n📈 RESUMEN:');
    console.log(`  ✅ Eliminadas: ${deletedCount}`);
    console.log(`  ❌ Errores: ${errorCount}`);
    console.log(`  ⏱️ Duración: ${duration}ms`);

    return {
      success: true,
      message: 'Limpieza completada',
      cleaned: deletedCount,
      errors: errorCount,
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error.message.includes('Timeout')) {
      console.error(`⏱️ ${error.message}`);
      return {
        success: false,
        message: 'Proceso interrumpido por timeout (4 minutos)',
        error: error.message,
        duration
      };
    }
    
    console.error('❌ Error en limpieza:', error);
    return {
      success: false,
      message: 'Error en limpieza',
      error: error.message,
      duration
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupDuplicates()
    .then(result => {
      console.log('\n🏁 Resultado:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { cleanupDuplicates };

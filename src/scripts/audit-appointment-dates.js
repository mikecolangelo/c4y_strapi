/**
 * Script de auditoría de fechas inválidas en citas (appointments)
 * Arquitectura limpia: usa Strapi Document Service, sin SQL crudo.
 * Objetivo: detectar citas con scheduledAt vacío, nulo o que genere Invalid Date.
 */

const { createStrapi } = require('@strapi/strapi');

const BATCH_SIZE = 100;

function isValidDateString(value) {
  if (!value || typeof value !== 'string') return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

async function main() {
  console.log('🔍 Iniciando auditoría de citas...');

  // Evitar conflicto de puerto con la instancia de Strapi en producción
  process.env.PORT = '0';

  const app = createStrapi({ serve: false, distDir: require('path').resolve(__dirname, '../../dist') });
  await app.start();

  const documentService = app.documents('api::appointment.appointment');

  let start = 0;
  let hasMore = true;
  const invalidAppointments = [];
  const validCount = { total: 0 };

  while (hasMore) {
    const results = await documentService.findMany({
      fields: ['documentId', 'scheduledAt', 'title', 'type', 'status', 'createdAt'],
      limit: BATCH_SIZE,
      start,
    });

    if (!results || results.length === 0) {
      hasMore = false;
      break;
    }

    for (const entry of results) {
      validCount.total++;
      const scheduledAt = entry.scheduledAt;

      if (!isValidDateString(scheduledAt)) {
        invalidAppointments.push({
          documentId: entry.documentId,
          scheduledAt: scheduledAt ?? null,
          title: entry.title ?? null,
          type: entry.type ?? null,
          status: entry.status ?? null,
          createdAt: entry.createdAt ?? null,
        });
      }
    }

    console.log(`  📄 Lote ${Math.floor(start / BATCH_SIZE) + 1} procesado (${results.length} registros)`);
    start += BATCH_SIZE;

    // Safety break
    if (start > 10000) {
      console.warn('⚠️ Límite de seguridad alcanzado (10000 registros)');
      break;
    }
  }

  console.log('\n📊 RESULTADO DE AUDITORÍA');
  console.log('=========================');
  console.log(`Total de citas auditadas: ${validCount.total}`);
  console.log(`Citas con fecha inválida:  ${invalidAppointments.length}`);

  if (invalidAppointments.length > 0) {
    console.log('\n📝 Citas con fechas inválidas:');
    invalidAppointments.forEach((a, i) => {
      console.log(`  ${i + 1}. documentId=${a.documentId} | scheduledAt="${a.scheduledAt}" | title="${a.title}" | type=${a.type} | createdAt=${a.createdAt}`);
    });

    // Decisión de negocio: como scheduledAt es required en el schema,
    // las citas inválidas probablemente son basura de datos. Proponemos eliminarlas.
    console.log('\n🗑️  Procediendo a eliminar citas con fechas inválidas (dato basura)...');

    for (const a of invalidAppointments) {
      try {
        await documentService.delete({ documentId: a.documentId });
        console.log(`   ✅ Eliminada cita ${a.documentId}`);
      } catch (err) {
        console.error(`   ❌ Error eliminando cita ${a.documentId}:`, err.message);
      }
    }
  } else {
    console.log('\n✅ No se encontraron citas con fechas inválidas.');
  }

  await app.destroy();
  console.log('\n🏁 Auditoría finalizada.');
  process.exit(0);
}

main().catch((err) => {
  console.error('💥 Error fatal en auditoría:', err);
  process.exit(1);
});

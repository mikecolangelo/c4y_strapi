'use strict';

/**
 * Migration: Añadir índices únicos a email y username en up_users
 * Fecha: 2026-04-23
 * Motivación: Prevenir duplicados de usuarios que causaban fallos de login
 *             al promover leads a usuarios activos.
 */

async function up(knex) {
  const indexes = await knex.raw(`
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'up_users' AND schemaname = 'public'
  `);
  const indexNames = indexes.rows.map((r) => r.indexname);

  if (!indexNames.includes('up_users_email_unique')) {
    await knex.schema.table('up_users', (table) => {
      table.unique('email', { indexName: 'up_users_email_unique' });
    });
    console.log('✅ Índice único up_users_email_unique creado');
  }

  if (!indexNames.includes('up_users_username_unique')) {
    await knex.schema.table('up_users', (table) => {
      table.unique('username', { indexName: 'up_users_username_unique' });
    });
    console.log('✅ Índice único up_users_username_unique creado');
  }
}

async function down(knex) {
  await knex.schema.table('up_users', (table) => {
    table.dropUnique('email', 'up_users_email_unique');
    table.dropUnique('username', 'up_users_username_unique');
  });
  console.log('✅ Índices únicos eliminados');
}

module.exports = { up, down };

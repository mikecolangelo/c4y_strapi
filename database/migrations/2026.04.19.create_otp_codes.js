'use strict';

/**
 * Migration: Crear tabla otp_codes para el flujo MFA por email
 * Fecha: 2026-04-19
 */

async function up(knex) {
  const exists = await knex.schema.hasTable('otp_codes');
  if (exists) {
    console.log('Table otp_codes already exists, skipping creation.');
    return;
  }

  await knex.schema.createTable('otp_codes', (table) => {
    table.increments('id').primary();
    table.string('code', 6).notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();
    table.integer('attempts').unsigned().notNullable().defaultTo(0);
    table.timestamp('blocked_until').nullable();
    table.timestamps(true, true);

    // Índices para rendimiento y limpieza
    table.index(['user_id', 'used_at'], 'idx_otp_user_used');
    table.index(['expires_at'], 'idx_otp_expires');
  });

  console.log('✅ Table otp_codes created successfully');
}

async function down(knex) {
  await knex.schema.dropTableIfExists('otp_codes');
  console.log('✅ Table otp_codes dropped');
}

module.exports = { up, down };

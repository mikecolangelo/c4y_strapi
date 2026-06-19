import type { Core } from '@strapi/strapi';
import { env } from '@strapi/utils';
import { seedInitialData } from './seed/seed-initial-data';
import { seedDocumentTypes, migrateExistingDocuments } from './extensions/seeders/document-types';
import { seedVehicleDocumentCategories } from './extensions/seeders/vehicle-document-categories';
import {
  ensureAuthenticatedPermissions,
  ROLE_PERMISSION_ACTIONS,
  SERVICE_CATALOG_ACTIONS,
  USER_COMMENT_ACTIONS,
  USER_PROFILE_ACTIONS,
} from './extensions/permissions/authenticated-access';

type SequenceMaxResult = { max?: string | number | null };

const ensureOtpCodesTable = async (strapi: Core.Strapi) => {
  try {
    const knex = strapi.db.connection;
    const exists = await knex.schema.hasTable('otp_codes');
    if (!exists) {
      await knex.schema.createTable('otp_codes', (table) => {
        table.increments('id').primary();
        table.string('code', 6).notNullable();
        table.integer('user_id').unsigned().notNullable();
        table.timestamp('expires_at').notNullable();
        table.timestamp('used_at').nullable();
        table.integer('attempts').unsigned().notNullable().defaultTo(0);
        table.timestamp('blocked_until').nullable();
        table.timestamps(true, true);
        table.index(['user_id', 'used_at'], 'idx_otp_user_used');
        table.index(['expires_at'], 'idx_otp_expires');
      });
      strapi.log.info('✅ Tabla otp_codes creada exitosamente');
    }
  } catch (error) {
    strapi.log.error('Error creando tabla otp_codes:', error as Error);
  }
};

const normalizeFleetIdSequence = async (strapi: Core.Strapi) => {
  const client = strapi.db?.connection?.client?.config?.client;
  if (client !== 'postgres') {
    return;
  }

  const metadata = strapi.db.metadata.get('api::fleet.fleet');
  const tableName = metadata?.tableName;
  if (!tableName) {
    return;
  }

  const schema = env('DATABASE_SCHEMA', 'public');
  const sequenceName = `${tableName}_id_seq`;

  try {
    await strapi.db.connection.raw(`ALTER SEQUENCE "${schema}"."${sequenceName}" INCREMENT BY 1;`);

    const [result] = (await strapi.db
      .connection(tableName)
      .max('id as max')) as SequenceMaxResult[];
    const maxId = Number(result?.max ?? 0);
    const nextValue = maxId > 0 ? maxId : 1;
    const isCalled = maxId > 0 ? 'true' : 'false';

    await strapi.db.connection.raw(
      `SELECT setval('"${schema}"."${sequenceName}"', ${nextValue}, ${isCalled});`
    );
  } catch (error) {
    strapi.log.warn('No se pudo normalizar la secuencia de Fleet', error as Error);
  }
};

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    // La creación automática de user-profile se maneja en la extensión del plugin users-permissions
    // Ver: src/extensions/users-permissions/controllers/auth.js
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap: async ({ strapi }: { strapi: Core.Strapi }) => {
    await ensureOtpCodesTable(strapi);
    await normalizeFleetIdSequence(strapi);
    await seedInitialData(strapi);

    // Seed document types and migrate existing documents
    await seedDocumentTypes(strapi);
    await migrateExistingDocuments(strapi);

    // Seed new isolated vehicle document categories
    await seedVehicleDocumentCategories(strapi);

    // Seed de permisos por rol y módulo (idempotente)
    await strapi.service('api::role-permission.role-permission').seedDefaults();

    // Grant the Authenticated role access to the custom role-permission and
    // service catalog endpoints (Strapi disables new content-types by default).
    await ensureAuthenticatedPermissions(strapi, ROLE_PERMISSION_ACTIONS, 'role-permission');
    await ensureAuthenticatedPermissions(strapi, SERVICE_CATALOG_ACTIONS, 'service');
    await ensureAuthenticatedPermissions(strapi, USER_COMMENT_ACTIONS, 'user-comment');
    await ensureAuthenticatedPermissions(strapi, USER_PROFILE_ACTIONS, 'user-profile');
  },
};

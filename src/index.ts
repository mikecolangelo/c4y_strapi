import type { Core } from '@strapi/strapi';
import { env } from '@strapi/utils';
import { seedInitialData } from './seed/seed-initial-data';

type SequenceMaxResult = { max?: string | number | null };

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
    await strapi.db.connection.raw(
      `ALTER SEQUENCE "${schema}"."${sequenceName}" INCREMENT BY 1;`
    );

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
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap: async ({ strapi }: { strapi: Core.Strapi }) => {
    await normalizeFleetIdSequence(strapi);
    await seedInitialData(strapi);
  },
};

'use strict';

module.exports = () => {
  return {
    connection: {
      client: 'postgres',
      connection: {
        host: '127.0.0.1',
        port: 5432,
        database: 'strapi_db',
        user: 'strapi_user',
        password: 'hBs&soM6sK@fQA@P',
        ssl: false,
        schema: 'public',
      },
      pool: { min: 2, max: 10 },
      acquireConnectionTimeout: 60000,
    },
    settings: {
      forceMigration: false,
      runMigrations: false,
    },
  };
};

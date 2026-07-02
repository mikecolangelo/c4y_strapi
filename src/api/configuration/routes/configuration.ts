/**
 * configuration router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'settings' } };
const canRead = {
  name: 'global::can-write-module',
  config: { module: 'settings', action: 'read' },
};

export default factories.createCoreRouter('api::configuration.configuration', {
  config: {
    find: {
      middlewares: [],
      policies: [canRead],
    },
    findOne: {
      middlewares: [],
      policies: [canRead],
    },
    create: {
      middlewares: [],
      policies: [canWrite],
    },
    update: {
      middlewares: [],
      policies: [canWrite],
    },
    delete: {
      middlewares: [],
      policies: [canWrite],
    },
  },
});

/**
 * company-info router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'settings' } };

export default factories.createCoreRouter('api::company-info.company-info', {
  config: {
    find: {
      middlewares: [],
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

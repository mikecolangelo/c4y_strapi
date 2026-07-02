/**
 * contract-type router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'deal' } };

export default factories.createCoreRouter('api::contract-type.contract-type', {
  config: {
    find: {
      middlewares: [],
    },
    findOne: {
      middlewares: [],
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

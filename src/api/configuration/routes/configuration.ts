/**
 * configuration router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::configuration.configuration', {
  config: {
    find: {
      middlewares: [],
    },
    findOne: {
      middlewares: [],
    },
    create: {
      middlewares: [],
    },
    update: {
      middlewares: [],
    },
    delete: {
      middlewares: [],
    },
  },
});

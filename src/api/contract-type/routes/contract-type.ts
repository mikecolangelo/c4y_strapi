/**
 * contract-type router
 */

import { factories } from '@strapi/strapi';

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
    },
    update: {
      middlewares: [],
    },
    delete: {
      middlewares: [],
    },
  },
});

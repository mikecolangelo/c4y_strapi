/**
 * notification router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::notification.notification', {
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

/**
 * company-info router
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::company-info.company-info', {
  config: {
    find: {
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

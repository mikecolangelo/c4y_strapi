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

// Ruta personalizada para limpieza de duplicados
export const cleanupRoute = {
  routes: [
    {
      method: 'POST',
      path: '/notifications/cleanup-duplicates',
      handler: 'notification.cleanupDuplicates',
      config: {
        
      },
    },
  ],
};

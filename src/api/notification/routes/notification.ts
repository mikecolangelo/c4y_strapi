/**
 * notification router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'notifications' } };
const canDelete = {
  name: 'global::can-write-module',
  config: { module: 'notifications', action: 'delete' },
};

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

// Ruta personalizada para limpieza de duplicados
export const cleanupRoute = {
  routes: [
    {
      method: 'POST',
      path: '/notifications/cleanup-duplicates',
      handler: 'notification.cleanupDuplicates',
      config: {
        policies: [canDelete],
      },
    },
  ],
};

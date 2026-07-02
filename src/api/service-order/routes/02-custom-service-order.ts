import type { Core } from '@strapi/strapi';

const canWrite = {
  name: 'global::can-write-module',
  config: { module: 'service-orders', action: 'create' },
};

const customRoutes = [
  {
    method: 'POST',
    path: '/service-orders/create-from-maintenance',
    handler: 'api::service-order.service-order.createFromMaintenance',
    config: {
      policies: [canWrite],
      middlewares: [],
    },
  },
];

export default {
  routes: customRoutes,
} as Core.Router;

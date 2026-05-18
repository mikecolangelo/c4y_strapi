import type { Core } from '@strapi/strapi';

const customRoutes = [
  {
    method: 'POST',
    path: '/service-orders/create-from-maintenance',
    handler: 'api::service-order.service-order.createFromMaintenance',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default {
  routes: customRoutes,
} as Core.Router;

import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/menu-configs/order',
      handler: 'api::menu-config.menu-config.order',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/menu-configs/order',
      handler: 'api::menu-config.menu-config.updateOrder',
      config: { policies: [], middlewares: [] },
    },
  ],
} as Core.Router;

import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/role-permissions/matrix',
      handler: 'api::role-permission.role-permission.matrix',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/role-permissions/modules',
      handler: 'api::role-permission.role-permission.modules',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/role-permissions/mine',
      handler: 'api::role-permission.role-permission.mine',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/role-permissions/matrix',
      handler: 'api::role-permission.role-permission.updateMatrix',
      config: { policies: [], middlewares: [] },
    },
  ],
} as Core.Router;

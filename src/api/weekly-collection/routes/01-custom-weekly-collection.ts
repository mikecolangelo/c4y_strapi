import type { Core } from '@strapi/strapi';

const customRoutes = [
  {
    method: 'POST',
    path: '/weekly-collections/batch-import',
    handler: 'api::weekly-collection.weekly-collection.batchImport',
    config: {
      policies: [],
      middlewares: [],
    },
  },
];

export default {
  routes: customRoutes,
} as Core.Router;

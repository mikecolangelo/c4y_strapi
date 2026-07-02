import type { Core } from '@strapi/strapi';

const canWrite = {
  name: 'global::can-write-module',
  config: { module: 'billing', action: 'create' },
};

const customRoutes = [
  {
    method: 'POST',
    path: '/weekly-collections/batch-import',
    handler: 'api::weekly-collection.weekly-collection.batchImport',
    config: {
      policies: [canWrite],
      middlewares: [],
    },
  },
];

export default {
  routes: customRoutes,
} as Core.Router;

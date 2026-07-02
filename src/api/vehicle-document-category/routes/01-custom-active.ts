/**
 * Custom routes for vehicle-document-category
 */

import type { Core } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'fleet' } };

export default {
  routes: [
    {
      method: 'GET',
      path: '/vehicle-document-categories/active',
      handler: 'api::vehicle-document-category.vehicle-document-category.getActive',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/vehicle-document-categories/reorder',
      handler: 'api::vehicle-document-category.vehicle-document-category.reorder',
      config: {
        policies: [canWrite],
        middlewares: [],
      },
    },
  ],
} as Core.Router;

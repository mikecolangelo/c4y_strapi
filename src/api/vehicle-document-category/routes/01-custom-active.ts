/**
 * Custom routes for vehicle-document-category
 */

import type { Core } from '@strapi/strapi';

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
        policies: [],
        middlewares: [],
      },
    },
  ],
} as Core.Router;

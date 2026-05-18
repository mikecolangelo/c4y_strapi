/**
 * Public routes for fleet-document-type
 * These routes bypass authentication for read operations
 */

import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/fleet-document-types/public',
      handler: 'api::fleet-document-type.fleet-document-type.find',
      config: {
        
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/fleet-document-types',
      handler: 'api::fleet-document-type.fleet-document-type.find',
      config: {
        
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/fleet-document-types/:id',
      handler: 'api::fleet-document-type.fleet-document-type.findOne',
      config: {
        
        policies: [],
        middlewares: [],
      },
    },
  ],
} as Core.Router;

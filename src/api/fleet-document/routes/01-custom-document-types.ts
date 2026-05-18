/**
 * Custom route for getting document types
 */

import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/fleet-documents/document-types',
      handler: 'api::fleet-document.fleet-document.getDocumentTypes',
      config: {
        
        policies: [],
        middlewares: [],
      },
    },
  ],
} as Core.Router;

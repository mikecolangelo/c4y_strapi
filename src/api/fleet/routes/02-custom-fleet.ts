/**
 * fleet custom routes v2 (nuevos endpoints de kilometraje y aceite)
 */

import type { Core } from '@strapi/strapi';

const customRoutes = [
  {
    method: 'POST',
    path: '/fleets/:documentId/set-mileage-record',
    handler: 'api::fleet.fleet.setMileageRecord',
    config: {
      // auth omitted to require authentication by default in Strapi 5
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'POST',
    path: '/fleets/:documentId/record-oil-change',
    handler: 'api::fleet.fleet.recordOilChange',
    config: {
      // auth omitted to require authentication by default in Strapi 5
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'GET',
    path: '/fleets/:documentId/mileage-history',
    handler: 'api::fleet.fleet.getMileageHistory',
    config: {
      // auth omitted to require authentication by default in Strapi 5
      policies: [],
      middlewares: [],
    },
  },
  {
    method: 'DELETE',
    path: '/fleets/:documentId/mileage-history/:recordId',
    handler: 'api::fleet.fleet.deleteMileageRecord',
    config: {
      // auth omitted to require authentication by default in Strapi 5
      policies: [],
      middlewares: [],
    },
  },
];

export default {
  routes: customRoutes,
} as Core.Router;

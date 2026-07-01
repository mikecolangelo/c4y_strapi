import type { Core } from '@strapi/strapi';

/**
 * Custom role-management endpoints (admin-gated in the controller, same
 * defense-in-depth as role-permission.updateMatrix). These are the only role
 * routes granted to the Authenticated role; the auto-generated core CRUD routes
 * are intentionally left ungranted.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/roles/list',
      handler: 'api::role.role.list',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/roles/create',
      handler: 'api::role.role.createRole',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'PUT',
      path: '/roles/:id',
      handler: 'api::role.role.updateRole',
      config: { policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/roles/:id',
      handler: 'api::role.role.deleteRole',
      config: { policies: [], middlewares: [] },
    },
  ],
} as Core.Router;

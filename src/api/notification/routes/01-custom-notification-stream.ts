import type { Core } from '@strapi/strapi';

/**
 * Custom additive route for the real-time notifications SSE stream.
 *
 * The handler lives in a dedicated controller (`notification-stream`) so it
 * does not interfere with the core notification controller. Authentication is
 * enforced by the standard users-permissions layer: the route's action is
 * granted to the Authenticated role on bootstrap.
 */
export default {
  routes: [
    {
      method: 'GET',
      path: '/notifications/stream',
      handler: 'api::notification.notification-stream.stream',
      config: { policies: [], middlewares: [] },
    },
  ],
} as Core.Router;

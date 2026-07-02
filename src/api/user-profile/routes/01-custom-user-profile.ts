import type { Core } from '@strapi/strapi';

export default {
  routes: [
    {
      method: 'GET',
      path: '/user-profiles/:documentId/account',
      handler: 'api::user-profile.user-profile.account',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-profiles/:documentId/convert',
      handler: 'api::user-profile.user-profile.convert',
      config: {
        policies: ['api::user-profile.require-admin'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-profiles/:documentId/reset-password',
      handler: 'api::user-profile.user-profile.resetPassword',
      config: {
        policies: ['api::user-profile.require-admin'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-profiles/:documentId/create-account',
      handler: 'api::user-profile.user-profile.createAccount',
      config: {
        policies: ['api::user-profile.require-admin'],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-profiles/batch-import',
      handler: 'api::user-profile.user-profile.batchImport',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/user-profiles/deletion-impact',
      handler: 'api::user-profile.user-profile.deletionImpact',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
} as Core.Router;

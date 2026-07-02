/**
 * invoice router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'billing' } };

export default factories.createCoreRouter('api::invoice.invoice', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

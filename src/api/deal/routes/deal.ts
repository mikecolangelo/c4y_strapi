/**
 * deal router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'deal' } };

export default factories.createCoreRouter('api::deal.deal', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

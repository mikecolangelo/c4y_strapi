/**
 * inventory-item router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'stock' } };

export default factories.createCoreRouter('api::inventory-item.inventory-item', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

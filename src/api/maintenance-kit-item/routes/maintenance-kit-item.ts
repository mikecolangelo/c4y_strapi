import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'stock' } };

export default factories.createCoreRouter('api::maintenance-kit-item.maintenance-kit-item', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

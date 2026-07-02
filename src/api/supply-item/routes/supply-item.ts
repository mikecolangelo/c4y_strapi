import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'stock' } };

export default factories.createCoreRouter('api::supply-item.supply-item', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

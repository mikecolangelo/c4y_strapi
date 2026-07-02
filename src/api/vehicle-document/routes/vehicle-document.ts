/**
 * vehicle-document router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'fleet' } };

export default factories.createCoreRouter('api::vehicle-document.vehicle-document', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

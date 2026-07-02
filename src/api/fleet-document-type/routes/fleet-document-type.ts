/**
 * fleet-document-type router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'fleet' } };

export default factories.createCoreRouter('api::fleet-document-type.fleet-document-type', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

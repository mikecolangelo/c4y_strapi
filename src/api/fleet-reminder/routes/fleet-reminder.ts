/**
 * fleet-reminder router
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'fleet' } };

export default factories.createCoreRouter('api::fleet-reminder.fleet-reminder', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

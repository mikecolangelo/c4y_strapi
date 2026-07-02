/**
 * user-profile router
 */

import { factories } from '@strapi/strapi';

// Authz por rol en las escrituras: la matriz `role-permission` decide quién
// puede crear/editar/eliminar contactos, y ningún no-admin puede otorgar admin.
const canWriteUsers = 'api::user-profile.can-write-users';

export default factories.createCoreRouter('api::user-profile.user-profile', {
  config: {
    create: { policies: [canWriteUsers] },
    update: { policies: [canWriteUsers] },
    delete: { policies: [canWriteUsers] },
  },
});

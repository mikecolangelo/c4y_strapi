/**
 * menu-config router (core CRUD).
 *
 * El menú se gestiona vía las rutas personalizadas `/menu-configs/order`; este
 * router por defecto queda cerrado salvo que se concedan permisos de rol.
 */

import { factories } from '@strapi/strapi';

const canWrite = { name: 'global::can-write-module', config: { module: 'settings' } };

export default factories.createCoreRouter('api::menu-config.menu-config', {
  config: {
    create: { policies: [canWrite] },
    update: { policies: [canWrite] },
    delete: { policies: [canWrite] },
  },
});

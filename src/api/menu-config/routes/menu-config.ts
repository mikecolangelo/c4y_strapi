/**
 * menu-config router (core CRUD).
 *
 * El menú se gestiona vía las rutas personalizadas `/menu-configs/order`; este
 * router por defecto queda cerrado salvo que se concedan permisos de rol.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::menu-config.menu-config');

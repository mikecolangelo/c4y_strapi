import type { Core } from '@strapi/strapi';
import {
  actionForMethod,
  isModuleWriteAllowed,
  type ModuleWriteAction,
} from './module-write-authz';

const UP_UID = 'api::user-profile.user-profile';

interface CanWriteModuleConfig {
  /** Clave del módulo en la matriz `role-permission` (ver config/permission-modules.ts). */
  module: string;
  /**
   * Acción explícita a chequear, para rutas custom cuyo método HTTP no refleja
   * la semántica real (p.ej. un POST que aprueba/rechaza una solicitud, no que
   * crea un registro). Si se omite, se infiere del método HTTP.
   */
  action?: ModuleWriteAction;
}

/**
 * Policy genérica de escritura: bloquea create/update/delete sobre cualquier
 * content-type según la matriz `role-permission` del rol del usuario
 * autenticado. Se parametriza con `config.module` al registrarla en cada
 * router, por ejemplo:
 *
 *   { name: 'global::can-write-module', config: { module: 'fleet' } }
 *
 * Bypass: peticiones sin sesión de usuario (API token de servidor / público)
 * se consideran de confianza — su autorización se resuelve en su capa de origen.
 */
export default async (
  policyContext: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  config: CanWriteModuleConfig,
  { strapi }: { strapi: Core.Strapi }
): Promise<boolean> => {
  const user = policyContext.state?.user;
  if (!user?.email) return true;

  const requester = await strapi.db.query(UP_UID).findOne({
    where: { email: user.email },
    select: ['role'],
  });
  const role: string = requester?.role ?? 'lead';

  const method: string = policyContext.request?.method ?? 'PUT';
  const action = config.action ?? actionForMethod(method);

  const hasPermission: boolean = await strapi
    .service('api::role-permission.role-permission')
    .can(role, config.module, action);

  const allowed = isModuleWriteAllowed({ role, hasPermission });

  if (!allowed) {
    strapi.log.warn(`[authz] ${method} módulo="${config.module}" denegado: rol="${role}"`);
  }
  return allowed;
};

import type { Core } from '@strapi/strapi';
import {
  actionForMethod,
  grantsAdminRole,
  isAdminRole,
  isUsersWriteAllowed,
  moduleForWrite,
} from '../users-write-authz';

const UP_UID = 'api::user-profile.user-profile';

/**
 * Authz de escrituras (create/update/delete) sobre `user-profile`.
 *
 * `user-profile` sirve a dos módulos: "users" (gestión de contactos) y "profile"
 * (perfil propio). Resolvemos cuál corresponde según si el destino es el propio
 * usuario, y consultamos la matriz `role-permission`. Además, ningún rol no-admin
 * puede otorgar el rol admin (anti escalación de privilegios).
 *
 * Bypass: peticiones sin sesión de usuario (API token de servidor / público) se
 * consideran de confianza — su autorización se resuelve en su capa de origen.
 */
export default async (
  policyContext: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  _config: unknown,
  { strapi }: { strapi: Core.Strapi }
): Promise<boolean> => {
  const user = policyContext.state?.user;
  if (!user?.email) return true;

  const requester = await strapi.db.query(UP_UID).findOne({
    where: { email: user.email },
    select: ['role'],
  });
  const requesterRole: string = requester?.role ?? 'lead';
  if (isAdminRole(requesterRole)) return true;

  const method: string = policyContext.request?.method ?? 'PUT';
  const action = actionForMethod(method);
  const incomingRole: string | undefined = policyContext.request?.body?.data?.role;

  // ¿El destino es el propio usuario? -> módulo "profile"; si no -> "users".
  let isSelf = false;
  const targetId = policyContext.params?.id;
  if (targetId) {
    const target = await strapi.db.query(UP_UID).findOne({
      where: { documentId: targetId },
      select: ['email'],
    });
    isSelf = !!target && target.email === user.email;
  }
  const moduleKey = moduleForWrite(isSelf);

  const hasPermission: boolean = await strapi
    .service('api::role-permission.role-permission')
    .can(requesterRole, moduleKey, action);

  const allowed = isUsersWriteAllowed({
    requesterRole,
    hasPermission,
    escalation: grantsAdminRole(requesterRole, incomingRole),
  });

  if (!allowed) {
    strapi.log.warn(
      `[authz] ${method} user-profile denegado: rol="${requesterRole}" modulo="${moduleKey}" accion="${action}"`
    );
  }
  return allowed;
};

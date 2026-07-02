import type { Core } from '@strapi/strapi';
import { isAdminRole } from '../users-write-authz';

const UP_UID = 'api::user-profile.user-profile';

/**
 * Policy estricta para acciones de gestión de cuentas de otros usuarios
 * (crear cuenta, resetear contraseña, promover a admin/driver). A diferencia
 * de `can-write-users`/`can-write-module`, NO tiene bypass para peticiones
 * sin sesión: no existe un caller legítimo server-to-server para estas
 * rutas, solo el panel admin autenticado.
 */
export default async (
  policyContext: any, // eslint-disable-line @typescript-eslint/no-explicit-any
  _config: unknown,
  { strapi }: { strapi: Core.Strapi }
): Promise<boolean> => {
  const user = policyContext.state?.user;
  if (!user?.email) return false;

  const requester = await strapi.db.query(UP_UID).findOne({
    where: { email: user.email },
    select: ['role'],
  });
  const requesterRole: string = requester?.role ?? 'lead';

  const allowed = isAdminRole(requesterRole);
  if (!allowed) {
    strapi.log.warn(`[authz] Acción de gestión de cuenta denegada: rol="${requesterRole}"`);
  }
  return allowed;
};

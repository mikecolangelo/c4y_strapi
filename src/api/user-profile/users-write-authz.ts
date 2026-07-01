/**
 * Lógica PURA de autorización para escrituras sobre `user-profile`.
 *
 * El content-type `user-profile` sirve a DOS módulos de la matriz de permisos:
 * "users" (gestión de contactos por un admin) y "profile" (perfil propio). La
 * policy que consume estas funciones decide cuál aplica según el destino.
 *
 * Se aísla acá, sin dependencias de Strapi, para poder testearla sola.
 */

export type UsersWriteAction = 'canCreate' | 'canUpdate' | 'canDelete';

/** Mapea el método HTTP a la acción de la matriz. */
export function actionForMethod(method: string): UsersWriteAction {
  const m = (method || '').toUpperCase();
  if (m === 'POST') return 'canCreate';
  if (m === 'DELETE') return 'canDelete';
  return 'canUpdate'; // PUT / PATCH
}

/** admin y super-admin tienen acceso total. */
export function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'super-admin';
}

/** Módulo de la matriz según si la escritura es sobre el propio perfil. */
export function moduleForWrite(isSelf: boolean): 'users' | 'profile' {
  return isSelf ? 'profile' : 'users';
}

/**
 * ¿Un rol NO admin intenta otorgar el rol admin? Esto es escalación de
 * privilegios y se bloquea siempre (aunque el rol tenga permiso de edición).
 */
export function grantsAdminRole(
  requesterRole: string,
  incomingRole: string | undefined | null
): boolean {
  if (incomingRole == null) return false;
  return isAdminRole(incomingRole) && !isAdminRole(requesterRole);
}

export interface UsersWriteDecision {
  requesterRole: string;
  /** Resultado de role-permission.can(rol, módulo, acción). */
  hasPermission: boolean;
  /** ¿La request intenta otorgar rol admin desde un rol no admin? */
  escalation: boolean;
}

/** Decisión final: ¿se permite la escritura sobre user-profile? */
export function isUsersWriteAllowed({
  requesterRole,
  hasPermission,
  escalation,
}: UsersWriteDecision): boolean {
  if (isAdminRole(requesterRole)) return true;
  if (escalation) return false;
  return hasPermission;
}

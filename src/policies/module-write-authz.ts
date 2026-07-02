/**
 * Lógica PURA de autorización genérica para escrituras sobre cualquier
 * content-type mapeado a un módulo de la matriz `role-permission`.
 *
 * A diferencia de `users-write-authz.ts` (que resuelve el caso especial de
 * `user-profile`, servido por dos módulos "users"/"profile" y con anti
 * escalación de rol), este archivo cubre el caso genérico: un content-type
 * que pertenece a un único módulo (flota, facturación, inventario, etc.).
 *
 * Se aísla acá, sin dependencias de Strapi, para poder testearla sola.
 */

export type ModuleWriteAction = 'create' | 'update' | 'delete';

/** Mapea el método HTTP a la acción de la matriz. */
export function actionForMethod(method: string): ModuleWriteAction {
  const m = (method || '').toUpperCase();
  if (m === 'POST') return 'create';
  if (m === 'DELETE') return 'delete';
  return 'update'; // PUT / PATCH
}

/** admin y super-admin tienen acceso total. */
export function isAdminRole(role: string): boolean {
  return role === 'admin' || role === 'super-admin';
}

export interface ModuleWriteDecision {
  role: string;
  /** Resultado de role-permission.can(rol, módulo, acción). */
  hasPermission: boolean;
}

/** Decisión final: ¿se permite la escritura sobre el módulo? */
export function isModuleWriteAllowed({ role, hasPermission }: ModuleWriteDecision): boolean {
  if (isAdminRole(role)) return true;
  return hasPermission;
}

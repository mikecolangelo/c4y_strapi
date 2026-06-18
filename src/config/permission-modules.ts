/**
 * Definición central del sistema de permisos por rol.
 *
 * Los permisos se almacenan en la colección `role-permission` (una fila por
 * combinación rol + módulo) y son editables desde la pantalla de Configuración.
 * Este archivo define los módulos disponibles, las acciones y la matriz por
 * defecto que se usa para sembrar la base de datos (idempotente) y como
 * fallback si la BD aún no tiene la fila correspondiente.
 */

export const ROLES = ['admin', 'driver', 'lead'] as const;
export type PermissionRole = (typeof ROLES)[number];

export const ACTIONS = ['read', 'create', 'update', 'delete'] as const;
export type PermissionAction = (typeof ACTIONS)[number];

export interface ModuleDefinition {
  /** Clave estable, coincide con el segmento de ruta del frontend. */
  key: string;
  /** Etiqueta legible para la UI de Configuración. */
  label: string;
  /** Ruta principal del módulo en el frontend (para enforcement de middleware). */
  path: string;
}

export const MODULES: ModuleDefinition[] = [
  { key: 'dashboard', label: 'Panel', path: '/dashboard' },
  { key: 'users', label: 'Contactos', path: '/users' },
  { key: 'adm-services', label: 'Servicios', path: '/adm-services' },
  { key: 'stock', label: 'Inventario', path: '/stock' },
  { key: 'fleet', label: 'Flota', path: '/fleet' },
  { key: 'billing', label: 'Facturación', path: '/billing' },
  { key: 'calendar', label: 'Calendario', path: '/calendar' },
  { key: 'deal', label: 'Tratos', path: '/deal' },
  { key: 'service-orders', label: 'Órdenes de servicio', path: '/service-orders' },
  { key: 'notifications', label: 'Notificaciones', path: '/notifications' },
  { key: 'profile', label: 'Perfil', path: '/profile' },
  { key: 'settings', label: 'Configuración', path: '/settings' },
];

export const MODULE_KEYS = MODULES.map((m) => m.key);

export interface ModulePermission {
  /** Si el rol puede ver el módulo en el menú y entrar a la ruta. */
  canAccess: boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export type RoleMatrix = Record<string, ModulePermission>;

const full = (): ModulePermission => ({
  canAccess: true,
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
});

const readOnly = (): ModulePermission => ({
  canAccess: true,
  canRead: true,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
});

const none = (): ModulePermission => ({
  canAccess: false,
  canRead: false,
  canCreate: false,
  canUpdate: false,
  canDelete: false,
});

/**
 * Matriz por defecto.
 * - admin: acceso total a todo.
 * - driver (Usuario): solo lo mínimo — su panel (/dashboard-user),
 *   notificaciones y perfil. Sin acceso a flota, facturación ni calendario.
 * - lead: sin acceso al portal.
 */
export const DEFAULT_MATRIX: Record<PermissionRole, RoleMatrix> = {
  admin: MODULE_KEYS.reduce<RoleMatrix>((acc, key) => {
    acc[key] = full();
    return acc;
  }, {}),
  driver: {
    dashboard: readOnly(),
    users: none(),
    'adm-services': none(),
    stock: none(),
    fleet: none(),
    billing: none(),
    calendar: none(),
    deal: none(),
    'service-orders': none(),
    notifications: { canAccess: true, canRead: true, canCreate: true, canUpdate: true, canDelete: false },
    profile: { canAccess: true, canRead: true, canCreate: false, canUpdate: true, canDelete: false },
    settings: none(),
  },
  lead: MODULE_KEYS.reduce<RoleMatrix>((acc, key) => {
    acc[key] = none();
    return acc;
  }, {}),
};

export const ACTION_FIELD: Record<PermissionAction, keyof ModulePermission> = {
  read: 'canRead',
  create: 'canCreate',
  update: 'canUpdate',
  delete: 'canDelete',
};

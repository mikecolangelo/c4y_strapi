export type Role = 'admin' | 'driver';
export type Resource =
  | 'fleet'
  | 'deal'
  | 'billing'
  | 'appointment'
  | 'inventory'
  | 'notification'
  | 'profile'
  | 'service-order'
  | 'supply-item'
  | 'supply-request';
export type Permission = 'read' | 'create' | 'update' | 'delete';

const ROLE_MATRIX: Record<Role, Partial<Record<Resource, Permission[]>>> = {
  admin: {
    fleet: ['read', 'create', 'update', 'delete'],
    deal: ['read', 'create', 'update', 'delete'],
    billing: ['read', 'create', 'update', 'delete'],
    appointment: ['read', 'create', 'update', 'delete'],
    inventory: ['read', 'create', 'update', 'delete'],
    notification: ['read', 'create', 'update', 'delete'],
    profile: ['read', 'create', 'update', 'delete'],
    'service-order': ['read', 'create', 'update', 'delete'],
    'supply-item': ['read', 'create', 'update', 'delete'],
    'supply-request': ['read', 'create', 'update', 'delete'],
  },
  driver: {
    fleet: ['read'],
    deal: ['read'],
    billing: ['read'],
    appointment: ['read', 'update'],
    inventory: ['read'],
    notification: ['read', 'create', 'update'],
    profile: ['read', 'update'],
    'supply-item': ['read'],
    'supply-request': ['read', 'create'],
  },
};

export const canPerform = (role: Role, resource: Resource, action: Permission) => {
  const permissions = ROLE_MATRIX[role]?.[resource] ?? [];
  return permissions.includes(action);
};

export const getRolePermissions = (role: Role) => ROLE_MATRIX[role];

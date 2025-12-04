export type Role = 'admin' | 'seller' | 'driver';
export type Resource =
  | 'fleet'
  | 'deal'
  | 'billing'
  | 'appointment'
  | 'inventory'
  | 'notification'
  | 'profile';
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
  },
  seller: {
    fleet: ['read'],
    deal: ['read', 'create', 'update'],
    billing: ['read', 'create', 'update'],
    appointment: ['read', 'create', 'update'],
    inventory: ['read'],
    notification: ['read', 'update'],
    profile: ['read', 'update'],
  },
  driver: {
    fleet: ['read'],
    deal: ['read'],
    billing: ['read'],
    appointment: ['read', 'update'],
    inventory: ['read'],
    notification: ['read', 'update'],
    profile: ['read', 'update'],
  },
};

export const canPerform = (role: Role, resource: Resource, action: Permission) => {
  const permissions = ROLE_MATRIX[role]?.[resource] ?? [];
  return permissions.includes(action);
};

export const getRolePermissions = (role: Role) => ROLE_MATRIX[role];

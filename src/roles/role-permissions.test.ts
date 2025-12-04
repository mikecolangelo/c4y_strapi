import { describe, expect, it } from 'vitest';
import { canPerform, getRolePermissions } from './role-permissions';

describe('role-permissions', () => {
  it('permite que un admin ejecute cualquier acción', () => {
    expect(canPerform('admin', 'fleet', 'delete')).toBe(true);
    expect(canPerform('admin', 'billing', 'update')).toBe(true);
  });

  it('restringe a los vendedores a operaciones definidas', () => {
    expect(canPerform('seller', 'deal', 'create')).toBe(true);
    expect(canPerform('seller', 'inventory', 'delete')).toBe(false);
  });

  it('limita a los conductores a sus vistas de lectura', () => {
    expect(canPerform('driver', 'billing', 'read')).toBe(true);
    expect(canPerform('driver', 'billing', 'update')).toBe(false);
  });

  it('expone la matriz completa para construir UI dinámicas', () => {
    const sellerPermissions = getRolePermissions('seller');
    expect(sellerPermissions?.deal).toContain('create');
    expect(sellerPermissions?.inventory).toEqual(['read']);
  });
});

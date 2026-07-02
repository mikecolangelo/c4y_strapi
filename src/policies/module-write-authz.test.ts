import { describe, expect, it } from 'vitest';

import { actionForMethod, isAdminRole, isModuleWriteAllowed } from './module-write-authz';

describe('actionForMethod', () => {
  it('mapea el método HTTP a la acción de la matriz', () => {
    expect(actionForMethod('POST')).toBe('create');
    expect(actionForMethod('put')).toBe('update');
    expect(actionForMethod('PATCH')).toBe('update');
    expect(actionForMethod('DELETE')).toBe('delete');
  });
});

describe('isAdminRole', () => {
  it('reconoce admin y super-admin', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('super-admin')).toBe(true);
  });

  it('rechaza cualquier otro rol', () => {
    expect(isAdminRole('driver')).toBe(false);
    expect(isAdminRole('test')).toBe(false);
    expect(isAdminRole('lead')).toBe(false);
  });
});

describe('isModuleWriteAllowed', () => {
  it('el admin siempre puede, tenga o no permiso en la matriz', () => {
    expect(isModuleWriteAllowed({ role: 'admin', hasPermission: false })).toBe(true);
    expect(isModuleWriteAllowed({ role: 'super-admin', hasPermission: false })).toBe(true);
  });

  it('permite a un no-admin con permiso', () => {
    expect(isModuleWriteAllowed({ role: 'driver', hasPermission: true })).toBe(true);
  });

  it('niega a un no-admin sin permiso (rol solo-lectura)', () => {
    expect(isModuleWriteAllowed({ role: 'test', hasPermission: false })).toBe(false);
  });
});

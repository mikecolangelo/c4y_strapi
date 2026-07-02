import { describe, expect, it } from 'vitest';

import {
  actionForMethod,
  grantsAdminRole,
  isUsersWriteAllowed,
  moduleForWrite,
} from './users-write-authz';

describe('actionForMethod', () => {
  it('mapea el método HTTP a la acción de la matriz', () => {
    expect(actionForMethod('POST')).toBe('create');
    expect(actionForMethod('put')).toBe('update');
    expect(actionForMethod('PATCH')).toBe('update');
    expect(actionForMethod('DELETE')).toBe('delete');
  });
});

describe('moduleForWrite', () => {
  it('usa "profile" para el perfil propio y "users" para otros', () => {
    expect(moduleForWrite(true)).toBe('profile');
    expect(moduleForWrite(false)).toBe('users');
  });
});

describe('grantsAdminRole', () => {
  it('detecta a un no-admin intentando otorgar admin', () => {
    expect(grantsAdminRole('driver', 'admin')).toBe(true);
    expect(grantsAdminRole('test', 'super-admin')).toBe(true);
  });

  it('no marca cambios a roles no admin', () => {
    expect(grantsAdminRole('driver', 'driver')).toBe(false);
    expect(grantsAdminRole('test', 'lead')).toBe(false);
  });

  it('un admin puede otorgar admin', () => {
    expect(grantsAdminRole('admin', 'admin')).toBe(false);
  });

  it('ignora requests sin rol entrante', () => {
    expect(grantsAdminRole('driver', undefined)).toBe(false);
    expect(grantsAdminRole('driver', null)).toBe(false);
  });
});

describe('isUsersWriteAllowed', () => {
  it('el admin siempre puede', () => {
    expect(
      isUsersWriteAllowed({ requesterRole: 'admin', hasPermission: false, escalation: true })
    ).toBe(true);
  });

  it('bloquea escalación aunque tenga permiso', () => {
    expect(
      isUsersWriteAllowed({ requesterRole: 'driver', hasPermission: true, escalation: true })
    ).toBe(false);
  });

  it('permite a un no-admin con permiso y sin escalación', () => {
    expect(
      isUsersWriteAllowed({ requesterRole: 'driver', hasPermission: true, escalation: false })
    ).toBe(true);
  });

  it('niega a un no-admin sin permiso (rol solo-lectura)', () => {
    expect(
      isUsersWriteAllowed({ requesterRole: 'test', hasPermission: false, escalation: false })
    ).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import {
  auditRolePermissionCoherence,
  type RolePermissionRow,
} from './role-permission-coherence';
import { DEFAULT_MATRIX, MODULE_KEYS } from '../config/permission-modules';

/** Aplana `DEFAULT_MATRIX` a filas estilo `role-permission`. */
function rowsFromDefaultMatrix(): RolePermissionRow[] {
  const rows: RolePermissionRow[] = [];
  for (const [role, matrix] of Object.entries(DEFAULT_MATRIX)) {
    for (const [moduleKey, perm] of Object.entries(matrix)) {
      rows.push({ role, moduleKey, canAccess: perm.canAccess });
    }
  }
  return rows;
}

/** Construye una cobertura completa (rol x modulo) con `canAccess` configurable. */
function fullCoverage(roles: string[], canAccess = true): RolePermissionRow[] {
  return roles.flatMap((role) =>
    MODULE_KEYS.map((moduleKey) => ({ role, moduleKey, canAccess }))
  );
}

describe('auditRolePermissionCoherence', () => {
  it('reporta coherente cuando la cobertura es completa y no hay hides', () => {
    const report = auditRolePermissionCoherence({
      roles: ['admin', 'driver'],
      permissions: fullCoverage(['admin', 'driver']),
    });
    expect(report.ok).toBe(true);
    expect(report.issues).toHaveLength(0);
  });

  it('detecta una fila de permiso que apunta a un rol inexistente', () => {
    const report = auditRolePermissionCoherence({
      roles: ['admin'],
      permissions: [
        ...fullCoverage(['admin']),
        { role: 'fantasma', moduleKey: 'fleet', canAccess: true },
      ],
    });
    const dangling = report.issues.filter((i) => i.kind === 'dangling-permission-role');
    expect(report.ok).toBe(false);
    expect(dangling).toHaveLength(1);
    expect(dangling[0].role).toBe('fantasma');
    expect(dangling[0].moduleKey).toBe('fleet');
  });

  it('detecta un rol inexistente referenciado en hiddenForRoles', () => {
    const report = auditRolePermissionCoherence({
      roles: ['admin'],
      permissions: fullCoverage(['admin']),
      hidden: { fleet: ['fantasma'] },
    });
    const dangling = report.issues.filter((i) => i.kind === 'dangling-hidden-role');
    expect(dangling).toHaveLength(1);
    expect(dangling[0].role).toBe('fantasma');
    expect(dangling[0].moduleKey).toBe('fleet');
  });

  it('detecta cobertura faltante (rol x modulo sin fila de permiso)', () => {
    const permissions = fullCoverage(['admin']).filter((r) => r.moduleKey !== 'billing');
    const report = auditRolePermissionCoherence({ roles: ['admin'], permissions });
    const missing = report.issues.filter((i) => i.kind === 'missing-permission');
    expect(missing).toHaveLength(1);
    expect(missing[0]).toMatchObject({ role: 'admin', moduleKey: 'billing' });
  });

  it('marca un hide redundante (modulo oculto para un rol sin canAccess)', () => {
    const permissions = fullCoverage(['admin', 'driver']).map((r) =>
      r.role === 'driver' && r.moduleKey === 'billing' ? { ...r, canAccess: false } : r
    );
    const report = auditRolePermissionCoherence({
      roles: ['admin', 'driver'],
      permissions,
      hidden: { billing: ['driver'] },
    });
    const redundant = report.issues.filter((i) => i.kind === 'redundant-hide');
    expect(redundant).toHaveLength(1);
    expect(redundant[0]).toMatchObject({ role: 'driver', moduleKey: 'billing' });
  });

  it('no marca como redundante un hide sobre un modulo que el rol SI puede acceder', () => {
    const report = auditRolePermissionCoherence({
      roles: ['admin', 'driver'],
      permissions: fullCoverage(['admin', 'driver'], true),
      hidden: { billing: ['driver'] },
    });
    expect(report.issues.filter((i) => i.kind === 'redundant-hide')).toHaveLength(0);
    expect(report.ok).toBe(true);
  });

  it('ignora filas de modulos retirados para la cobertura', () => {
    const report = auditRolePermissionCoherence({
      roles: ['admin'],
      permissions: [
        ...fullCoverage(['admin']),
        { role: 'admin', moduleKey: 'modulo-viejo', canAccess: true },
      ],
    });
    expect(report.ok).toBe(true);
  });

  it('la matriz por defecto (seed) es referencialmente coherente y cubre todo', () => {
    const report = auditRolePermissionCoherence({
      roles: ['admin', 'driver', 'lead'],
      permissions: rowsFromDefaultMatrix(),
    });
    expect(report.issues).toEqual([]);
    expect(report.ok).toBe(true);
  });
});

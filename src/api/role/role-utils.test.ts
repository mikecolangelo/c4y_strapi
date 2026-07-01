import { describe, expect, it } from 'vitest';
import { mergeRoleKeys, isBaseRole, evaluateDeleteGuard, normalizeRoleKey } from './role-utils';

describe('mergeRoleKeys', () => {
  it('keeps base roles first, then appends custom roles in order', () => {
    const rows = [
      { key: 'taller' },
      { key: 'admin' }, // base, already present -> ignored
      { key: 'ventas' },
    ];
    expect(mergeRoleKeys(rows)).toEqual(['admin', 'driver', 'lead', 'taller', 'ventas']);
  });

  it('falls back to the base list when there are no custom rows', () => {
    expect(mergeRoleKeys([])).toEqual(['admin', 'driver', 'lead']);
  });

  it('de-duplicates and ignores blank keys', () => {
    const rows = [{ key: 'taller' }, { key: 'taller' }, { key: '   ' }, { key: '' }];
    expect(mergeRoleKeys(rows)).toEqual(['admin', 'driver', 'lead', 'taller']);
  });
});

describe('isBaseRole', () => {
  it('recognizes the base roles', () => {
    expect(isBaseRole('admin')).toBe(true);
    expect(isBaseRole('driver')).toBe(true);
    expect(isBaseRole('lead')).toBe(true);
  });

  it('rejects custom roles', () => {
    expect(isBaseRole('taller')).toBe(false);
  });
});

describe('evaluateDeleteGuard', () => {
  it('blocks when the role does not exist', () => {
    expect(evaluateDeleteGuard(null, 0)).toEqual({ allowed: false, reason: 'not_found' });
  });

  it('blocks system roles', () => {
    expect(evaluateDeleteGuard({ key: 'taller', isSystem: true }, 0)).toEqual({
      allowed: false,
      reason: 'system',
    });
  });

  it('blocks base roles even if not flagged isSystem', () => {
    expect(evaluateDeleteGuard({ key: 'admin' }, 0)).toEqual({
      allowed: false,
      reason: 'system',
    });
  });

  it('blocks when contacts still use the role, reporting the count', () => {
    expect(evaluateDeleteGuard({ key: 'taller', isSystem: false }, 3)).toEqual({
      allowed: false,
      reason: 'in_use',
      contacts: 3,
    });
  });

  it('allows deleting an unused custom role', () => {
    expect(evaluateDeleteGuard({ key: 'taller', isSystem: false }, 0)).toEqual({ allowed: true });
  });
});

describe('normalizeRoleKey', () => {
  it('slugifies labels with accents and spaces', () => {
    expect(normalizeRoleKey('Taller Pro')).toBe('taller-pro');
    expect(normalizeRoleKey('Atención Cliente')).toBe('atencion-cliente');
  });

  it('trims separators and lowercases', () => {
    expect(normalizeRoleKey('  --Ventas--  ')).toBe('ventas');
  });

  it('returns empty for non-strings', () => {
    expect(normalizeRoleKey(123)).toBe('');
    expect(normalizeRoleKey(null)).toBe('');
  });
});

import { describe, expect, it } from 'vitest';
import { resolveMenuOrder, buildOrderRows, resolveHidden, sanitizeHidden } from './order-utils';

const VALID = ['dashboard', 'users', 'fleet', 'billing', 'settings'];
const ROLES = ['admin', 'driver', 'lead'];

describe('resolveMenuOrder', () => {
  it('orders known keys by their saved sortIndex', () => {
    const rows = [
      { moduleKey: 'billing', sortIndex: 0 },
      { moduleKey: 'dashboard', sortIndex: 1 },
      { moduleKey: 'fleet', sortIndex: 2 },
    ];
    expect(resolveMenuOrder(rows, VALID)).toEqual([
      'billing',
      'dashboard',
      'fleet',
      // unsaved keys appended in declaration order
      'users',
      'settings',
    ]);
  });

  it('appends modules without a saved row so new modules never disappear', () => {
    const rows = [{ moduleKey: 'settings', sortIndex: 0 }];
    expect(resolveMenuOrder(rows, VALID)).toEqual([
      'settings',
      'dashboard',
      'users',
      'fleet',
      'billing',
    ]);
  });

  it('ignores saved rows pointing at unknown keys', () => {
    const rows = [
      { moduleKey: 'ghost', sortIndex: 0 },
      { moduleKey: 'fleet', sortIndex: 1 },
    ];
    expect(resolveMenuOrder(rows, VALID)[0]).toBe('fleet');
  });

  it('returns the declaration order when there are no saved rows', () => {
    expect(resolveMenuOrder([], VALID)).toEqual(VALID);
  });
});

describe('buildOrderRows', () => {
  it('assigns a dense 0..n sortIndex in the given order', () => {
    expect(buildOrderRows(['fleet', 'dashboard', 'users'], VALID)).toEqual([
      { moduleKey: 'fleet', sortIndex: 0 },
      { moduleKey: 'dashboard', sortIndex: 1 },
      { moduleKey: 'users', sortIndex: 2 },
    ]);
  });

  it('drops unknown and duplicate keys', () => {
    expect(buildOrderRows(['fleet', 'ghost', 'fleet', 'users'], VALID)).toEqual([
      { moduleKey: 'fleet', sortIndex: 0 },
      { moduleKey: 'users', sortIndex: 1 },
    ]);
  });
});

describe('resolveHidden', () => {
  it('maps stored hidden roles, ignoring empty and unknown entries', () => {
    const rows = [
      { moduleKey: 'settings', sortIndex: 0, hiddenForRoles: ['admin'] },
      { moduleKey: 'fleet', sortIndex: 1, hiddenForRoles: [] },
      { moduleKey: 'ghost', sortIndex: 2, hiddenForRoles: ['admin'] },
    ];
    expect(resolveHidden(rows, VALID, ROLES)).toEqual({ settings: ['admin'] });
  });

  it('filters out invalid roles and dedupes', () => {
    const rows = [
      { moduleKey: 'fleet', sortIndex: 0, hiddenForRoles: ['admin', 'admin', 'ghost-role'] },
    ];
    expect(resolveHidden(rows, VALID, ROLES)).toEqual({ fleet: ['admin'] });
  });

  it('tolerates non-array hiddenForRoles', () => {
    const rows = [{ moduleKey: 'fleet', sortIndex: 0, hiddenForRoles: 'nope' }];
    expect(resolveHidden(rows, VALID, ROLES)).toEqual({});
  });
});

describe('sanitizeHidden', () => {
  it('keeps only valid modules and roles', () => {
    const input = { settings: ['admin'], ghost: ['admin'], fleet: ['driver', 'bad'] };
    expect(sanitizeHidden(input, VALID, ROLES)).toEqual({
      settings: ['admin'],
      fleet: ['driver'],
    });
  });

  it('returns empty object for non-object input', () => {
    expect(sanitizeHidden(null, VALID, ROLES)).toEqual({});
    expect(sanitizeHidden(undefined, VALID, ROLES)).toEqual({});
  });
});

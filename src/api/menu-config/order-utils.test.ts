import { describe, expect, it } from 'vitest';
import { resolveMenuOrder, buildOrderRows } from './order-utils';

const VALID = ['dashboard', 'users', 'fleet', 'billing', 'settings'];

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

/**
 * Pure helpers for the menu ordering logic.
 *
 * Kept free of Strapi so they can be unit-tested in isolation. The service
 * persists one `menu-config` row per module ({ moduleKey, sortIndex }); these
 * helpers turn those rows into a stable, gap-free ordered list of module keys.
 */

export interface MenuOrderRow {
  moduleKey: string;
  sortIndex: number;
}

/**
 * Resolve the effective menu order.
 *
 * - Known keys are sorted by their saved `sortIndex` (ascending).
 * - Any `validKeys` without a saved row are appended, preserving their original
 *   declaration order, so newly added modules never disappear from the menu.
 * - Saved rows pointing at unknown keys are ignored (defensive against stale data).
 */
export function resolveMenuOrder(rows: MenuOrderRow[], validKeys: string[]): string[] {
  const valid = new Set(validKeys);
  const indexByKey = new Map<string, number>();
  for (const row of rows) {
    if (valid.has(row.moduleKey)) {
      indexByKey.set(row.moduleKey, row.sortIndex);
    }
  }

  const saved = validKeys
    .filter((key) => indexByKey.has(key))
    .sort((a, b) => indexByKey.get(a)! - indexByKey.get(b)!);

  const unsaved = validKeys.filter((key) => !indexByKey.has(key));

  return [...saved, ...unsaved];
}

/**
 * Normalize an incoming ordered list of keys into persistable rows.
 *
 * Drops unknown/duplicate keys and re-assigns a dense `sortIndex` (0..n) so the
 * stored order is always clean regardless of what the client sent.
 */
export function buildOrderRows(orderedKeys: string[], validKeys: string[]): MenuOrderRow[] {
  const valid = new Set(validKeys);
  const seen = new Set<string>();
  const rows: MenuOrderRow[] = [];

  for (const moduleKey of orderedKeys) {
    if (!valid.has(moduleKey) || seen.has(moduleKey)) continue;
    seen.add(moduleKey);
    rows.push({ moduleKey, sortIndex: rows.length });
  }

  return rows;
}

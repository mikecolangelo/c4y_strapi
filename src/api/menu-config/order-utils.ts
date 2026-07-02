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

export interface MenuLayoutRow extends MenuOrderRow {
  /** Roles para los que el item está oculto del menú (no afecta el acceso). */
  hiddenForRoles?: unknown;
}

/** Mapa { moduleKey: rolesOcultos[] }. */
export type HiddenMap = Record<string, string[]>;

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

/** Coacciona un valor desconocido a una lista de roles válidos, sin duplicados. */
function toRoleList(value: unknown, validRoles: string[]): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(validRoles);
  return [...new Set(value.filter((r): r is string => typeof r === 'string' && allowed.has(r)))];
}

/**
 * Construye el mapa de roles ocultos a partir de las filas guardadas.
 * Ignora módulos desconocidos y roles inválidos; omite las entradas vacías.
 */
export function resolveHidden(
  rows: MenuLayoutRow[],
  validKeys: string[],
  validRoles: string[]
): HiddenMap {
  const valid = new Set(validKeys);
  const map: HiddenMap = {};
  for (const row of rows) {
    if (!valid.has(row.moduleKey)) continue;
    const roles = toRoleList(row.hiddenForRoles, validRoles);
    if (roles.length > 0) map[row.moduleKey] = roles;
  }
  return map;
}

/**
 * Sanea el mapa de ocultos entrante (PUT) a la forma persistible:
 * solo módulos válidos, solo roles válidos, sin duplicados.
 */
export function sanitizeHidden(
  input: unknown,
  validKeys: string[],
  validRoles: string[]
): HiddenMap {
  if (!input || typeof input !== 'object') return {};
  const valid = new Set(validKeys);
  const out: HiddenMap = {};
  for (const [moduleKey, roles] of Object.entries(input as Record<string, unknown>)) {
    if (!valid.has(moduleKey)) continue;
    out[moduleKey] = toRoleList(roles, validRoles);
  }
  return out;
}

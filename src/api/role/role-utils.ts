/**
 * Pure helpers for the dynamic role system.
 *
 * Kept free of Strapi so they can be unit-tested in isolation. They merge the
 * static BASE roles (admin/driver/lead) with the custom roles stored in the
 * `role` content-type and decide whether a role may be deleted.
 */

import { ROLES, type PermissionRole } from '../../config/permission-modules';

/** Minimal shape of a stored `role` row needed by these helpers. */
export interface RoleRow {
  key: string;
  isSystem?: boolean | null;
  isActive?: boolean | null;
}

/**
 * Build the effective, ordered list of role keys.
 *
 * BASE roles always come first (in their declared order) so admin/driver/lead
 * keep their canonical position even if the `role` table is empty or partial.
 * Custom roles are appended in the order they were provided, de-duplicated.
 */
export function mergeRoleKeys(rows: RoleRow[]): string[] {
  const base = [...ROLES] as string[];
  const seen = new Set(base);
  const merged = [...base];

  for (const row of rows) {
    const key = typeof row?.key === 'string' ? row.key.trim() : '';
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(key);
  }

  return merged;
}

/** Whether a role key belongs to the immutable BASE set. */
export function isBaseRole(key: string): key is PermissionRole {
  return (ROLES as readonly string[]).includes(key);
}

export interface DeleteGuard {
  /** True when the role is safe to delete. */
  allowed: boolean;
  /** Stable reason code when blocked (for typed handling/tests). */
  reason?: 'not_found' | 'system' | 'in_use';
  /** Number of user-profiles still assigned to the role (when in_use). */
  contacts?: number;
}

/**
 * Decide whether a role can be deleted.
 *
 * - `not_found`: no matching role row.
 * - `system`: base/system roles are permanent.
 * - `in_use`: at least one user-profile still has this role assigned.
 */
export function evaluateDeleteGuard(
  row: RoleRow | null | undefined,
  contacts: number
): DeleteGuard {
  if (!row) return { allowed: false, reason: 'not_found' };
  if (row.isSystem || isBaseRole(row.key)) {
    return { allowed: false, reason: 'system' };
  }
  if (contacts > 0) {
    return { allowed: false, reason: 'in_use', contacts };
  }
  return { allowed: true };
}

/** Normalize a free-text role key into a stable slug ("Taller Pro" -> "taller-pro"). */
export function normalizeRoleKey(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

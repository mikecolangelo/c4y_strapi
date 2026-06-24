/**
 * Helpers to keep the "Authenticated" role's REST permissions in sync.
 *
 * Strapi disables the REST permissions of newly created content-types by
 * default. When a content-type the admin panel relies on is left disabled, the
 * panel receives a 403 and the feature silently fails (e.g. the Services page
 * showing "No pudimos cargar los servicios"). These helpers grant the required
 * permissions idempotently on bootstrap, so they self-heal on a fresh database.
 */
import type { Core } from '@strapi/strapi';

/** CRUD REST actions the panel needs for the Service catalog content-type. */
export const SERVICE_CATALOG_ACTIONS = [
  'api::service.service.find',
  'api::service.service.findOne',
  'api::service.service.create',
  'api::service.service.update',
  'api::service.service.delete',
] as const;

/** REST actions the panel needs for the contact (user) comment timeline. */
export const USER_COMMENT_ACTIONS = [
  'api::user-comment.user-comment.find',
  'api::user-comment.user-comment.findOne',
  'api::user-comment.user-comment.create',
  'api::user-comment.user-comment.delete',
] as const;

/**
 * REST actions the panel needs on the user-profile content-type: listing and
 * reading contacts, plus updating (used by contact editing and by persisting
 * each user's theme preference).
 */
export const USER_PROFILE_ACTIONS = [
  'api::user-profile.user-profile.find',
  'api::user-profile.user-profile.findOne',
  'api::user-profile.user-profile.update',
] as const;

/** CRUD REST actions the panel needs for the Fleet (vehicles) content-type. */
export const FLEET_ACTIONS = [
  'api::fleet.fleet.find',
  'api::fleet.fleet.findOne',
  'api::fleet.fleet.create',
  'api::fleet.fleet.update',
  'api::fleet.fleet.delete',
] as const;

/** Custom role-permission endpoints consumed by the sidebar/middleware. */
export const ROLE_PERMISSION_ACTIONS = [
  'api::role-permission.role-permission.mine',
  'api::role-permission.role-permission.matrix',
  'api::role-permission.role-permission.modules',
  'api::role-permission.role-permission.updateMatrix',
] as const;

/** Custom menu-config endpoints: read the menu order, and reorder it (admin). */
export const MENU_CONFIG_ACTIONS = [
  'api::menu-config.menu-config.order',
  'api::menu-config.menu-config.updateOrder',
] as const;

/**
 * Idempotently grants the given users-permissions `actions` to the
 * "Authenticated" role. Only missing permissions are created, so it is safe to
 * run on every bootstrap.
 *
 * @returns the number of permissions newly created.
 */
export async function ensureAuthenticatedPermissions(
  strapi: Core.Strapi,
  actions: readonly string[],
  label?: string
): Promise<number> {
  try {
    const authRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authRole) {
      strapi.log.warn('[permissions] Authenticated role not found');
      return 0;
    }

    let granted = 0;
    for (const action of actions) {
      const existing = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: authRole.id } });

      if (!existing) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({ data: { action, role: authRole.id } });
        granted += 1;
      }
    }

    if (granted > 0 && label) {
      strapi.log.info(`[permissions] ${granted} ${label} endpoints enabled for Authenticated`);
    }

    return granted;
  } catch (error) {
    strapi.log.error(
      `[permissions] Failed to grant ${label ?? 'authenticated'} access:`,
      error as Error
    );
    return 0;
  }
}

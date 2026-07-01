/**
 * role controller
 *
 * Admin-gated CRUD for the dynamic role system. Mirrors the defense-in-depth of
 * role-permission.updateMatrix: requests carrying a user JWT must resolve to a
 * user-profile with role === 'admin'; trusted server API tokens (no
 * ctx.state.user) are allowed through.
 */

import { factories } from '@strapi/strapi';
import { evaluateDeleteGuard, normalizeRoleKey, type RoleRow } from '../role-utils';

const UID = 'api::role.role';
const ROLE_PERMISSION_UID = 'api::role-permission.role-permission';
const MENU_CONFIG_UID = 'api::menu-config.menu-config';
const USER_PROFILE_UID = 'api::user-profile.user-profile';

/** Resolve the caller and verify admin, returning false when forbidden. */
async function requireAdmin(strapi: any, ctx: any): Promise<boolean> {
  const user = ctx.state.user;
  if (!user?.email) return true; // trusted server token
  const profile = await strapi.db.query(USER_PROFILE_UID).findOne({
    where: { email: user.email },
    select: ['role'],
  });
  return profile?.role === 'admin';
}

/** Count how many user-profiles still have the given role assigned. */
async function countContactsForRole(strapi: any, key: string): Promise<number> {
  return strapi.db.query(USER_PROFILE_UID).count({ where: { role: key } });
}

export default factories.createCoreController(UID, ({ strapi }) => ({
  /** List every role (base + custom). Open to authenticated users (read-only). */
  async list(ctx) {
    try {
      const roles = await strapi.service(UID).listRoles();
      return ctx.send({ data: roles });
    } catch (error: any) {
      strapi.log.error('Error listando roles:', error);
      return ctx.internalServerError('Error al obtener los roles');
    }
  },

  /** Create a custom role. Admin only. */
  async createRole(ctx) {
    if (!(await requireAdmin(strapi, ctx))) {
      return ctx.forbidden('Solo los administradores pueden crear roles');
    }

    const body = ctx.request.body?.data ?? ctx.request.body ?? {};
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    if (!label) return ctx.badRequest("Se requiere 'label'");

    const key = normalizeRoleKey(body.key || label);
    if (!key) return ctx.badRequest('No se pudo derivar una clave válida del nombre');

    const color =
      typeof body.color === 'string' && body.color.trim() ? body.color.trim() : undefined;

    try {
      const existing = await strapi.db.query(UID).findOne({ where: { key } });
      if (existing) {
        return ctx.conflict(`Ya existe un rol con la clave '${key}'`);
      }

      const created = await strapi.db.query(UID).create({
        data: { key, label, color, isSystem: false, isActive: true },
      });

      // Seed the new role's permission rows (all-false) so the matrix is complete.
      await strapi.service(ROLE_PERMISSION_UID).seedDefaults();

      return ctx.send({ data: created });
    } catch (error: any) {
      strapi.log.error('Error creando rol:', error);
      return ctx.badRequest(error.message || 'Error al crear el rol');
    }
  },

  /** Update a role's label/color/isActive. `key` is immutable for system roles. */
  async updateRole(ctx) {
    if (!(await requireAdmin(strapi, ctx))) {
      return ctx.forbidden('Solo los administradores pueden modificar roles');
    }

    const { id } = ctx.params;
    const body = ctx.request.body?.data ?? ctx.request.body ?? {};

    try {
      const row: RoleRow & { id: number } = await strapi.db.query(UID).findOne({ where: { id } });
      if (!row) return ctx.notFound('Rol no encontrado');

      const data: Record<string, unknown> = {};
      if (typeof body.label === 'string' && body.label.trim()) data.label = body.label.trim();
      if (typeof body.color === 'string') data.color = body.color.trim() || null;
      if (typeof body.isActive === 'boolean') data.isActive = body.isActive;

      // Changing the key is only allowed for non-system roles.
      if (typeof body.key === 'string' && body.key.trim()) {
        if (row.isSystem) {
          return ctx.badRequest('No se puede cambiar la clave de un rol del sistema');
        }
        const nextKey = normalizeRoleKey(body.key);
        if (nextKey && nextKey !== row.key) {
          const clash = await strapi.db.query(UID).findOne({ where: { key: nextKey } });
          if (clash) return ctx.conflict(`Ya existe un rol con la clave '${nextKey}'`);
          data.key = nextKey;
        }
      }

      const updated = await strapi.db.query(UID).update({ where: { id }, data });
      return ctx.send({ data: updated });
    } catch (error: any) {
      strapi.log.error('Error actualizando rol:', error);
      return ctx.badRequest(error.message || 'Error al actualizar el rol');
    }
  },

  /**
   * Delete a custom role. Blocked when system or still assigned to any contact.
   * On success also removes the role's role-permission rows and strips the key
   * from every menu-config.hiddenForRoles array.
   */
  async deleteRole(ctx) {
    if (!(await requireAdmin(strapi, ctx))) {
      return ctx.forbidden('Solo los administradores pueden eliminar roles');
    }

    const { id } = ctx.params;

    try {
      const row: RoleRow & { id: number } = await strapi.db.query(UID).findOne({ where: { id } });
      if (!row) return ctx.notFound('Rol no encontrado');

      const contacts = await countContactsForRole(strapi, row.key);
      const guard = evaluateDeleteGuard(row, contacts);

      if (!guard.allowed) {
        if (guard.reason === 'system') {
          return ctx.badRequest('Los roles del sistema no se pueden eliminar');
        }
        if (guard.reason === 'in_use') {
          return ctx.conflict(
            `No se puede eliminar: ${guard.contacts} contacto(s) tienen este rol asignado`,
            { contacts: guard.contacts }
          );
        }
        return ctx.notFound('Rol no encontrado');
      }

      // Remove the role's permission rows.
      await strapi.db.query(ROLE_PERMISSION_UID).deleteMany({ where: { role: row.key } });

      // Strip the role key from every menu-config.hiddenForRoles array.
      const menuRows = await strapi.db.query(MENU_CONFIG_UID).findMany({});
      for (const menu of menuRows) {
        const hidden = Array.isArray(menu.hiddenForRoles) ? menu.hiddenForRoles : [];
        if (!hidden.includes(row.key)) continue;
        await strapi.db.query(MENU_CONFIG_UID).update({
          where: { id: menu.id },
          data: { hiddenForRoles: hidden.filter((r: string) => r !== row.key) },
        });
      }

      await strapi.db.query(UID).delete({ where: { id } });

      return ctx.send({ data: { id: row.id, key: row.key, deleted: true } });
    } catch (error: any) {
      strapi.log.error('Error eliminando rol:', error);
      return ctx.badRequest(error.message || 'Error al eliminar el rol');
    }
  },
}));

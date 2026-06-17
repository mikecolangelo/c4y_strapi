/**
 * role-permission controller
 */

import { factories } from '@strapi/strapi';

const UID = 'api::role-permission.role-permission';

const service = (strapi: any) => strapi.service(UID);

export default factories.createCoreController(UID, ({ strapi }) => ({
  /** Devuelve la matriz completa de permisos + metadatos de módulos. */
  async matrix(ctx) {
    try {
      const [matrix, modules] = await Promise.all([
        service(strapi).getMatrix(),
        service(strapi).getModules(),
      ]);
      return ctx.send({ data: { matrix, modules } });
    } catch (error: any) {
      strapi.log.error('Error obteniendo matriz de permisos:', error);
      return ctx.internalServerError('Error al obtener los permisos');
    }
  },

  /** Lista de módulos disponibles (para construir la UI). */
  async modules(ctx) {
    return ctx.send({ data: service(strapi).getModules() });
  },

  /**
   * Permisos del usuario autenticado (según su rol en user-profile).
   * Si no hay sesión o no se encuentra el perfil, se asume rol "lead" (sin acceso).
   */
  async mine(ctx) {
    try {
      const user = ctx.state.user;
      let role = 'lead';

      if (user?.email) {
        const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
          where: { email: user.email },
          select: ['role'],
        });
        if (profile?.role) role = profile.role;
      }

      const matrix = await service(strapi).getMatrix();
      return ctx.send({ data: { role, permissions: matrix[role] ?? {} } });
    } catch (error: any) {
      strapi.log.error('Error obteniendo permisos del usuario:', error);
      return ctx.internalServerError('Error al obtener los permisos del usuario');
    }
  },

  /** Reemplaza la matriz de permisos. Solo debe invocarse por un admin. */
  async updateMatrix(ctx) {
    const { matrix } = ctx.request.body || {};
    if (!matrix || typeof matrix !== 'object') {
      return ctx.badRequest("Se requiere el objeto 'matrix'");
    }

    try {
      const updated = await service(strapi).updateMatrix(matrix);
      return ctx.send({ data: { matrix: updated } });
    } catch (error: any) {
      strapi.log.error('Error actualizando matriz de permisos:', error);
      return ctx.badRequest(error.message || 'Error al actualizar los permisos');
    }
  },
}));

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

  /** Reemplaza la matriz de permisos. Solo admin (o API token de servidor). */
  async updateMatrix(ctx) {
    // Defensa en profundidad: si la petición viene con sesión de usuario (JWT),
    // exigir que su perfil tenga rol admin. Las peticiones con API token de
    // servidor (sin ctx.state.user) se consideran de confianza.
    const user = ctx.state.user;
    if (user?.email) {
      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
        select: ['role'],
      });
      if (profile?.role !== 'admin') {
        return ctx.forbidden('Solo los administradores pueden modificar los permisos');
      }
    }

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

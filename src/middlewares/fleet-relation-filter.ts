export default (config, { strapi }) => {
  return async (ctx, next) => {
    const path = ctx.path;
    const vehicleId = ctx.query?.filters?.vehicle?.id?.$eq;

    if (!vehicleId) {
      return next();
    }

    let uid: string | null = null;
    let populate: any = {};

    if (path === '/api/fleet-notes') {
      uid = 'api::fleet-note.fleet-note';
    } else if (path === '/api/fleet-statuses') {
      uid = 'api::fleet-status.fleet-status';
      populate = { images: true };
    } else if (path === '/api/vehicle-states') {
      uid = 'api::vehicle-state.vehicle-state';
      populate = { images: true };
    } else if (path === '/api/fleet-documents') {
      uid = 'api::fleet-document.fleet-document';
      populate = { files: true };
    } else {
      return next();
    }

    // Este atajo responde directamente y nunca llama a next(), por lo que
    // se salta por completo el router de Strapi y sus policies. Replicamos
    // acá la autenticación (JWT) + autorización (matriz de permisos, módulo
    // "fleet") que el pipeline normal aplicaría, para no dejar estas 4 rutas
    // abiertas a cualquiera que adivine un vehicleId.
    const jwtService = strapi.plugin('users-permissions').service('jwt');
    let decoded: { id?: number } | null = null;
    try {
      decoded = await jwtService.getToken(ctx);
    } catch {
      decoded = null;
    }
    if (!decoded?.id) {
      ctx.status = 401;
      ctx.body = {
        error: {
          status: 401,
          name: 'UnauthorizedError',
          message: 'Missing or invalid credentials',
        },
      };
      return;
    }

    const authUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: decoded.id },
      select: ['email'],
    });
    const requester = authUser?.email
      ? await strapi.db.query('api::user-profile.user-profile').findOne({
          where: { email: authUser.email },
          select: ['role'],
        })
      : null;
    const role: string = requester?.role ?? 'lead';
    const isAdmin = role === 'admin' || role === 'super-admin';

    if (!isAdmin) {
      const hasPermission: boolean = await strapi
        .service('api::role-permission.role-permission')
        .can(role, 'fleet', 'read');
      if (!hasPermission) {
        ctx.status = 403;
        ctx.body = { error: { status: 403, name: 'ForbiddenError', message: 'Forbidden' } };
        return;
      }
    }

    try {
      const entries = await strapi.db.query(uid).findMany({
        where: { vehicle: vehicleId },
        populate,
        orderBy: { createdAt: 'desc' },
      });

      ctx.status = 200;
      ctx.body = {
        data: entries,
        meta: {
          pagination: {
            page: 1,
            pageSize: entries.length,
            pageCount: 1,
            total: entries.length,
          },
        },
      };
      return;
    } catch (error) {
      strapi.log.error(
        `[fleet-relation-filter] Error filtering ${path} by vehicle ${vehicleId}:`,
        error
      );
      return next();
    }
  };
};

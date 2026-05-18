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
      strapi.log.error(`[fleet-relation-filter] Error filtering ${path} by vehicle ${vehicleId}:`, error);
      return next();
    }
  };
};

export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Intercept POST /api/fleets/:documentId and treat it as PUT for partial updates
    if (
      ctx.method === 'POST' &&
      ctx.path.match(/^\/api\/fleets\/[^\/]+$/)
    ) {
      ctx.method = 'PUT';
    }
    return next();
  };
};

/**
 * Middleware para permitir acceso público a rutas específicas
 */

export default () => {
  return async (ctx, next) => {
    // Bypass autenticación para esta ruta
    ctx.state.isPublic = true;
    return next();
  };
};

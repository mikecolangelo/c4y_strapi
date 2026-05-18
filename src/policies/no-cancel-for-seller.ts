import type { Context } from 'koa';

/**
 * Policy que permite a cualquier usuario autenticado cancelar órdenes de servicio.
 * (Anteriormente restringido solo a administradores)
 */
export default () => {
  return async (ctx: Context, next: () => Promise<unknown>) => {
    // Permitir cancelación sin restricciones de rol
    return next();
  };
};

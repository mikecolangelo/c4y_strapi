"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Policy que permite a cualquier usuario autenticado cancelar órdenes de servicio.
 * (Anteriormente restringido solo a administradores)
 */
exports.default = () => {
    return async (ctx, next) => {
        // Permitir cancelación sin restricciones de rol
        return next();
    };
};

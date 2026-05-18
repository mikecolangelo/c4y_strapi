"use strict";
/**
 * Middleware para permitir acceso público a rutas específicas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = () => {
    return async (ctx, next) => {
        // Bypass autenticación para esta ruta
        ctx.state.isPublic = true;
        return next();
    };
};

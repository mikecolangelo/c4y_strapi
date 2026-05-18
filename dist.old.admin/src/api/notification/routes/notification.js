"use strict";
/**
 * notification router
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupRoute = void 0;
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreRouter('api::notification.notification', {
    config: {
        find: {
            middlewares: [],
        },
        findOne: {
            middlewares: [],
        },
        create: {
            middlewares: [],
        },
        update: {
            middlewares: [],
        },
        delete: {
            middlewares: [],
        },
    },
});
// Ruta personalizada para limpieza de duplicados
exports.cleanupRoute = {
    routes: [
        {
            method: 'POST',
            path: '/notifications/cleanup-duplicates',
            handler: 'notification.cleanupDuplicates',
            config: {
                auth: false, // Cambiar a true si se requiere autenticación
            },
        },
    ],
};

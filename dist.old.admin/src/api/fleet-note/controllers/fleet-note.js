"use strict";
/**
 * fleet-note controller
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::fleet-note.fleet-note', ({ strapi }) => ({
    async create(ctx) {
        const { data } = ctx.request.body;
        // Validar que authorDocumentId esté presente y no sea null
        if (!(data === null || data === void 0 ? void 0 : data.authorDocumentId) || data.authorDocumentId === null || data.authorDocumentId === undefined) {
            return ctx.badRequest('authorDocumentId es requerido y no puede ser null');
        }
        // Validar que authorDocumentId no esté vacío
        if (typeof data.authorDocumentId === 'string' && data.authorDocumentId.trim() === '') {
            return ctx.badRequest('authorDocumentId no puede estar vacío');
        }
        // Llamar al método create del controller base
        return await super.create(ctx);
    },
    async update(ctx) {
        const { data } = ctx.request.body;
        // Si se está actualizando authorDocumentId, validar que no sea null
        if ((data === null || data === void 0 ? void 0 : data.authorDocumentId) !== undefined) {
            if (data.authorDocumentId === null || data.authorDocumentId === undefined) {
                return ctx.badRequest('authorDocumentId no puede ser null');
            }
            // Validar que authorDocumentId no esté vacío
            if (typeof data.authorDocumentId === 'string' && data.authorDocumentId.trim() === '') {
                return ctx.badRequest('authorDocumentId no puede estar vacío');
            }
        }
        // Llamar al método update del controller base
        return await super.update(ctx);
    },
}));

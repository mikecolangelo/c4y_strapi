"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreController('api::supply-request.supply-request', ({ strapi }) => ({
    // Sobreescribir find para permitir acceso con API token
    // Transformar resultados al formato Strapi v4 esperado por el frontend
    async find(ctx) {
        const results = await strapi.entityService.findMany('api::supply-request.supply-request', {
            sort: { requestedAt: 'desc' },
            populate: ['requester', 'approvedBy', 'supplyItem'],
        });
        // Transformar al formato Strapi v4 { data: [ { id, attributes: {...} } ] }
        const transformedData = results.map((item) => ({
            id: item.id,
            documentId: item.documentId,
            attributes: {
                ...item,
                requester: item.requester ? {
                    data: {
                        id: item.requester.id,
                        documentId: item.requester.documentId,
                        attributes: {
                            displayName: item.requester.displayName,
                            email: item.requester.email,
                        }
                    }
                } : undefined,
                approvedBy: item.approvedBy ? {
                    data: {
                        id: item.approvedBy.id,
                        documentId: item.approvedBy.documentId,
                        attributes: {
                            displayName: item.approvedBy.displayName,
                            email: item.approvedBy.email,
                        }
                    }
                } : undefined,
                supplyItem: item.supplyItem ? {
                    data: {
                        id: item.supplyItem.id,
                        documentId: item.supplyItem.documentId,
                        attributes: {
                            name: item.supplyItem.name,
                            stock: item.supplyItem.stock,
                        }
                    }
                } : undefined,
            }
        }));
        return { data: transformedData };
    },
    // Sobreescribir create para permitir acceso con API token
    async create(ctx) {
        const { data } = ctx.request.body;
        // Generar número de solicitud único
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const requestNumber = `SOL-${timestamp}-${random}`;
        // Asignar el usuario actual como solicitante (si está autenticado)
        const user = ctx.state.user;
        if (user) {
            const userProfile = await strapi.db.query('api::user-profile.user-profile').findOne({
                where: { email: user.email }
            });
            if (userProfile) {
                data.requester = userProfile.id;
            }
        }
        data.requestNumber = requestNumber;
        data.requestedAt = new Date().toISOString();
        data.status = 'pendiente';
        // Crear directamente usando el servicio
        const result = await strapi.entityService.create('api::supply-request.supply-request', {
            data: data,
        });
        return { data: result };
    },
    // Helper para verificar permisos (admin o seller)
    async checkAdminOrSellerPermission(ctx) {
        const user = ctx.state.user;
        const userRoleHeader = ctx.request.headers['x-user-role'];
        const userRole = Array.isArray(userRoleHeader) ? userRoleHeader[0] : userRoleHeader;
        // Si hay usuario autenticado por JWT
        if (user) {
            const userProfile = await strapi.db.query('api::user-profile.user-profile').findOne({
                where: { email: user.email }
            });
            if (!userProfile || !['admin', 'seller'].includes(userProfile.role)) {
                return {
                    allowed: false,
                    error: ctx.forbidden('Solo administradores y vendedores pueden realizar esta acción')
                };
            }
            return { allowed: true, userProfile };
        }
        // Si no hay usuario JWT, verificar por API Token + header x-user-role
        // El API Token ya fue verificado por el middleware de Strapi
        if (userRole && ['admin', 'seller'].includes(userRole)) {
            // Buscar un usuario con rol admin o seller para asignar como aprobador
            const userProfile = await strapi.db.query('api::user-profile.user-profile').findOne({
                where: { role: userRole },
                orderBy: { id: 'asc' }
            });
            if (userProfile) {
                return { allowed: true, userProfile };
            }
        }
        return {
            allowed: false,
            error: ctx.unauthorized('No autorizado')
        };
    },
    async approve(ctx) {
        var _a;
        const { id } = ctx.params;
        const { notes } = ((_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a.data) || {};
        // Verificar permisos
        const permissionCheck = await this.checkAdminOrSellerPermission(ctx);
        if (!permissionCheck.allowed) {
            return permissionCheck.error;
        }
        const userProfile = permissionCheck.userProfile;
        // Obtener la solicitud
        const request = await strapi.db.query('api::supply-request.supply-request').findOne({
            where: { id },
            populate: ['supplyItem']
        });
        if (!request) {
            return ctx.notFound('Solicitud no encontrada');
        }
        if (request.status !== 'pendiente') {
            return ctx.badRequest('La solicitud ya ha sido procesada');
        }
        // Verificar stock disponible
        if (request.supplyItem && request.supplyItem.stock < request.quantity) {
            return ctx.badRequest('Stock insuficiente para aprobar esta solicitud');
        }
        // Actualizar stock del insumo
        if (request.supplyItem) {
            await strapi.db.query('api::supply-item.supply-item').update({
                where: { id: request.supplyItem.id },
                data: {
                    stock: request.supplyItem.stock - request.quantity
                }
            });
        }
        // Actualizar solicitud
        const updatedRequest = await strapi.db.query('api::supply-request.supply-request').update({
            where: { id },
            data: {
                status: 'aprobado',
                approvedBy: userProfile.id,
                approvedAt: new Date().toISOString(),
                notes: notes || request.notes
            }
        });
        return { data: updatedRequest };
    },
    async reject(ctx) {
        var _a;
        const { id } = ctx.params;
        const { notes } = ((_a = ctx.request.body) === null || _a === void 0 ? void 0 : _a.data) || {};
        // Verificar permisos
        const permissionCheck = await this.checkAdminOrSellerPermission(ctx);
        if (!permissionCheck.allowed) {
            return permissionCheck.error;
        }
        const userProfile = permissionCheck.userProfile;
        // Obtener la solicitud
        const request = await strapi.db.query('api::supply-request.supply-request').findOne({
            where: { id }
        });
        if (!request) {
            return ctx.notFound('Solicitud no encontrada');
        }
        if (request.status !== 'pendiente') {
            return ctx.badRequest('La solicitud ya ha sido procesada');
        }
        // Actualizar solicitud
        const updatedRequest = await strapi.db.query('api::supply-request.supply-request').update({
            where: { id },
            data: {
                status: 'rechazado',
                approvedBy: userProfile.id,
                approvedAt: new Date().toISOString(),
                notes: notes || request.notes
            }
        });
        return { data: updatedRequest };
    },
    async deliver(ctx) {
        const { id } = ctx.params;
        // Verificar permisos
        const permissionCheck = await this.checkAdminOrSellerPermission(ctx);
        if (!permissionCheck.allowed) {
            return permissionCheck.error;
        }
        // Obtener la solicitud
        const request = await strapi.db.query('api::supply-request.supply-request').findOne({
            where: { id }
        });
        if (!request) {
            return ctx.notFound('Solicitud no encontrada');
        }
        if (request.status !== 'aprobado') {
            return ctx.badRequest('La solicitud debe estar aprobada para marcarla como entregada');
        }
        // Actualizar solicitud
        const updatedRequest = await strapi.db.query('api::supply-request.supply-request').update({
            where: { id },
            data: {
                status: 'entregado',
                deliveredAt: new Date().toISOString()
            }
        });
        return { data: updatedRequest };
    }
}));

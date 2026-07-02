import { factories } from '@strapi/strapi';

interface PermissionCheckResult {
  allowed: boolean;
  userProfile?: any;
  error?: any;
}

export default factories.createCoreController(
  'api::supply-request.supply-request',
  ({ strapi }) => ({
    // Sobreescribir find para permitir acceso con API token
    // Transformar resultados al formato Strapi v4 esperado por el frontend
    async find(ctx) {
      const results = (await strapi.entityService.findMany('api::supply-request.supply-request', {
        sort: { requestedAt: 'desc' },
        populate: ['requester', 'approvedBy', 'supplyItem'],
      })) as any[];

      // Transformar al formato Strapi v4 { data: [ { id, attributes: {...} } ] }
      const transformedData = results.map((item: any) => ({
        id: item.id,
        documentId: item.documentId,
        attributes: {
          ...item,
          requester: item.requester
            ? {
                data: {
                  id: item.requester.id,
                  documentId: item.requester.documentId,
                  attributes: {
                    displayName: item.requester.displayName,
                    email: item.requester.email,
                  },
                },
              }
            : undefined,
          approvedBy: item.approvedBy
            ? {
                data: {
                  id: item.approvedBy.id,
                  documentId: item.approvedBy.documentId,
                  attributes: {
                    displayName: item.approvedBy.displayName,
                    email: item.approvedBy.email,
                  },
                },
              }
            : undefined,
          supplyItem: item.supplyItem
            ? {
                data: {
                  id: item.supplyItem.id,
                  documentId: item.supplyItem.documentId,
                  attributes: {
                    name: item.supplyItem.name,
                    stock: item.supplyItem.stock,
                  },
                },
              }
            : undefined,
        },
      }));

      return { data: transformedData };
    },

    // Sobreescribir findOne para permitir acceso con API token
    async findOne(ctx) {
      const { id } = ctx.params;

      const result = (await strapi.entityService.findOne('api::supply-request.supply-request', id, {
        populate: ['requester', 'approvedBy', 'supplyItem'],
      })) as any;

      if (!result) {
        return ctx.notFound('Solicitud no encontrada');
      }

      // Transformar al formato Strapi v4
      const transformedData = {
        id: result.id,
        documentId: result.documentId,
        attributes: {
          ...result,
          requester: result.requester
            ? {
                data: {
                  id: result.requester.id,
                  documentId: result.requester.documentId,
                  attributes: {
                    displayName: result.requester.displayName,
                    email: result.requester.email,
                  },
                },
              }
            : undefined,
          approvedBy: result.approvedBy
            ? {
                data: {
                  id: result.approvedBy.id,
                  documentId: result.approvedBy.documentId,
                  attributes: {
                    displayName: result.approvedBy.displayName,
                    email: result.approvedBy.email,
                  },
                },
              }
            : undefined,
          supplyItem: result.supplyItem
            ? {
                data: {
                  id: result.supplyItem.id,
                  documentId: result.supplyItem.documentId,
                  attributes: {
                    name: result.supplyItem.name,
                    stock: result.supplyItem.stock,
                  },
                },
              }
            : undefined,
        },
      };

      return { data: transformedData };
    },

    // Sobreescribir create para permitir acceso con API token
    async create(ctx) {
      const { data } = ctx.request.body;

      // Generar número de solicitud único
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      const requestNumber = `SOL-${timestamp}-${random}`;

      // Asignar el usuario actual como solicitante (si está autenticado)
      const user = ctx.state.user;
      if (user) {
        const userProfile = await strapi.db.query('api::user-profile.user-profile').findOne({
          where: { email: user.email },
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

    // Helper para verificar permisos (solo admin). Requiere sesión de usuario
    // real (ctx.state.user): no confiamos en headers que el propio cliente
    // controla para decidir privilegios.
    async checkAdminOrSellerPermission(ctx): Promise<PermissionCheckResult> {
      const user = ctx.state.user;
      if (!user) {
        return {
          allowed: false,
          error: ctx.unauthorized('No autorizado'),
        };
      }

      const userProfile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
      });

      if (!userProfile || !['admin'].includes(userProfile.role)) {
        return {
          allowed: false,
          error: ctx.forbidden('Solo administradores pueden realizar esta acción'),
        };
      }

      return { allowed: true, userProfile };
    },

    async approve(ctx) {
      const { id } = ctx.params;
      const { notes } = ctx.request.body?.data || {};

      // Verificar permisos
      const permissionCheck = await (this as any).checkAdminOrSellerPermission(ctx);
      if (!permissionCheck.allowed) {
        return permissionCheck.error;
      }
      const userProfile = permissionCheck.userProfile;

      // Obtener la solicitud
      const request = await strapi.db.query('api::supply-request.supply-request').findOne({
        where: { id },
        populate: ['supplyItem'],
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
            stock: request.supplyItem.stock - request.quantity,
          },
        });
      }

      // Actualizar solicitud
      const updatedRequest = await strapi.db.query('api::supply-request.supply-request').update({
        where: { id },
        data: {
          status: 'aprobado',
          approvedBy: userProfile.id,
          approvedAt: new Date().toISOString(),
          notes: notes || request.notes,
        },
      });

      return { data: updatedRequest };
    },

    async reject(ctx) {
      const { id } = ctx.params;
      const { notes } = ctx.request.body?.data || {};

      // Verificar permisos
      const permissionCheck = await (this as any).checkAdminOrSellerPermission(ctx);
      if (!permissionCheck.allowed) {
        return permissionCheck.error;
      }
      const userProfile = permissionCheck.userProfile;

      // Obtener la solicitud
      const request = await strapi.db.query('api::supply-request.supply-request').findOne({
        where: { id },
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
          notes: notes || request.notes,
        },
      });

      return { data: updatedRequest };
    },

    async deliver(ctx) {
      const { id } = ctx.params;

      // Verificar permisos
      const permissionCheck = await (this as any).checkAdminOrSellerPermission(ctx);
      if (!permissionCheck.allowed) {
        return permissionCheck.error;
      }

      // Obtener la solicitud
      const request = await strapi.db.query('api::supply-request.supply-request').findOne({
        where: { id },
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
          deliveredAt: new Date().toISOString(),
        },
      });

      return { data: updatedRequest };
    },
  })
);

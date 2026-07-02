import { factories } from '@strapi/strapi';

interface PermissionCheckResult {
  allowed: boolean;
  userProfile?: any;
  error?: any;
}

export default factories.createCoreController(
  'api::inventory-request.inventory-request',
  ({ strapi }) => ({
    async find(ctx) {
      const results = (await strapi.entityService.findMany(
        'api::inventory-request.inventory-request',
        {
          sort: { requestedAt: 'desc' },
          populate: ['requester', 'approvedBy', 'inventoryItem'],
        }
      )) as any[];

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
          inventoryItem: item.inventoryItem
            ? {
                data: {
                  id: item.inventoryItem.id,
                  documentId: item.inventoryItem.documentId,
                  attributes: {
                    code: item.inventoryItem.code,
                    description: item.inventoryItem.description,
                    stock: item.inventoryItem.stock,
                  },
                },
              }
            : undefined,
        },
      }));

      return { data: transformedData };
    },

    async findOne(ctx) {
      const { id } = ctx.params;

      const result = (await strapi.entityService.findOne(
        'api::inventory-request.inventory-request',
        id,
        {
          populate: ['requester', 'approvedBy', 'inventoryItem'],
        }
      )) as any;

      if (!result) {
        return ctx.notFound('Solicitud no encontrada');
      }

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
          inventoryItem: result.inventoryItem
            ? {
                data: {
                  id: result.inventoryItem.id,
                  documentId: result.inventoryItem.documentId,
                  attributes: {
                    code: result.inventoryItem.code,
                    description: result.inventoryItem.description,
                    stock: result.inventoryItem.stock,
                  },
                },
              }
            : undefined,
        },
      };

      return { data: transformedData };
    },

    async create(ctx) {
      const { data } = ctx.request.body;

      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      const requestNumber = `SOL-PZA-${timestamp}-${random}`;

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

      const result = await strapi.entityService.create('api::inventory-request.inventory-request', {
        data: data,
      });

      return { data: result };
    },

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

      const permissionCheck = await (this as any).checkAdminOrSellerPermission(ctx);
      if (!permissionCheck.allowed) {
        return permissionCheck.error;
      }
      const userProfile = permissionCheck.userProfile;

      const request = await strapi.db.query('api::inventory-request.inventory-request').findOne({
        where: { id },
        populate: ['inventoryItem'],
      });

      if (!request) {
        return ctx.notFound('Solicitud no encontrada');
      }

      if (request.status !== 'pendiente') {
        return ctx.badRequest('La solicitud ya ha sido procesada');
      }

      if (request.inventoryItem && request.inventoryItem.stock < request.quantity) {
        return ctx.badRequest('Stock insuficiente para aprobar esta solicitud');
      }

      if (request.inventoryItem) {
        await strapi.db.query('api::inventory-item.inventory-item').update({
          where: { id: request.inventoryItem.id },
          data: {
            stock: request.inventoryItem.stock - request.quantity,
          },
        });
      }

      const updatedRequest = await strapi.db
        .query('api::inventory-request.inventory-request')
        .update({
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

      const permissionCheck = await (this as any).checkAdminOrSellerPermission(ctx);
      if (!permissionCheck.allowed) {
        return permissionCheck.error;
      }
      const userProfile = permissionCheck.userProfile;

      const request = await strapi.db.query('api::inventory-request.inventory-request').findOne({
        where: { id },
      });

      if (!request) {
        return ctx.notFound('Solicitud no encontrada');
      }

      if (request.status !== 'pendiente') {
        return ctx.badRequest('La solicitud ya ha sido procesada');
      }

      const updatedRequest = await strapi.db
        .query('api::inventory-request.inventory-request')
        .update({
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

      const permissionCheck = await (this as any).checkAdminOrSellerPermission(ctx);
      if (!permissionCheck.allowed) {
        return permissionCheck.error;
      }

      const request = await strapi.db.query('api::inventory-request.inventory-request').findOne({
        where: { id },
      });

      if (!request) {
        return ctx.notFound('Solicitud no encontrada');
      }

      if (request.status !== 'aprobado') {
        return ctx.badRequest('La solicitud debe estar aprobada para marcarla como entregada');
      }

      const updatedRequest = await strapi.db
        .query('api::inventory-request.inventory-request')
        .update({
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

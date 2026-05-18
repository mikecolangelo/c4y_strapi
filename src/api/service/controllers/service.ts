/**
 * service controller
 */

import { factories } from '@strapi/strapi';

const ADMIN_ROLES = ['admin', 'super-admin'];

const normalizeDecimalFields = (body: any) => {
  if (!body?.data) return;
  // Normalizar basePrice y agencyCost a números para evitar validación de tipo
  if (body.data.basePrice !== undefined) {
    const parsed = Number(body.data.basePrice);
    body.data.basePrice = Number.isFinite(parsed) ? parsed : 0;
  }
  if (body.data.agencyCost !== undefined) {
    const parsed = Number(body.data.agencyCost);
    body.data.agencyCost = Number.isFinite(parsed) ? parsed : 0;
  }
};

export default factories.createCoreController('api::service.service', ({ strapi: strapiInstance }) => ({
  async create(ctx) {
    normalizeDecimalFields(ctx.request.body);
    await this.sanitizeRestrictedFields(ctx);
    return await super.create(ctx);
  },

  async update(ctx) {
    normalizeDecimalFields(ctx.request.body);
    await this.sanitizeRestrictedFields(ctx);
    return await super.update(ctx);
  },

  async sanitizeRestrictedFields(ctx: any) {
    const user = ctx.state.user;
    if (!user) return;

    try {
      const profile = await strapiInstance.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
        select: ['role'],
      });

      const role = profile?.role;
      if (ADMIN_ROLES.includes(role)) return;

      // No es administrador: eliminar campos restringidos del payload
      const body = ctx.request.body;
      if (body?.data) {
        delete body.data.basePrice;
        delete body.data.agencyCost;
      }
    } catch (err) {
      // En caso de error al resolver el perfil, ser conservador y eliminar los campos
      const body = ctx.request.body;
      if (body?.data) {
        delete body.data.basePrice;
        delete body.data.agencyCost;
      }
      strapiInstance.log.warn('[service] Error verificando rol para campos restringidos:', err);
    }
  },
}));

/**
 * configuration controller
 */

import { factories } from '@strapi/strapi';

const REDACTED = '••••••••';

/** Redacta `value` en cualquier fila con isSecret=true antes de salir por la API pública. */
const redactSecrets = (entity: any) => {
  if (Array.isArray(entity)) return entity.map(redactSecrets);
  if (entity?.isSecret) return { ...entity, value: REDACTED };
  return entity;
};

export default factories.createCoreController('api::configuration.configuration', () => ({
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    return { data: redactSecrets(data), meta };
  },

  async findOne(ctx) {
    const response = await super.findOne(ctx);
    if (!response?.data) return response;
    return { ...response, data: redactSecrets(response.data) };
  },
}));

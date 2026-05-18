/**
 * Seeder para crear las categorías predefinidas de documentos vehiculares.
 * Se ejecuta una sola vez al iniciar Strapi si no hay registros existentes.
 */

const DEFAULT_CATEGORIES = [
  { name: 'Póliza de Seguro', slug: 'poliza-de-seguro', description: 'Póliza de seguro del vehículo', isActive: true, order: 0 },
  { name: 'Factura de Compra', slug: 'factura-de-compra', description: 'Factura original de compra del vehículo', isActive: true, order: 1 },
  { name: 'Contrato Compraventa', slug: 'contrato-compraventa', description: 'Contrato de compraventa del vehículo', isActive: true, order: 2 },
  { name: 'Registro Único de Propiedad Vehicular', slug: 'registro-unico-propiedad-vehicular', description: 'Registro único de propiedad vehicular', isActive: true, order: 3 },
  { name: 'Placa', slug: 'placa', description: 'Placa o matrícula del vehículo', isActive: true, order: 4 },
  { name: 'Certificado de Revisado Vehicular', slug: 'certificado-revisado-vehicular', description: 'Certificado de revisión técnica vehicular', isActive: true, order: 5 },
  { name: 'Revisado', slug: 'revisado', description: 'Documento de revisado del vehículo', isActive: true, order: 6 },
  { name: 'Otros', slug: 'otros', description: 'Otros documentos no listados', isActive: true, order: 7 },
];

export async function seedVehicleDocumentCategories(strapi: any) {
  try {
    const existing = await strapi.entityService.findMany('api::vehicle-document-category.vehicle-document-category', {
      filters: {},
    });

    if (existing && existing.length > 0) {
      strapi.log.info('[seed] vehicle-document-categories: ya existen registros, omitiendo seed.');
      return;
    }

    for (const category of DEFAULT_CATEGORIES) {
      await strapi.entityService.create('api::vehicle-document-category.vehicle-document-category', {
        data: category,
      });
    }

    strapi.log.info(`[seed] vehicle-document-categories: ${DEFAULT_CATEGORIES.length} categorías creadas.`);
  } catch (error) {
    strapi.log.error('[seed] Error en vehicle-document-categories:', error);
  }
}

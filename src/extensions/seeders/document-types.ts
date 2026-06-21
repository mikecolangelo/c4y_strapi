/**
 * Seeder para crear los tipos de documentos por defecto
 * Este seeder se ejecuta automáticamente al iniciar Strapi
 */

const defaultDocumentTypes = [
  {
    name: 'Póliza de Seguro del Vehículo',
    slug: 'poliza-seguro',
    description: 'Documento de seguro vigente del vehículo',
    isActive: true,
    order: 0,
  },
  {
    name: 'Factura de Compra del Automóvil',
    slug: 'factura-compra',
    description: 'Factura de compra del vehículo',
    isActive: true,
    order: 1,
  },
  {
    name: 'Contrato Compraventa',
    slug: 'contrato-compraventa',
    description: 'Contrato de compra-venta del vehículo',
    isActive: true,
    order: 2,
  },
  {
    name: 'Registro Único de Propiedad Vehicular',
    slug: 'registro-propiedad',
    description: 'Registro único de propiedad del vehículo',
    isActive: true,
    order: 3,
  },
  {
    name: 'Placa',
    slug: 'placa',
    description: 'Placa o matrícula del vehículo',
    isActive: true,
    order: 4,
  },
  {
    name: 'Certificado de Revisado Vehicular',
    slug: 'certificado-revisado',
    description: 'Certificado de revisión técnica vehicular',
    isActive: true,
    order: 5,
  },
  {
    name: 'Revisado',
    slug: 'revisado',
    description: 'Documento de revisado del vehículo',
    isActive: true,
    order: 6,
  },
  {
    name: 'Otros',
    slug: 'otros',
    description: 'Otros tipos de documentos no listados',
    isActive: true,
    order: 7,
  },
];

/**
 * Mapeo de los valores del enum antiguo a los nuevos slugs
 * Para migración de datos existentes
 */
export const enumToSlugMap: Record<string, string> = {
  poliza_seguro: 'poliza-seguro',
  ficha_tecnica: 'factura-compra', // Mapeo antiguo -> nuevo
  tarjeta_propiedad: 'registro-propiedad', // Mapeo antiguo -> nuevo
  contrato_compraventa: 'contrato-compraventa',
  matricula_vehicular: 'placa', // Mapeo antiguo -> nuevo
  certificado_revisado: 'certificado-revisado',
  otros: 'otros',
};

/**
 * Tipos de documentos obsoletos que deben desactivarse
 */
const obsoleteSlugs = [
  'ficha-tecnica', // Reemplazado por factura-compra
  'tarjeta-propiedad', // Reemplazado por registro-propiedad
  'matricula-vehicular', // Reemplazado por placa
];

/**
 * Configura permisos públicos para fleet-document-types
 */
async function setupPublicPermissions(strapi: any) {
  try {
    strapi.log.info('🔓 Setting up public permissions for fleet-document-types...');

    // Get the public role
    const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: 'public' },
    });

    if (!publicRole) {
      strapi.log.warn('⚠️ Public role not found');
      return;
    }

    // Define permissions to grant
    const permissionsToGrant = [
      'api::fleet-document-type.fleet-document-type.find',
      'api::fleet-document-type.fleet-document-type.findOne',
    ];

    // Get existing permissions for this role and content type
    const existingPermissions = await strapi.db
      .query('plugin::users-permissions.permission')
      .findMany({
        where: {
          role: publicRole.id,
          action: {
            $in: permissionsToGrant,
          },
        },
      });

    const existingActions = existingPermissions.map((p: any) => p.action);
    const actionsToCreate = permissionsToGrant.filter(
      (action) => !existingActions.includes(action)
    );

    // Create missing permissions
    for (const action of actionsToCreate) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: {
          action,
          role: publicRole.id,
          enabled: true,
        },
      });
      strapi.log.info(`✅ Granted permission: ${action}`);
    }

    if (actionsToCreate.length === 0) {
      strapi.log.info('⏭️  Public permissions already configured');
    }
  } catch (error) {
    strapi.log.error('❌ Error setting up public permissions:', error);
  }
}

/**
 * Inicializa los tipos de documentos por defecto si no existen
 */
export async function seedDocumentTypes(strapi: any) {
  try {
    strapi.log.info('🌱 Seeding document types...');

    // Setup public permissions first
    await setupPublicPermissions(strapi);

    const documentTypeService = strapi.service('api::fleet-document-type.fleet-document-type');

    if (!documentTypeService) {
      strapi.log.warn('⚠️ Document type service not found, skipping seed');
      return;
    }

    // Crear o actualizar tipos de documentos
    for (const typeData of defaultDocumentTypes) {
      const existing = await strapi.entityService.findMany(
        'api::fleet-document-type.fleet-document-type',
        {
          filters: { slug: typeData.slug },
        }
      );

      if (existing.length === 0) {
        await strapi.entityService.create('api::fleet-document-type.fleet-document-type', {
          data: typeData,
        });
        strapi.log.info(`✅ Created document type: ${typeData.name}`);
      } else {
        // Actualizar el nombre y otros campos si cambiaron
        const existingType = existing[0];
        if (existingType.name !== typeData.name || existingType.order !== typeData.order) {
          await strapi.entityService.update(
            'api::fleet-document-type.fleet-document-type',
            existingType.id,
            {
              data: {
                name: typeData.name,
                description: typeData.description,
                order: typeData.order,
              },
            }
          );
          strapi.log.info(`🔄 Updated document type: ${typeData.name}`);
        } else {
          strapi.log.info(`⏭️  Document type already exists: ${typeData.name}`);
        }
      }
    }

    // Desactivar tipos obsoletos
    for (const slug of obsoleteSlugs) {
      const existing = await strapi.entityService.findMany(
        'api::fleet-document-type.fleet-document-type',
        {
          filters: { slug },
        }
      );

      if (existing.length > 0 && existing[0].isActive) {
        await strapi.entityService.update(
          'api::fleet-document-type.fleet-document-type',
          existing[0].id,
          {
            data: { isActive: false },
          }
        );
        strapi.log.info(`🚫 Deactivated obsolete document type: ${existing[0].name}`);
      }
    }

    strapi.log.info('✅ Document types seeding completed');
  } catch (error) {
    strapi.log.error('❌ Error seeding document types:', error);
  }
}

/**
 * Migra los documentos existentes del enum a la relación
 */
export async function migrateExistingDocuments(strapi: any) {
  try {
    strapi.log.info('🔄 Migrating existing documents...');

    const documentService = strapi.service('api::fleet-document.fleet-document');

    if (!documentService) {
      strapi.log.warn('⚠️ Document service not found, skipping migration');
      return;
    }

    // Obtener solo los documentos que necesitan migración o actualización
    const documents = await strapi.entityService.findMany('api::fleet-document.fleet-document', {
      filters: {
        $or: [
          {
            documentType: {
              id: { $null: true },
            },
          },
          {
            documentType: {
              slug: { $in: obsoleteSlugs },
            },
          },
        ],
      },
      populate: ['documentType'],
    });

    for (const document of documents) {
      // Si el documento ya tiene una relación válida, verificar si necesita actualización
      if (
        document.documentType &&
        typeof document.documentType === 'object' &&
        document.documentType.id
      ) {
        // Verificar si el tipo está en la lista de obsoletos
        if (obsoleteSlugs.includes(document.documentType.slug)) {
          const newSlug = enumToSlugMap[document.documentType.slug];
          if (newSlug && newSlug !== document.documentType.slug) {
            // Buscar el nuevo tipo
            const newTypes = await strapi.entityService.findMany(
              'api::fleet-document-type.fleet-document-type',
              {
                filters: { slug: newSlug },
              }
            );

            if (newTypes.length > 0) {
              await strapi.entityService.update('api::fleet-document.fleet-document', document.id, {
                data: {
                  documentType: newTypes[0].id,
                },
              });
              strapi.log.info(
                `✅ Migrated document ${document.id} from ${document.documentType.slug} to ${newSlug}`
              );
            }
          }
        }
        continue;
      }

      // Obtener el slug correspondiente al valor del enum (migración antigua)
      const oldEnumValue = document.documentType as string;
      const slug = enumToSlugMap[oldEnumValue];

      if (!slug) {
        strapi.log.warn(`⚠️ No slug mapping found for: ${oldEnumValue}`);
        continue;
      }

      // Buscar el tipo de documento por slug
      const documentTypes = await strapi.entityService.findMany(
        'api::fleet-document-type.fleet-document-type',
        {
          filters: { slug },
        }
      );

      if (documentTypes.length === 0) {
        strapi.log.warn(`⚠️ Document type not found for slug: ${slug}`);
        continue;
      }

      const documentTypeId = documentTypes[0].id;

      // Actualizar el documento con la nueva relación
      await strapi.entityService.update('api::fleet-document.fleet-document', document.id, {
        data: {
          documentType: documentTypeId,
        },
      });

      strapi.log.info(`✅ Migrated document ${document.id} from ${oldEnumValue} to ${slug}`);
    }

    strapi.log.info('✅ Document migration completed');
  } catch (error) {
    strapi.log.error('❌ Error migrating documents:', error);
  }
}

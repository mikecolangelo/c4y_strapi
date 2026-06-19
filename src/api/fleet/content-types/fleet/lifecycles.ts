/**
 * Lifecycle hooks for fleet (Vehículos de flota)
 *
 * Calcula automáticamente billingInitials si está vacío:
 * - Base: Primera letra de Marca + Primera letra de Modelo (ej: Ford Mustang → FM)
 * - Si existe duplicado: Añadir letras del modelo hasta obtener sigla única
 *   (ej: FM → FMU → FMUS → FMUST...)
 */

// Declaración de la variable global strapi
declare const strapi: any;

interface FleetData {
  brand?: string;
  model?: string;
  billingInitials?: string;
}

interface EventParams {
  data: FleetData;
  where?: {
    documentId?: string;
    id?: number;
  };
}

/**
 * Genera las siglas base: primera letra de marca + primera letra de modelo
 */
const generateBaseInitials = (brand: string, model: string): string => {
  const brandInitial = brand.charAt(0).toUpperCase();
  const modelInitial = model.charAt(0).toUpperCase();
  return brandInitial + modelInitial;
};

/**
 * Verifica si una sigla ya existe en la base de datos
 */
const checkInitialsExists = async (
  strapi: any,
  initials: string,
  excludeDocumentId?: string
): Promise<boolean> => {
  try {
    const query: any = {
      where: {
        billingInitials: initials,
      },
    };

    if (excludeDocumentId) {
      query.where.documentId = {
        $ne: excludeDocumentId,
      };
    }

    const existing = await strapi.db.query('api::fleet.fleet').findOne(query);
    return !!existing;
  } catch (error) {
    strapi.log.error('[checkInitialsExists] Error:', error);
    return false;
  }
};

/**
 * Encuentra una sigla única para el vehículo
 * Si la sigla base existe, va añadiendo letras del modelo hasta encontrar una única
 */
const findUniqueInitials = async (
  strapi: any,
  brand: string,
  model: string,
  excludeDocumentId?: string
): Promise<string> => {
  // Si no hay marca o modelo, retornar vacío
  if (!brand?.trim() || !model?.trim()) {
    return '';
  }

  const cleanBrand = brand.trim();
  const cleanModel = model.trim();

  let initials = generateBaseInitials(cleanBrand, cleanModel);

  // Verificar si la sigla base existe
  const exists = await checkInitialsExists(strapi, initials, excludeDocumentId);
  if (!exists) {
    return initials;
  }

  // Si existe, ir añadiendo letras del modelo hasta encontrar una única
  let modelIndex = 1; // Empezar desde la segunda letra del modelo
  const maxAttempts = Math.min(cleanModel.length + 5, 20); // Límite de seguridad

  while (modelIndex <= maxAttempts) {
    if (modelIndex < cleanModel.length) {
      initials += cleanModel.charAt(modelIndex).toUpperCase();
      modelIndex++;
    } else {
      // Se agotaron las letras del modelo, agregar número al final
      initials += modelIndex;
      modelIndex++;
    }

    const exists = await checkInitialsExists(strapi, initials, excludeDocumentId);
    if (!exists) {
      return initials;
    }
  }

  // Si llegamos aquí, agregamos un timestamp para garantizar unicidad
  return `${initials}${Date.now().toString().slice(-3)}`;
};

export default {
  async beforeCreate(event: { params: EventParams }) {
    try {
      const { data } = event.params;

      // Solo calcular si billingInitials está vacío y tenemos marca y modelo
      if (!data.billingInitials?.trim() && data.brand?.trim() && data.model?.trim()) {
        strapi.log.info('[beforeCreate] Generando siglas para:', data.brand, data.model);

        const initials = await findUniqueInitials(strapi, data.brand, data.model);

        if (initials) {
          data.billingInitials = initials;
          strapi.log.info('[beforeCreate] Siglas generadas:', initials);
        }
      }
    } catch (error) {
      // Loggear error pero no bloquear la creación del vehículo
      strapi.log.error('[beforeCreate] Error generando siglas:', error);
      // No lanzar el error para evitar que falle la creación del vehículo
    }
  },

  async beforeUpdate(event: { params: EventParams }) {
    try {
      const { data, where } = event.params;

      // Si se está actualizando marca o modelo, y no viene billingInitials explícito
      const shouldRecalculate =
        (data.brand !== undefined || data.model !== undefined) && !data.billingInitials?.trim();

      if (shouldRecalculate) {
        strapi.log.info('[beforeUpdate] Recalculando siglas...');

        // Obtener el documentId para excluir el registro actual
        let documentId = where?.documentId;
        let currentBrand = data.brand;
        let currentModel = data.model;

        // Si no tenemos documentId pero tenemos id, buscarlo
        if (!documentId && where?.id) {
          try {
            const existing = await strapi.db.query('api::fleet.fleet').findOne({
              where: { id: where.id },
              select: ['documentId', 'brand', 'model'],
            });

            if (existing) {
              documentId = existing.documentId;
              // Usar valores existentes si no se proporcionaron nuevos
              currentBrand = currentBrand ?? existing.brand;
              currentModel = currentModel ?? existing.model;
            }
          } catch (lookupError) {
            strapi.log.error('[beforeUpdate] Error buscando vehículo existente:', lookupError);
          }
        }

        if (currentBrand?.trim() && currentModel?.trim()) {
          const initials = await findUniqueInitials(strapi, currentBrand, currentModel, documentId);

          if (initials) {
            data.billingInitials = initials;
            strapi.log.info('[beforeUpdate] Siglas recalculadas:', initials);
          }
        }
      }
    } catch (error) {
      // Loggear error pero no bloquear la actualización del vehículo
      strapi.log.error('[beforeUpdate] Error recalculando siglas:', error);
      // No lanzar el error para evitar que falle la actualización del vehículo
    }
  },
};

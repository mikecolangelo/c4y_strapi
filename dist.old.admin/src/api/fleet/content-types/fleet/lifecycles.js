"use strict";
/**
 * Lifecycle hooks for fleet (Vehículos de flota)
 *
 * Calcula automáticamente billingInitials si está vacío:
 * - Base: Primera letra de Marca + Primera letra de Modelo (ej: Ford Mustang → FM)
 * - Si existe duplicado: Añadir letras del modelo hasta obtener sigla única
 *   (ej: FM → FMU → FMUS → FMUST...)
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Genera las siglas base: primera letra de marca + primera letra de modelo
 */
const generateBaseInitials = (brand, model) => {
    const brandInitial = brand.charAt(0).toUpperCase();
    const modelInitial = model.charAt(0).toUpperCase();
    return brandInitial + modelInitial;
};
/**
 * Encuentra una sigla única para el vehículo
 * Si la sigla base existe, va añadiendo letras del modelo hasta encontrar una única
 */
const findUniqueInitials = async (strapi, brand, model, excludeDocumentId) => {
    let initials = generateBaseInitials(brand, model);
    // Si no hay modelo o marca, retornar lo que se pueda generar
    if (!brand || !model) {
        return initials;
    }
    // Intentar con letras adicionales del modelo si es necesario
    let modelIndex = 1; // Empezar desde la segunda letra del modelo
    // Límite de intentos para evitar bucles infinitos (longitud del modelo)
    const maxAttempts = model.length;
    while (modelIndex <= maxAttempts) {
        // Verificar si ya existe esta sigla en otro vehículo
        const existing = await strapi.db.query('api::fleet.fleet').findOne({
            where: {
                billingInitials: initials,
                ...(excludeDocumentId && {
                    documentId: {
                        $ne: excludeDocumentId,
                    },
                }),
            },
        });
        // Si no existe, esta sigla es única
        if (!existing) {
            return initials;
        }
        // Si existe, añadir la siguiente letra del modelo
        if (modelIndex < model.length) {
            initials += model.charAt(modelIndex).toUpperCase();
            modelIndex++;
        }
        else {
            // Se agotaron las letras del modelo, agregar número al final
            initials += modelIndex;
            modelIndex++;
        }
    }
    // Si llegamos aquí, agregamos un timestamp para garantizar unicidad
    return `${initials}${Date.now().toString().slice(-3)}`;
};
exports.default = {
    async beforeCreate(event) {
        const { data } = event.params;
        // Solo calcular si billingInitials está vacío y tenemos marca y modelo
        if (!data.billingInitials && data.brand && data.model) {
            data.billingInitials = await findUniqueInitials(strapi, data.brand, data.model);
        }
    },
    async beforeUpdate(event) {
        var _a, _b;
        const { data, where } = event.params;
        // Si se está actualizando marca o modelo, recalcular siglas si no viene explícito
        if ((data.brand !== undefined || data.model !== undefined) && !data.billingInitials) {
            // Obtener el documentId para excluir el registro actual
            let documentId = where.documentId;
            // Si no tenemos documentId pero tenemos id, buscarlo
            if (!documentId && where.id) {
                const existing = await strapi.db.query('api::fleet.fleet').findOne({
                    where: { id: where.id },
                    select: ['documentId', 'brand', 'model'],
                });
                if (existing) {
                    documentId = existing.documentId;
                    // Usar valores existentes si no se proporcionaron nuevos
                    data.brand = (_a = data.brand) !== null && _a !== void 0 ? _a : existing.brand;
                    data.model = (_b = data.model) !== null && _b !== void 0 ? _b : existing.model;
                }
            }
            if (data.brand && data.model) {
                data.billingInitials = await findUniqueInitials(strapi, data.brand, data.model, documentId);
            }
        }
    },
};

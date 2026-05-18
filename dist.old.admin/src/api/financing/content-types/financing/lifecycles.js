"use strict";
/**
 * Lifecycle hooks for financing (Financiamiento - Pago Padre)
 *
 * Calcula automáticamente al crear:
 * - totalQuotas: basado en meses y frecuencia de pago
 * - quotaAmount: monto total / total de cuotas
 * - nextDueDate: primera fecha de vencimiento
 * - currentBalance: igual al monto total inicialmente
 * - financingNumber: número único auto-generado
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Calcula el número total de cuotas basado en meses y frecuencia
 */
const calculateTotalQuotas = (months, frequency) => {
    switch (frequency) {
        case 'semanal':
            return Math.ceil(months * 4.33); // ~4.33 semanas por mes
        case 'quincenal':
            return months * 2;
        case 'mensual':
            return months;
        default:
            return months;
    }
};
/**
 * Obtiene el intervalo de días entre cuotas
 */
const getDaysInterval = (frequency) => {
    switch (frequency) {
        case 'semanal':
            return 7;
        case 'quincenal':
            return 15;
        case 'mensual':
            return 30;
        default:
            return 7;
    }
};
/**
 * Genera un número de financiamiento único
 * Formato: {PREFIX}-YYYYMMDD-XXXXX (ej: FIN-20260125-12345 o FM-20260125-12345)
 * Usa timestamp para garantizar unicidad sin acceso a DB
 *
 * @param prefix - Prefijo opcional (default: "FIN")
 */
const generateFinancingNumber = (prefix = 'FIN') => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const timestamp = now.getTime().toString().slice(-5); // Últimos 5 dígitos del timestamp
    return `${prefix}-${year}${month}${day}-${timestamp}`;
};
/**
 * Extrae el ID o documentId del vehículo de diferentes formatos de relación
 * Soporta:
 * - Directo: number (id), string (documentId)
 * - Objeto: { id }, { documentId }
 * - Connect (Strapi 5): { connect: [id|documentId|{id}|{documentId}] }
 */
const extractVehicleIdentifier = (vehicle) => {
    if (!vehicle)
        return null;
    console.log('[extractVehicleIdentifier] Input:', vehicle, 'tipo:', typeof vehicle);
    // Formato connect de Strapi 5: { connect: [...] }
    if (typeof vehicle === 'object' && 'connect' in vehicle && Array.isArray(vehicle.connect)) {
        const connectArray = vehicle.connect;
        if (connectArray.length === 0)
            return null;
        const first = connectArray[0];
        if (typeof first === 'string') {
            return { documentId: first };
        }
        else if (typeof first === 'number') {
            return { id: first };
        }
        else if (typeof first === 'object' && first) {
            return {
                id: first.id,
                documentId: first.documentId
            };
        }
        return null;
    }
    // Formato directo
    if (typeof vehicle === 'number') {
        return { id: vehicle };
    }
    if (typeof vehicle === 'string') {
        return { documentId: vehicle };
    }
    if (typeof vehicle === 'object') {
        return {
            id: vehicle.id,
            documentId: vehicle.documentId
        };
    }
    return null;
};
/**
 * Obtiene las siglas de facturación del vehículo asociado
 */
const getVehicleBillingInitials = async (strapi, vehicle) => {
    const identifier = extractVehicleIdentifier(vehicle);
    if (!identifier) {
        console.log('[getVehicleBillingInitials] No se pudo extraer identificador del vehículo');
        return null;
    }
    console.log('[getVehicleBillingInitials] Identificador extraído:', identifier);
    try {
        let fleetVehicle = null;
        // Buscar por documentId (prioridad)
        if (identifier.documentId) {
            console.log('[getVehicleBillingInitials] Buscando por documentId:', identifier.documentId);
            const results = await strapi.entityService.findMany('api::fleet.fleet', {
                filters: { documentId: identifier.documentId },
                fields: ['billingInitials'],
            });
            fleetVehicle = results && results.length > 0 ? results[0] : null;
        }
        // Buscar por ID numérico
        else if (identifier.id) {
            console.log('[getVehicleBillingInitials] Buscando por ID:', identifier.id);
            fleetVehicle = await strapi.entityService.findOne('api::fleet.fleet', identifier.id, {
                fields: ['billingInitials'],
            });
        }
        console.log('[getVehicleBillingInitials] Resultado:', fleetVehicle);
        console.log('[getVehicleBillingInitials] billingInitials:', fleetVehicle === null || fleetVehicle === void 0 ? void 0 : fleetVehicle.billingInitials);
        return (fleetVehicle === null || fleetVehicle === void 0 ? void 0 : fleetVehicle.billingInitials) || null;
    }
    catch (error) {
        console.error('[getVehicleBillingInitials] Error:', error);
        return null;
    }
};
/**
 * Calcula la siguiente fecha de vencimiento
 */
const calculateNextDueDate = (startDate, frequency) => {
    const start = new Date(startDate);
    const daysInterval = getDaysInterval(frequency);
    start.setDate(start.getDate() + daysInterval);
    return start.toISOString().split('T')[0];
};
exports.default = {
    async beforeCreate(event) {
        const { data } = event.params;
        console.log('[beforeCreate] Datos recibidos:', JSON.stringify(data, null, 2));
        console.log('[beforeCreate] data.vehicle:', data.vehicle);
        // Generar número de financiamiento si no existe
        if (!data.financingNumber) {
            // Obtener prefijo del vehículo si existe
            const vehicleInitials = await getVehicleBillingInitials(strapi, data.vehicle);
            const prefix = vehicleInitials || 'FIN';
            console.log('[beforeCreate] Prefijo a usar:', prefix);
            data.financingNumber = generateFinancingNumber(prefix);
            console.log('[beforeCreate] Número generado:', data.financingNumber);
        }
        // Calcular cuotas si hay datos necesarios
        if (data.totalAmount && data.paymentFrequency) {
            const frequency = data.paymentFrequency || 'semanal';
            // Usar totalQuotas del payload si viene, de lo contrario calcularlo
            let totalQuotas = data.totalQuotas;
            if (!totalQuotas && data.financingMonths) {
                const months = data.financingMonths;
                totalQuotas = calculateTotalQuotas(months, frequency);
                data.totalQuotas = totalQuotas;
            }
            // Calcular monto por cuota si tenemos totalQuotas
            if (totalQuotas && totalQuotas > 0) {
                data.quotaAmount = parseFloat((data.totalAmount / totalQuotas).toFixed(2));
            }
            // Establecer balance inicial
            data.currentBalance = data.totalAmount;
            // Calcular primera fecha de vencimiento
            if (data.startDate) {
                data.nextDueDate = calculateNextDueDate(data.startDate, frequency);
            }
        }
    },
    async beforeUpdate(event) {
        const { data } = event.params;
        // Si se actualiza monto o frecuencia, recalcular
        if (data.totalAmount !== undefined || data.paymentFrequency !== undefined || data.financingMonths !== undefined) {
            // Solo recalcular si tenemos todos los datos necesarios
            // Esto se manejará mejor en el frontend/API
        }
    },
    /**
     * beforeDelete: Elimina todos los billing-records (pagos) asociados
     * antes de eliminar el financiamiento (cascade delete)
     */
    async beforeDelete(event) {
        const { where } = event.params;
        // Obtener el ID interno del financiamiento a eliminar
        let financingId = null;
        if (where.id) {
            financingId = where.id;
        }
        else if (where.documentId) {
            // Buscar por documentId para obtener el ID interno
            const financings = await strapi.entityService.findMany('api::financing.financing', {
                filters: { documentId: { $eq: where.documentId } },
            });
            financingId = financings && financings.length > 0 ? financings[0].id : null;
        }
        if (!financingId) {
            console.log('[beforeDelete] No se pudo determinar el ID del financiamiento');
            return;
        }
        console.log('[beforeDelete] Eliminando pagos asociados al financiamiento ID:', financingId);
        // Buscar todos los billing-records asociados a este financiamiento
        // Usamos el ID interno para la relación
        const billingRecords = await strapi.entityService.findMany('api::billing-record.billing-record', {
            filters: { financing: { id: { $eq: financingId } } },
        });
        if (!billingRecords || billingRecords.length === 0) {
            console.log('[beforeDelete] No hay pagos asociados para eliminar');
            return;
        }
        console.log(`[beforeDelete] Encontrados ${billingRecords.length} pagos para eliminar`);
        // Eliminar cada billing-record usando su ID
        for (const record of billingRecords) {
            if (record.id) {
                try {
                    await strapi.entityService.delete('api::billing-record.billing-record', record.id);
                    console.log(`[beforeDelete] Pago eliminado ID: ${record.id}`);
                }
                catch (error) {
                    console.error(`[beforeDelete] Error al eliminar pago ID ${record.id}:`, error);
                    // Continuar con el siguiente aunque falle uno
                }
            }
        }
        console.log('[beforeDelete] Todos los pagos asociados han sido eliminados');
    },
};

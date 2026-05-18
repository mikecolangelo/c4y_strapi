"use strict";
/**
 * Lifecycle hooks for billing-record (Pago Hijo)
 *
 * Calcula automáticamente:
 * - daysLate: días de retraso basado en dueDate
 * - lateFeeAmount: multa por retraso (10% diario sobre monto pendiente)
 * - Actualiza el financing padre cuando se crea/modifica un pago
 *
 * Valida relaciones padre/hijo:
 * - Evita auto-referencia (un registro no puede ser padre de sí mismo)
 * - Verifica que padre e hijo pertenezcan al mismo financing
 * - Evita ciclos (un padre no puede ser hijo de otro registro)
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Calcula los días de retraso basándose en la fecha de vencimiento
 */
const calculateDaysLate = (dueDate, paymentDate) => {
    if (!dueDate)
        return 0;
    const due = new Date(dueDate);
    const payment = paymentDate ? new Date(paymentDate) : new Date();
    const diffTime = payment.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
};
/**
 * Calcula la multa por retraso
 * 10% diario sobre el monto pendiente de la cuota
 */
const calculateLateFee = (pendingAmount, daysLate, percentage = 10) => {
    if (daysLate <= 0 || pendingAmount <= 0)
        return 0;
    return parseFloat((pendingAmount * (percentage / 100) * daysLate).toFixed(2));
};
const processPaymentData = (data) => {
    const updates = {};
    // Calcular días de retraso si hay fecha de vencimiento
    // Solo calcular si no viene un valor explícito de daysLate
    if (data.dueDate && data.daysLate === undefined) {
        const daysLate = calculateDaysLate(data.dueDate, data.paymentDate);
        updates.daysLate = daysLate;
        // Si hay retraso, calcular multa
        // Solo calcular si no viene un valor explícito de lateFeeAmount
        if (daysLate > 0 && data.status === 'retrasado' && data.lateFeeAmount === undefined) {
            const pendingAmount = data.quotaAmountCovered || data.amount || 0;
            updates.lateFeeAmount = calculateLateFee(pendingAmount, daysLate);
        }
        else if (data.lateFeeAmount === undefined) {
            updates.lateFeeAmount = 0;
        }
    }
    return updates;
};
/**
 * Obtiene el ID de un registro (puede ser number, string o objeto)
 */
const getRecordId = (value) => {
    if (value === null || value === undefined)
        return null;
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string')
        return value;
    if (typeof value === 'object' && value !== null) {
        const obj = value;
        if (obj.documentId)
            return obj.documentId;
        if (obj.id)
            return obj.id;
    }
    return null;
};
/**
 * Obtiene el financing ID de un billing record desde la base de datos
 */
const getRecordFinancingId = async (strapi, recordId) => {
    try {
        const record = await strapi.db.query('api::billing-record.billing-record').findOne({
            where: { id: recordId },
            populate: ['financing'],
        });
        if (!record)
            return null;
        const financing = record.financing;
        if (!financing)
            return null;
        return financing.documentId || financing.id;
    }
    catch (error) {
        console.error('[Lifecycle] Error fetching record financing:', error);
        return null;
    }
};
/**
 * Verifica si un registro es descendiente de otro (para evitar ciclos)
 */
const isDescendant = async (strapi, parentId, childId) => {
    try {
        const record = await strapi.db.query('api::billing-record.billing-record').findOne({
            where: { id: childId },
            populate: ['parentRecord'],
        });
        if (!record || !record.parentRecord)
            return false;
        const recordParentId = record.parentRecord.id;
        // Si el padre del registro es el parentId que buscamos, es descendiente
        if (recordParentId === parentId)
            return true;
        // Si no, seguir buscando hacia arriba
        return await isDescendant(strapi, parentId, recordParentId);
    }
    catch (error) {
        console.error('[Lifecycle] Error checking descendant:', error);
        return false;
    }
};
/**
 * Valida la relación padre/hijo
 */
const validateParentRecord = async (strapi, data, currentRecordId) => {
    // Si no hay parentRecord, es válido
    if (!data.parentRecord) {
        return { valid: true };
    }
    const parentId = getRecordId(data.parentRecord);
    // Si parentRecord es null o connect vacío
    if (parentId === null) {
        return { valid: true };
    }
    // 1. Validar auto-referencia
    if (currentRecordId && parentId === currentRecordId) {
        return { valid: false, error: 'Un registro no puede ser padre de sí mismo' };
    }
    // 2. Obtener el financing del padre
    const parentFinancingId = await getRecordFinancingId(strapi, parentId);
    if (!parentFinancingId) {
        return { valid: false, error: 'El registro padre no existe o no tiene financiamiento asociado' };
    }
    // 3. Verificar que el hijo pertenezca al mismo financing
    const childFinancingId = getRecordId(data.financing);
    if (childFinancingId && String(childFinancingId) !== String(parentFinancingId)) {
        return { valid: false, error: 'El registro hijo debe pertenecer al mismo financiamiento que el padre' };
    }
    // 4. Si estamos actualizando, verificar que no se cree un ciclo
    if (currentRecordId) {
        // Verificar que el padre no sea descendiente del hijo (evitar ciclos)
        const wouldCreateCycle = await isDescendant(strapi, currentRecordId, parentId);
        if (wouldCreateCycle) {
            return { valid: false, error: 'No se puede asociar: esto crearía un ciclo en la jerarquía' };
        }
    }
    return { valid: true };
};
exports.default = {
    async beforeCreate(event) {
        const { data } = event.params;
        // Procesar cálculos de días de retraso y multas
        const updates = processPaymentData(data);
        Object.assign(data, updates);
        // Validar relación padre/hijo
        const validation = await validateParentRecord(strapi, data);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
    },
    async beforeUpdate(event) {
        const { data, where } = event.params;
        // Procesar cálculos de días de retraso y multas
        const updates = processPaymentData(data);
        Object.assign(data, updates);
        // Validar relación padre/hijo (pasando el ID del registro actual)
        const validation = await validateParentRecord(strapi, data, where.id);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
    },
};

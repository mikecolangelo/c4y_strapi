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
 * - Verifica que padre e hijo pertenezcan al mismo financiamiento
 * - Evita ciclos (un padre no puede ser hijo de otro registro)
 * 
 * Manejo de duplicados:
 * - Si se crea un registro con receiptNumber ya existente que tiene "abonado",
 *   el registro existente se convierte en hijo del nuevo (anidación jerárquica)
 * - Ambos quedan como "pendiente" hasta que se regularicen
 */

interface BillingRecordData {
  status?: 'pagado' | 'pendiente' | 'adelanto' | 'retrasado' | 'abonado';
  amount?: number;
  quotaAmountCovered?: number;
  lateFeeAmount?: number;
  daysLate?: number;
  dueDate?: string;
  paymentDate?: string;
  financing?: number | string | { id: number; documentId?: string };
  parentRecord?: number | string | { id: number; documentId?: string } | null;
  documentId?: string;
  id?: number;
}

/**
 * Calcula los días de retraso basándose en la fecha de vencimiento
 */
const calculateDaysLate = (dueDate?: string, paymentDate?: string): number => {
  if (!dueDate) return 0;
  
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
const calculateLateFee = (
  pendingAmount: number,
  daysLate: number,
  percentage: number = 10
): number => {
  if (daysLate <= 0 || pendingAmount <= 0) return 0;
  return parseFloat((pendingAmount * (percentage / 100) * daysLate).toFixed(2));
};

const processPaymentData = (data: BillingRecordData): Partial<BillingRecordData> => {
  const updates: Partial<BillingRecordData> = {};
  
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
    } else if (data.lateFeeAmount === undefined) {
      updates.lateFeeAmount = 0;
    }
  }
  
  return updates;
};

/**
 * Obtiene el ID de un registro (puede ser number, string o objeto)
 */
const getRecordId = (value: unknown): number | string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    const obj = value as { id?: number; documentId?: string };
    if (obj.documentId) return obj.documentId;
    if (obj.id) return obj.id;
  }
  return null;
};

/**
 * Obtiene el financing ID de un billing record desde la base de datos
 */
const getRecordFinancingId = async (strapi: any, recordId: number | string): Promise<number | string | null> => {
  try {
    const record = await strapi.db.query('api::billing-record.billing-record').findOne({
      where: { id: recordId },
      populate: ['financing'],
    });
    
    if (!record) return null;
    
    const financing = record.financing;
    if (!financing) return null;
    
    return financing.documentId || financing.id;
  } catch (error) {
    console.error('[Lifecycle] Error fetching record financing:', error);
    return null;
  }
};

/**
 * Verifica si un registro es descendiente de otro (para evitar ciclos)
 */
const isDescendant = async (strapi: any, parentId: number | string, childId: number | string): Promise<boolean> => {
  try {
    const record = await strapi.db.query('api::billing-record.billing-record').findOne({
      where: { id: childId },
      populate: ['parentRecord'],
    });

    if (!record || !record.parentRecord) return false;

    const recordParentId = record.parentRecord.id;

    // Si el padre del registro es el parentId que buscamos, es descendiente
    if (recordParentId === parentId) return true;

    // Si no, seguir buscando hacia arriba
    return await isDescendant(strapi, parentId, recordParentId);
  } catch (error) {
    console.error('[Lifecycle] Error checking descendant:', error);
    return false;
  }
};

/**
 * Maneja duplicados de receiptNumber con jerarquía automática.
 *
 * Escenario: Se crea un nuevo registro con receiptNumber ya existente
 * y el nuevo registro tiene "abonado" (crédito por adelantado).
 * El registro existente (Pagado) se convierte en hijo del nuevo.
 * Ambos quedan como "pendiente".
 *
 * @param strapi - Instancia de Strapi
 * @param data - Datos del nuevo registro a crear
 * @returns true si se manejó un duplicado (el registro no debe crearse como nuevo)
 */
const handleDuplicateReceiptNumber = async (
  strapi: any,
  data: BillingRecordData
): Promise<{ handled: boolean; parentRecordId?: number }> => {
  const receiptNumber = data.receiptNumber;
  if (!receiptNumber) {
    return { handled: false };
  }

  // Solo procesar si el nuevo registro tiene abonado o advanceCredit
  const newHasAbonado = data.status === 'abonado' || (data.advanceCredit && Number(data.advanceCredit) > 0);
  if (!newHasAbonado) {
    return { handled: false };
  }

  try {
    // Buscar registro existente con mismo receiptNumber que NO tenga ya padre
    // y que no sea él mismo un hijo (para evitar transformar algo que ya es hijo)
    const existingRecords = await strapi.db.query('api::billing-record.billing-record').findMany({
      where: {
        receiptNumber: receiptNumber,
        parentRecord: { $null: true },
      },
      populate: ['financing', 'coveredQuotas'],
      limit: 1,
    });

    if (!existingRecords || existingRecords.length === 0) {
      console.log(`[handleDuplicate] No se encontró registro existente sin padre para receiptNumber: ${receiptNumber}`);
      return { handled: false };
    }

    const existingRecord = existingRecords[0];

    // Si el registro existente ya tiene coveredBy o ya es hijo, no procesar
    if (existingRecord.coveredBy) {
      console.log(`[handleDuplicate] El registro existente ya tiene coveredBy, no se procesa`);
      return { handled: false };
    }

    // Si el registro existente es exactamente igual al que intentamos crear (mismo ID), no procesar
    if (data.id && existingRecord.id === data.id) {
      return { handled: false };
    }

    console.log(`[handleDuplicate] Transformando registro existente ID ${existingRecord.id} en hijo del nuevo registro`);
    console.log(`[handleDuplicate] existingRecord.status: ${existingRecord.status}, amount: ${existingRecord.amount}`);

    // Obtener el financing del registro existente para encontrar el ID interno
    const existingFinancingId = existingRecord.financing?.id || existingRecord.financing;
    if (!existingFinancingId) {
      console.log(`[handleDuplicate] El registro existente no tiene financing asociado`);
      return { handled: false };
    }

    // Ahora necesitamos crear el nuevo registro con el existing como hijo.
    // Como estamos en beforeCreate, no podemos cambiar data para que sea update,
    // pero podemos:
    // 1. Vincular el existente como hijo del nuevo (parentRecord)
    // 2. Ambos quedan como pendiente

    // Para lograr esto, necesitamos:
    // - Actualizar el registro existente para que apunte al nuevo como su padre
    // - Ambos deben quedar como pendiente

    // El ID del nuevo registro aún no existe, así que no podemos setear parentRecord todavía.
    // Lo que haremos es:
    // 1. Guardar el ID del existing para usarlo como child
    // 2. En afterCreate, actualizaremos el existente para que sea hijo del nuevo

    // Marcamos el existing para indicar que será hijo (usamos un campo temporal o lo procesamos en afterCreate)
    // Por ahora, retornamos que sí se manejó y guardamos el ID del existing

    // Pero espera - el ID del nuevo registro no existe todavía.
    // La solución es usar un campo especial: coveredBy/coveredQuotas
    // Cuando el new registro se crea, en afterCreate usamos coveredQuotas para linkar

    // Mejor aproximación: usar parentRecord del existing para apuntar a la relación correcta.
    // Después de crear el nuevo registro, en afterCreate actualizamos el existente.

    // Guardar referencia para después (via un mecanismo - population o similar)
    // Por ahora retornamos que se manejó para que el flujo continúe
    // y en afterCreate se haga la vinculación real

    return { handled: true, parentRecordId: existingRecord.id };

  } catch (error) {
    console.error('[handleDuplicate] Error al procesar duplicado:', error);
    return { handled: false };
  }
};

/**
 * Vincula un registro existente como hijo del nuevo registro (afterCreate)
 */
const linkExistingAsChild = async (
  strapi: any,
  newRecordId: number,
  existingChildId: number
): Promise<void> => {
  try {
    // El existing record se convierte en hijo del nuevo
    // Ambos quedan como "pendiente"

    await strapi.db.query('api::billing-record.billing-record').update({
      where: { id: existingChildId },
      data: {
        parentRecord: newRecordId,
        status: 'pendiente', // El hijo pasa a pendiente
      },
    });

    console.log(`[linkExistingAsChild] Registro ${existingChildId} vinculado como hijo de ${newRecordId}`);

    // También actualizar el nuevo registro para que quede como pendiente
    // (porque el crédito de abonado no cubre completamente la cuota)
    await strapi.db.query('api::billing-record.billing-record').update({
      where: { id: newRecordId },
      data: {
        status: 'pendiente',
      },
    });

    console.log(`[linkExistingAsChild] Registro ${newRecordId} marcado como pendiente (tenía abonado)`);

  } catch (error) {
    console.error('[linkExistingAsChild] Error al vincular hijo:', error);
  }
};

/**
 * Valida la relación padre/hijo
 */
const validateParentRecord = async (
  strapi: any,
  data: BillingRecordData,
  currentRecordId?: number
): Promise<{ valid: boolean; error?: string }> => {
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

export default {
  async beforeCreate(event: { params: { data: BillingRecordData }; state?: Record<string, unknown> }) {
    const { data } = event.params;

    // Procesar cálculos de días de retraso y multas
    const updates = processPaymentData(data);
    Object.assign(data, updates);

    // Manejo de duplicados con jerarquía automática
    const duplicateResult = await handleDuplicateReceiptNumber(strapi, data);
    if (duplicateResult.handled && duplicateResult.parentRecordId) {
      // Guardar el ID del registro hijo para vincularlo en afterCreate
      // Usamos event.state para pasar información entre beforeCreate y afterCreate
      if (!event.state) event.state = {};
      event.state.pendingChildRecordId = duplicateResult.parentRecordId;
      console.log(`[beforeCreate] Duplicado detectado. Child ${duplicateResult.parentRecordId} será vinculado después`);
    }

    // Validar relación padre/hijo
    const validation = await validateParentRecord(strapi, data);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  },

  async afterCreate(event: { result: any; params: { data: BillingRecordData }; state?: Record<string, unknown> }) {
    const newRecord = event.result;

    // Si tenemos un child record pendiente por vincular, hacerlo ahora
    if (event.state?.pendingChildRecordId && newRecord?.id) {
      await linkExistingAsChild(strapi, newRecord.id, event.state.pendingChildRecordId);
      delete event.state.pendingChildRecordId;
    }
  },

  async beforeUpdate(event: { params: { data: BillingRecordData; where: { id: number } }; state?: Record<string, unknown> }) {
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

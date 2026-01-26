/**
 * Lifecycle hooks for billing-record (Pago Hijo)
 * 
 * Calcula automáticamente:
 * - daysLate: días de retraso basado en dueDate
 * - lateFeeAmount: multa por retraso (10% diario sobre monto pendiente)
 * - Actualiza el financing padre cuando se crea/modifica un pago
 */

interface BillingRecordData {
  status?: 'pagado' | 'pendiente' | 'adelanto' | 'retrasado';
  amount?: number;
  quotaAmountCovered?: number;
  lateFeeAmount?: number;
  daysLate?: number;
  dueDate?: string;
  paymentDate?: string;
  financing?: number | string | { id: number };
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
  if (data.dueDate) {
    const daysLate = calculateDaysLate(data.dueDate, data.paymentDate);
    updates.daysLate = daysLate;
    
    // Si hay retraso, calcular multa
    if (daysLate > 0 && data.status === 'retrasado') {
      const pendingAmount = data.quotaAmountCovered || data.amount || 0;
      updates.lateFeeAmount = calculateLateFee(pendingAmount, daysLate);
    } else {
      updates.lateFeeAmount = 0;
    }
  }
  
  return updates;
};

export default {
  async beforeCreate(event: { params: { data: BillingRecordData } }) {
    const { data } = event.params;
    const updates = processPaymentData(data);
    Object.assign(data, updates);
  },

  async beforeUpdate(event: { params: { data: BillingRecordData } }) {
    const { data } = event.params;
    const updates = processPaymentData(data);
    Object.assign(data, updates);
  },
};

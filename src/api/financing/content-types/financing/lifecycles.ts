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

interface FinancingData {
  financingNumber?: string;
  totalAmount?: number;
  financingMonths?: number;
  paymentFrequency?: 'semanal' | 'quincenal' | 'mensual';
  quotaAmount?: number;
  totalQuotas?: number;
  startDate?: string;
  nextDueDate?: string;
  currentBalance?: number;
  status?: 'activo' | 'inactivo' | 'en_mora' | 'completado';
}

/**
 * Calcula el número total de cuotas basado en meses y frecuencia
 */
const calculateTotalQuotas = (months: number, frequency: string): number => {
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
const getDaysInterval = (frequency: string): number => {
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
 * Formato: FIN-YYYYMMDD-XXXXX (ej: FIN-20260125-12345)
 * Usa timestamp para garantizar unicidad sin acceso a DB
 */
const generateFinancingNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-5); // Últimos 5 dígitos del timestamp
  
  return `FIN-${year}${month}${day}-${timestamp}`;
};

/**
 * Calcula la siguiente fecha de vencimiento
 */
const calculateNextDueDate = (startDate: string, frequency: string): string => {
  const start = new Date(startDate);
  const daysInterval = getDaysInterval(frequency);
  start.setDate(start.getDate() + daysInterval);
  return start.toISOString().split('T')[0];
};

export default {
  async beforeCreate(event: { params: { data: FinancingData } }) {
    const { data } = event.params;

    // Generar número de financiamiento si no existe
    if (!data.financingNumber) {
      data.financingNumber = generateFinancingNumber();
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

  async beforeUpdate(event: { params: { data: FinancingData } }) {
    const { data } = event.params;

    // Si se actualiza monto o frecuencia, recalcular
    if (data.totalAmount !== undefined || data.paymentFrequency !== undefined || data.financingMonths !== undefined) {
      // Solo recalcular si tenemos todos los datos necesarios
      // Esto se manejará mejor en el frontend/API
    }
  },
};

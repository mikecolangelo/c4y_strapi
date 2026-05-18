import { factories } from '@strapi/strapi';

function normalizeDecimal(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : Number(value.toFixed(2));
  const cleaned = String(value).replace(/[$,\s]/g, '').replace(/%/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : Number(parsed.toFixed(2));
}

function normalizeDate(value: any): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value.toISOString().split('T')[0];
  }
  // Excel serial date
  if (typeof value === 'number' && value > 30000 && value < 50000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  }
  const str = String(value).trim();
  // Try multiple formats
  const separators = str.includes('/') ? '/' : str.includes('-') ? '-' : null;
  if (!separators) return null;
  const parts = str.split(separators);
  if (parts.length !== 3) return null;
  // Try DD/MM/YYYY or MM/DD/YYYY or DD-MM-YY
  let day = parseInt(parts[0], 10);
  let month = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  if (year < 100) year += 2000;
  // Heuristic: if month > 12, swap day and month
  if (month > 12 && day <= 12) {
    const tmp = day;
    day = month;
    month = tmp;
  }
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() !== month - 1) {
    return null;
  }
  return date.toISOString().split('T')[0];
}

function normalizeBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const str = String(value).trim().toLowerCase();
  return ['si', 'sí', 'yes', 'true', 'verificado', '1', 'ok'].includes(str);
}

function normalizeString(value: any): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

function normalizeInteger(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isInteger(value) ? value : Math.floor(value);
  const parsed = parseInt(String(value).trim(), 10);
  return isNaN(parsed) ? null : parsed;
}

export default factories.createCoreController('api::weekly-collection.weekly-collection', ({ strapi }) => ({
  async batchImport(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Autenticacion requerida');
    }

    const body = ctx.request.body;
    const records = body?.data;
    const importBatch = body?.importBatch || `batch-${Date.now()}`;

    if (!Array.isArray(records) || records.length === 0) {
      return ctx.badRequest('Se requiere un array de registros en data');
    }

    if (records.length > 1000) {
      return ctx.badRequest('Limite maximo de 1000 registros por lote excedido');
    }

    const results = {
      total: records.length,
      created: 0,
      duplicated: 0,
      errors: 0,
      details: [] as Array<{
        index: number;
        receiptNumber: string | null;
        status: 'created' | 'duplicate' | 'error';
        message?: string;
        raw?: any;
      }>,
    };

    // Preload existing receiptNumbers from weekly-collection and billing-record for performance
    const weeklyNumbers = new Set<string>();
    const billingNumbers = new Set<string>();

    try {
      const existingWeekly = await strapi.db.query('api::weekly-collection.weekly-collection').findMany({
        where: { receiptNumber: { $in: records.map((r: any) => r.receiptNumber).filter(Boolean) } },
        select: ['receiptNumber'],
      });
      existingWeekly.forEach((r: any) => weeklyNumbers.add(r.receiptNumber));

      const existingBilling = await strapi.db.query('api::billing-record.billing-record').findMany({
        where: { receiptNumber: { $in: records.map((r: any) => r.receiptNumber).filter(Boolean) } },
        select: ['receiptNumber'],
      });
      existingBilling.forEach((r: any) => billingNumbers.add(r.receiptNumber));
    } catch (_e) {
      // If preload fails, fall back to per-record checks
    }

    // Preload clients by identificationNumber
    const idents = records.map((r: any) => r.clientIdentification).filter(Boolean);
    const clientsById = new Map<string, number>();
    const financingsByClient = new Map<number, number>();

    if (idents.length > 0) {
      try {
        const clients = await strapi.db.query('api::user-profile.user-profile').findMany({
          where: { identificationNumber: { $in: idents } },
          select: ['id', 'identificationNumber'],
        });
        clients.forEach((c: any) => {
          if (c.identificationNumber) {
            clientsById.set(String(c.identificationNumber).trim(), c.id);
          }
        });

        if (clients.length > 0) {
          const clientIds = clients.map((c: any) => c.id);
          const financings = await strapi.db.query('api::financing.financing').findMany({
            where: { client: { $in: clientIds }, status: 'activo' },
            select: ['id', 'client'],
          });
          financings.forEach((f: any) => {
            if (f.client) {
              // In Strapi v5 relations may return as object or id depending on query
              const clientId = typeof f.client === 'object' ? f.client.id : f.client;
              if (!financingsByClient.has(clientId)) {
                financingsByClient.set(clientId, f.id);
              }
            }
          });
        }
      } catch (_e) {
        // Fallback to no linking
      }
    }

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const receiptNumber = normalizeString(raw.receiptNumber ?? raw.nro_recibo ?? raw['# RECIBO'] ?? raw['NRO RECIBO']);

      if (!receiptNumber) {
        results.errors++;
        results.details.push({
          index: i + 1,
          receiptNumber: null,
          status: 'error',
          message: 'Fila sin numero de recibo',
          raw,
        });
        continue;
      }

      // Duplicate check
      if (weeklyNumbers.has(receiptNumber) || billingNumbers.has(receiptNumber)) {
        results.duplicated++;
        results.details.push({
          index: i + 1,
          receiptNumber,
          status: 'duplicate',
          message: `El recibo ${receiptNumber} ya existe en el sistema`,
        });
        continue;
      }

      const clientIdentification = normalizeString(
        raw.clientIdentification ?? raw.cedula ?? raw['CEDULA'] ?? raw['ID CLIENTE'] ?? raw.identificationNumber
      );
      const clientId = clientIdentification ? clientsById.get(clientIdentification) ?? null : null;
      const financingId = clientId ? financingsByClient.get(clientId) ?? null : null;

      const payload: any = {
        weekNumber: normalizeInteger(raw.weekNumber ?? raw.semana ?? raw['No.'] ?? raw.SEMANA),
        receiptDate: normalizeDate(raw.receiptDate ?? raw.fecha_recibo ?? raw['FECHA DE RECIBO']),
        receiptNumber,
        paymentDate: normalizeDate(raw.paymentDate ?? raw.fecha_pago ?? raw['FECHA DE PAGO']),
        confirmationNumber: normalizeString(raw.confirmationNumber ?? raw.confirmacion ?? raw['# DE CONFIRMACION']),
        weeklyQuota: normalizeDecimal(raw.weeklyQuota ?? raw.cuota_semanal ?? raw['LETRA $225.00 SEMANAL'] ?? raw.cuota),
        initialDeposit: normalizeDecimal(raw.initialDeposit ?? raw.deposito_inicial ?? raw['ARREGLOS DE DEPOSITO INICIAL']),
        lateFee: normalizeDecimal(raw.lateFee ?? raw.multa ?? raw['MULTA POR ATRASO']),
        amountPaid: normalizeDecimal(raw.amountPaid ?? raw.pago_realizado ?? raw.PAGOS ?? raw.pago),
        remainingBalance: normalizeDecimal(raw.remainingBalance ?? raw.saldo_restante ?? raw.SALDO ?? raw.saldo),
        verifiedInBank: normalizeBoolean(raw.verifiedInBank ?? raw.verificado_banco ?? raw['VERIFICADO EN BANCO']),
        clientIdentification: clientIdentification,
        clientName: normalizeString(raw.clientName ?? raw.cliente ?? raw['NOMBRE CLIENTE'] ?? raw.nombre),
        importBatch,
        importStatus: 'processed',
        client: clientId,
        financing: financingId,
      };

      // Clean nulls for relations to avoid Strapi issues
      if (!payload.client) delete payload.client;
      if (!payload.financing) delete payload.financing;

      try {
        await strapi.db.query('api::weekly-collection.weekly-collection').create({ data: payload });
        results.created++;
        weeklyNumbers.add(receiptNumber); // prevent intra-batch duplicates
        results.details.push({
          index: i + 1,
          receiptNumber,
          status: 'created',
        });
      } catch (error: any) {
        results.errors++;
        results.details.push({
          index: i + 1,
          receiptNumber,
          status: 'error',
          message: error?.message || 'Error desconocido al guardar en base de datos',
          raw,
        });
      }
    }

    return ctx.send({
      data: {
        importBatch,
        summary: {
          total: results.total,
          created: results.created,
          duplicated: results.duplicated,
          errors: results.errors,
        },
        details: results.details,
      },
    });
  },
}));

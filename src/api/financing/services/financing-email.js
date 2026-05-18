'use strict';

/**
 * Servicio helper para emails del módulo de financiamiento.
 * Encapsula reemplazo de variables en templates y extracción de datos.
 */
function createFinancingEmailService({ strapi }) {
  /**
   * Reemplaza variables {{key}} en un template string.
   * @param {string} template
   * @param {Record<string, string>} variables
   */
  function renderTemplate(template, variables) {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Extrae variables disponibles de un financiamiento y sus relaciones.
   * @param {Object} financing — Entidad financing de Strapi (con populate de client, vehicle, payments)
   */
  function getFinancingVariables(financing) {
    const vars = {};

    // Datos del financiamiento
    vars.financingNumber = financing.financingNumber || '';
    vars.totalAmount = financing.totalAmount ? Number(financing.totalAmount).toFixed(2) : '0.00';
    vars.currentBalance = financing.currentBalance ? Number(financing.currentBalance).toFixed(2) : '0.00';
    vars.totalPaid = financing.totalPaid ? Number(financing.totalPaid).toFixed(2) : '0.00';
    vars.quotaAmount = financing.quotaAmount ? Number(financing.quotaAmount).toFixed(2) : '0.00';
    vars.paidQuotas = String(financing.paidQuotas || 0);
    vars.totalQuotas = String(financing.totalQuotas || 0);
    vars.status = financing.status || '';
    vars.startDate = financing.startDate || '';
    vars.nextDueDate = financing.nextDueDate || '';
    vars.paymentFrequency = financing.paymentFrequency || '';
    vars.lateQuotasCount = String(financing.lateQuotasCount || 0);
    vars.totalLateFees = financing.totalLateFees ? Number(financing.totalLateFees).toFixed(2) : '0.00';

    // Cliente
    const client = financing.client;
    if (client) {
      vars.clientName = client.displayName || client.billingName || 'Cliente';
      vars.clientEmail = client.email || '';
      vars.clientPhone = client.phone || client.billingPhone || '';
      vars.clientCedula = client.identificationNumber || '';
      vars.clientAddress = client.address || client.billingAddress || '';
    } else {
      vars.clientName = 'Cliente';
      vars.clientEmail = '';
      vars.clientPhone = '';
      vars.clientCedula = '';
      vars.clientAddress = '';
    }

    // Vehículo
    const vehicle = financing.vehicle;
    if (vehicle) {
      vars.vehicleInfo = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim();
      vars.vehiclePlate = vehicle.plate || '';
      vars.vehicleVin = vehicle.vin || '';
    } else {
      vars.vehicleInfo = '';
      vars.vehiclePlate = '';
      vars.vehicleVin = '';
    }

    // Datos del negocio
    vars.companyName = 'Car4youpanama';
    vars.currentDate = new Date().toLocaleDateString('es-PA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return vars;
  }

  /**
   * Obtiene templates de email desde el content-type configuration.
   * @returns {Promise<Object>} — { templates: Array, smtp: Object }
   */
  async function getEmailTemplates() {
    const templateKeys = [
      'billing-email-template-financing-created',
      'billing-email-template-payment-reminder',
      'billing-email-template-payment-received',
      'billing-email-template-quota-overdue',
      'billing-email-template-account-statement',
    ];

    const configs = await strapi.db.query('api::configuration.configuration').findMany({
      where: {
        key: { $in: templateKeys },
        category: 'billing',
      },
    });

    const defaultTemplates = {
      'billing-email-template-financing-created': {
        key: 'financing-created',
        name: 'Financiamiento Creado',
        subject: 'Bienvenido a Car4youpanama — Financiamiento {{financingNumber}}',
        body: `<p>Hola {{clientName}},</p>
<p>Tu financiamiento <strong>{{financingNumber}}</strong> ha sido creado exitosamente.</p>
<ul>
  <li>Monto total: ${{totalAmount}}</li>
  <li>Cuota: ${{quotaAmount}}</li>
  <li>Frecuencia: {{paymentFrequency}}</li>
  <li>Total de cuotas: {{totalQuotas}}</li>
</ul>
<p>Gracias por confiar en nosotros.</p>`,
        enabled: true,
      },
      'billing-email-template-payment-reminder': {
        key: 'payment-reminder',
        name: 'Recordatorio de Pago',
        subject: 'Recordatorio de pago — Financiamiento {{financingNumber}}',
        body: `<p>Hola {{clientName}},</p>
<p>Te recordamos que tu próxima cuota del financiamiento <strong>{{financingNumber}}</strong> vence el <strong>{{nextDueDate}}</strong>.</p>
<ul>
  <li>Cuota: ${{quotaAmount}}</li>
  <li>Saldo actual: ${{currentBalance}}</li>
</ul>
<p>Por favor realiza tu pago a tiempo para evitar recargos.</p>`,
        enabled: true,
      },
      'billing-email-template-payment-received': {
        key: 'payment-received',
        name: 'Pago Recibido',
        subject: 'Pago recibido — Financiamiento {{financingNumber}}',
        body: `<p>Hola {{clientName}},</p>
<p>Hemos recibido tu pago correspondiente al financiamiento <strong>{{financingNumber}}</strong>.</p>
<ul>
  <li>Cuotas pagadas: {{paidQuotas}} de {{totalQuotas}}</li>
  <li>Saldo actual: ${{currentBalance}}</li>
</ul>
<p>Gracias por tu puntualidad.</p>`,
        enabled: true,
      },
      'billing-email-template-quota-overdue': {
        key: 'quota-overdue',
        name: 'Cuota Vencida',
        subject: 'Cuota vencida — Financiamiento {{financingNumber}}',
        body: `<p>Hola {{clientName}},</p>
<p>Tu financiamiento <strong>{{financingNumber}}</strong> tiene cuotas vencidas.</p>
<ul>
  <li>Cuotas en mora: {{lateQuotasCount}}</li>
  <li>Recargos acumulados: ${{totalLateFees}}</li>
  <li>Saldo actual: ${{currentBalance}}</li>
</ul>
<p>Contacta con nosotros para regularizar tu situación.</p>`,
        enabled: true,
      },
      'billing-email-template-account-statement': {
        key: 'account-statement',
        name: 'Estado de Cuenta',
        subject: 'Estado de cuenta — Financiamiento {{financingNumber}}',
        body: `<p>Hola {{clientName}},</p>
<p>A continuación el resumen de tu financiamiento <strong>{{financingNumber}}</strong> a la fecha {{currentDate}}:</p>
<ul>
  <li>Monto total: ${{totalAmount}}</li>
  <li>Total pagado: ${{totalPaid}}</li>
  <li>Saldo actual: ${{currentBalance}}</li>
  <li>Cuotas pagadas: {{paidQuotas}} de {{totalQuotas}}</li>
</ul>
<p>Gracias por preferir Car4youpanama.</p>`,
        enabled: true,
      },
    };

    const result = [];
    for (const [fullKey, defaultTpl] of Object.entries(defaultTemplates)) {
      const dbConfig = configs.find((c) => c.key === fullKey);
      let template = { ...defaultTpl };

      if (dbConfig && dbConfig.value) {
        try {
          const parsed = JSON.parse(dbConfig.value);
          template = { ...template, ...parsed };
        } catch (e) {
          strapi.log.warn(`⚠️ Template ${fullKey} tiene JSON inválido, usando default.`);
        }
      }

      result.push(template);
    }

    return result;
  }

  return {
    renderTemplate,
    getFinancingVariables,
    getEmailTemplates,
  };
}

module.exports = createFinancingEmailService;

/**
 * financing controller
 */

import { factories } from '@strapi/strapi';
import nodemailer from 'nodemailer';

const ADMIN_ROLES = ['admin', 'super-admin'];

/**
 * Reemplaza variables {{key}} en un template string.
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

/**
 * Extrae variables disponibles de un financiamiento y sus relaciones.
 */
function getFinancingVariables(financing: any): Record<string, string> {
  const vars: Record<string, string> = {};

  vars.financingNumber = financing.financingNumber || '';
  vars.totalAmount = financing.totalAmount ? Number(financing.totalAmount).toFixed(2) : '0.00';
  vars.currentBalance = financing.currentBalance
    ? Number(financing.currentBalance).toFixed(2)
    : '0.00';
  vars.totalPaid = financing.totalPaid ? Number(financing.totalPaid).toFixed(2) : '0.00';
  vars.quotaAmount = financing.quotaAmount ? Number(financing.quotaAmount).toFixed(2) : '0.00';
  vars.paidQuotas = String(financing.paidQuotas || 0);
  vars.totalQuotas = String(financing.totalQuotas || 0);
  vars.status = financing.status || '';
  vars.startDate = financing.startDate || '';
  vars.nextDueDate = financing.nextDueDate || '';
  vars.paymentFrequency = financing.paymentFrequency || '';
  vars.lateQuotasCount = String(financing.lateQuotasCount || 0);
  vars.totalLateFees = financing.totalLateFees
    ? Number(financing.totalLateFees).toFixed(2)
    : '0.00';

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

  const vehicle = financing.vehicle;
  if (vehicle) {
    vars.vehicleInfo = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''}`.trim();
    vars.vehiclePlate = vehicle.placa || '';
    vars.vehicleVin = vehicle.vin || '';
  } else {
    vars.vehicleInfo = '';
    vars.vehiclePlate = '';
    vars.vehicleVin = '';
  }

  vars.companyName = 'Car4youpanama';
  vars.currentDate = new Date().toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return vars;
}

/**
 * Obtiene la configuración SMTP activa.
 */
async function getSmtpConfig(strapi: any) {
  const configKeys = [
    'billing-smtp-host',
    'billing-smtp-port',
    'billing-smtp-user',
    'billing-smtp-pass',
    'billing-smtp-from',
    'billing-smtp-secure',
  ];

  const configs = await strapi.db.query('api::configuration.configuration').findMany({
    where: {
      key: { $in: configKeys },
      category: 'billing',
    },
  });

  const dbConfig: Record<string, string> = {};
  for (const c of configs) {
    dbConfig[c.key] = c.value;
  }

  const host = dbConfig['billing-smtp-host'] || process.env.SMTP_HOST;
  const port = Number(dbConfig['billing-smtp-port'] || process.env.SMTP_PORT) || 465;
  const user = dbConfig['billing-smtp-user'] || process.env.SMTP_USER;
  const pass = dbConfig['billing-smtp-pass'] || process.env.SMTP_PASS;
  const from = dbConfig['billing-smtp-from'] || process.env.SMTP_FROM || user;
  const secureVal = dbConfig['billing-smtp-secure'];
  const secure = secureVal !== undefined ? secureVal === 'true' : port === 465;

  return { host, port, user, pass, from, secure, hasCustomConfig: !!dbConfig['billing-smtp-host'] };
}

/**
 * Envía un email usando nodemailer.
 */
async function sendEmail(
  strapi: any,
  { to, subject, html, text }: { to: string; subject: string; html: string; text?: string }
) {
  const config = await getSmtpConfig(strapi);

  if (!config.host || !config.user || !config.pass) {
    throw new Error('Configuración SMTP incompleta. Verifica host, usuario y contraseña.');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    tls: { rejectUnauthorized: false },
  });

  const from = config.from || config.user;

  const info = await transporter.sendMail({
    from: `"Car4youpanama" <${from}>`,
    to,
    subject,
    text: text || subject,
    html,
  });

  strapi.log.info(`📧 Email enviado a ${to} | MessageId: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
}

/**
 * Obtiene templates de email desde configuration.
 */
async function getEmailTemplates(strapi: any) {
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

  const defaultTemplates: Record<string, any> = {
    'billing-email-template-financing-created': {
      key: 'financing-created',
      name: 'Financiamiento Creado',
      subject: 'Bienvenido a Car4youpanama — Financiamiento {{financingNumber}}',
      body: '<p>Hola {{clientName}},</p><p>Tu financiamiento <strong>{{financingNumber}}</strong> ha sido creado exitosamente.</p><ul><li>Monto total: ${{totalAmount}}</li><li>Cuota: ${{quotaAmount}}</li><li>Frecuencia: {{paymentFrequency}}</li><li>Total de cuotas: {{totalQuotas}}</li></ul><p>Gracias por confiar en nosotros.</p>',
      enabled: true,
    },
    'billing-email-template-payment-reminder': {
      key: 'payment-reminder',
      name: 'Recordatorio de Pago',
      subject: 'Recordatorio de pago — Financiamiento {{financingNumber}}',
      body: '<p>Hola {{clientName}},</p><p>Te recordamos que tu próxima cuota del financiamiento <strong>{{financingNumber}}</strong> vence el <strong>{{nextDueDate}}</strong>.</p><ul><li>Cuota: ${{quotaAmount}}</li><li>Saldo actual: ${{currentBalance}}</li></ul><p>Por favor realiza tu pago a tiempo para evitar recargos.</p>',
      enabled: true,
    },
    'billing-email-template-payment-received': {
      key: 'payment-received',
      name: 'Pago Recibido',
      subject: 'Pago recibido — Financiamiento {{financingNumber}}',
      body: '<p>Hola {{clientName}},</p><p>Hemos recibido tu pago correspondiente al financiamiento <strong>{{financingNumber}}</strong>.</p><ul><li>Cuotas pagadas: {{paidQuotas}} de {{totalQuotas}}</li><li>Saldo actual: ${{currentBalance}}</li></ul><p>Gracias por tu puntualidad.</p>',
      enabled: true,
    },
    'billing-email-template-quota-overdue': {
      key: 'quota-overdue',
      name: 'Cuota Vencida',
      subject: 'Cuota vencida — Financiamiento {{financingNumber}}',
      body: '<p>Hola {{clientName}},</p><p>Tu financiamiento <strong>{{financingNumber}}</strong> tiene cuotas vencidas.</p><ul><li>Cuotas en mora: {{lateQuotasCount}}</li><li>Recargos acumulados: ${{totalLateFees}}</li><li>Saldo actual: ${{currentBalance}}</li></ul><p>Contacta con nosotros para regularizar tu situación.</p>',
      enabled: true,
    },
    'billing-email-template-account-statement': {
      key: 'account-statement',
      name: 'Estado de Cuenta',
      subject: 'Estado de cuenta — Financiamiento {{financingNumber}}',
      body: '<p>Hola {{clientName}},</p><p>A continuación el resumen de tu financiamiento <strong>{{financingNumber}}</strong> a la fecha {{currentDate}}:</p><ul><li>Monto total: ${{totalAmount}}</li><li>Total pagado: ${{totalPaid}}</li><li>Saldo actual: ${{currentBalance}}</li><li>Cuotas pagadas: {{paidQuotas}} de {{totalQuotas}}</li></ul><p>Gracias por preferir Car4youpanama.</p>',
      enabled: true,
    },
  };

  const result = [];
  for (const [fullKey, defaultTpl] of Object.entries(defaultTemplates)) {
    const dbConfig = configs.find((c: any) => c.key === fullKey);
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

export default factories.createCoreController('api::financing.financing', ({ strapi }) => ({
  async getEmailConfig(ctx: any) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('No autenticado');

      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
      });
      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        return ctx.forbidden('Se requieren permisos de administrador');
      }

      const smtp = await getSmtpConfig(strapi);
      const templates = await getEmailTemplates(strapi);

      const safeSmtp = {
        host: smtp.host,
        port: smtp.port,
        user: smtp.user,
        from: smtp.from,
        secure: smtp.secure,
        hasCustomConfig: smtp.hasCustomConfig,
        hasPass: !!smtp.pass,
      };

      return ctx.send({ data: { smtp: safeSmtp, templates } });
    } catch (error) {
      strapi.log.error('Error obteniendo config de email:', error);
      return ctx.badRequest('Error obteniendo configuración de email');
    }
  },

  async updateEmailConfig(ctx: any) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('No autenticado');

      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
      });
      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        return ctx.forbidden('Se requieren permisos de administrador');
      }

      const { smtp, templates } = ctx.request.body;

      const smtpConfigs = [
        { key: 'billing-smtp-host', value: smtp?.host || '' },
        { key: 'billing-smtp-port', value: String(smtp?.port || 465) },
        { key: 'billing-smtp-user', value: smtp?.user || '' },
        { key: 'billing-smtp-pass', value: smtp?.pass || '', isSecret: true },
        { key: 'billing-smtp-from', value: smtp?.from || '' },
        {
          key: 'billing-smtp-secure',
          value: smtp?.secure !== undefined ? String(smtp.secure) : 'true',
        },
      ];

      for (const cfg of smtpConfigs) {
        const existing = await strapi.db.query('api::configuration.configuration').findOne({
          where: { key: cfg.key, category: 'billing' },
        });

        if (existing) {
          await strapi.db.query('api::configuration.configuration').update({
            where: { id: existing.id },
            data: { value: cfg.value, isSecret: cfg.isSecret || false },
          });
        } else {
          await strapi.db.query('api::configuration.configuration').create({
            data: {
              key: cfg.key,
              value: cfg.value,
              category: 'billing',
              isSecret: cfg.isSecret || false,
              description: `Configuración SMTP de financiamiento: ${cfg.key}`,
            },
          });
        }
      }

      if (Array.isArray(templates)) {
        for (const tpl of templates) {
          const key = `billing-email-template-${tpl.key}`;
          const existing = await strapi.db.query('api::configuration.configuration').findOne({
            where: { key, category: 'billing' },
          });

          const value = JSON.stringify({
            key: tpl.key,
            name: tpl.name,
            subject: tpl.subject,
            body: tpl.body,
            enabled: tpl.enabled,
          });

          if (existing) {
            await strapi.db.query('api::configuration.configuration').update({
              where: { id: existing.id },
              data: { value },
            });
          } else {
            await strapi.db.query('api::configuration.configuration').create({
              data: {
                key,
                value,
                category: 'billing',
                description: `Template de email para financiamiento: ${tpl.name}`,
              },
            });
          }
        }
      }

      return ctx.send({ success: true, message: 'Configuración guardada exitosamente' });
    } catch (error) {
      strapi.log.error('Error guardando config de email:', error);
      return ctx.badRequest('Error guardando configuración de email');
    }
  },

  async sendTestEmail(ctx: any) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('No autenticado');

      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
      });
      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        return ctx.forbidden('Se requieren permisos de administrador');
      }

      const { to, subject, body } = ctx.request.body;
      const result = await sendEmail(strapi, {
        to: to || user.email,
        subject: subject || 'Email de prueba — Car4youpanama',
        html: body || '<p>Este es un email de prueba desde Car4youpanama.</p>',
      });

      return ctx.send({ success: true, message: 'Email de prueba enviado', result });
    } catch (error: any) {
      strapi.log.error('Error enviando email de prueba:', error);
      return ctx.badRequest(error.message || 'Error enviando email de prueba');
    }
  },

  async sendFinancingEmail(ctx: any) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('No autenticado');

      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { email: user.email },
      });
      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        return ctx.forbidden('Se requieren permisos de administrador');
      }

      const { id } = ctx.params;
      const { templateKey, to, customSubject, customBody } = ctx.request.body;

      if (!templateKey && !customBody) {
        return ctx.badRequest('Debes proporcionar un templateKey o un customBody');
      }

      const financing = await strapi.documents('api::financing.financing').findOne({
        documentId: id,
        populate: {
          client: {
            fields: [
              'displayName',
              'email',
              'phone',
              'billingName',
              'billingPhone',
              'identificationNumber',
              'address',
              'billingAddress',
            ],
          },
          vehicle: { fields: ['brand', 'model', 'year', 'placa', 'vin'] },
        },
      });

      if (!financing) {
        return ctx.notFound('Financiamiento no encontrado');
      }

      const variables = getFinancingVariables(financing);

      let subject = customSubject;
      let html = customBody;

      if (templateKey && !customBody) {
        const configKey = `billing-email-template-${templateKey}`;
        const templateConfig = await strapi.db.query('api::configuration.configuration').findOne({
          where: { key: configKey, category: 'billing' },
        });

        if (!templateConfig) {
          return ctx.badRequest(`Template ${templateKey} no encontrado`);
        }

        let template;
        try {
          template = JSON.parse(templateConfig.value);
        } catch (e) {
          return ctx.badRequest(`Template ${templateKey} tiene formato inválido`);
        }

        subject = template.subject;
        html = template.body;
      }

      subject = renderTemplate(subject, variables);
      html = renderTemplate(html, variables);

      const recipient = to || variables.clientEmail || user.email;

      if (!recipient) {
        return ctx.badRequest('No se encontró dirección de email del destinatario');
      }

      const result = await sendEmail(strapi, { to: recipient, subject, html });

      return ctx.send({
        success: true,
        message: 'Email enviado exitosamente',
        recipient,
        subject,
        result,
      });
    } catch (error: any) {
      strapi.log.error('Error enviando email de financiamiento:', error);
      return ctx.badRequest(error.message || 'Error enviando email');
    }
  },
}));

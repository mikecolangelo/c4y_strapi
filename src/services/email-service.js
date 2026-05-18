'use strict';

const nodemailer = require('nodemailer');

/**
 * Servicio genérico de envío de emails.
 * Lee configuración SMTP dinámicamente desde el content-type `configuration`
 * con categoría `billing` y prefijo `billing-smtp-`.
 * Fallback a variables de entorno si no hay config en BD.
 */
function createGenericEmailService({ strapi }) {
  return {
    /**
     * Obtiene la configuración SMTP activa.
     * Prioridad: BD (configuration) > variables de entorno.
     * El password se oculta en la respuesta pública.
     */
    async getSmtpConfig() {
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

      const dbConfig = {};
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

      return {
        host,
        port,
        user,
        pass,
        from,
        secure,
        hasCustomConfig: !!dbConfig['billing-smtp-host'],
      };
    },

    /**
     * Construye y devuelve un transporter nodemailer.
     */
    async getTransporter() {
      const config = await this.getSmtpConfig();

      if (!config.host || !config.user || !config.pass) {
        throw new Error('Configuración SMTP incompleta. Verifica host, usuario y contraseña.');
      }

      return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    },

    /**
     * Envía un email.
     * @param {Object} params
     * @param {string} params.to
     * @param {string} params.subject
     * @param {string} params.html
     * @param {string} [params.text]
     */
    async sendEmail({ to, subject, html, text }) {
      if (!to || !subject || !html) {
        throw new Error('Los campos to, subject y html son requeridos.');
      }

      const transporter = await this.getTransporter();
      const config = await this.getSmtpConfig();
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
    },

    /**
     * Prueba la conectividad SMTP.
     */
    async testConnection() {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return { success: true, message: 'Conexión SMTP exitosa' };
    },
  };
}

module.exports = createGenericEmailService;

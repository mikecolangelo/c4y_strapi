'use strict';

const nodemailer = require('nodemailer');

function createEmailService({ strapi }) {
  return {
    getTransporter() {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT) || 465;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!host || !user || !pass) {
        strapi.log.error('❌ Configuración SMTP incompleta. Verifica SMTP_HOST, SMTP_USER y SMTP_PASS en .env');
        throw new Error('Configuración SMTP incompleta');
      }

      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });
    },

    async sendOtpEmail(to, code) {
      const transporter = this.getTransporter();
      const from = process.env.SMTP_FROM || process.env.SMTP_USER;

      await transporter.sendMail({
        from: `"Car4youpanama" <${from}>`,
        to,
        subject: 'Tu código de verificación',
        text: `Tu código de verificación es: ${code}. Expira en 10 minutos.`,
        html: `
          <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 12px;">
            <h2 style="color: #18181b; margin-top: 0;">Verificación de cuenta</h2>
            <p style="color: #3f3f46;">Usa el siguiente código para completar la validación de tu cuenta:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; padding: 20px; background: #f4f4f5; border-radius: 8px; text-align: center; color: #18181b; margin: 16px 0;">
              ${code}
            </div>
            <p style="color: #71717a; font-size: 13px;">Este código expira en <strong>10 minutos</strong>. No lo compartas con nadie.</p>
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
            <p style="color: #a1a1aa; font-size: 12px;">Si no solicitaste este código, ignora este mensaje.</p>
          </div>
        `,
      });

      strapi.log.info(`📧 OTP enviado a ${to}`);
    },
  };
}

module.exports = createEmailService;

'use strict';

module.exports = ({ strapi }) => ({
  async request(ctx) {
    const { email, password } = ctx.request.body;

    if (!email || !password) {
      return ctx.badRequest('Email y contraseña son requeridos');
    }

    try {
      // 1. Buscar usuario por email
      const user = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({ where: { email } });

      if (!user) {
        return ctx.unauthorized('Credenciales inválidas');
      }

      // 2. Validar password usando el servicio nativo de users-permissions
      const userService = strapi.plugin('users-permissions').service('user');
      const validPassword = await userService.validatePassword(password, user.password);

      if (!validPassword) {
        return ctx.unauthorized('Credenciales inválidas');
      }

      // 3. Limpiar OTPs antiguos para este usuario
      const otpService = require('../services/otp-service')({ strapi });
      await otpService.cleanupOldOtps(user.id);

      // 4. Generar nuevo OTP
      const code = await otpService.createOtp(user.id);

      // 5. Enviar email
      const emailService = require('../services/email-service')({ strapi });
      await emailService.sendOtpEmail(user.email, code);

      ctx.send({ success: true, message: 'Código de verificación enviado al correo' });
    } catch (error) {
      strapi.log.error('Error en MFA request:', error);
      ctx.internalServerError('Error al procesar la solicitud de verificación');
    }
  },

  async verify(ctx) {
    const { email, code } = ctx.request.body;

    if (!email || !code) {
      return ctx.badRequest('Email y código son requeridos');
    }

    try {
      // Buscar usuario por email
      const user = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({ where: { email } });

      if (!user) {
        return ctx.badRequest('Usuario no encontrado');
      }

      const otpService = require('../services/otp-service')({ strapi });
      const result = await otpService.verifyOtp(user.id, code);

      if (!result.valid) {
        if (result.reason === 'BLOCKED') {
          return ctx.badRequest('Cuenta bloqueada temporalmente por intentos fallidos. Intenta en 15 minutos.');
        }
        if (result.reason === 'EXPIRED') {
          return ctx.badRequest('El código ha expirado. Solicita uno nuevo.');
        }
        if (result.reason === 'NO_OTP') {
          return ctx.badRequest('No hay un código activo para este usuario');
        }
        return ctx.badRequest(`Código incorrecto. Intentos restantes: ${result.remainingAttempts ?? 0}`);
      }

      // Actualizar usuario como validado
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          isValidated: true,
          validatedAt: new Date(),
          validationMethod: 'email_otp',
        },
      });

      ctx.send({ success: true, message: 'Cuenta verificada exitosamente' });
    } catch (error) {
      strapi.log.error('Error en MFA verify:', error);
      ctx.internalServerError('Error al verificar el código');
    }
  },

  async adminForce(ctx) {
    const { userId } = ctx.request.body;

    if (!userId) {
      return ctx.badRequest('userId es requerido');
    }

    // Verificar que el caller sea admin
    const caller = ctx.state.user;
    const callerRole = caller?.role?.type || caller?.role?.name;

    if (!caller || callerRole !== 'admin') {
      return ctx.forbidden('Solo administradores pueden forzar la validación manual');
    }

    try {
      const user = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({ where: { id: Number(userId) } });

      if (!user) {
        return ctx.notFound('Usuario no encontrado');
      }

      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: {
          isValidated: true,
          validatedAt: new Date(),
          validationMethod: 'manual',
        },
      });

      ctx.send({ success: true, message: 'Validación manual aplicada exitosamente' });
    } catch (error) {
      strapi.log.error('Error en admin force validate:', error);
      ctx.internalServerError('Error al aplicar validación manual');
    }
  },
});

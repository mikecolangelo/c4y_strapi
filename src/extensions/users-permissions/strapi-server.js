'use strict';

const authMfaController = require('./controllers/auth-mfa');

module.exports = (plugin) => {
  // Cargar servicios
  const emailService = require('./services/email-service')({ strapi });
  const otpService = require('./services/otp-service')({ strapi });

  plugin.services['email-mfa'] = emailService;
  plugin.services['otp'] = otpService;

  // Cargar controlador MFA
  plugin.controllers['auth-mfa'] = authMfaController({ strapi });

  // Registrar rutas del flujo MFA
  const mfaRoutes = [
    {
      method: 'POST',
      path: '/auth/mfa/request',
      handler: 'auth-mfa.request',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/mfa/verify',
      handler: 'auth-mfa.verify',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/auth/mfa/admin-force',
      handler: 'auth-mfa.adminForce',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ];

  // Asegurar que existe el array de rutas del content-api
  if (!plugin.routes['content-api']) {
    plugin.routes['content-api'] = { type: 'content-api', routes: [] };
  }
  if (!plugin.routes['content-api'].routes) {
    plugin.routes['content-api'].routes = [];
  }

  plugin.routes['content-api'].routes.push(...mfaRoutes);

  strapi.log.info('🔐 MFA routes registered: /auth/mfa/request, /auth/mfa/verify, /auth/mfa/admin-force');

  return plugin;
};

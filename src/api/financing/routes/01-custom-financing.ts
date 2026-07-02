/**
 * Rutas custom para el módulo de financiamiento.
 * Agrega endpoints de configuración y envío de emails.
 */

export default {
  routes: [
    {
      method: 'GET',
      path: '/financing/email-config',
      handler: 'financing.getEmailConfig',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/financing/email-config',
      handler: 'financing.updateEmailConfig',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/financing/send-test-email',
      handler: 'financing.sendTestEmail',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/financing/:id/send-email',
      handler: 'financing.sendFinancingEmail',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};

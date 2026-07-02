const canCreate = {
  name: 'global::can-write-module',
  config: { module: 'stock', action: 'create' },
};
const canUpdate = {
  name: 'global::can-write-module',
  config: { module: 'stock', action: 'update' },
};

export default {
  routes: [
    {
      method: 'GET',
      path: '/supply-requests',
      handler: 'api::supply-request.supply-request.find',
      config: {},
    },
    {
      method: 'GET',
      path: '/supply-requests/:id',
      handler: 'api::supply-request.supply-request.findOne',
      config: {},
    },
    {
      method: 'POST',
      path: '/supply-requests',
      handler: 'api::supply-request.supply-request.create',
      config: {
        policies: [canCreate],
      },
    },
    {
      method: 'POST',
      path: '/supply-requests/:id/approve',
      handler: 'api::supply-request.supply-request.approve',
      config: {
        policies: [canUpdate],
      },
    },
    {
      method: 'POST',
      path: '/supply-requests/:id/reject',
      handler: 'api::supply-request.supply-request.reject',
      config: {
        policies: [canUpdate],
      },
    },
    {
      method: 'POST',
      path: '/supply-requests/:id/deliver',
      handler: 'api::supply-request.supply-request.deliver',
      config: {
        policies: [canUpdate],
      },
    },
  ],
};

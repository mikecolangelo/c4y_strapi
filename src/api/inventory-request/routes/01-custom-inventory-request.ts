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
      path: '/inventory-requests',
      handler: 'api::inventory-request.inventory-request.find',
      config: {},
    },
    {
      method: 'GET',
      path: '/inventory-requests/:id',
      handler: 'api::inventory-request.inventory-request.findOne',
      config: {},
    },
    {
      method: 'POST',
      path: '/inventory-requests',
      handler: 'api::inventory-request.inventory-request.create',
      config: {
        policies: [canCreate],
      },
    },
    {
      method: 'POST',
      path: '/inventory-requests/:id/approve',
      handler: 'api::inventory-request.inventory-request.approve',
      config: {
        policies: [canUpdate],
      },
    },
    {
      method: 'POST',
      path: '/inventory-requests/:id/reject',
      handler: 'api::inventory-request.inventory-request.reject',
      config: {
        policies: [canUpdate],
      },
    },
    {
      method: 'POST',
      path: '/inventory-requests/:id/deliver',
      handler: 'api::inventory-request.inventory-request.deliver',
      config: {
        policies: [canUpdate],
      },
    },
  ],
};

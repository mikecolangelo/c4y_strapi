module.exports = {
  async bootstrap({ strapi }) {
    const permissions = [
      {
        action: 'api::fleet.fleet.update',
        fields: ['responsables', 'assignedDrivers', 'interestedDrivers', 'currentDrivers'],
      },
    ];

    // Grant permissions to authenticated role
    const authenticatedRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (authenticatedRole) {
      for (const permission of permissions) {
        await strapi.query('plugin::users-permissions.permission').updateMany({
          where: {
            role: authenticatedRole.id,
            action: permission.action,
          },
          data: {
            enabled: true,
            fields: permission.fields,
          },
        });
      }
    }
  },
};
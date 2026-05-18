'use strict';

/**
 * Extensión del controlador de autenticación de users-permissions
 * Para crear automáticamente un user-profile cuando se registra un usuario
 */

module.exports = (plugin) => {
  // Guardar el controlador original
  const originalRegister = plugin.controllers.auth.register;

  // Extender el método register
  plugin.controllers.auth.register = async (ctx) => {
    // Llamar al método original
    const response = await originalRegister(ctx);

    // Si el registro fue exitoso y hay un usuario
    if (response && response.user && response.user.id) {
      try {
        const userId = response.user.id;
        const userData = response.user;

        // Usar el servicio de user-profile para crear el perfil
        const userProfileService = strapi.service('api::user-profile.user-profile');
        
        if (userProfileService && typeof userProfileService.createProfileForUser === 'function') {
          await userProfileService.createProfileForUser(userId, {
            email: userData.email,
            username: userData.username,
            fullName: userData.username,
          });
        } else {
          // Fallback: crear directamente si el método no está disponible
          const existingProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
            filters: {
              userAccount: {
                id: userId,
              },
            },
            limit: 1,
          });

          if (!existingProfile || existingProfile.length === 0) {
            let displayName = userData.username || 'Usuario';
            
            if (displayName.includes('@')) {
              const emailPart = displayName.split('@')[0];
              displayName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
            }

            await strapi.entityService.create('api::user-profile.user-profile', {
              data: {
                displayName,
                email: userData.email || '',
                role: 'driver',
                userAccount: userId,
              },
            });

            strapi.log.info(`✅ User-profile creado automáticamente para el usuario ${userId} (${userData.email})`);
          }
        }
      } catch (error) {
        // Log del error pero no interrumpir el registro
        strapi.log.error(`❌ Error al crear user-profile automáticamente:`, error);
      }
    }

    return response;
  };

  return plugin;
};


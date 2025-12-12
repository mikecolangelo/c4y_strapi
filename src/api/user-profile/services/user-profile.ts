/**
 * user-profile service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::user-profile.user-profile', ({ strapi }) => ({
  /**
   * Crea un user-profile automáticamente cuando se crea un usuario
   */
  async createProfileForUser(userId: number, userData: { email?: string; username?: string; fullName?: string }) {
    try {
      // Verificar si ya existe un user-profile para este usuario
      const existingProfile = await strapi.entityService.findMany('api::user-profile.user-profile', {
        filters: {
          userAccount: {
            id: userId,
          },
        },
        limit: 1,
      });

      if (existingProfile && existingProfile.length > 0) {
        strapi.log.info(`User-profile ya existe para el usuario ${userId}`);
        return existingProfile[0];
      }

      // Determinar el displayName
      let displayName = userData.fullName || userData.username || 'Usuario';
      
      // Si el username es un email, usar la parte antes del @
      if (displayName.includes('@')) {
        const emailPart = displayName.split('@')[0];
        displayName = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
      }

      // Crear el user-profile
      const profile = await strapi.entityService.create('api::user-profile.user-profile', {
        data: {
          displayName,
          email: userData.email || '',
          role: 'driver', // Rol por defecto para nuevos usuarios
          userAccount: userId,
        },
      });

      strapi.log.info(`User-profile creado automáticamente para el usuario ${userId}`);
      return profile;
    } catch (error) {
      strapi.log.error(`Error al crear user-profile para el usuario ${userId}:`, error);
      throw error;
    }
  },
}));

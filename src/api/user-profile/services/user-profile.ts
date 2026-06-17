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

  /**
   * Crea una cuenta nativa de users-permissions para un perfil existente
   * que no sea lead y que no tenga userAccount vinculado.
   * Reutiliza la logica de promoteLeadToUser pero sin la restriccion de role === 'lead'.
   */
  async createAccountForProfile(profileDocumentId: string, targetRole: 'admin' | 'driver', customPassword?: string) {
    // 1. Buscar el perfil
    const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
      where: { documentId: profileDocumentId },
      populate: { userAccount: true },
    });

    if (!profile) {
      throw new Error('Perfil no encontrado');
    }

    if (profile.userAccount) {
      throw new Error('Este contacto ya tiene una cuenta de usuario activa');
    }

    if (!profile.email) {
      throw new Error('El contacto no tiene email');
    }

    const userService = strapi.plugin('users-permissions').service('user');

    // 2. Verificar si ya existe un up_users con ese email
    const existingUserByEmail = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: profile.email },
    });

    if (existingUserByEmail) {
      // Verificar si esta vinculado a OTRO profile
      const linkedProfile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: {
          userAccount: existingUserByEmail.id,
          id: { $ne: profile.id },
        },
      });

      if (linkedProfile) {
        throw new Error(
          `El email ${profile.email} ya pertenece a un usuario activo vinculado al contacto "${linkedProfile.displayName || linkedProfile.email}". ` +
          'No se puede crear un duplicado.'
        );
      }

      // Vincular el up_user existente a este perfil
      const userProfile = await strapi.entityService.update(
        'api::user-profile.user-profile',
        profile.id,
        {
          data: {
            role: targetRole,
            userAccount: existingUserByEmail.id,
          },
        }
      );

      return {
        userProfile,
        authUser: existingUserByEmail,
        tempPassword: null,
        alreadyConverted: true,
      };
    }

    // 3. Generar contrasena temporal segura
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let tempPassword = customPassword ? customPassword.trim() : '';
    if (tempPassword) {
      if (tempPassword.length < 6) {
        throw new Error('La contrasena personalizada debe tener al menos 6 caracteres');
      }
    } else {
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // 4. Crear usuario en users-permissions
    const authUser = await userService.add({
      username: profile.email,
      email: profile.email,
      password: tempPassword,
      confirmed: true,
      provider: 'local',
      role: 1,
    });

    try {
      // 5. Actualizar user-profile
      const userProfile = await strapi.entityService.update(
        'api::user-profile.user-profile',
        profile.id,
        {
          data: {
            role: targetRole,
            userAccount: authUser.id,
          },
        }
      );

      return {
        userProfile,
        authUser,
        tempPassword,
        alreadyConverted: false,
      };
    } catch (updateError) {
      // Rollback
      try {
        await userService.remove({ id: authUser.id });
      } catch (removeError) {
        strapi.log.error('Error limpiando usuario huérfano tras fallo de vinculacion:', removeError);
      }
      throw updateError;
    }
  },

  /**
   * Promueve un lead a usuario nativo de Strapi
   */
  async promoteLeadToUser(leadDocumentId: string, targetRole: 'admin' | 'driver', customPassword?: string) {
    // 1. Buscar el lead por documentId con su cuenta de usuario si existe
    const lead = await strapi.db.query('api::user-profile.user-profile').findOne({
      where: { documentId: leadDocumentId },
      populate: { userAccount: true },
    });

    if (!lead) {
      throw new Error('Lead no encontrado');
    }

    // 2. Verificar que role === 'lead'
    if (lead.role !== 'lead') {
      throw new Error('El perfil no es un lead');
    }

    if (!lead.email) {
      throw new Error('El lead no tiene email');
    }

    const userService = strapi.plugin('users-permissions').service('user');

    // 3. Si el lead ya tiene un userAccount vinculado, verificar que exista y reutilizarlo
    if (lead.userAccount) {
      const existingUserId = typeof lead.userAccount === 'object' ? lead.userAccount.id : lead.userAccount;
      const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: existingUserId },
      });

      if (existingUser) {
        // Actualizar solo el rol del perfil
        const userProfile = await strapi.entityService.update(
          'api::user-profile.user-profile',
          lead.id,
          {
            data: {
              role: targetRole,
            },
          }
        );

        return {
          userProfile,
          authUser: existingUser,
          tempPassword: null,
          alreadyConverted: true,
        };
      }
    }

    // 4. Verificar si ya existe otro user-profile con el mismo email que ya fue convertido
    const existingProfileByEmail = await strapi.db.query('api::user-profile.user-profile').findOne({
      where: {
        email: lead.email,
        id: { $ne: lead.id },
        role: { $ne: 'lead' },
      },
      populate: { userAccount: true },
    });

    if (existingProfileByEmail) {
      throw new Error(
        `Ya existe un contacto activo (${existingProfileByEmail.displayName || existingProfileByEmail.email}) con este email. ` +
        `No se puede crear un duplicado. Use el contacto existente o cambie el email de este lead.`
      );
    }

    // 5. Verificar si ya existe un usuario en up_users con el mismo email (no vinculado a este lead)
    const existingUserByEmail = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: lead.email },
    });

    if (existingUserByEmail) {
      // Verificar si ese up_user está vinculado a OTRO profile
      const linkedProfile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: {
          userAccount: existingUserByEmail.id,
          id: { $ne: lead.id },
        },
      });

      if (linkedProfile) {
        throw new Error(
          `El email ${lead.email} ya pertenece a un usuario activo vinculado al contacto "${linkedProfile.displayName || linkedProfile.email}". ` +
          `No se puede crear un duplicado.`
        );
      }

      // Si no está vinculado a otro profile, vincularlo a este lead automáticamente
      const userProfile = await strapi.entityService.update(
        'api::user-profile.user-profile',
        lead.id,
        {
          data: {
            role: targetRole,
            userAccount: existingUserByEmail.id,
          },
        }
      );

      return {
        userProfile,
        authUser: existingUserByEmail,
        tempPassword: null,
        alreadyConverted: true,
      };
    }

    // 6. Generar contraseña temporal segura (12 chars, alfanumérico sin ambigüedad)
    // Se excluyen caracteres visualmente idénticos: 0/O, l/I/1
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let tempPassword = customPassword ? customPassword.trim() : '';
    if (tempPassword) {
      if (tempPassword.length < 6) {
        throw new Error('La contraseña personalizada debe tener al menos 6 caracteres');
      }
    } else {
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    // 6. Crear usuario en plugin::users-permissions.user
    // Usamos el servicio del plugin que hashea la contraseña automáticamente
    const authUser = await userService.add({
      username: lead.email,
      email: lead.email,
      password: tempPassword,
      confirmed: true,
      provider: 'local',
      role: 1, // Asignar rol Authenticated por defecto
    });

    try {
      // 7. Actualizar user-profile
      const userProfile = await strapi.entityService.update(
        'api::user-profile.user-profile',
        lead.id,
        {
          data: {
            role: targetRole,
            userAccount: authUser.id,
          },
        }
      );

      // 8. Retornar resultado
      return {
        userProfile,
        authUser,
        tempPassword,
      };
    } catch (updateError) {
      // Si la actualización del user-profile falla, eliminar el usuario creado
      // para evitar usuarios huérfanos sin vínculo a un perfil.
      try {
        await userService.remove({ id: authUser.id });
      } catch (removeError) {
        strapi.log.error('Error limpiando usuario huérfano tras fallo de conversión:', removeError);
      }
      throw updateError;
    }
  },
}));

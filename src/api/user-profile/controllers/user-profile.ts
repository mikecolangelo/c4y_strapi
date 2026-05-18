/**
 * user-profile controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::user-profile.user-profile', ({ strapi }) => ({
  /**
   * Sobreescribe create para que contactos con rol activo (admin/seller/driver)
   * automaticamente obtengan una cuenta nativa de users-permissions vinculada.
   */
  async create(ctx) {
    const { data } = ctx.request.body || {};

    // Si es lead o no tiene email, comportamiento normal de Strapi
    if (!data || data.role === 'lead' || !data.email) {
      const entity = await strapi.entityService.create('api::user-profile.user-profile', {
        data,
      });
      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity);
    }

    // Validar rol
    const validRoles = ['admin', 'seller', 'driver'];
    if (!validRoles.includes(data.role)) {
      return ctx.badRequest('Rol invalido. Debe ser admin, seller, driver o lead');
    }

    const userService = strapi.plugin('users-permissions').service('user');
    const normalizedEmail = data.email.toLowerCase().trim();

    // Verificar si ya existe up_user con ese email
    const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return ctx.badRequest(`Ya existe un usuario con el email ${data.email}`);
    }

    // Generar o validar contrasena
    let tempPassword = data.password ? String(data.password).trim() : '';
    if (!tempPassword) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      for (let i = 0; i < 12; i++) {
        tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } else if (tempPassword.length < 6) {
      return ctx.badRequest('La contrasena debe tener al menos 6 caracteres');
    }

    // Crear up_user nativo
    const authUser = await userService.add({
      username: normalizedEmail,
      email: normalizedEmail,
      password: tempPassword,
      confirmed: true,
      provider: 'local',
      role: 1, // Rol Authenticated por defecto
    });

    try {
      // Preparar datos del profile sin password ni campos internos
      const profileData = { ...data };
      delete profileData.password;

      // Crear user-profile con userAccount vinculado
      const entity = await strapi.entityService.create('api::user-profile.user-profile', {
        data: {
          ...profileData,
          userAccount: authUser.id,
        },
      });

      const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
      return this.transformResponse(sanitizedEntity, { tempPassword });
    } catch (error: any) {
      // Rollback: eliminar usuario creado para evitar huérfanos
      try {
        await userService.remove({ id: authUser.id });
      } catch (cleanupError: any) {
        strapi.log.error('Error limpiando usuario huérfano tras fallo de creacion:', cleanupError);
      }
      strapi.log.error('Error creando user-profile con cuenta nativa:', error);
      return ctx.badRequest(error.message || 'Error al crear el contacto con cuenta de acceso');
    }
  },

  async account(ctx) {
    const { documentId } = ctx.params;

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId');
    }

    try {
      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { documentId },
        populate: { userAccount: true },
      });

      if (!profile) {
        return ctx.notFound('Perfil no encontrado');
      }

      if (!profile.userAccount) {
        return ctx.send({ data: null });
      }

      const userAccountId = typeof profile.userAccount === 'object' ? profile.userAccount.id : profile.userAccount;
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userAccountId },
        select: ['id', 'email', 'isValidated', 'validatedAt', 'validationMethod'],
      });

      return ctx.send({ data: user });
    } catch (error: any) {
      strapi.log.error('Error obteniendo cuenta de usuario:', error);
      return ctx.internalServerError('Error al obtener cuenta de usuario');
    }
  },

  async convert(ctx) {
    const { documentId } = ctx.params;
    const { targetRole, customPassword } = ctx.request.body;

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId');
    }

    if (!targetRole || !['admin', 'seller', 'driver'].includes(targetRole)) {
      return ctx.badRequest('targetRole inválido. Debe ser admin, seller o driver');
    }

    try {
      const result = await strapi
        .service('api::user-profile.user-profile')
        .promoteLeadToUser(documentId, targetRole, customPassword);

      return ctx.send({ data: result });
    } catch (error: any) {
      strapi.log.error('Error promoviendo lead:', error);
      return ctx.badRequest(error.message || 'Error al promover el lead');
    }
  },

  /**
   * Crea una cuenta de usuario nativa para un contacto existente
   * que tenga rol activo pero no tenga userAccount vinculado.
   */
  async createAccount(ctx) {
    const { documentId } = ctx.params;
    const { targetRole, customPassword } = ctx.request.body || {};

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId');
    }

    if (!targetRole || !['admin', 'seller', 'driver'].includes(targetRole)) {
      return ctx.badRequest('targetRole inválido. Debe ser admin, seller o driver');
    }

    try {
      const result = await strapi
        .service('api::user-profile.user-profile')
        .createAccountForProfile(documentId, targetRole, customPassword);

      return ctx.send({ data: result });
    } catch (error: any) {
      strapi.log.error('Error creando cuenta para contacto:', error);
      return ctx.badRequest(error.message || 'Error al crear cuenta de acceso');
    }
  },

  async resetPassword(ctx) {
    const { documentId } = ctx.params;
    const { newPassword } = ctx.request.body;

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId');
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return ctx.badRequest('La nueva contraseña debe tener al menos 6 caracteres');
    }

    try {
      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { documentId },
        populate: { userAccount: true },
      });

      if (!profile) {
        return ctx.notFound('Perfil no encontrado');
      }

      if (!profile.userAccount) {
        return ctx.badRequest('Este contacto no tiene una cuenta de usuario activa');
      }

      const userAccountId = typeof profile.userAccount === 'object' ? profile.userAccount.id : profile.userAccount;
      const userService = strapi.plugin('users-permissions').service('user');

      await userService.edit(userAccountId, {
        password: newPassword.trim(),
      });

      return ctx.send({
        data: {
          message: 'Contraseña actualizada correctamente',
          userId: userAccountId,
        },
      });
    } catch (error: any) {
      strapi.log.error('Error restableciendo contraseña:', error);
      return ctx.internalServerError(error.message || 'Error al restablecer la contraseña');
    }
  },

  async batchImport(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const { data, importBatch } = ctx.request.body || {};
    if (!Array.isArray(data) || data.length === 0) {
      return ctx.badRequest("Se requiere un array de registros en 'data'");
    }
    if (data.length > 50) {
      return ctx.badRequest('Limite maximo de 50 registros por lote');
    }

    // Verificar si el usuario autenticado es administrador
    const userProfile = await strapi.db.query('api::user-profile.user-profile').findOne({
      where: { email: user.email },
    });
    const isAdmin = ['admin', 'super-admin'].includes(userProfile?.role);

    try {
      // Pre-cargar emails y telefonos existentes para deduplicacion eficiente
      const existingProfiles = await strapi.db.query('api::user-profile.user-profile').findMany({
        where: {
          $or: [
            { email: { $notNull: true } },
            { phone: { $notNull: true } },
          ],
        },
        select: ['email', 'phone'],
      });

      const existingEmails = new Set(
        existingProfiles
          .map((p: any) => p.email?.toLowerCase().trim())
          .filter(Boolean)
      );
      const existingPhones = new Set(
        existingProfiles
          .map((p: any) => p.phone?.replace(/\D/g, ''))
          .filter(Boolean)
      );

      // Tambien trackear duplicados dentro del mismo batch
      const batchEmails = new Set<string>();
      const batchPhones = new Set<string>();

      const details: Array<{
        index: number;
        displayName: string | null;
        status: 'created' | 'duplicate' | 'error';
        message?: string;
      }> = [];
      let created = 0;
      let duplicated = 0;
      let errors = 0;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowIndex = i + 1;
        const displayName = row.displayName || null;

        try {
          // Nota: se permite guardar leads con datos faltantes a peticion del usuario.
          // Solo se bloquean duplicados exactos por email o telefono.

          const normalizedEmail = row.email ? row.email.toLowerCase().trim() : null;
          const normalizedPhone = row.phone ? row.phone.replace(/\D/g, '') : null;

          // Deduplicacion contra base de datos
          if (normalizedEmail && existingEmails.has(normalizedEmail)) {
            duplicated++;
            details.push({
              index: rowIndex,
              displayName,
              status: 'duplicate',
              message: `Email '${row.email}' ya existe en la base de datos`,
            });
            continue;
          }

          if (normalizedPhone && existingPhones.has(normalizedPhone)) {
            duplicated++;
            details.push({
              index: rowIndex,
              displayName,
              status: 'duplicate',
              message: `Telefono '${row.phone}' ya existe en la base de datos`,
            });
            continue;
          }

          // Deduplicacion intra-batch
          if (normalizedEmail && batchEmails.has(normalizedEmail)) {
            duplicated++;
            details.push({
              index: rowIndex,
              displayName,
              status: 'duplicate',
              message: `Email '${row.email}' duplicado dentro del lote`,
            });
            continue;
          }
          if (normalizedPhone && batchPhones.has(normalizedPhone)) {
            duplicated++;
            details.push({
              index: rowIndex,
              displayName,
              status: 'duplicate',
              message: `Telefono '${row.phone}' duplicado dentro del lote`,
            });
            continue;
          }

          // Determinar rol: solo admins pueden importar roles distintos a 'lead'
          const requestedRole = row.role ? String(row.role).toLowerCase().trim() : null;
          const allowedRoles = ['admin', 'seller', 'driver', 'lead'];
          const effectiveRole = isAdmin && requestedRole && allowedRoles.includes(requestedRole)
            ? requestedRole
            : 'lead';

          // Crear el lead
          const payload = {
            displayName: row.displayName.trim(),
            role: effectiveRole,
            email: normalizedEmail || undefined,
            phone: row.phone ? row.phone.trim() : undefined,
            department: row.department ? String(row.department).trim() : undefined,
            bio: row.bio ? String(row.bio).trim() : undefined,
            hireDate: row.hireDate || undefined,
            workSchedule: row.workSchedule ? String(row.workSchedule).trim() : undefined,
          };

          await strapi.entityService.create('api::user-profile.user-profile', {
            data: payload,
          });

          // Registrar en sets para evitar duplicados intra-batch
          if (normalizedEmail) batchEmails.add(normalizedEmail);
          if (normalizedPhone) batchPhones.add(normalizedPhone);
          // Tambien registrar en sets globales para este request
          if (normalizedEmail) existingEmails.add(normalizedEmail);
          if (normalizedPhone) existingPhones.add(normalizedPhone);

          created++;
          details.push({
            index: rowIndex,
            displayName,
            status: 'created',
          });
        } catch (err: any) {
          errors++;
          details.push({
            index: rowIndex,
            displayName,
            status: 'error',
            message: err.message || 'Error al crear el lead',
          });
        }
      }

      return ctx.send({
        data: {
          importBatch: importBatch || `leads-${Date.now()}`,
          summary: {
            total: data.length,
            created,
            duplicated,
            errors,
          },
          details,
        },
      });
    } catch (error: any) {
      strapi.log.error('Error en batchImport de leads:', error);
      return ctx.internalServerError(error.message || 'Error durante la importacion masiva');
    }
  },
}));

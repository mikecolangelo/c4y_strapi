/**
 * fleet controller
 */

import { factories } from '@strapi/strapi'

function sanitizeFleetEntity(entity: any) {
  const relationFields = ['responsables', 'assignedDrivers', 'interestedDrivers', 'currentDrivers', 'interestedPersons'];
  for (const field of relationFields) {
    if (Array.isArray(entity[field])) {
      entity[field] = entity[field].map((item: any) => {
        if (item && typeof item === 'object') {
          const { password, ...rest } = item;
          return rest;
        }
        return item;
      });
    }
  }
  return entity;
}

export default factories.createCoreController('api::fleet.fleet', ({ strapi }) => ({

  async findOne(ctx) {
    const documentId = ctx.params.id;
    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId del vehículo');
    }
    try {
      const entity = await strapi.db.query('api::fleet.fleet').findOne({
        where: { documentId },
        populate: {
          image: true,
          responsables: true,
          assignedDrivers: true,
          interestedDrivers: true,
          currentDrivers: true,
          interestedPersons: true,
          financing: true,
        },
      });
      if (!entity) {
        return ctx.notFound('Vehículo no encontrado');
      }
      const sanitized = sanitizeFleetEntity(entity);
      return this.transformResponse(sanitized);
    } catch (error) {
      console.error('Error obteniendo vehículo:', error);
      return ctx.badRequest('Error al obtener el vehículo: ' + (error as Error).message);
    }
  },

  async update(ctx) {
    const documentId = ctx.params.id;
    const data = ctx.request.body?.data;

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId del vehículo');
    }

    try {
      const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
        where: { documentId },
      });

      if (!vehicle) {
        return ctx.notFound('Vehículo no encontrado');
      }

      const internalId = vehicle.id;

      const relationFields = ['responsables', 'assignedDrivers', 'interestedDrivers', 'currentDrivers'];
      const scalarData: any = {};
      const relationsData: Record<string, number[]> = {};

      for (const [key, value] of Object.entries(data || {})) {
        if (relationFields.includes(key) && Array.isArray(value)) {
          const numericIds = (value as any[])
            .map((id: any) => (typeof id === 'number' ? id : parseInt(id, 10)))
            .filter((id: any) => !isNaN(id));
          relationsData[key] = numericIds;
        } else {
          scalarData[key] = value;
        }
      }

      if (Object.keys(scalarData).length > 0) {
        await strapi.db.query('api::fleet.fleet').update({
          where: { documentId },
          data: scalarData,
        });
      }

      const relationMappings: Record<string, { table: string; col1: string; col2: string }> = {
        responsables: { table: 'fleets_responsables_lnk', col1: 'fleet_id', col2: 'user_profile_id' },
        assignedDrivers: { table: 'user_profiles_assigned_vehicles_lnk', col1: 'fleet_id', col2: 'user_profile_id' },
        interestedDrivers: { table: 'user_profiles_interested_vehicles_lnk', col1: 'fleet_id', col2: 'user_profile_id' },
        currentDrivers: { table: 'fleets_current_drivers_lnk', col1: 'fleet_id', col2: 'user_profile_id' },
      };

      for (const [field, ids] of Object.entries(relationsData)) {
        const mapping = relationMappings[field];
        if (!mapping) continue;

        await strapi.db.connection(mapping.table).where(mapping.col1, internalId).del();

        if (ids.length > 0) {
          const rows = ids.map((userId) => ({
            [mapping.col1]: internalId,
            [mapping.col2]: userId,
          }));
          await strapi.db.connection(mapping.table).insert(rows).onConflict().ignore();
        }
      }

      const entity = await strapi.db.query('api::fleet.fleet').findOne({
        where: { documentId },
        populate: {
          image: true,
          responsables: true,
          assignedDrivers: true,
          interestedDrivers: true,
          currentDrivers: true,
          interestedPersons: true,
          financing: true,
        },
      });

      const sanitized = sanitizeFleetEntity(entity);
      return this.transformResponse(sanitized);
    } catch (error) {
      console.error('Error actualizando vehículo:', error);
      return ctx.badRequest('Error al actualizando el vehículo: ' + (error as Error).message);
    }
  },

  async setMileageRecord(ctx) {
    const { documentId } = ctx.params;
    const { newMileage, notes, lastKnownUpdatedAt } = ctx.request.body;

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId del vehículo');
    }

    if (newMileage === undefined || newMileage === null) {
      return ctx.badRequest('Se requiere newMileage');
    }

    const mileageValue = parseInt(newMileage, 10);
    if (isNaN(mileageValue) || mileageValue < 0) {
      return ctx.badRequest('newMileage debe ser un número entero positivo');
    }

    try {
      const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
        where: { documentId },
      });

      if (!vehicle) {
        return ctx.notFound('Vehículo no encontrado');
      }

      const currentMileage = parseInt(vehicle.currentMileage || 0, 10);

      if (mileageValue < currentMileage) {
        return ctx.badRequest(`El kilometraje no puede ser menor al actual (${currentMileage} km)`);
      }

      // Validación de concurrencia opcional por timestamp
      if (lastKnownUpdatedAt) {
        const vehicleUpdatedAt = new Date(vehicle.updatedAt).getTime();
        const clientUpdatedAt = new Date(lastKnownUpdatedAt).getTime();
        if (vehicleUpdatedAt !== clientUpdatedAt) {
          return ctx.conflict('El vehículo fue modificado por otro usuario. Recarga y vuelve a intentarlo.');
        }
      }

      const updatedVehicle = await strapi.db.query('api::fleet.fleet').update({
        where: { documentId },
        data: {
          currentMileage: mileageValue,
        },
      });

      // Resolver nombre del usuario actual para el historial
      const user = ctx.state.user;
      let createdByName = null;
      if (user) {
        const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
          where: { email: user.email },
          select: ['displayName'],
        });
        createdByName = profile?.displayName || user.username || user.email || null;
      }

      // Crear registro en historial
      await strapi.entityService.create('api::fleet-mileage-history.fleet-mileage-history', {
        data: {
          previousMileage: currentMileage,
          newMileage: mileageValue,
          notes: notes || 'Actualización automática de sistema',
          createdByName,
          changeType: 'mileage_update',
          vehicle: vehicle.id,
        },
      });

      // Verificar recordatorios de aceite en segundo plano
      try {
        const fleetReminderService = strapi.service('api::fleet-reminder.fleet-reminder');
        if (fleetReminderService && typeof fleetReminderService.checkMileageReminders === 'function') {
          fleetReminderService.checkMileageReminders(vehicle.id, mileageValue).catch((err: any) => {
            strapi.log.error(`[setMileageRecord] Error verificando recordatorios para vehículo ${documentId}:`, err);
          });
        }
      } catch (reminderError) {
        strapi.log.error(`[setMileageRecord] Error iniciando verificación de recordatorios para vehículo ${documentId}:`, reminderError);
      }

      return ctx.send({
        data: {
          documentId: updatedVehicle.documentId,
          previousMileage: currentMileage,
          newMileage: mileageValue,
          message: 'Kilometraje actualizado correctamente',
        },
      });
    } catch (error) {
      console.error('Error actualizando kilometraje:', error);
      return ctx.internalServerError('Error al actualizar el kilometraje');
    }
  },

  async recordOilChange(ctx) {
    const { documentId } = ctx.params;

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId del vehículo');
    }

    try {
      const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
        where: { documentId },
      });

      if (!vehicle) {
        return ctx.notFound('Vehículo no encontrado');
      }

      const currentMileage = parseInt(vehicle.currentMileage || 0, 10);

      const updatedVehicle = await strapi.db.query('api::fleet.fleet').update({
        where: { documentId },
        data: {
          lastOilChangeMileage: currentMileage,
          oilChangeNotificationSent: false,
          oilChangeWarningSent: false,
        },
      });

      // Resolver nombre del usuario actual para el historial
      const user = ctx.state.user;
      let createdByName = null;
      if (user) {
        const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
          where: { email: user.email },
          select: ['displayName'],
        });
        createdByName = profile?.displayName || user.username || user.email || null;
      }

      // Crear registro en historial de cambio de aceite
      await strapi.entityService.create('api::fleet-mileage-history.fleet-mileage-history', {
        data: {
          previousMileage: currentMileage,
          newMileage: currentMileage,
          notes: 'Cambio de aceite registrado',
          createdByName,
          changeType: 'oil_change_reset',
          vehicle: vehicle.id,
        },
      });

      return ctx.send({
        data: {
          documentId: updatedVehicle.documentId,
          currentMileage: updatedVehicle.currentMileage,
          lastOilChangeMileage: currentMileage,
          message: 'Cambio de aceite registrado correctamente',
        },
      });
    } catch (error) {
      console.error('Error registrando cambio de aceite:', error);
      return ctx.internalServerError('Error al registrar el cambio de aceite');
    }
  },

  async getMileageHistory(ctx) {
    const { documentId } = ctx.params;

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId del vehículo');
    }

    try {
      const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
        where: { documentId },
        select: ['id'],
      });

      if (!vehicle) {
        return ctx.notFound('Vehículo no encontrado');
      }

      const history = await strapi.entityService.findMany('api::fleet-mileage-history.fleet-mileage-history', {
        filters: {
          vehicle: { id: { $eq: vehicle.id } },
        },
        sort: { createdAt: 'desc' },
      });

      return ctx.send({
        data: history || [],
      });
    } catch (error) {
      console.error('Error obteniendo historial de kilometraje:', error);
      return ctx.internalServerError('Error al obtener el historial de kilometraje');
    }
  },

  async checkMileageReminders(ctx) {
    const { documentId } = ctx.params;

    if (!documentId) {
      return ctx.badRequest('Se requiere el documentId del vehículo');
    }

    try {
      const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
        where: { documentId },
      });

      if (!vehicle) {
        return ctx.notFound('Vehículo no encontrado');
      }

      const fleetReminderService = strapi.service('api::fleet-reminder.fleet-reminder');
      if (!fleetReminderService || typeof fleetReminderService.checkMileageReminders !== 'function') {
        return ctx.internalServerError('Servicio de recordatorios no disponible');
      }

      const currentMileage = parseInt(vehicle.currentMileage || 0, 10);
      const result = await fleetReminderService.checkMileageReminders(
        vehicle.id,
        currentMileage
      );

      return ctx.send({
        data: {
          documentId,
          currentMileage,
          ...result,
        },
      });
    } catch (error) {
      console.error('Error verificando recordatorios:', error);
      return ctx.internalServerError('Error al verificar recordatorios');
    }
  },

  // Alias legacy para compatibilidad temporal con rutas antiguas
  async incrementMileage(ctx) {
    const { additionalMileage } = ctx.request.body;
    const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
      where: { documentId: ctx.params.documentId },
    });
    if (!vehicle) return ctx.notFound('Vehículo no encontrado');
    const currentMileage = parseInt(vehicle.currentMileage || 0, 10);
    const newMileage = currentMileage + parseFloat(additionalMileage || 0);
    ctx.request.body = { newMileage, notes: ctx.request.body?.notes };
    return (this as any).setMileageRecord(ctx);
  },

  async resetOilChangeCounter(ctx) {
    return (this as any).recordOilChange(ctx);
  },
}));

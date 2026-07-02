import { factories } from '@strapi/strapi';
import { randomUUID } from 'crypto';

function calculateTotals(laborCost: number, partsCost: number, servicesCost: number = 0) {
  const subtotal = laborCost + partsCost + servicesCost;
  const totalCost = subtotal;
  return {
    partsCost: Number(partsCost.toFixed(2)),
    taxAmount: 0,
    totalCost: Number(totalCost.toFixed(2)),
  };
}

function calculateServicesCost(services: any[] | undefined | null): number {
  if (!services || !Array.isArray(services)) return 0;
  return services.reduce((sum: number, s: any) => sum + parseFloat(s?.price || 0), 0);
}

/**
 * Normaliza las relaciones del payload al formato que espera
 * el Document Service API de Strapi v5 (connect / set / disconnect).
 */
function normalizeRelations(data: any) {
  if (!data || typeof data !== 'object') return data;
  const result = { ...data };

  if (result.vehicle !== undefined) {
    if (result.vehicle === null) {
      result.vehicle = { disconnect: true };
    } else {
      result.vehicle = { connect: [{ id: Number(result.vehicle) }] };
    }
  }

  if (result.driver !== undefined) {
    if (result.driver === null) {
      result.driver = { disconnect: true };
    } else {
      result.driver = { connect: [{ id: Number(result.driver) }] };
    }
  }

  if (result.services !== undefined) {
    if (
      result.services === null ||
      (Array.isArray(result.services) && result.services.length === 0)
    ) {
      result.services = { set: [] };
    } else if (Array.isArray(result.services)) {
      result.services = { connect: result.services.map((id: any) => ({ id: Number(id) })) };
    }
  }

  if (result.inventoryItems !== undefined) {
    if (
      result.inventoryItems === null ||
      (Array.isArray(result.inventoryItems) && result.inventoryItems.length === 0)
    ) {
      result.inventoryItems = { set: [] };
    } else if (Array.isArray(result.inventoryItems)) {
      result.inventoryItems = {
        connect: result.inventoryItems.map((id: any) => ({ id: Number(id) })),
      };
    }
  }

  return result;
}

async function resolveNumericId(strapi: any, documentId: string): Promise<number | null> {
  const result = await strapi.db.query('api::service-order.service-order').findOne({
    where: { documentId },
    select: ['id'],
  });
  return result?.id ?? null;
}

async function createUsedItems(strapi: any, orderId: number, usedItems: any[]) {
  let partsCost = 0;
  if (!usedItems || usedItems.length === 0) {
    return partsCost;
  }
  for (const item of usedItems) {
    const resolvedInventoryItem = Number(item.inventoryItem);
    if (!Number.isFinite(resolvedInventoryItem) || resolvedInventoryItem <= 0) {
      strapi.log.warn(
        `[createUsedItems] Skipping item with invalid inventoryItem:`,
        item.inventoryItem
      );
      continue;
    }
    const quantity = parseFloat(item.quantity);
    const unitPrice = parseFloat(item.unitPriceAtMoment);
    const lineTotal = quantity * unitPrice;
    partsCost += lineTotal;
    await strapi.db.query('api::service-order-inventory-item.service-order-inventory-item').create({
      data: {
        quantity,
        unitPriceAtMoment: unitPrice,
        totalLine: Number(lineTotal.toFixed(2)),
        serviceOrder: { connect: [{ id: orderId }] },
        inventoryItem: { connect: [{ id: resolvedInventoryItem }] },
      },
    });
  }
  return partsCost;
}

async function removeExistingUsedItems(strapi: any, orderId: number) {
  const existing = await strapi.db
    .query('api::service-order-inventory-item.service-order-inventory-item')
    .findMany({
      where: { serviceOrder: orderId },
      select: ['id'],
    });
  if (existing && existing.length > 0) {
    for (const row of existing) {
      await strapi.db
        .query('api::service-order-inventory-item.service-order-inventory-item')
        .delete({
          where: { id: row.id },
        });
    }
  }
}

async function fetchUsedItems(strapi: any, orderId: number) {
  const rows = await strapi.db
    .query('api::service-order-inventory-item.service-order-inventory-item')
    .findMany({
      where: { serviceOrder: orderId },
      populate: { inventoryItem: true },
    });

  if (!rows || rows.length === 0) return [];

  return rows.map((r: any) => ({
    id: r.id,
    quantity: r.quantity,
    unitPriceAtMoment: r.unitPriceAtMoment,
    totalLine: r.totalLine,
    inventoryItemId: r.inventoryItem?.id ?? null,
    inventoryItem: r.inventoryItem || null,
  }));
}

async function createInventoryMovement(strapi: any, data: any, userId?: number | null) {
  const movementData: any = {
    type: data.type,
    quantity: data.quantity,
    reason: data.reason,
    date: data.date,
    inventoryItem: { connect: [{ id: data.inventoryItemId }] },
    serviceOrder: { connect: [{ id: data.serviceOrderId }] },
  };
  if (userId) {
    movementData.performedBy = { connect: [{ id: userId }] };
  }
  return await strapi.db.query('api::inventory-movement.inventory-movement').create({
    data: movementData,
  });
}

async function finalizeOrder(
  ctx: any,
  strapi: any,
  numericId: number,
  order: any,
  updateData: any
) {
  if (order.status === 'completado') {
    return ctx.badRequest('La orden ya está completada');
  }
  if (order.status === 'cancelado') {
    return ctx.badRequest('No se puede completar una orden cancelada');
  }

  const usedItems = await fetchUsedItems(strapi, numericId);
  const stockErrors: any[] = [];

  for (const item of usedItems || []) {
    const inv = item.inventoryItem;
    if (!inv) continue;
    if (parseFloat(inv.stock) < parseFloat(item.quantity)) {
      stockErrors.push({
        inventoryItem: inv.id,
        code: inv.code,
        description: inv.description,
        requested: item.quantity,
        available: inv.stock,
      });
    }
  }

  if (stockErrors.length > 0) {
    return ctx.conflict({
      error: 'STOCK_INSUFFICIENT',
      message: 'No hay stock suficiente para completar la orden',
      details: stockErrors,
    });
  }

  const now = new Date();
  const userId = ctx.state.user?.id || null;

  for (const item of usedItems || []) {
    const inv = item.inventoryItem;
    if (!inv) continue;
    const newStock = parseFloat(inv.stock) - parseFloat(item.quantity);
    await strapi.db.query('api::inventory-item.inventory-item').update({
      where: { id: inv.id },
      data: { stock: newStock },
    });
    await createInventoryMovement(
      strapi,
      {
        type: 'salida',
        quantity: item.quantity,
        reason: `Consumo en Orden de Servicio #${order.code || order.id}`,
        date: now,
        inventoryItemId: inv.id,
        serviceOrderId: numericId,
      },
      userId
    );
  }

  const laborCost = parseFloat(updateData.laborCost ?? order.laborCost ?? 0);
  const partsCost = usedItems.reduce((sum: number, item: any) => {
    return sum + parseFloat(item.quantity) * parseFloat(item.unitPriceAtMoment);
  }, 0);

  // Obtener servicios vinculados para calcular su costo
  const orderWithServices = await strapi.db.query('api::service-order.service-order').findOne({
    where: { id: numericId },
    populate: { services: true },
  });
  const servicesCost = calculateServicesCost(orderWithServices?.services);
  const totals = calculateTotals(laborCost, partsCost, servicesCost);

  const updated = await strapi.db.query('api::service-order.service-order').update({
    where: { id: numericId },
    data: {
      status: 'completado',
      completedAt: now,
      laborCost,
      ...totals,
    },
    populate: {
      vehicle: true,
      driver: true,
      services: true,
      serviceOrderInventoryItems: { populate: { inventoryItem: true } },
    },
  });

  return { data: updated, meta: {} };
}

async function cancelOrder(ctx: any, strapi: any, numericId: number, order: any, _updateData: any) {
  if (order.status === 'cancelado') {
    return ctx.badRequest('La orden ya está cancelada');
  }

  const usedItems = await fetchUsedItems(strapi, numericId);
  const now = new Date();
  const userId = ctx.state.user?.id || null;

  if (order.status === 'completado') {
    for (const item of usedItems || []) {
      const inv = item.inventoryItem;
      if (!inv) continue;
      const newStock = parseFloat(inv.stock) + parseFloat(item.quantity);
      await strapi.db.query('api::inventory-item.inventory-item').update({
        where: { id: inv.id },
        data: { stock: newStock },
      });
      await createInventoryMovement(
        strapi,
        {
          type: 'reversion',
          quantity: item.quantity,
          reason: `Reversión por cancelación de Orden #${order.code || order.id}`,
          date: now,
          inventoryItemId: inv.id,
          serviceOrderId: numericId,
        },
        userId
      );
    }
  }

  const updated = await strapi.db.query('api::service-order.service-order').update({
    where: { id: numericId },
    data: { status: 'cancelado' },
    populate: {
      vehicle: true,
      driver: true,
      services: true,
      serviceOrderInventoryItems: { populate: { inventoryItem: true } },
    },
  });

  return { data: updated, meta: {} };
}

export default factories.createCoreController('api::service-order.service-order', ({ strapi }) => ({
  async create(ctx) {
    const body = ctx.request.body;
    const usedItems = body?.usedItems;

    // Extraer relaciones manyToOne que el Document Service rechaza en Strapi v5
    const vehicleId = body?.data?.vehicle;
    const driverId = body?.data?.driver;

    if (body?.usedItems) {
      delete body.usedItems;
    }
    if (body?.data?.vehicle !== undefined) {
      delete body.data.vehicle;
    }
    if (body?.data?.driver !== undefined) {
      delete body.data.driver;
    }

    // Normalizar relaciones manyToMany al formato Strapi v5
    if (body?.data) {
      body.data = normalizeRelations(body.data);
    }

    const response = await super.create(ctx);
    const orderDocumentId = response?.data?.documentId || response?.data?.id;

    if (!orderDocumentId) {
      return response;
    }

    const orderRecord = await strapi.db.query('api::service-order.service-order').findOne({
      where: { documentId: orderDocumentId },
      select: ['id'],
    });
    const orderId = orderRecord?.id;

    if (!orderId) {
      return response;
    }

    const partsCost = await createUsedItems(strapi, orderId, usedItems);
    const laborCost = parseFloat(response?.data?.laborCost || 0);

    // Obtener servicios vinculados para calcular su costo
    const createdOrder = await strapi.db.query('api::service-order.service-order').findOne({
      where: { id: orderId },
      populate: { services: true },
    });
    const servicesCost = calculateServicesCost(createdOrder?.services);
    const totals = calculateTotals(laborCost, partsCost, servicesCost);

    const updated = await strapi.db.query('api::service-order.service-order').update({
      where: { id: orderId },
      data: {
        ...totals,
        ...(vehicleId !== undefined ? { vehicle: vehicleId } : {}),
        ...(driverId !== undefined ? { driver: driverId } : {}),
      },
      populate: {
        vehicle: true,
        driver: true,
        services: true,
        serviceOrderInventoryItems: { populate: { inventoryItem: true } },
      },
    });

    return { data: updated, meta: {} };
  },

  async update(ctx) {
    const documentId = ctx.params.id;
    const numericId = await resolveNumericId(strapi, documentId);
    if (!numericId) {
      return ctx.notFound('Orden no encontrada');
    }

    const body = ctx.request.body;
    const data = body?.data || {};
    const usedItems = body?.usedItems;
    const newStatus = data.status;

    // Extraer relaciones manyToOne que el Document Service rechaza en Strapi v5
    const vehicleId = data.vehicle;
    const driverId = data.driver;

    if (body?.usedItems) {
      delete body.usedItems;
    }
    if (body?.data?.vehicle !== undefined) {
      delete body.data.vehicle;
    }
    if (body?.data?.driver !== undefined) {
      delete body.data.driver;
    }

    // Normalizar relaciones manyToMany al formato Strapi v5
    if (body?.data) {
      body.data = normalizeRelations(body.data);
    }

    const existingOrder = await strapi.db.query('api::service-order.service-order').findOne({
      where: { id: numericId },
    });
    if (!existingOrder) {
      return ctx.notFound('Orden no encontrada');
    }

    if (newStatus === 'completado' && existingOrder.status !== 'completado') {
      return await finalizeOrder(ctx, strapi, numericId, existingOrder, data);
    }

    if (newStatus === 'cancelado' && existingOrder.status !== 'cancelado') {
      return await cancelOrder(ctx, strapi, numericId, existingOrder, data);
    }

    if (existingOrder.status === 'completado') {
      return ctx.badRequest('No se puede editar una orden completada');
    }

    let partsCost: number | null = null;
    if (usedItems !== undefined) {
      await removeExistingUsedItems(strapi, numericId);
      partsCost = await createUsedItems(strapi, numericId, usedItems);
      const laborCost = parseFloat(data.laborCost ?? existingOrder.laborCost ?? 0);
      // Temp totals (will be recalculated with services after super.update)
      const tempTotals = calculateTotals(laborCost, partsCost);
      Object.assign(data, tempTotals);
    }

    const response = await super.update(ctx);

    // Recalculate totals including services prices
    const updatedOrder = await strapi.db.query('api::service-order.service-order').findOne({
      where: { id: numericId },
      populate: { services: true },
    });
    const servicesCost = calculateServicesCost(updatedOrder?.services);
    const finalLaborCost = parseFloat(data.laborCost ?? existingOrder.laborCost ?? 0);
    const finalPartsCost =
      partsCost !== null ? partsCost : parseFloat(existingOrder.partsCost || 0);
    const finalTotals = calculateTotals(finalLaborCost, finalPartsCost, servicesCost);

    const finalUpdateData: any = { ...finalTotals };
    if (vehicleId !== undefined) finalUpdateData.vehicle = vehicleId;
    if (driverId !== undefined) finalUpdateData.driver = driverId;

    const finalUpdate = await strapi.db.query('api::service-order.service-order').update({
      where: { id: numericId },
      data: finalUpdateData,
      populate: {
        vehicle: true,
        driver: true,
        services: true,
        serviceOrderInventoryItems: { populate: { inventoryItem: true } },
      },
    });

    return { data: finalUpdate, meta: {} };
  },

  /**
   * Crea una Orden de Servicio completada a partir de un Kit de Mantenimiento,
   * con descuento atómico de stock vía transacción PostgreSQL.
   */
  async createFromMaintenance(ctx) {
    const body = ctx.request.body;
    const { vehicleId, maintenanceType, laborCost: rawLaborCost, notes } = body || {};

    // ── Validaciones de entrada ──
    if (!vehicleId) {
      return ctx.badRequest('Se requiere vehicleId');
    }
    if (!maintenanceType) {
      return ctx.badRequest('Se requiere maintenanceType');
    }

    try {
      // ── 1. Buscar kit de mantenimiento activo ──
      const maintenanceKit = await strapi.db.query('api::maintenance-kit.maintenance-kit').findOne({
        where: {
          type: maintenanceType,
          isActive: true,
        },
        populate: {
          kitItems: {
            populate: { inventoryItem: true },
          },
          service: true,
        },
      });

      if (!maintenanceKit) {
        return ctx.notFound(
          `No existe un kit de mantenimiento activo para el tipo: ${maintenanceType}`
        );
      }

      // ── 2. Buscar vehículo y responsables ──
      const vehicle = await strapi.db.query('api::fleet.fleet').findOne({
        where: { documentId: vehicleId },
        populate: { responsables: true },
      });

      if (!vehicle) {
        return ctx.notFound('Vehículo no encontrado');
      }

      const currentMileage = parseInt(vehicle.currentMileage || 0, 10);
      const kitItems = maintenanceKit.kitItems || [];

      // ── 3. Validar stock de cada ítem del kit ──
      const stockErrors: any[] = [];
      for (const kitItem of kitItems) {
        const inv = kitItem.inventoryItem;
        if (!inv) continue;
        const requested = parseFloat(kitItem.quantity);
        const available = parseFloat(inv.stock);
        if (available < requested) {
          stockErrors.push({
            inventoryItemId: inv.id,
            code: inv.code,
            description: inv.description,
            requested,
            available,
          });
        }
      }

      if (stockErrors.length > 0) {
        return ctx.conflict({
          error: 'STOCK_INSUFFICIENT',
          message: 'No hay stock suficiente para generar la orden de servicio',
          details: stockErrors,
        });
      }

      // ── 4. Resolver driver (primer responsable) ──
      const driverId = vehicle.responsables?.[0]?.id ?? null;
      const laborCost = parseFloat(rawLaborCost ?? maintenanceKit.defaultLaborCost ?? 0);
      const now = new Date();
      const user = ctx.state.user;
      const userId = user?.id || null;

      // Resolver nombre del usuario para historial
      let createdByName = null;
      if (user) {
        const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
          where: { email: user.email },
          select: ['displayName'],
        });
        createdByName = profile?.displayName || user.username || user.email || null;
      }

      // ── 5. Transacción atómica PostgreSQL ──
      const knex = strapi.db.connection;
      const result = await knex.transaction(async (trx) => {
        // Calcular partsCost
        let partsCost = 0;
        for (const kitItem of kitItems) {
          const inv = kitItem.inventoryItem;
          if (!inv) continue;
          const qty = parseFloat(kitItem.quantity);
          const unitPrice = parseFloat(inv.salePrice || inv.unitCost || 0);
          partsCost += qty * unitPrice;
        }
        const servicesCost = parseFloat(maintenanceKit.service?.price || 0);
        const totals = calculateTotals(laborCost, partsCost, servicesCost);

        // 5a. Crear Service Order
        const orderDocumentId = randomUUID();
        const orderCode = `SO-MNT-${Date.now()}`;
        const [orderRow] = await knex('service_orders')
          .transacting(trx)
          .insert({
            document_id: orderDocumentId,
            code: orderCode,
            status: 'completado',
            scheduled_at: now,
            completed_at: now,
            summary:
              notes ||
              `Orden generada automáticamente desde kit de mantenimiento: ${maintenanceKit.name}`,
            labor_cost: laborCost,
            parts_cost: totals.partsCost,
            tax_amount: totals.taxAmount,
            total_cost: totals.totalCost,
            created_at: now,
            updated_at: now,
            published_at: now,
          })
          .returning('*');

        const orderId = orderRow.id;

        // 5a.1 Vincular vehículo (tabla de enlace manyToOne)
        await knex('service_orders_vehicle_lnk').transacting(trx).insert({
          service_order_id: orderId,
          fleet_id: vehicle.id,
          service_order_ord: 1,
        });

        // 5a.2 Vincular driver si existe (tabla de enlace manyToOne)
        if (driverId) {
          await knex('service_orders_driver_lnk').transacting(trx).insert({
            service_order_id: orderId,
            user_profile_id: driverId,
            service_order_ord: 1,
          });
        }

        // 5b. Crear Service Order Inventory Items
        for (const kitItem of kitItems) {
          const inv = kitItem.inventoryItem;
          if (!inv) continue;
          const qty = parseFloat(kitItem.quantity);
          const unitPrice = parseFloat(inv.salePrice || inv.unitCost || 0);
          const lineTotal = qty * unitPrice;

          await knex('service_order_inventory_items')
            .transacting(trx)
            .insert({
              document_id: randomUUID(),
              quantity: qty,
              unit_price_at_moment: unitPrice,
              total_line: Number(lineTotal.toFixed(2)),
              service_order_id: orderId,
              inventory_item_id: inv.id,
              created_at: now,
              updated_at: now,
              published_at: now,
            });
        }

        // 5c. Descontar stock de inventory_items
        for (const kitItem of kitItems) {
          const inv = kitItem.inventoryItem;
          if (!inv) continue;
          const qty = parseFloat(kitItem.quantity);
          const newStock = parseFloat(inv.stock) - qty;

          await knex('inventory_items').transacting(trx).where('id', inv.id).update({
            stock: newStock,
            updated_at: now,
          });
        }

        // 5d. Crear inventory_movements
        for (const kitItem of kitItems) {
          const inv = kitItem.inventoryItem;
          if (!inv) continue;
          const qty = parseFloat(kitItem.quantity);

          await knex('inventory_movements')
            .transacting(trx)
            .insert({
              document_id: randomUUID(),
              type: 'salida',
              quantity: qty,
              reason: `Consumo en Orden de Servicio #${orderCode}`,
              date: now,
              inventory_item_id: inv.id,
              service_order_id: orderId,
              performed_by_id: userId,
              created_at: now,
              updated_at: now,
              published_at: now,
            });
        }

        // 5e. Actualizar vehículo (lastOilChangeMileage para oil_change)
        const fleetUpdateData: any = {
          updated_at: now,
        };
        if (maintenanceType === 'oil_change') {
          fleetUpdateData.last_oil_change_mileage = currentMileage;
          fleetUpdateData.oil_change_notification_sent = false;
          fleetUpdateData.oil_change_warning_sent = false;
        }

        await knex('fleets').transacting(trx).where('id', vehicle.id).update(fleetUpdateData);

        // 5f. Crear registro en fleet_mileage_history
        await knex('fleet_mileage_history')
          .transacting(trx)
          .insert({
            previous_mileage: currentMileage,
            new_mileage: currentMileage,
            notes: `Mantenimiento registrado: ${maintenanceKit.name}`,
            created_by_name: createdByName,
            change_type: 'oil_change_reset',
            fleet_vehicle_id: vehicle.id,
            created_at: now,
          });

        // 5g. Vincular servicio del catálogo (si existe) vía tabla de enlace
        if (maintenanceKit.service?.id) {
          try {
            await knex('service_orders_services_lnk')
              .transacting(trx)
              .insert({
                service_order_id: orderId,
                service_id: maintenanceKit.service.id,
                service_ord: 1,
                service_order_ord: 1,
              })
              .onConflict()
              .ignore();
          } catch (lnkError) {
            strapi.log.warn(
              '[createFromMaintenance] No se pudo vincular servicio del catálogo:',
              (lnkError as Error).message
            );
          }
        }

        return {
          orderId,
          orderDocumentId,
          orderCode,
          ...totals,
        };
      });

      // ── 6. Retornar respuesta exitosa ──
      return ctx.send({
        data: {
          id: result.orderId,
          documentId: result.orderDocumentId,
          code: result.orderCode,
          status: 'completado',
          laborCost,
          partsCost: result.partsCost,
          taxAmount: result.taxAmount,
          totalCost: result.totalCost,
          vehicle: {
            id: vehicle.id,
            documentId: vehicle.documentId,
            name: vehicle.name,
          },
          maintenanceKit: {
            id: maintenanceKit.id,
            name: maintenanceKit.name,
            type: maintenanceKit.type,
          },
          message: 'Orden de servicio generada y stock actualizado correctamente',
        },
      });
    } catch (error: any) {
      strapi.log.error('[createFromMaintenance] Error transaccional:', error);
      return ctx.internalServerError(
        error.message || 'Error al generar la orden de servicio desde mantenimiento'
      );
    }
  },
}));

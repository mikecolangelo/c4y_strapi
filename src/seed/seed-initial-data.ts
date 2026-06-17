import type { Core } from '@strapi/strapi';

const PROFILE_SEEDS = [
  { displayName: 'Administrador', role: 'admin', email: 'admin@example.com', phone: '+34 600 000 000' },
  { displayName: 'Conductor Demo', role: 'driver', email: 'driver@example.com', phone: '+34 600 000 222' }
];

const CLIENT_SEEDS = [
  { fullName: 'Alejandro Gomez', status: 'activo', email: 'alejandro@example.com', phone: '+34 612 345 678' },
  { fullName: 'Beatriz Fernández', status: 'lead', email: 'beatriz@example.com', phone: '+34 698 765 432' }
];

const SERVICE_SEEDS = [
  { name: 'Cambio de Aceite', coverage: 'cliente', price: 80, durationMinutes: 30, category: 'Mantenimiento' },
  { name: 'Rotación de Neumáticos', coverage: 'cliente', price: 50, durationMinutes: 45, category: 'Mantenimiento' }
];

const INVENTORY_SEEDS = [
  { code: 'FLTR-001', description: 'Filtro de aceite motor 1.6L', stock: 50, stockStatus: 'high', unit: 'unidades' },
  { code: 'ACEITE-10W30', description: 'Aceite de motor semisintético 10W-30', stock: 30, stockStatus: 'high', unit: 'litros', salePrice: 12.5, unitCost: 8.0 },
  { code: 'ESTOPERA-001', description: 'Estopera de cárter universal', stock: 20, stockStatus: 'medium', unit: 'unidades', salePrice: 3.0, unitCost: 1.5 },
  { code: 'TYR-205-55R16', description: 'Neumático Michelin Primacy 4', stock: 4, stockStatus: 'low', unit: 'unidades' }
];

const SUPPLY_ITEM_SEEDS = [
  {
    name: 'Kit de Limpieza Básico',
    type: 'kit_limpieza',
    stock: 20,
    unit: 'kits',
    minStock: 5,
    description: 'Kit completo de limpieza para vehículos: paños, limpiador, aromatizante',
    isActive: true,
    icon: 'package'
  },
  {
    name: 'Gasolina Regular',
    type: 'gasolina',
    stock: 100,
    unit: 'litros',
    minStock: 20,
    description: 'Gasolina regular para abastecimiento de vehículos de la flota',
    isActive: true,
    icon: 'fuel'
  },
  {
    name: 'Aceite de Motor 10W-30',
    type: 'aceite',
    stock: 30,
    unit: 'litros',
    minStock: 10,
    description: 'Aceite semisintético para motor gasolina',
    isActive: true,
    icon: 'droplet'
  },
  {
    name: 'Kit de Emergencia Vial',
    type: 'otros',
    stock: 15,
    unit: 'kits',
    minStock: 3,
    description: 'Kit de emergencia: triángulos, chaleco reflectante, linterna',
    isActive: true,
    icon: 'box'
  }
];

const FLEET_SEEDS = [
  {
    name: 'Ford Mustang 2023',
    vin: '1ZVBP8CM0D5281234',
    price: 55000,
    condition: 'nuevo',
    brand: 'Ford',
    model: 'Mustang',
    year: 2023,
    color: 'Plata Metálico',
    mileage: 0,
    fuelType: 'Gasolina',
    transmission: 'Automática',
    imageAlt: 'Ford Mustang plata 2023'
  },
  {
    name: 'Honda Civic 2021',
    vin: '2HGFC1F56MH543210',
    price: 28000,
    condition: 'usado',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    color: 'Azul Marino',
    mileage: 35000,
    fuelType: 'Híbrido',
    transmission: 'CVT',
    imageAlt: 'Honda Civic azul 2021'
  },
  {
    name: 'Toyota RAV4 2022',
    vin: 'JTMEP4RE7ND123456',
    price: 35500,
    condition: 'seminuevo',
    brand: 'Toyota',
    model: 'RAV4',
    year: 2022,
    color: 'Blanco Perla',
    mileage: 15000,
    fuelType: 'Híbrido',
    transmission: 'Automática',
    imageAlt: 'Toyota RAV4 blanca 2022'
  }
];

export const seedInitialData = async (strapi: Core.Strapi) => {
  await seedCollection(strapi, 'api::user-profile.user-profile', PROFILE_SEEDS);
  await seedCollection(strapi, 'api::client.client', CLIENT_SEEDS);
  await seedCollection(strapi, 'api::service.service', SERVICE_SEEDS);
  await seedCollection(strapi, 'api::inventory-item.inventory-item', INVENTORY_SEEDS);
  await seedCollection(strapi, 'api::fleet.fleet', FLEET_SEEDS);
  await seedCollection(strapi, 'api::supply-item.supply-item', SUPPLY_ITEM_SEEDS);
  await configureUploadPermissions(strapi);
  await configureServicePermissions(strapi);
  await configureInventoryIntegrationPermissions(strapi);
  await configureInventoryRequestPermissions(strapi);
  await configureMaintenanceKitPermissions(strapi);
  await seedMaintenanceKit(strapi);
  await configureWeeklyCollectionPermissions(strapi);
  await configureUserProfilePermissions(strapi);
};

/**
 * Helper genérico para configurar múltiples permisos para un rol de manera eficiente
 */
const configurePermissionsForRole = async (strapi: Core.Strapi, roleType: string, actions: string[]) => {
  try {
    const role = await strapi.db.query('plugin::users-permissions.role').findOne({
      where: { type: roleType },
    });

    if (!role) {
      strapi.log.warn(`No se encontró el rol ${roleType}`);
      return;
    }

    // Obtener todos los permisos existentes para este rol y estas acciones de una sola vez
    const existingPermissions = await strapi.db.query('plugin::users-permissions.permission').findMany({
      where: {
        role: role.id,
        action: { $in: actions },
      },
    });

    const existingActions = new Set(existingPermissions.map((p: any) => p.action));

    for (const action of actions) {
      if (!existingActions.has(action)) {
        await strapi.db.query('plugin::users-permissions.permission').create({
          data: {
            action,
            role: role.id,
            enabled: true,
          },
        });
        strapi.log.info(`✅ Permiso ${action} creado para rol ${roleType}`);
      } else {
        // Usar debug en lugar de info para reducir el ruido en consola
        strapi.log.debug(`ℹ️ Permiso ${action} ya existe para rol ${roleType}`);
      }
    }
  } catch (error) {
    strapi.log.error(`Error configurando permisos para el rol ${roleType}:`, error as Error);
  }
};

/**
 * Configura permisos de upload para el rol Authenticated
 */
const configureUploadPermissions = async (strapi: Core.Strapi) => {
  const actions = [
    'plugin::upload.content-api.upload',
    'plugin::upload.content-api.find',
    'plugin::upload.content-api.findOne'
  ];
  await configurePermissionsForRole(strapi, 'authenticated', actions);
};

/**
 * Configura permisos de Service Orders y Appointments para el rol Authenticated
 */
const configureServicePermissions = async (strapi: Core.Strapi) => {
  const actions = [
    'api::service-order.service-order.find',
    'api::service-order.service-order.findOne',
    'api::service-order.service-order.create',
    'api::service-order.service-order.update',
    'api::service-order.service-order.delete',
    'api::service-order.service-order.createFromMaintenance',
    'api::appointment.appointment.find',
    'api::appointment.appointment.findOne',
    'api::appointment.appointment.create',
    'api::appointment.appointment.update',
    'api::appointment.appointment.delete',
  ];
  await configurePermissionsForRole(strapi, 'authenticated', actions);
};

/**
 * Configura permisos para los nuevos content-types de integración Servicios × Inventario
 */
const configureInventoryIntegrationPermissions = async (strapi: Core.Strapi) => {
  const actions = [
    'api::inventory-item.inventory-item.find',
    'api::inventory-item.inventory-item.findOne',
    'api::inventory-item.inventory-item.create',
    'api::inventory-item.inventory-item.update',
    'api::inventory-item.inventory-item.delete',
    'api::service-order-inventory-item.service-order-inventory-item.find',
    'api::service-order-inventory-item.service-order-inventory-item.findOne',
    'api::service-order-inventory-item.service-order-inventory-item.create',
    'api::service-order-inventory-item.service-order-inventory-item.update',
    'api::service-order-inventory-item.service-order-inventory-item.delete',
    'api::inventory-movement.inventory-movement.find',
    'api::inventory-movement.inventory-movement.findOne',
    'api::inventory-movement.inventory-movement.create',
  ];
  await configurePermissionsForRole(strapi, 'authenticated', actions);
};

/**
 * Configura permisos para el content-type Inventory Request (solicitudes de piezas)
 */
const configureInventoryRequestPermissions = async (strapi: Core.Strapi) => {
  const actions = [
    'api::inventory-request.inventory-request.find',
    'api::inventory-request.inventory-request.findOne',
    'api::inventory-request.inventory-request.create',
    'api::inventory-request.inventory-request.update',
    'api::inventory-request.inventory-request.delete',
    'api::inventory-request.inventory-request.approve',
    'api::inventory-request.inventory-request.reject',
    'api::inventory-request.inventory-request.deliver',
  ];
  await configurePermissionsForRole(strapi, 'authenticated', actions);
};

/**
 * Configura permisos para Maintenance Kit y Maintenance Kit Item
 */
const configureMaintenanceKitPermissions = async (strapi: Core.Strapi) => {
  const actions = [
    'api::maintenance-kit.maintenance-kit.find',
    'api::maintenance-kit.maintenance-kit.findOne',
    'api::maintenance-kit.maintenance-kit.create',
    'api::maintenance-kit.maintenance-kit.update',
    'api::maintenance-kit.maintenance-kit.delete',
    'api::maintenance-kit-item.maintenance-kit-item.find',
    'api::maintenance-kit-item.maintenance-kit-item.findOne',
    'api::maintenance-kit-item.maintenance-kit-item.create',
    'api::maintenance-kit-item.maintenance-kit-item.update',
    'api::maintenance-kit-item.maintenance-kit-item.delete',
  ];
  await configurePermissionsForRole(strapi, 'authenticated', actions);
};

/**
 * Crea un kit de mantenimiento de ejemplo para cambio de aceite
 */
const seedMaintenanceKit = async (strapi: Core.Strapi) => {
  try {
    // Buscar servicio de cambio de aceite
    const oilService = await strapi.db.query('api::service.service').findOne({
      where: { name: 'Cambio de Aceite' },
    });

    // Buscar o crear ítems de inventario necesarios
    const ensureInventoryItem = async (data: any) => {
      const existing = await strapi.db.query('api::inventory-item.inventory-item').findOne({
        where: { code: data.code },
      });
      if (existing) return existing;
      return await strapi.entityService.create('api::inventory-item.inventory-item', { data });
    };

    const aceite = await ensureInventoryItem({
      code: 'ACEITE-10W30',
      description: 'Aceite de motor semisintético 10W-30',
      stock: 30,
      stockStatus: 'high',
      unit: 'litros',
      salePrice: 12.5,
      unitCost: 8.0,
    });

    const filtro = await ensureInventoryItem({
      code: 'FLTR-001',
      description: 'Filtro de aceite motor 1.6L',
      stock: 50,
      stockStatus: 'high',
      unit: 'unidades',
      salePrice: 8.0,
      unitCost: 4.5,
    });

    const estopera = await ensureInventoryItem({
      code: 'ESTOPERA-001',
      description: 'Estopera de cárter universal',
      stock: 20,
      stockStatus: 'medium',
      unit: 'unidades',
      salePrice: 3.0,
      unitCost: 1.5,
    });

    // Verificar si ya existe un kit de aceite
    let kit = await strapi.db.query('api::maintenance-kit.maintenance-kit').findOne({
      where: { type: 'oil_change' },
      populate: { kitItems: true },
    });

    if (kit && (kit.kitItems?.length ?? 0) > 0) {
      strapi.log.info('Kit de mantenimiento oil_change ya existe con ítems, omitiendo seed');
      return;
    }

    if (!kit) {
      kit = await strapi.entityService.create('api::maintenance-kit.maintenance-kit', {
        data: {
          name: 'Kit Cambio de Aceite Completo',
          type: 'oil_change',
          description: 'Incluye aceite 10W-30, filtro de aceite y estopera de cárter',
          defaultLaborCost: 80,
          isActive: true,
          service: oilService?.id ?? null,
        },
      });
    }

    // Crear líneas del kit
    const kitItems = [];
    if (aceite) {
      kitItems.push({ quantity: 4, inventoryItem: aceite.id, maintenanceKit: kit.id });
    }
    if (filtro) {
      kitItems.push({ quantity: 1, inventoryItem: filtro.id, maintenanceKit: kit.id });
    }
    if (estopera) {
      kitItems.push({ quantity: 1, inventoryItem: estopera.id, maintenanceKit: kit.id });
    }

    for (const item of kitItems) {
      await strapi.entityService.create('api::maintenance-kit-item.maintenance-kit-item', {
        data: item,
      });
    }

    strapi.log.info(`✅ Kit de mantenimiento creado: Kit Cambio de Aceite Completo (${kitItems.length} ítems)`);
  } catch (error) {
    strapi.log.error('Error creando kit de mantenimiento:', error as Error);
  }
};

/**
 * Configura permisos para el content-type Weekly Collection (Cobranza Semanal)
 */
const configureWeeklyCollectionPermissions = async (strapi: Core.Strapi) => {
  const actions = [
    'api::weekly-collection.weekly-collection.find',
    'api::weekly-collection.weekly-collection.findOne',
    'api::weekly-collection.weekly-collection.create',
    'api::weekly-collection.weekly-collection.update',
    'api::weekly-collection.weekly-collection.delete',
    'api::weekly-collection.weekly-collection.batchImport',
  ];
  await configurePermissionsForRole(strapi, 'authenticated', actions);
};

/**
 * Configura permisos para el content-type User Profile (Contactos / Leads)
 */
const configureUserProfilePermissions = async (strapi: Core.Strapi) => {
  const actions = [
    'api::user-profile.user-profile.find',
    'api::user-profile.user-profile.findOne',
    'api::user-profile.user-profile.create',
    'api::user-profile.user-profile.update',
    'api::user-profile.user-profile.delete',
    'api::user-profile.user-profile.batchImport',
    'api::user-profile.user-profile.convert',
    'api::user-profile.user-profile.account',
    'api::user-profile.user-profile.resetPassword',
  ];
  await configurePermissionsForRole(strapi, 'authenticated', actions);
};

const seedCollection = async (
  strapi: Core.Strapi,
  uid: Parameters<Core.Strapi['entityService']['count']>[0],
  data: Record<string, unknown>[]
) => {
  const count = await strapi.entityService.count(uid);
  if (count > 0 || data.length === 0) {
    return;
  }

  for (const entry of data) {
    try {
      await strapi.entityService.create(uid, {
        data: entry,
      });
    } catch (error: any) {
      // Si el error es de duplicado, lo ignoramos y continuamos
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        console.log(`[Seed] Entrada duplicada ignorada para ${uid}:`, entry.name || entry.vin || 'unknown');
        continue;
      }
      // Para otros errores, solo loggear pero no detener el seed
      console.error(`[Seed] Error creando entrada en ${uid}:`, error.message);
    }
  }
};

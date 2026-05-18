"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialData = void 0;
const PROFILE_SEEDS = [
    { displayName: 'Administrador', role: 'admin', email: 'admin@example.com', phone: '+34 600 000 000' },
    { displayName: 'Vendedor Demo', role: 'seller', email: 'seller@example.com', phone: '+34 600 000 111' },
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
const seedInitialData = async (strapi) => {
    await seedCollection(strapi, 'api::user-profile.user-profile', PROFILE_SEEDS);
    await seedCollection(strapi, 'api::client.client', CLIENT_SEEDS);
    await seedCollection(strapi, 'api::service.service', SERVICE_SEEDS);
    await seedCollection(strapi, 'api::inventory-item.inventory-item', INVENTORY_SEEDS);
    await seedCollection(strapi, 'api::fleet.fleet', FLEET_SEEDS);
    await seedCollection(strapi, 'api::supply-item.supply-item', SUPPLY_ITEM_SEEDS);
    await configureUploadPermissions(strapi);
};
exports.seedInitialData = seedInitialData;
/**
 * Configura permisos de upload para el rol Authenticated
 */
const configureUploadPermissions = async (strapi) => {
    try {
        // Obtener el rol Authenticated
        const authenticatedRole = await strapi.db.query('plugin::users-permissions.role').findOne({
            where: { type: 'authenticated' },
        });
        if (!authenticatedRole) {
            strapi.log.warn('No se encontró el rol Authenticated');
            return;
        }
        // Verificar si ya tiene permisos de upload
        const existingPermission = await strapi.db.query('plugin::users-permissions.permission').findOne({
            where: {
                role: authenticatedRole.id,
                action: 'plugin::upload.content-api.upload',
            },
        });
        if (existingPermission) {
            strapi.log.info('Permisos de upload ya configurados para el rol Authenticated');
            return;
        }
        // Crear permiso de upload
        await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
                action: 'plugin::upload.content-api.upload',
                role: authenticatedRole.id,
                enabled: true,
            },
        });
        // También agregar permiso para acceder a archivos (find y findOne)
        await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
                action: 'plugin::upload.content-api.find',
                role: authenticatedRole.id,
                enabled: true,
            },
        });
        await strapi.db.query('plugin::users-permissions.permission').create({
            data: {
                action: 'plugin::upload.content-api.findOne',
                role: authenticatedRole.id,
                enabled: true,
            },
        });
        strapi.log.info('Permisos de upload configurados correctamente para el rol Authenticated');
    }
    catch (error) {
        strapi.log.error('Error configurando permisos de upload:', error);
    }
};
const seedCollection = async (strapi, uid, data) => {
    const count = await strapi.entityService.count(uid);
    if (count > 0 || data.length === 0) {
        return;
    }
    for (const entry of data) {
        await strapi.entityService.create(uid, {
            data: entry,
        });
    }
};

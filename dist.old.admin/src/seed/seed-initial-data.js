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
};
exports.seedInitialData = seedInitialData;
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

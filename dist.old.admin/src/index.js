"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@strapi/utils");
const seed_initial_data_1 = require("./seed/seed-initial-data");
const normalizeFleetIdSequence = async (strapi) => {
    var _a, _b, _c, _d, _e;
    const client = (_d = (_c = (_b = (_a = strapi.db) === null || _a === void 0 ? void 0 : _a.connection) === null || _b === void 0 ? void 0 : _b.client) === null || _c === void 0 ? void 0 : _c.config) === null || _d === void 0 ? void 0 : _d.client;
    if (client !== 'postgres') {
        return;
    }
    const metadata = strapi.db.metadata.get('api::fleet.fleet');
    const tableName = metadata === null || metadata === void 0 ? void 0 : metadata.tableName;
    if (!tableName) {
        return;
    }
    const schema = (0, utils_1.env)('DATABASE_SCHEMA', 'public');
    const sequenceName = `${tableName}_id_seq`;
    try {
        await strapi.db.connection.raw(`ALTER SEQUENCE "${schema}"."${sequenceName}" INCREMENT BY 1;`);
        const [result] = (await strapi.db
            .connection(tableName)
            .max('id as max'));
        const maxId = Number((_e = result === null || result === void 0 ? void 0 : result.max) !== null && _e !== void 0 ? _e : 0);
        const nextValue = maxId > 0 ? maxId : 1;
        const isCalled = maxId > 0 ? 'true' : 'false';
        await strapi.db.connection.raw(`SELECT setval('"${schema}"."${sequenceName}"', ${nextValue}, ${isCalled});`);
    }
    catch (error) {
        strapi.log.warn('No se pudo normalizar la secuencia de Fleet', error);
    }
};
exports.default = {
    /**
     * An asynchronous register function that runs before
     * your application is initialized.
     *
     * This gives you an opportunity to extend code.
     */
    register({ strapi }) {
        // La creación automática de user-profile se maneja en la extensión del plugin users-permissions
        // Ver: src/extensions/users-permissions/controllers/auth.js
    },
    /**
     * An asynchronous bootstrap function that runs before
     * your application gets started.
     *
     * This gives you an opportunity to set up your data model,
     * run jobs, or perform some special logic.
     */
    bootstrap: async ({ strapi }) => {
        await normalizeFleetIdSequence(strapi);
        await (0, seed_initial_data_1.seedInitialData)(strapi);
    },
};

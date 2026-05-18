"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreRouter('api::supply-item.supply-item', {
    config: {
        find: {
            auth: false, // Permitir acceso público a find
        },
        findOne: {
            auth: false,
        },
    },
});

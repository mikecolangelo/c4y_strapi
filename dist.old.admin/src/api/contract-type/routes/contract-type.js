"use strict";
/**
 * contract-type router
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreRouter('api::contract-type.contract-type', {
    config: {
        find: {
            middlewares: [],
        },
        findOne: {
            middlewares: [],
        },
        create: {
            middlewares: [],
        },
        update: {
            middlewares: [],
        },
        delete: {
            middlewares: [],
        },
    },
});

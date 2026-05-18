"use strict";
/**
 * company-info router
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strapi_1 = require("@strapi/strapi");
exports.default = strapi_1.factories.createCoreRouter('api::company-info.company-info', {
    config: {
        find: {
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

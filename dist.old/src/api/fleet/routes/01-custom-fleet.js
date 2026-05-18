"use strict";
/**
 * fleet custom routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const customRoutes = [
    {
        method: 'POST',
        path: '/fleets/:documentId/increment-mileage',
        handler: 'api::fleet.fleet.incrementMileage',
        config: {
            auth: false,
            policies: [],
            middlewares: [],
        },
    },
    {
        method: 'POST',
        path: '/fleets/:documentId/reset-oil-change',
        handler: 'api::fleet.fleet.resetOilChangeCounter',
        config: {
            auth: false,
            policies: [],
            middlewares: [],
        },
    },
    {
        method: 'POST',
        path: '/fleets/:documentId/check-mileage-reminders',
        handler: 'api::fleet.fleet.checkMileageReminders',
        config: {
            auth: false,
            policies: [],
            middlewares: [],
        },
    },
];
exports.default = {
    routes: customRoutes,
};

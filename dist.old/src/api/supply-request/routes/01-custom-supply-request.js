"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    routes: [
        {
            method: 'POST',
            path: '/supply-requests/:id/approve',
            handler: 'api::supply-request.supply-request.approve',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/supply-requests/:id/reject',
            handler: 'api::supply-request.supply-request.reject',
            config: {
                auth: false,
            },
        },
        {
            method: 'POST',
            path: '/supply-requests/:id/deliver',
            handler: 'api::supply-request.supply-request.deliver',
            config: {
                auth: false,
            },
        },
    ],
};

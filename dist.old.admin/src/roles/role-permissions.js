"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRolePermissions = exports.canPerform = void 0;
const ROLE_MATRIX = {
    admin: {
        fleet: ['read', 'create', 'update', 'delete'],
        deal: ['read', 'create', 'update', 'delete'],
        billing: ['read', 'create', 'update', 'delete'],
        appointment: ['read', 'create', 'update', 'delete'],
        inventory: ['read', 'create', 'update', 'delete'],
        notification: ['read', 'create', 'update', 'delete'],
        profile: ['read', 'create', 'update', 'delete'],
        'service-order': ['read', 'create', 'update', 'delete'],
    },
    seller: {
        fleet: ['read'],
        deal: ['read', 'create', 'update'],
        billing: ['read', 'create', 'update'],
        appointment: ['read', 'create', 'update'],
        inventory: ['read'],
        notification: ['read', 'create', 'update'],
        profile: ['read', 'update'],
        'service-order': ['read', 'create', 'update', 'delete'],
    },
    driver: {
        fleet: ['read'],
        deal: ['read'],
        billing: ['read'],
        appointment: ['read', 'update'],
        inventory: ['read'],
        notification: ['read', 'create', 'update'],
        profile: ['read', 'update'],
    },
};
const canPerform = (role, resource, action) => {
    var _a, _b;
    const permissions = (_b = (_a = ROLE_MATRIX[role]) === null || _a === void 0 ? void 0 : _a[resource]) !== null && _b !== void 0 ? _b : [];
    return permissions.includes(action);
};
exports.canPerform = canPerform;
const getRolePermissions = (role) => ROLE_MATRIX[role];
exports.getRolePermissions = getRolePermissions;

"use strict";
/**
 * Appointment Lifecycles
 * Deshabilitado: ya no se generan notificaciones automáticas al crear o modificar citas.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    async afterCreate() {
        // No-op: notificaciones automáticas desactivadas
    },
    async afterUpdate() {
        // No-op: notificaciones automáticas desactivadas
    },
};

"use strict";
/**
 * Cron tasks para facturación automática, penalidades y recordatorios de kilometraje
 * Zona horaria: America/Panama (GMT-5)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    /**
     * Generar facturas automáticamente cada martes a las 00:00
     * Cron: 0 0 * * 2 (Martes a medianoche)
     */
    '0 0 * * 2': async ({ strapi }) => {
        var _a, _b, _c;
        strapi.log.info('[CRON] Iniciando generación de facturas automáticas...');
        try {
            // Obtener configuración de penalidad
            const config = await strapi.entityService.findMany('api::configuration.configuration', {
                filters: {
                    key: 'billing-penalty-percentage',
                    category: 'billing'
                }
            });
            const penaltyPercentage = ((_a = config === null || config === void 0 ? void 0 : config[0]) === null || _a === void 0 ? void 0 : _a.value) ? parseFloat(config[0].value) : 10;
            // Buscar financiamientos activos con cuotas restantes
            const activeFinancings = await strapi.entityService.findMany('api::financing.financing', {
                filters: {
                    status: 'activo',
                    currentBalance: { $gt: 0 }
                },
                populate: ['client', 'vehicle']
            });
            strapi.log.info(`[CRON] Se encontraron ${activeFinancings.length} financiamientos activos`);
            const today = new Date();
            // Calcular jueves de la semana actual (día 4)
            const thursday = new Date(today);
            const currentDay = today.getDay();
            const daysUntilThursday = (4 - currentDay + 7) % 7;
            thursday.setDate(today.getDate() + daysUntilThursday);
            let createdCount = 0;
            for (const financing of activeFinancings) {
                try {
                    // Verificar si ya existe una factura para esta semana
                    const existingInvoice = await strapi.entityService.findMany('api::invoice.invoice', {
                        filters: {
                            financing: financing.id,
                            billingDate: today.toISOString().split('T')[0]
                        }
                    });
                    if (existingInvoice.length > 0) {
                        strapi.log.info(`[CRON] Factura ya existe para financiamiento ${financing.financingNumber}`);
                        continue;
                    }
                    // Calcular número de cuota
                    const nextQuotaNumber = (financing.paidQuotas || 0) + 1;
                    // Crear factura
                    await strapi.entityService.create('api::invoice.invoice', {
                        data: {
                            financing: financing.id,
                            client: ((_b = financing.client) === null || _b === void 0 ? void 0 : _b.id) || null,
                            amount: financing.quotaAmount,
                            penaltyAmount: 0,
                            totalAmount: financing.quotaAmount,
                            dueDate: thursday.toISOString().split('T')[0],
                            billingDate: today.toISOString().split('T')[0],
                            status: 'pending',
                            quotaNumber: nextQuotaNumber,
                            invoiceNumber: `INV-${financing.financingNumber}-${today.toISOString().split('T')[0].replace(/-/g, '')}-${nextQuotaNumber}`,
                            notes: `Factura generada automáticamente - Cuota ${nextQuotaNumber} de ${financing.totalQuotas}`
                        }
                    });
                    // Crear notificación para el cliente
                    if ((_c = financing.client) === null || _c === void 0 ? void 0 : _c.id) {
                        await strapi.entityService.create('api::notification.notification', {
                            data: {
                                title: 'Nueva factura disponible',
                                message: `Se ha generado una nueva factura por $${financing.quotaAmount} para el financiamiento ${financing.financingNumber}. Fecha límite de pago: ${thursday.toLocaleDateString('es-PA')}`,
                                type: 'billing',
                                user: financing.client.id,
                                isRead: false,
                                link: `/billing?financingId=${financing.documentId}`
                            }
                        });
                    }
                    createdCount++;
                    strapi.log.info(`[CRON] Factura creada para financiamiento ${financing.financingNumber}`);
                }
                catch (error) {
                    strapi.log.error(`[CRON] Error creando factura para financiamiento ${financing.id}:`, error);
                }
            }
            strapi.log.info(`[CRON] Generación completada. Facturas creadas: ${createdCount}`);
        }
        catch (error) {
            strapi.log.error('[CRON] Error en generación de facturas:', error);
        }
    },
    /**
     * Verificar vencimientos y aplicar penalidades cada jueves a las 23:59
     * Cron: 59 23 * * 4 (Jueves a las 23:59)
     */
    '59 23 * * 4': async ({ strapi }) => {
        var _a, _b, _c;
        strapi.log.info('[CRON] Verificando facturas vencidas...');
        try {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            // Obtener configuración de penalidad
            const config = await strapi.entityService.findMany('api::configuration.configuration', {
                filters: {
                    key: 'billing-penalty-percentage',
                    category: 'billing'
                }
            });
            const penaltyPercentage = ((_a = config === null || config === void 0 ? void 0 : config[0]) === null || _a === void 0 ? void 0 : _a.value) ? parseFloat(config[0].value) : 10;
            // Buscar facturas pendientes con fecha de vencimiento hoy o anterior
            const pendingInvoices = await strapi.entityService.findMany('api::invoice.invoice', {
                filters: {
                    status: 'pending',
                    dueDate: {
                        $lte: todayStr
                    }
                },
                populate: ['financing', 'client']
            });
            strapi.log.info(`[CRON] Se encontraron ${pendingInvoices.length} facturas pendientes de vencimiento`);
            let updatedCount = 0;
            for (const invoice of pendingInvoices) {
                try {
                    const penaltyAmount = (invoice.amount * penaltyPercentage) / 100;
                    const newTotal = invoice.amount + penaltyAmount;
                    // Actualizar factura a vencida con penalidad
                    await strapi.entityService.update('api::invoice.invoice', invoice.id, {
                        data: {
                            status: 'overdue',
                            penaltyAmount: penaltyAmount,
                            totalAmount: newTotal,
                            notes: `${invoice.notes || ''} | Penalidad del ${penaltyPercentage}% aplicada el ${todayStr}`
                        }
                    });
                    // Actualizar financiamiento a estado en_mora si aplica
                    if ((_b = invoice.financing) === null || _b === void 0 ? void 0 : _b.id) {
                        const financing = await strapi.entityService.findOne('api::financing.financing', invoice.financing.id);
                        // Verificar si se excede el máximo de cuotas permitidas en mora
                        const maxLateAllowed = financing.maxLateQuotasAllowed || 4;
                        const currentLateQuotas = (financing.lateQuotasCount || 0) + 1;
                        await strapi.entityService.update('api::financing.financing', invoice.financing.id, {
                            data: {
                                status: currentLateQuotas >= maxLateAllowed ? 'en_mora' : financing.status,
                                totalLateFees: (financing.totalLateFees || 0) + penaltyAmount,
                                lateQuotasCount: currentLateQuotas
                            }
                        });
                    }
                    // Crear notificación de factura vencida
                    if ((_c = invoice.client) === null || _c === void 0 ? void 0 : _c.id) {
                        await strapi.entityService.create('api::notification.notification', {
                            data: {
                                title: 'Factura vencida - Penalidad aplicada',
                                message: `Su factura ${invoice.invoiceNumber} ha vencido. Se ha aplicado una penalidad del ${penaltyPercentage}%. Nuevo monto a pagar: $${newTotal.toFixed(2)}`,
                                type: 'billing',
                                user: invoice.client.id,
                                isRead: false,
                                link: `/billing?invoiceId=${invoice.documentId}`
                            }
                        });
                    }
                    updatedCount++;
                    strapi.log.info(`[CRON] Factura ${invoice.invoiceNumber} marcada como vencida con penalidad`);
                }
                catch (error) {
                    strapi.log.error(`[CRON] Error actualizando factura ${invoice.id}:`, error);
                }
            }
            strapi.log.info(`[CRON] Verificación completada. Facturas vencidas: ${updatedCount}`);
        }
        catch (error) {
            strapi.log.error('[CRON] Error verificando vencimientos:', error);
        }
    },
    /**
     * Recordatorio de pago cada miércoles a las 09:00
     * Cron: 0 9 * * 3 (Miércoles a las 9:00 AM)
     */
    '0 9 * * 3': async ({ strapi }) => {
        var _a;
        strapi.log.info('[CRON] Enviando recordatorios de pago...');
        try {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            // Buscar facturas pendientes que vencen mañana (jueves)
            const pendingInvoices = await strapi.entityService.findMany('api::invoice.invoice', {
                filters: {
                    status: 'pending',
                    dueDate: tomorrowStr
                },
                populate: ['client']
            });
            strapi.log.info(`[CRON] Se encontraron ${pendingInvoices.length} facturas para recordatorio`);
            for (const invoice of pendingInvoices) {
                try {
                    if ((_a = invoice.client) === null || _a === void 0 ? void 0 : _a.id) {
                        await strapi.entityService.create('api::notification.notification', {
                            data: {
                                title: 'Recordatorio: Pago vence mañana',
                                message: `Recordatorio: Su factura ${invoice.invoiceNumber} vence mañana (${tomorrow.toLocaleDateString('es-PA')}). Monto: $${invoice.totalAmount.toFixed(2)}`,
                                type: 'billing',
                                user: invoice.client.id,
                                isRead: false,
                                link: `/billing?invoiceId=${invoice.documentId}`
                            }
                        });
                    }
                }
                catch (error) {
                    strapi.log.error(`[CRON] Error enviando recordatorio para factura ${invoice.id}:`, error);
                }
            }
            strapi.log.info('[CRON] Recordatorios enviados');
        }
        catch (error) {
            strapi.log.error('[CRON] Error enviando recordatorios:', error);
        }
    },
    /**
     * Verificar recordatorios de kilometraje cada hora
     * Cron: 0 * * * * (Cada hora en punto)
     * Con protección de timeout: máximo 4 minutos de ejecución
     */
    '0 * * * *': async ({ strapi }) => {
        const cronStartTime = Date.now();
        const MAX_CRON_TIME_MS = 4 * 60 * 1000; // 4 minutos
        strapi.log.info('[CRON] Verificando recordatorios de kilometraje...');
        strapi.log.info(`[CRON] Tiempo máximo de ejecución: ${MAX_CRON_TIME_MS / 1000} segundos`);
        try {
            const fleetReminderService = strapi.service('api::fleet-reminder.fleet-reminder');
            if (!fleetReminderService || typeof fleetReminderService.checkAllMileageReminders !== 'function') {
                strapi.log.warn('[CRON] Servicio de recordatorios de kilometraje no disponible');
                return;
            }
            // Verificar tiempo antes de iniciar
            if (Date.now() - cronStartTime >= MAX_CRON_TIME_MS) {
                strapi.log.warn('[CRON] Tiempo excedido antes de iniciar verificación de kilometraje. Saltando.');
                return;
            }
            const result = await fleetReminderService.checkAllMileageReminders();
            const elapsedTime = Date.now() - cronStartTime;
            if (result.skippedDueToTimeout) {
                strapi.log.warn(`[CRON] Verificación de kilometraje interrumpida por timeout. Procesados: ${result.vehiclesChecked}/${result.totalVehiclesAvailable} vehículos en ${result.elapsedTimeMs}ms`);
            }
            else {
                strapi.log.info(`[CRON] Verificación de kilometraje completada en ${elapsedTime}ms. Vehículos: ${result.vehiclesChecked}, Recordatorios: ${result.remindersChecked}, Notificaciones: ${result.notificationsCreated}`);
            }
        }
        catch (error) {
            const elapsedTime = Date.now() - cronStartTime;
            strapi.log.error(`[CRON] Error verificando recordatorios de kilometraje después de ${elapsedTime}ms:`, error);
        }
    },
};

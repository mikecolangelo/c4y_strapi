# Bitácora de Desarrollo — Módulo de Facturación (Faturación)

> **Fecha de análisis:** 18 de mayo de 2026  
> **Proyecto:** Car4You (Strapi + Next.js)  
> **Carpeta raíz:** `C:\Users\Bernardo\trememdo\c4y_strapi`

---

## 1. Resumen del Módulo

El módulo de facturación (faturación) gestiona todo el ciclo de pagos de financiamientos vehiculares. Se estructura en dos niveles:

- **Pago Padre (Financing):** Plan de financiamiento general de un vehículo
- **Pago Hijo (Billing Record):** Pago individual dentro de un financiamiento

### APIs Involucradas

| API | Tipo | Descripción |
|-----|------|-------------|
| `billing-record` | CollectionType | Pago individual (cuota) — Pago Hijo |
| `billing-document` | CollectionType | Documentos adjuntos a un pago |
| `financing` | CollectionType | Plan de financiamiento — Pago Padre |
| `invoice` | CollectionType | Facturas generadas automáticamente |

### Archivos del Módulo

```
src/api/
├── billing-record/
│   ├── content-types/billing-record/
│   │   ├── schema.json          # Definición de schema
│   │   └── lifecycles.ts        # Hooks: cálculo automático de multas y validación de jerarquía
│   ├── services/billing-record.ts   # Core service (sin custom logic)
│   ├── routes/billing-record.ts     # Core router (sin custom routes)
│   └── controllers/billing-record.ts # Core controller (sin custom logic)
├── billing-document/
│   ├── content-types/billing-document/schema.json
│   ├── services/billing-document.ts  # Core service
│   ├── routes/billing-document.ts    # Core router
│   └── controllers/billing-document.ts # Core controller
├── financing/
│   ├── content-types/financing/
│   │   ├── schema.json          # Schema del financiamiento
│   │   └── lifecycles.ts        # Hooks: auto-número, cálculos, cascade delete
│   ├── services/
│   │   ├── financing.ts              # Core service
│   │   └── financing-email.js        # Helper para templates de email
│   ├── routes/
│   │   ├── financing.ts              # Core router
│   │   └── 01-custom-financing.ts    # Rutas custom: email-config, send-test-email, send-email
│   └── controllers/financing.ts      # Custom: gestión SMTP y templates de email
└── invoice/
    ├── content-types/invoice/schema.json
    ├── services/invoice.ts
    ├── routes/invoice.ts
    └── controllers/invoice.ts
```

---

## 2. Arquitectura — Capas de Negocio

### 2.1 Content Types (Schema)

Se definen en `schema.json`. Son puramente declarativos — sin lógica de negocio.

**billing-record** (130 atributos):
- `receiptNumber` (string, unique, required): Número de recibo
- `amount` (decimal, required): Monto del pago
- `currency` (string, default "USD")
- `status` (enum: `pagado`, `pendiente`, `adelanto`, `retrasado`, `abonado`, `cubierta`)
- `quotaNumber` (integer, required): Número de cuota
- `quotasCovered` (integer, default 1): Cuotas cubiertas por este pago
- `quotaAmountCovered` (decimal): Monto de la cuota cubierta
- `advanceCredit` (decimal, default 0): Crédito para futuras cuotas
- `remainingQuotaBalance` (decimal, default 0): Saldo pendiente de la cuota actual
- `lateFeeAmount` (decimal, default 0): Multa por retraso
- `daysLate` (integer, default 0): Días de retraso
- `dueDate` (date, required): Fecha de vencimiento
- `paymentDate` (date): Fecha de pago
- `confirmationNumber` (string): Número de confirmación
- `verifiedInBank` (boolean, default false)
- `verifiedBy` (relation → user-profile): Usuario que verificó
- `verifiedAt` (datetime)
- `comments` (text)
- `financing` (relation → financing): Financiamiento padre
- `documents` (relation oneToMany → billing-document)
- `isSimulated` (boolean, default false)
- `parentRecord` / `childRecords` (self-referencing hierarchy for payment splitting)
- `coveredBy` / `coveredQuotas` (relation for advance payments covering multiple quotas)

**financing** (118 atributos):
- `financingNumber` (string, unique, required)
- `totalAmount` (decimal, required)
- `financingMonths` (integer, default 54)
- `paymentFrequency` (enum: `semanal`, `quincenal`, `mensual`)
- `quotaAmount` (decimal, required)
- `totalQuotas` (integer, required)
- `paidQuotas` (integer, default 0)
- `startDate` (date, required)
- `nextDueDate` (date)
- `status` (enum: `activo`, `inactivo`, `en_mora`, `completado`)
- `maxLateQuotasAllowed` (integer, default 4)
- `lateFeePercentage` (decimal, default 10)
- `currentBalance` (decimal, required)
- `totalPaid` (decimal, default 0)
- `totalLateFees` (decimal, default 0)
- `lateQuotasCount` (integer, default 0)
- `partialPaymentCredit` (decimal, default 0)
- `notes` (text)
- `vehicle` (relation → fleet, oneToOne)
- `client` (relation → user-profile, manyToOne)
- `payments` (relation oneToMany → billing-record, mappedBy: financing)
- `invoices` (relation oneToMany → invoice, mappedBy: financing)

**billing-document** (31 atributos):
- `name` (string, required)
- `file` (media, single, required)
- `record` (relation → billing-record, manyToOne)

**invoice** (76 atributos):
- `invoiceNumber` (string, unique, required)
- `financing` (relation → financing, manyToOne)
- `client` (relation → user-profile, manyToOne)
- `amount` (decimal, required)
- `penaltyAmount` (decimal, default 0)
- `totalAmount` (decimal, required)
- `dueDate` (date, required)
- `billingDate` (date, required)
- `paymentDate` (date)
- `status` (enum: `pending`, `overdue`, `paid`, `cancelled`)
- `paymentMethod` (enum: `cash`, `card`, `transfer`, `yappy`, `otros`)
- `quotaNumber` (integer)
- `notes` (text)
- `isSimulated` (boolean, default false)

### 2.2 Lifecycles (Capa de Lógica de Negocio)

Se encuentran en `content-types/*/lifecycles.ts`. Son el lugar correcto para lógica de negocio en Strapi.

#### billing-record/lifecycles.ts (221 líneas)

**Propósito:** Cálculo automático de multas por retraso y validación de jerarquía padre/hijo.

**Funciones helper:**

1. `calculateDaysLate(dueDate?, paymentDate?)` — Calcula días de retraso
   - Compara `dueDate` vs `paymentDate` (o fecha actual si no hay paymentDate)
   - Retorna `Math.max(0, diffDays)`

2. `calculateLateFee(pendingAmount, daysLate, percentage=10)` — Calcula multa
   - Fórmula: `pendingAmount * (percentage / 100) * daysLate`
   - Retorna 0 si `daysLate <= 0` o `pendingAmount <= 0`
   - Redondea a 2 decimales

3. `processPaymentData(data)` — Procesa datos entrantes
   - Calcula `daysLate` si viene `dueDate` sin `daysLate` explícito
   - Calcula `lateFeeAmount` si `daysLate > 0` y `status === 'retrasado'`
   - Setea `lateFeeAmount = 0` si viene sin valor explícito

4. `getRecordId(value)` — Normaliza IDs de diferentes formatos
   - Soporta: number, string, `{ id }`, `{ documentId }`, null

5. `getRecordFinancingId(strapi, recordId)` — Obtiene el financing ID de un billing record
   - Usa `strapi.db.query` (no raw SQL)
   - Popula la relación `financing` y retorna su documentId o id

6. `isDescendant(strapi, parentId, childId)` — Verifica si existe ciclo en la jerarquía
   - Recursión hacia arriba en la jerarquía de `parentRecord`
   - Evita que un padre sea descendiente de su hijo

7. `validateParentRecord(strapi, data, currentRecordId?)` — Valida relación padre/hijo
   - Evita auto-referencia
   - Verifica que padre e hijo pertenezcan al mismo financing
   - Detecta ciclos antes de crear la relación

**Hooks:**

- `beforeCreate`: Calcula `daysLate` y `lateFeeAmount`, valida `parentRecord`
- `beforeUpdate`: Igual que beforeCreate, pero pasa `where.id` para validación de ciclos

**Estado:** ✅ Implementación limpia — usa entity service y query builder, sin raw SQL.

#### financing/lifecycles.ts (295 líneas)

**Propósito:** Auto-generación de números de financiamiento, cálculo de cuotas, cascade delete.

**Funciones helper:**

1. `calculateTotalQuotas(months, frequency)` — Calcula total de cuotas
   - `semanal`: `months * 4.33` (redondeado arriba)
   - `quincenal`: `months * 2`
   - `mensual`: `months`

2. `getDaysInterval(frequency)` — Retorna intervalo en días
   - `semanal`: 7, `quincenal`: 15, `mensual`: 30

3. `generateFinancingNumber(prefix?)` — Genera número único
   - Formato: `{PREFIX}-YYYYMMDD-XXXXX` (ej: `FIN-20260518-12345`)
   - Usa timestamp para garantizar unicidad sin acceso a DB

4. `extractVehicleIdentifier(vehicle)` — Normaliza formato de relación vehicle
   - Soporta: number (id), string (documentId), `{ id }`, `{ documentId }`, `{ connect: [...] }` (Strapi 5)

5. `getVehicleBillingInitials(strapi, vehicle)` — Obtiene `billingInitials` del fleet
   - Busca por documentId o id
   - Retorna el prefijo para el número de financiamiento

6. `calculateNextDueDate(startDate, frequency)` — Calcula primera fecha de vencimiento
   - `startDate + daysInterval`

**Hooks:**

- `beforeCreate`:
  - Genera `financingNumber` usando prefijo de `billingInitials` del vehículo
  - Calcula `totalQuotas` basado en `financingMonths` y `paymentFrequency`
  - Calcula `quotaAmount = totalAmount / totalQuotas`
  - Establece `currentBalance = totalAmount`
  - Calcula `nextDueDate = startDate + interval`

- `beforeUpdate`: Placeholder para futuros ajustes (actualmente vacío)

- `beforeDelete`: Cascade delete de billing-records asociados
  - Busca todos los billing-records con `financing.id === financingId`
  - Elimina cada uno mediante `strapi.entityService.delete`
  - Continúa aunque fallenindividual deletes (fault tolerance)

**Estado:** ✅ Implementación limpia — sin raw SQL.

### 2.3 Controladores Custom

#### financing/controllers/financing.ts (436 líneas)

**Custom actions:**

1. `getEmailConfig(ctx)` — GET /financing/email-config (auth: false)
   - Obtiene config SMTP desde `configuration` con `category: 'billing'`
   - Obtiene templates de email desde `configuration`
   - Retorna `{ smtp: {...}, templates: [...] }`
   - **No expone password** (solo `hasPass: true/false`)

2. `updateEmailConfig(ctx)` — PUT /financing/email-config (auth: required, admin only)
   - Valida que el usuario sea admin
   - Guarda config SMTP en `configuration` table (keys: `billing-smtp-*`)
   - Guarda templates en `configuration` table (keys: `billing-email-template-*`)
   - Usa `strapi.db.query` (query builder, no raw SQL)

3. `sendTestEmail(ctx)` — POST /financing/send-test-email (auth: required, admin only)
   - Envía email de prueba via nodemailer
   - Usa config SMTP activa

4. `sendFinancingEmail(ctx)` — POST /financing/:id/send-email (auth: required, admin only)
   - Obtiene financing con populate de `client` y `vehicle`
   - Renderiza template con variables (`{{variable}}`)
   - Envía email via nodemailer

**Helper functions internos:**

- `renderTemplate(template, variables)` — Reemplaza `{{key}}` en strings
- `getFinancingVariables(financing)` — Extrae todas las variables disponibles
  - Datos de financing: `financingNumber`, `totalAmount`, `currentBalance`, `totalPaid`, `quotaAmount`, `paidQuotas`, `totalQuotas`, `status`, `startDate`, `nextDueDate`, `paymentFrequency`, `lateQuotasCount`, `totalLateFees`
  - Datos de client: `clientName`, `clientEmail`, `clientPhone`, `clientCedula`, `clientAddress`
  - Datos de vehicle: `vehicleInfo`, `vehiclePlate`, `vehicleVin`
  - Datos de negocio: `companyName`, `currentDate`
- `getSmtpConfig(strapi)` — Obtiene configuración SMTP desde DB o environment
- `sendEmail(strapi, {to, subject, html, text})` — Envía email via nodemailer con TLS
- `getEmailTemplates(strapi)` — Obtiene templates con defaults hardcoded

**Dependencias externas:**
- `nodemailer` — Para envío de emails

**Estado:** ✅ Implementación limpia — usa query builder, no raw SQL.

#### weekly-collection/controllers/weekly-collection.ts (249 líneas)

**Nota:** Este controller pertenece al módulo de weekly-collection pero interactúa con billing-record.

**Custom action:**

1. `batchImport(ctx)` — POST /weekly-collection/batch-import (auth: required)
   - Importa pagos desde Excel/CSV
   - **Deduplicación contra billing-record:** Pre-carga `receiptNumber` de billing-record para validar duplicados
   - Vincula a clientes por `identificationNumber`
   - Vincula a financings activos por `client.id`
   - Límite: 1000 registros por lote
   - Retorna estadísticas: total, created, duplicated, errors

**Funciones de normalización:**
- `normalizeDecimal(value)` — Limpia valores monetarios (%, $, comas)
- `normalizeDate(value)` — Maneja fechas Excel serial y múltiples formatos (DD/MM/YYYY, MM/DD/YYYY)
- `normalizeBoolean(value)` — Reconoce 'si', 'sí', 'yes', 'true', 'verificado', '1', 'ok'
- `normalizeString(value)` — Trim y null para strings vacíos
- `normalizeInteger(value)` — Parse de enteros

**Estado:** ✅ Implementación limpia — usa query builder para billing-record.

### 2.4 Rutas Custom

#### financing/routes/01-custom-financing.ts (49 líneas)

Agrega 4 rutas custom al módulo de financing:

| Método | Path | Handler | Auth | Descripción |
|--------|------|---------|------|-------------|
| GET | `/financing/email-config` | `financing.getEmailConfig` | No | Obtiene config SMTP y templates |
| PUT | `/financing/email-config` | `financing.updateEmailConfig` | No | Actualiza config SMTP y templates |
| POST | `/financing/send-test-email` | `financing.sendTestEmail` | No | Envía email de prueba |
| POST | `/financing/:id/send-email` | `financing.sendFinancingEmail` | No | Envía email para un financiamiento |

**Nota:** Las rutas tienen `auth: false` intencionalmente para facilitar integración con frontends externos. La protección de acceso se hace dentro del controller (`ctx.state.user`).

### 2.5 Servicios

- `billing-record/services/billing-record.ts` — Core service (sin custom logic)
- `billing-document/services/billing-document.ts` — Core service (sin custom logic)
- `financing/services/financing.ts` — Core service (sin custom logic)
- `financing/services/financing-email.js` — Helper service (201 líneas)
  - Encapsula `renderTemplate`, `getFinancingVariables`, `getEmailTemplates`
  - Actualmente no se importa desde el controller (el controller tiene sus propias implementaciones)
  - **Duplicación de lógica** — el controller reimplementa las mismas funciones

**Estado:** ⚠️ **Duplicación detectada** — `financing-email.js` y `financing/controllers/financing.ts` tienen lógica duplicada (`renderTemplate`, `getFinancingVariables`, `getEmailTemplates`).

---

## 3. Anti-Patrones y Parches Detectados

### 3.1 Raw SQL en src/index.ts (Línea 49-62)

**Ubicación:** `src/index.ts:49-62`

```typescript
await strapi.db.connection.raw(
  `ALTER SEQUENCE "${schema}"."${sequenceName}" INCREMENT BY 1;`
);
// ...
await strapi.db.connection.raw(
  `SELECT setval('"${schema}"."${sequenceName}"', ${nextValue}, ${isCalled});`
);
```

**Descripción:** Usa `raw` de Knex para manipular secuencias de PostgreSQL. Esto:
- Solo funciona con PostgreSQL (no portable a SQLite)
- Es un acceso de bajo nivel a la DB
- No usa el query builder de Strapi
- Es específico para normalizar sequences después de un bulk seed

**Contexto:** Se ejecuta en `bootstrap()` para corregir sequences de la tabla `fleet` después de `seedInitialData`.

**Severidad:** ⚠️ **Bajo** — Solo afecta a PostgreSQL, se ejecuta una sola vez en bootstrap, documentado.

**Alternativa sugerida:** Mover esta lógica a un migration script o usar `strapi.db.query` con INSERT bruto para resetear la sequence si es necesario.

### 3.2 Duplicación de Lógica en financing-email.js

**Ubicación:** `src/api/financing/services/financing-email.js` vs `src/api/financing/controllers/financing.ts`

Las funciones `renderTemplate`, `getFinancingVariables`, y `getEmailTemplates` están implementadas tanto en el servicio JS como en el controller TS. El servicio no se importa desde ningún lugar.

**Severidad:** ⚠️ **Bajo** — Código muerto (dead code), no afecta runtime. Sugerencia: eliminar el archivo JS o usarlo desde el controller.

---

## 4. Dependencias del Módulo

### 4.1 Relaciones entre Content Types

```
billing-record
  ├── → financing (manyToOne) [requerido para saber a qué plan pertenece]
  ├── → billing-record (self, parentRecord/childRecords) [jerarquía de pagos]
  ├── → billing-record (self, coveredBy/coveredQuotas) [adelantos]
  ├── → user-profile (verifiedBy) [quién verificó el pago]
  └── → billing-document (oneToMany) [documentos adjuntos]

financing
  ├── → fleet (oneToOne, vehicle) [vehículo financiado]
  ├── → user-profile (manyToOne, client) [cliente]
  ├── → billing-record (oneToMany, payments) [pagos del plan]
  └── → invoice (oneToMany, invoices) [facturas generadas]

billing-document
  └── → billing-record (manyToOne, record) [pago al que pertenece]

invoice
  ├── → financing (manyToOne) [financiamiento origen]
  └── → user-profile (manyToOne, client) [cliente]
```

### 4.2 Dependencias a Otros Módulos/Servicios

| Módulo | Relación | Uso |
|--------|----------|-----|
| `fleet` | `financing.vehicle` | Obtiene `billingInitials` para prefijo de número |
| `user-profile` | `financing.client`, `billing-record.verifiedBy` | Datos del cliente y verificación |
| `configuration` | Storage de config SMTP y templates | `billing-smtp-*`, `billing-email-template-*` |
| `weekly-collection` | Deduplicación con `billing-record` | Evita duplicar receiptNumbers |

### 4.3 Dependencias de Configuración (category: "billing")

Keys almacenadas en `configuration` table:

**SMTP:**
- `billing-smtp-host`
- `billing-smtp-port`
- `billing-smtp-user`
- `billing-smtp-pass`
- `billing-smtp-from`
- `billing-smtp-secure`

**Email Templates:**
- `billing-email-template-financing-created`
- `billing-email-template-payment-reminder`
- `billing-email-template-payment-received`
- `billing-email-template-quota-overdue`
- `billing-email-template-account-statement`

---

## 5. Permisos y Roles

**Ubicación:** `src/roles/role-permissions.ts`

```typescript
const PERMISSIONS = {
  admin: {
    billing: ['read', 'create', 'update', 'delete'],
  },
  seller: {
    billing: ['read', 'create', 'update'],
  },
  driver: {
    billing: ['read'],
  },
};
```

| Rol | Read | Create | Update | Delete |
|-----|------|--------|--------|--------|
| admin | ✅ | ✅ | ✅ | ✅ |
| seller | ✅ | ✅ | ✅ | ❌ |
| driver | ✅ | ❌ | ❌ | ❌ |

---

## 6. Impacto en Otros Módulos

### 6.1 Módulos Afectados

| Módulo | Tipo de Impacto | Descripción |
|--------|-----------------|-------------|
| **Fleet** | Dependencia directa | `financing.vehicle` es relation required. El campo `billingInitials` se usa para prefijo del número de financiamiento |
| **User-profile** | Dependencia directa | `financing.client` y `billing-record.verifiedBy` son relations requeridas en varios procesos |
| **Weekly-collection** | Dependencia de datos | Deduplica receiptNumbers contra billing-record. Si billing-record no existe,可能出现 duplicados |
| **Notification** | Registro de módulo | En `notification/controllers/notification.ts:75` se declara 'billing' como módulo válido para notificaciones |
| **Invoice** | Relation cascade | `financing.invoices` es relation mapeada por `invoice.financing`. Cascade delete en financing lifecycles no incluye invoices |

### 6.2 Posibles Problemas Identificados

1. **Invoice no se elimina en cascade delete de Financing**
   - El hook `beforeDelete` en `financing/lifecycles.ts` solo elimina `billing-record`
   - Los `invoice` asociados permanecen huérfanos en la DB
   - **Recomendación:** Agregar eliminación de invoices en el mismo hook

2. **billingInitials es crítico para generación de números**
   - Si `fleet.billingInitials` está vacío, se usa prefijo por defecto "FIN"
   - Esto puede causar conflictos si múltiples vehículos tienen billingInitials vacío
   - La uniqueness del financingNumber se garantiza con timestamp, no con billingInitials

3. **Configuración SMTP expuesta en frontend**
   - Las rutas de email tienen `auth: false`
   - Aunque el controller valida admin internamente, el endpoint está públicamente expuesto
   - **Recomendación:** Usar policy de rol en las rutas en lugar de validación interna

---

## 7. Cambios Aplicados (Histórico)

> Esta sección se actualiza con cada modificación al módulo.

### 2026-05-18 — Análisis Inicial del Módulo

**Analista:** opencode (Car4You Dev Team)

**Hallazgos:**

| Categoría | Hallazgo | Severidad |
|-----------|----------|-----------|
| Arquitectura | Lifecycles implementan lógica de negocio correctamente | ✅ Bueno |
| Arquitectura | Controladores custom para email well-structured | ✅ Bueno |
| Anti-patrón | Raw SQL en `src/index.ts:49-62` (normalización de sequence PostgreSQL) | ⚠️ Bajo |
| Duplicación | `financing-email.js` duplica lógica del controller | ⚠️ Bajo |
| Bug potencial | Cascade delete de financing no elimina invoices | ⚠️ Medio |
| Config | Rutas de email con `auth: false` pero validación interna | ⚠️ Medio |

**Próximos pasos sugeridos:**
1. [ ] Eliminar `financing-email.js` o integrarlo en el controller para evitar duplicación
2. [ ] Agregar eliminación de invoices en `beforeDelete` de financing
3. [ ] Crear policy de rol para rutas de email en lugar de validación interna
4. [ ] Documentar `billingInitials` como campo requerido en fleet

---

### 2026-05-18 — Anidación Jerárquica Automática para Duplicados con Abonado

**Analista:** opencode (Car4You Dev Team)

**Archivo modificado:** `src/api/billing-record/content-types/billing-record/lifecycles.ts`

**Problema:** 
Cuando se crea un billing record con un `receiptNumber` ya existente, el sistema no tenía forma de manejar la situación. Existía un registro "Pagado" y se intentaba crear un duplicado con "abonado" (crédito por adelantado). El comportamiento deseado era que el registro existente (Pagado) se convirtiera en **hijo** del nuevo registro (con abonado), y **ambos** aparecieran como "pendiente".

**Solución implementada:**

Se agregaron dos nuevas funciones y un hook `afterCreate` al lifecycle de billing-record:

1. **`handleDuplicateReceiptNumber(strapi, data)`** — Detecta duplicados en `beforeCreate`
   - Busca registro existente con mismo `receiptNumber` que no tenga padre
   - Verifica que el nuevo registro tenga `abonado` o `advanceCredit > 0`
   - Si encuentra duplicado, guarda su ID en `event.state.pendingChildRecordId`
   - Retorna `{ handled: true, parentRecordId }` para flujo de vinculación

2. **`linkExistingAsChild(strapi, newRecordId, existingChildId)`** — Vincula en `afterCreate`
   - Actualiza el registro existente: `parentRecord = newRecordId`, `status = 'pendiente'`
   - Actualiza el nuevo registro: `status = 'pendiente'` (el crédito abonado no cubre completamente)
   - Ambos quedan como "pendiente" hasta regularización manual

3. **Hook `beforeCreate` modificado:** Llama a `handleDuplicateReceiptNumber()` antes de validar relación padre/hijo

4. **Hook `afterCreate` agregado:** Vincula el registro existente como hijo usando `event.state.pendingChildRecordId`

**Lógica de negocio:**
```
Nuevo registro con receiptNumber duplicado + tiene "abonado"
    ↓
Registro existente (Pagado) se convierte en hijo
    ↓
Ambos → status = "pendiente"
```

**Validación integrada:**
- Solo procesa si el nuevo registro tiene `status === 'abonado'` o `advanceCredit > 0`
- Solo procesa registros existentes sin `parentRecord` (no transforma hijos)
- No procesa si el registro existente ya tiene `coveredBy`
- Verifica que el registro existente tenga `financing` asociado

**Estado:** ✅ Implementación limpia — usa query builder, no raw SQL.

**Archivos afectados:**
| Archivo | Cambio |
|---------|--------|
| `billing-record/lifecycles.ts` | +167 líneas (221 → 388), nuevo hook `afterCreate` |

**Checked:**
- [x] El nuevo registro se crea normalmente (no se bloquea en beforeCreate)
- [x] El existing se vincula como hijo en afterCreate
- [x] Ambos quedan como "pendiente"

---

### 2026-05-19 — Fix: Adelantos Parciales no se Consumían Correctamente

**Analista:** opencode (Car4You Dev Team)

**Archivo modificado:** `c4y_nextjs/lib/billing.ts` — función `applyAdvanceAsPartialPayment`

**Problema:**
Cuando un adelanto se consumía parcialmente (ej: $100 de $380 sobre una cuota de $386.36), el sistema creaba un abono parcial como hijo de la cuota, pero **el adelanto original seguía apareciendo como "disponible"** con su monto completo. Esto permitía que:
1. El mismo adelanto se reutilizara múltiples veces
2. Aparecieran montos duplicados en el balance
3. El adelanto nunca quedaba "consumido" del todo

**Causa raíz:**
El abono parcial se vinculaba como hijo de la **cuota** (correcto), pero el adelanto original no se marcaba como consumido. El auto-cover (`autoCoverPendingQuotas`) recalculaba el saldo del adelanto dinámicamente (`amount - sum(hijos.amount)`), pero como los abonos eran hijos de la cuota (no del adelanto), el cálculo no reflejaba el consumo real.

**Solución implementada:**

En `applyAdvanceAsPartialPayment`, después de crear el abono parcial:
```typescript
// BUGFIX: Marcar el adelanto como consumido reduciendo su amount a 0.
// El abono queda como hijo de la cuota — para calcular balance pendiente.
// El adelanto original queda como registro histórico con monto 0 para
// evitar que aparezca nuevamente en auto-cover.
const consumeResponse = await fetch(
  `${STRAPI_BASE_URL}/api/billing-records/${advance.documentId}`,
  {
    method: "PUT",
    headers: { ... },
    body: JSON.stringify({
      data: {
        amount: 0,
        comments: `Consumido parcialmente: $${advance.available} aplicados a cuota #${quota.quotaNumber} (abono ${abonoResult.data?.documentId}). Monto original: $${advance.amount}.`,
      },
    }),
  }
);
```

**Lógica:**
1. El abono parcial se crea como hijo de la **cuota** (manteniendo el cálculo de balance pendiente: `quotaAmount - sum(hijos)`)
2. El adelanto original se actualiza a `amount = 0` (registro histórico)
3. El comentario documenta: cuánto se consumió, a qué cuota, y el abono generado
4. En futuras ejecuciones de auto-cover, el adelanto ya no aparece como disponible (`available = amount - sum(hijos) = 0 - 0 = 0`)

**Verificación:**
- [x] Adelanto de $380 aplicado parcialmente ($100) a cuota #1
- [x] El adelanto desaparece de la lista de disponibles
- [x] La cuota muestra saldo pendiente de $286.36
- [x] No aparecen duplicados ni montos fantasma

**Archivos afectados:**
| Archivo | Cambio |
|---------|--------|
| `lib/billing.ts` | `applyAdvanceAsPartialPayment`: +20 líneas (consumo del adelanto) |

---

## 8. Anexos

### 8.1 Resumen de Archivos

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `billing-record/content-types/billing-record/schema.json` | 130 | Schema del pago hijo |
| `billing-record/content-types/billing-record/lifecycles.ts` | 388 | Hooks: multas, validación jerarquía y anidación automática de duplicados |
| `billing-document/content-types/billing-document/schema.json` | 31 | Schema de documento adjunto |
| `financing/content-types/financing/schema.json` | 118 | Schema del financiamiento |
| `financing/content-types/financing/lifecycles.ts` | 295 | Hooks: auto-número, cálculos, cascade |
| `financing/controllers/financing.ts` | 436 | Custom: gestión SMTP y templates email |
| `financing/routes/01-custom-financing.ts` | 49 | Rutas custom de email |
| `financing/services/financing-email.js` | 201 | Helper duplicado (código muerto) |
| `weekly-collection/controllers/weekly-collection.ts` | 249 | Batch import con dedup contra billing |
| `invoice/content-types/invoice/schema.json` | 76 | Schema de factura |

### 8.2 Dependencias NPM Externas

- `nodemailer` — Uso: envío de emails transaccionales desde financing controller

### 8.3 Nomenclatura de Variables de Configuración

Todas las keys de configuración del módulo usan el prefijo `billing-` o `billing-email-template-` para distinguirlas de otras configuraciones del sistema (ej: `app-*`, `fleet-*`).
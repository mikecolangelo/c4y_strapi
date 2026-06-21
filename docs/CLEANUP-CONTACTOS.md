# Limpieza módulo CONTACTOS (user-profile)

Fecha: 2026-06-20

Revisión campo por campo y línea por línea del módulo de contactos (BD + código),
validando que ningún cambio interfiera con otros módulos.

## Base de datos

### Campo eliminado: `user_profiles.password` (LEGACY)

- **Estado previo:** atributo `password` (`type: password`, `private: true`) marcado
  en el schema como _"LEGACY - No usar. La contraseña real vive en users-permissions"_.
- **Validación:** 33 filas totales, solo 2 con valor legacy. Ningún módulo lee la
  columna. El controller usa `data.password` (campo **transitorio** del request) para
  crear el usuario nativo de `users-permissions` y luego hace `delete profileData.password`
  antes de persistir — independiente del atributo del schema.
- **Acción:** removido el atributo de
  `src/api/user-profile/content-types/user-profile/schema.json`. Strapi sincronizó el
  schema al recargar y eliminó la columna. 33 filas intactas.
- **Backup:** `backups/main_car4youpanama-20260620-164235.sql` (pg_dump completo previo).

### Campos NO eliminados

- **Escalares** (`displayName`, `role`, `email`, `phone`, `department`, `bio`, `address`,
  `dateOfBirth`, `hireDate`, `identificationNumber`, `emergencyContact*`, `linkedin`,
  `workSchedule`, `specialties`, `driverLicense`, `themePreference`, `billing*`, `avatar`):
  todos referenciados en el frontend. Se conservan.
- **Relaciones inversas** (`clients`, `appointments`, `deals`, `notifications`,
  `communicationLogs`, `serviceNotes`, `serviceOrders`, `inventoryNotes`, `comments`,
  `assignedVehicles`, `interestedVehicles`, `financings`, `driverHistories`,
  `registeredVehicles`, `supplyRequests`, `inventoryRequests`, etc.): son lados inversos
  (`mappedBy`/`inversedBy`) cuya FK vive en otros módulos. Eliminarlas rompería esos
  módulos → se conservan.

## Código

### Backend (`src/api/user-profile`)

- `controllers/user-profile.ts`: todos los métodos (`create`, `account`, `convert`,
  `createAccount`, `resetPassword`, `batchImport`) mapean a rutas activas. Sin código muerto.
- `services/user-profile.ts`: los 3 métodos están en uso —
  `promoteLeadToUser` (← `convert`), `createAccountForProfile` (← `createAccount`),
  `createProfileForUser` (← extensión `users-permissions/controllers/auth.js`).
  Corregida numeración duplicada de comentarios (pasos 6→7→8→9).
- `lifecycles.ts`: vacío a propósito (documentado), se conserva.

### Frontend

- `lib/lead-import.ts`: eliminadas 3 variables sin usar (`fileName` → `_fileName`,
  y los parámetros `phone`/`email` redundantes en `forEach` de deduplicación).
- Endpoint proxy `app/api/user-profiles/[id]/create-account/route.ts`: sin referencias
  desde la UI (la promoción de leads usa `/convert`), pero refleja una capacidad viva del
  backend → **se conserva** (eliminarlo no aporta y quitaría una capacidad).

## Validación

- Frontend: 325 tests ✓ · Backend: 10 tests ✓
- Sin warnings de `unused-vars` en los archivos de contactos.

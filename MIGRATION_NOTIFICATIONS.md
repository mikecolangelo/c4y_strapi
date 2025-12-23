# Migración a Notifications como Fuente Única de Verdad

## Resumen
Se ha refactorizado el sistema para usar `notifications` como la tabla principal para todos los recordatorios y notificaciones del sistema, en lugar de tener múltiples lugares (fleet-reminder, assignedReminders, etc.).

## Cambios Realizados

### 1. Schema de Notification (`backend/src/api/notification/content-types/notification/schema.json`)

**Campos agregados:**
- `module`: Enum para identificar el módulo (fleet, inventory, billing, deal, client, service)
- `tags`: JSON para etiquetas y metadatos
- `reminderType`: Tipo de recordatorio (unique, recurring)
- `scheduledDate`: Fecha programada
- `recurrencePattern`: Patrón de recurrencia (daily, weekly, biweekly, monthly, yearly)
- `recurrenceEndDate`: Fecha de fin de recurrencia
- `isActive`: Si el recordatorio está activo
- `isCompleted`: Si el recordatorio está completado
- `lastTriggered`: Última vez que se activó
- `nextTrigger`: Próxima fecha de activación
- `authorDocumentId`: DocumentId del autor
- `assignedUsers`: Relación manyToMany con user-profile
- `author`: Relación manyToOne con user-profile (autor)
- `fleetVehicle`: Relación manyToOne con fleet (para module='fleet')

**Relaciones actualizadas:**
- `fleetReminder`: Mantenida para compatibilidad legacy (deprecated)

### 2. Schema de Fleet (`backend/src/api/fleet/content-types/fleet/schema.json`)

**Agregado:**
- `notifications`: Relación oneToMany con notifications (mappedBy: "fleetVehicle")

### 3. Schema de User Profile (`backend/src/api/user-profile/content-types/user-profile/schema.json`)

**Agregado:**
- `assignedNotifications`: Relación manyToMany con notifications (mappedBy: "assignedUsers")

### 4. Controller de Notification (`backend/src/api/notification/controllers/notification.ts`)

**Métodos agregados:**
- `createReminder`: Crea un recordatorio usando notifications como fuente principal
- `findReminders`: Obtiene recordatorios filtrados por módulo, vehículo, usuario, etc.

### 5. Service de Notification (`backend/src/api/notification/services/notification.ts`)

**Actualizado:**
- `syncReminderNotifications`: Ahora trabaja directamente con notifications en lugar de fleet-reminder
- Usa tags para relacionar notificaciones individuales con el recordatorio principal
- Soporta múltiples módulos (fleet, inventory, etc.)

### 6. Rutas de Notification (`backend/src/api/notification/routes/notification.ts`)

**Rutas agregadas:**
- `POST /api/notifications/reminders`: Crear un recordatorio
- `GET /api/notifications/reminders`: Obtener recordatorios filtrados

### 7. APIs del Frontend

**Actualizado:**
- `frontend/app/api/fleet/[id]/reminder/route.ts`:
  - GET: Usa `/api/notifications` con filtros `type='reminder'` y `module='fleet'`
  - POST: Usa `/api/notifications/reminders` en lugar de `/api/fleet-reminders`

## Estructura de Datos

### Crear un Recordatorio de Fleet

```json
{
  "data": {
    "title": "Mantenimiento completo del vehículo",
    "description": "Descripción del mantenimiento",
    "type": "reminder",
    "module": "fleet",
    "reminderType": "recurring",
    "scheduledDate": "2025-12-13T13:00:00",
    "recurrencePattern": "monthly",
    "recurrenceEndDate": null,
    "isActive": true,
    "isCompleted": false,
    "nextTrigger": "2025-12-13T13:00:00",
    "timestamp": "2025-12-13T13:00:00",
    "authorDocumentId": "user-123",
    "fleetVehicle": 1,
    "assignedUsers": [1, 2, 3],
    "tags": {
      "module": "fleet",
      "vehicleId": 1
    }
  }
}
```

### Consultar Recordatorios de Fleet

```
GET /api/notifications?filters[type][$eq]=reminder&filters[module][$eq]=fleet&filters[fleetVehicle][id][$eq]=1
```

## Próximos Pasos

1. **Migrar datos existentes**: Crear script de migración para mover datos de `fleet-reminder` a `notifications`
2. **Actualizar otras APIs**: Actualizar `frontend/app/api/fleet-reminder/[reminderId]/route.ts` y `frontend/app/api/reminders/route.ts`
3. **Actualizar frontend**: Actualizar componentes que usan fleet-reminder para usar notifications
4. **Deprecar fleet-reminder**: Una vez migrado todo, marcar fleet-reminder como deprecated

## Notas Importantes

- `fleet-reminder` se mantiene por compatibilidad pero está deprecated
- Todos los nuevos recordatorios deben crearse usando `notifications` con `module='fleet'`
- Las notificaciones individuales para usuarios se crean automáticamente usando tags para relacionarlas con el recordatorio principal
- El campo `tags` permite flexibilidad para agregar metadatos adicionales sin modificar el schema


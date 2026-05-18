# Cambios en Backend (Strapi)

## 2025-02-13: Nuevo estatus "Abonado"

### Archivo modificado
`src/api/billing-record/content-types/billing-record/schema.json`

### Cambio realizado
Añadido "abonado" al enum de estados de billing-record:

```json
"status": {
  "type": "enumeration",
  "enum": ["pagado", "pendiente", "adelanto", "retrasado", "abonado"],
  "required": true,
  "default": "pendiente"
}
```

### Notas importantes
- Este cambio requiere reiniciar Strapi para que se aplique
- Los registros existentes con estados anteriores no se ven afectados
- El nuevo estado "abonado" se usa para pagos parciales aplicados a cuotas existentes con saldo pendiente

### Diferencia entre estados
- **pagado**: Cuota pagada completamente y a tiempo
- **pendiente**: Cuota generada pero no pagada aún
- **adelanto**: Pago completo para cuotas futuras (cuota actual ya pagada)
- **retrasado**: Cuota pagada con días de atraso
- **abonado**: Pago parcial aplicado a cuota(s) existente(s) con saldo pendiente

---

## 2025-02-13: Nuevo campo "remainingQuotaBalance"

### Archivo modificado
`src/api/billing-record/content-types/billing-record/schema.json`

### Cambio realizado
Añadido campo `remainingQuotaBalance` para diferenciar entre:
- **Falta por pagar**: Saldo pendiente de la cuota actual
- **Crédito disponible**: Monto acumulado para cuotas futuras (advanceCredit)

```json
"remainingQuotaBalance": {
  "type": "decimal",
  "default": 0,
  "description": "Saldo pendiente por pagar de la cuota actual (diferente de advanceCredit que es crédito para futuras cuotas)"
}
```

### Diferenciación de conceptos
- **remainingQuotaBalance**: Lo que falta por pagar de la cuota actual (ej: cuota 227.27 - lo ya abonado = resto)
- **advanceCredit**: Monto de adelanto no aplicado aún, disponible para cuotas futuras

### Implementación en frontend
- Al crear un pago, se calcula `remainingQuotaBalance` según:
  - Para pagos parciales: `quotaAmount - totalApplied`
  - Para pagos completos con excedente: `0`
- Se muestra en la UI separadamente del crédito disponible

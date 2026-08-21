# Protocolo de Testing y Validación de Workflows

Este protocolo define el ciclo de verificación autónoma que ejecuta el Second Brain antes de dar por completado un workflow o proponer un pase a producción.

---

## Ciclo de Verificación (Loop Autónomo)

```text
[Diseño / Modificación]
         │
         ▼
[Generación de Payload Mock]
         │
         ▼
[Disparo de Ejecución de Prueba] ──▶ (run_webhook / trigger manual)
         │
         ▼
[Inspección de Ejecución] ─────────▶ (get_execution / logs)
         │
    ┌────┴───────────────────────────┐
    │                                │
[¿Hubo Error?]                  [¿Éxito?]
    │                                │
    ▼                                ▼
[Análisis de Causa Raíz]        [Validación de Schema de Salida]
    │                                │
    ▼                                ▼
[Corrección Automática de Nodos] [¿Output coincide con spec?]
    │                                │
    └───────────┬────────────────────┘
                │
                ▼
[Generación de Reporte de Prueba + Diff]
                │
                ▼
[Solicitud de Aprobación Humana para PROD]
```

---

## 1. Reglas de Ejecución de Pruebas

1. **Aislamiento en DEV:** Todas las pruebas de estrés o ejecución se realizan exclusivamente contra la instancia de desarrollo.
2. **Uso de Mocks:**
   - Si el nodo escribe en una base de datos o envía mensajes a personas reales, se deben usar identificadores de prueba o tablas de staging (mock).
   - Para webhooks, el agente genera un JSON sintético representativo de casos felices y casos de borde (ej: teléfono sin formato internacional, campo nulo).
3. **Validación de Salida:**
   - No basta con que n8n devuelva `finished: true`.
   - Se debe verificar que la estructura de datos emitida por el último nodo contenga las claves y tipos esperados.
4. **Criterio de Auto-corrección:**
   - Errores de sintaxis en nodos `Code` (JavaScript), mapeo de expresiones JSON (`{{ $json.field }}`) o tipos de datos deben corregirse automáticamente hasta lograr una ejecución limpia (máximo 3 reintentos).
   - Errores de credenciales, conectividad o permisos se escalan inmediatamente al usuario.

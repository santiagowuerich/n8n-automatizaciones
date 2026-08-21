---
name: n8n-testing
description: "Trigger: testear workflow, probar n8n, verificar workflow, ejecutar webhook prueba, debug n8n. Ejecuta pruebas con mock data y valida salidas."
license: Apache-2.0
metadata:
  author: santiagowuerich
  version: "1.0"
---

## Activation Contract

Activar para validar workflows en desarrollo mediante inyección de datos de prueba, inspección de ejecuciones y auto-corrección de errores.

## Hard Rules

- **Solo en DEV:** Las pruebas se ejecutan exclusivamente en la instancia de desarrollo.
- **Datos Seguros (Mocks):** Nunca usar datos reales de clientes en pruebas destructivas. Usar identificadores sintéticos de staging.
- **Validación Estructural:** Comprobar tanto que la ejecución termine en estado `success` como que los campos esperados estén presentes en el output del último nodo.
- **Límite de Auto-fix:** Máximo 3 reintentos autónomos ante fallos de sintaxis o mapeo antes de escalar al usuario.

## Decision Gates

| Resultado de Ejecución | Acción |
| :--- | :--- |
| `success` + Schema válido | Registrar prueba exitosa y retornar evidencia al orquestador. |
| `error` en nodo Code / Expresión | Analizar stack trace del error, actualizar el nodo en n8n y re-ejecutar. |
| `error` por credencial inválida | Detener el ciclo de prueba y notificar credencial faltante o expirada. |
| Time out (> 30 segundos) | Inspeccionar nodos bloqueantes (esperas, loops infinitos) y corregir. |

## Execution Steps

1. **Generar Mock Data:** Crear un payload JSON representativo (caso feliz + casos de borde: campos nulos, formatos no estándar).
2. **Disparar Ejecución:**
   - Si el trigger es Webhook: Enviar petición POST/GET al endpoint de webhook de prueba (`/webhook-test/...` o `/webhook/...`).
   - Si el trigger es manual: Disparar ejecución vía API de n8n.
3. **Inspeccionar Ejecución:**
   - Consultar `get_execution` para obtener el árbol de ejecución y datos de salida por nodo.
4. **Verificar y Corregir:**
   - Validar claves y tipos del JSON emitido por el nodo final.
   - Si hay discrepancia o error, ajustar la configuración del nodo en n8n y repetir desde el paso 2.
5. **Generar Log de Prueba:**
   - Retornar input inyectado, output obtenido, tiempo de ejecución y nodos atravesados.

## Output Contract

- Estado final: `APROBADO` o `FALLIDO`.
- JSON de entrada utilizado (mock).
- JSON de salida obtenido del nodo terminal.
- Detalle de correcciones automáticas realizadas (si hubo).

## References

- [testing-protocol.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/testing-protocol.md)

# Manifiesto — 04 Reactivación Closed Lost

## Propósito

Pilotear la reactivación por WhatsApp de oportunidades Closed Lost con un workflow de envío y otro de recepción, usando Chatwoot y una planilla de control.

## Estado observado

- `README.md` informa que el piloto está construido y requiere credenciales y plantilla para probarse.
- No se observó evidencia de ejecuciones en la documentación revisada.
- El export de envío está inactivo; el export de recepción declara `active: true`, aunque el README lo describe como inactivo. Esa discrepancia debe resolverse antes de declarar un estado operativo o una fuente canónica.

## Workflows y documentación relevante

| Recurso | Rol observado |
|---|---|
| [`workflows/Closed Lost WhatsApp — 1. Envío vía Chatwoot.json`](workflows/Closed%20Lost%20WhatsApp%20%E2%80%94%201.%20Env%C3%ADo%20v%C3%ADa%20Chatwoot.json) | Export de envío (20 nodos, inactivo). |
| [`workflows/Closed Lost WhatsApp — 2. Recepción vía Chatwoot.json`](workflows/Closed%20Lost%20WhatsApp%20%E2%80%94%202.%20Recepci%C3%B3n%20v%C3%ADa%20Chatwoot.json) | Export de recepción (25 nodos; `active: true` en el JSON). |
| [`README.md`](README.md), [`CONFIGURACION.md`](CONFIGURACION.md) y [`plantilla-meta.md`](plantilla-meta.md) | Estado, configuración y plantilla; no copiar credenciales a documentación de índice. |

## Demo, pruebas y datos

- `demos/` contiene el simulador HTML y exports de demostración/prueba; no se consideran workflows de producción por su ubicación y nomenclatura.
- `pruebas/nodos-wf1.js` y `pruebas/nodos-wf2.js` son pruebas de nodos.
- `datos/` contiene CSV, JSON, XLSX, PDF y TXT operativos/del piloto. Deben conservarse sin mover ni resumir datos personales en documentación.
- `demos/workflow_demo_gemini_real.json` es no trackeado y queda fuera de esta pasada.

## Ambigüedad y decisiones pendientes

1. Confirmar el estado real de activación del workflow de recepción.
2. Confirmar cuáles exports de `demos/` son sólo prototipos y cuál versión, si alguna, debe preservarse como referencia técnica.
3. Completar configuración y credenciales fuera del repositorio, y confirmar la plantilla antes de una prueba controlada.
4. Definir la política de conservación y acceso para los archivos de `datos/` antes de cualquier futura reorganización.

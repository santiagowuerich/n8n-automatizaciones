# Manifiesto — 03 Churn Grafana

## Propósito

Detectar desvíos de facturación —caídas y crecimiento atípico— usando Grafana como fuente, y registrar/alertar los resultados mediante Google Sheets y Slack.

## Estado observado

- La documentación lo marca bloqueado a la espera de un token de servicio de Grafana.
- Ambos exports están inactivos (`active: false`).
- No se debe ejecutar ni activar un workflow como parte de esta reorganización.

## Workflows y documentación relevante

| Recurso | Rol observado |
|---|---|
| [`workflow.json`](workflow.json) | Export titulado `Análisis Desvíos de Facturación v6 (Churn + Crecimiento) - Grafana → Sheets + Slack` (29 nodos). |
| [`workflow.v5.backup.json`](workflow.v5.backup.json) | Backup titulado `Análisis Churn Clientes v5 (Modular & Visual) - Grafana → Sheets + Slack` (27 nodos). |
| [`README.md`](README.md) y [`DOCUMENTACION_TECNICA.md`](DOCUMENTACION_TECNICA.md) | Describen v5 como versión actual. |
| [`decisiones.md`](decisiones.md) y [`parametros.md`](parametros.md) | Decisiones y parámetros de negocio. |

## Demo, pruebas y datos

- No se observó una carpeta dedicada de demos, pruebas automatizadas ni datos exportados dentro del proyecto.
- Los documentos describen consultas y salidas operativas, pero no sustituyen una evidencia de ejecución.

## Ambigüedad y decisiones pendientes

`workflow.json` parece corresponder a v6, pero los documentos vigentes describen v5 y el archivo v5 está nombrado como backup. **No hay workflow canónico confirmado.**

1. Confirmar si la fuente de verdad es el export v6, el backup v5 o una versión externa de n8n.
2. Obtener y configurar el token de servicio de Grafana fuera del repositorio.
3. Tras confirmar la versión, validar la documentación contra el export elegido antes de archivar o mover archivos.

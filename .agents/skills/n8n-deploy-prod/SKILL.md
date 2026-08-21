---
name: n8n-deploy-prod
description: "Trigger: desplegar a produccion, pasar a prod, deploy n8n, publicar workflow, migrar a xtract. Gestiona el pase seguro de DEV a PROD."
license: Apache-2.0
metadata:
  author: santiagowuerich
  version: "1.0"
---

## Activation Contract

Activar cuando un workflow probado en DEV deba ser promovido, actualizado o publicado en la instancia productiva (`n8n.xtract.app`).

## Hard Rules

- **Prueba Previa Obligatoria:** No se puede iniciar el despliegue sin un reporte de testing exitoso en DEV.
- **Sanitización de IDs:** Mapear los IDs de credenciales de DEV a sus correspondientes IDs de PROD usando `docs/brain/credenciales.md`.
- **Gate de Aprobación Humana:** Detenerse SIEMPRE antes de crear o sobreescribir en PROD. Mostrar el diff claro y esperar confirmación explícita del usuario.
- **Backup Previo:** Si se actualiza un workflow existente en PROD, obtener y guardar el JSON actual en `workflows/backups/` antes de modificar.

## Decision Gates

| Condición | Acción |
| :--- | :--- |
| Falta credencial equivalente en PROD | Alertar al usuario de la credencial faltante en Xtract y abortar. |
| Usuario confirma despliegue | Ejecutar creación/actualización en `n8n_prod` y verificar activación. |
| Usuario cancela o solicita cambios | Regresar a DEV para aplicar ajustes requeridos. |

## Execution Steps

1. **Obtener Workflow de DEV:** Exportar la definición JSON limpia del workflow probado en desarrollo.
2. **Reasignar Credenciales:** Reemplazar los IDs de credenciales de DEV por los IDs homólogos de PROD (según `docs/brain/credenciales.md`).
3. **Generar Diff y Reporte:**
   - Detallar: Nombre del workflow, trigger, nodos modificados, credenciales productivas asignadas y resultado de la prueba en DEV.
4. **Solicitar Aprobación:**
   - Presentar el resumen y pedir confirmación explícita: `¿Confirmás el despliegue a producción en Xtract?`
   - **DETENERSE Y ESPERAR RESPUESTA.**
5. **Aplicar en PROD:**
   - Tras el "Sí" del usuario, crear o actualizar el workflow en la API de `n8n_prod`.
   - Activar el workflow si corresponde y verificar que responda en estado activo.

## Output Contract

- Resumen del despliegue: ID en PROD, URL de webhook productivo (si aplica) y estado de activación (`active: true`).
- Backup del estado anterior (si fue actualización).

## References

- [sistemas.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/sistemas.md)
- [credenciales.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/credenciales.md)

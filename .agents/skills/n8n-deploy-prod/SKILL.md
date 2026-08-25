---
name: n8n-deploy-prod
description: "Trigger: desplegar a produccion, pasar a prod, deploy n8n, publicar workflow, migrar a xtract. Gestiona el pase seguro de DEV a PROD."
license: Apache-2.0
metadata:
  author: santiagowuerich
  version: "1.0"
---

## Activation Contract

Activar cuando un workflow **de cliente (Xtract)** probado en DEV deba ser promovido, actualizado o publicado en la instancia productiva (`n8n.xtract.app`).

**NO activar para proyectos propios** (`personal/`): esos viven en `n8n.santiagowuerich.info`, que ya es su producción. No hay pase entre instancias, así que no hay nada que desplegar — se edita en el lugar, con el rigor de una producción. Ver `docs/brain/sistemas.md`.

## Hard Rules

- **Verificación de Acceso Previa:** ANTES de cualquier otra cosa, comprobar si la sesión actual tiene un servidor MCP apuntando a `n8n.xtract.app` (`n8n_prod`). El acceso depende del host: Antigravity lo tiene, Claude Code **no**. Ver la matriz en `docs/brain/sistemas.md`. Nunca asumir que el servidor genérico `n8n` es producción.
- **Prueba Previa Obligatoria:** No se puede iniciar el despliegue sin un reporte de testing exitoso en DEV.
- **Sanitización de IDs:** Mapear los IDs de credenciales de DEV a sus correspondientes IDs de PROD usando `docs/brain/credenciales.md`.
- **Gate de Aprobación Humana:** Detenerse SIEMPRE antes de crear o sobreescribir en PROD. Mostrar el diff claro y esperar confirmación explícita del usuario.
- **Backup Previo:** Si se actualiza un workflow existente en PROD, obtener y guardar el JSON actual en `workflows/backups/` antes de modificar.
- **Nada se da por desplegado sin verificar:** si el agente no pudo confirmar el estado en PROD, se reporta como "pendiente de confirmación del usuario", nunca como hecho.

## Decision Gates

| Condición | Acción |
| :--- | :--- |
| La sesión NO tiene acceso a `n8n_prod` | Cambiar a la **ruta manual**: dejar el JSON listo con credenciales de PROD remapeadas + instrucciones de import. No abortar. |
| Falta credencial equivalente en PROD | Alertar al usuario de la credencial faltante en Xtract y abortar. |
| Usuario confirma despliegue (con acceso) | Ejecutar creación/actualización en `n8n_prod` y verificar activación. |
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
   - **Con acceso (`n8n_prod` disponible):** tras el "Sí" del usuario, crear o actualizar el workflow vía `n8n_prod`. Activar si corresponde y verificar que responda en estado activo.
   - **Sin acceso (ej. Claude Code):** guardar el JSON final —ya con credenciales de PROD— en `workflows/` del proyecto y entregar al usuario el checklist de import manual: importar en `n8n.xtract.app`, confirmar credenciales enlazadas, activar, y probar el webhook. Registrar lo que el usuario reporte.

## Output Contract

- Resumen del despliegue: ID en PROD, URL de webhook productivo (si aplica) y estado de activación (`active: true`).
- Backup del estado anterior (si fue actualización).

## References

- [sistemas.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/sistemas.md)
- [credenciales.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/credenciales.md)

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

**Dos rutas posibles (elegida al diseñar el proyecto, ver `docs/brain/sistemas.md §4`):**
- **Legacy (instancia separada):** DEV en Santiago → PROD en Xtract. Requiere remapeo de credenciales.
- **DEV embebido (recomendada para proyectos nuevos, 2026-09-10):** DEV y PROD son dos workflows dentro de `n8n.xtract.app`. Sin remapeo — mismos IDs de credencial en ambos. Ver [Patrón 11](../../../docs/brain/catalogo-patrones.md#11-patrón-entorno-de-prueba-embebido-con-redirect-seguro-2026-09-10).

## Hard Rules

- **Verificación de Acceso Previa:** ANTES de cualquier otra cosa, comprobar si la sesión actual tiene un servidor MCP apuntando a `n8n.xtract.app` (`n8n_prod`). El acceso depende del host: Antigravity lo tiene, Claude Code **no**. Ver la matriz en `docs/brain/sistemas.md`. Nunca asumir que el servidor genérico `n8n` es producción.
- **Prueba Previa Obligatoria:** No se puede iniciar el despliegue sin un reporte de testing exitoso en DEV (o en el workflow DEV-en-Xtract, con el redirect fail-safe activo, si la ruta es la embebida).
- **Sanitización de IDs (solo ruta legacy):** Mapear los IDs de credenciales de DEV a sus correspondientes IDs de PROD usando `docs/brain/credenciales.md`. En la ruta de DEV embebido este paso no aplica — misma instancia, mismos IDs.
- **Gate de Aprobación Humana:** Detenerse SIEMPRE antes de crear, sobreescribir o activar en PROD. Mostrar el diff claro y esperar confirmación explícita del usuario. Aplica a las dos rutas por igual.
- **Backup Previo:** Si se actualiza un workflow existente en PROD, obtener y guardar el JSON actual en `workflows/backups/` antes de modificar.
- **Nada se da por desplegado sin verificar:** si el agente no pudo confirmar el estado en PROD, se reporta como "pendiente de confirmación del usuario", nunca como hecho.

## Decision Gates

| Condición | Acción |
| :--- | :--- |
| Proyecto usa DEV embebido en Xtract | Saltar sanitización de IDs. El "despliegue" es: quitar el redirect fail-safe del workflow DEV-en-Xtract y activar el workflow PROD gemelo, tras el gate de aprobación. |
| La sesión NO tiene acceso a `n8n_prod` | Cambiar a la **ruta manual**: dejar el JSON listo con credenciales de PROD remapeadas (ruta legacy) o con el redirect ya quitado (ruta embebida) + instrucciones de import/activación. No abortar. |
| Falta credencial equivalente en PROD (solo ruta legacy) | Alertar al usuario de la credencial faltante en Xtract y abortar. |
| Usuario confirma despliegue (con acceso) | Ejecutar creación/actualización/activación vía `n8n_prod` y verificar estado. |
| Usuario cancela o solicita cambios | Regresar a DEV (o al workflow DEV-en-Xtract) para aplicar ajustes requeridos. |

## Execution Steps

**Ruta legacy (instancia separada):**
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

**Ruta DEV embebido (misma instancia, 2026-09-10):**
1. **Confirmar el par:** identificar el workflow DEV-en-Xtract validado y su gemelo PROD (mismos nodos, sin el redirect fail-safe).
2. **Generar Diff y Reporte:** mismo contenido que la ruta legacy, sin sección de credenciales (no cambian).
3. **Solicitar Aprobación:** mismo paso 4 de la ruta legacy — detenerse y esperar.
4. **Aplicar en PROD:** quitar/desactivar el nodo `Resolver Destinatario` (o confirmar que el workflow PROD gemelo, que nunca tuvo el redirect, sea el que se activa) y activar. Verificar estado.

## Output Contract

- Resumen del despliegue: ID en PROD, URL de webhook productivo (si aplica) y estado de activación (`active: true`).
- Backup del estado anterior (si fue actualización).

## References

- [sistemas.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/sistemas.md)
- [credenciales.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/credenciales.md)

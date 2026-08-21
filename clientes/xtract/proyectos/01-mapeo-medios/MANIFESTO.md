# Manifiesto — 01 Mapeo de medios

## Propósito

Automatizar la captación, enriquecimiento, priorización y documentación de contactos de prensa tech y negocios en LATAM para outreach.

## Estado observado

- `README.md` lo marca como entregado y en mantenimiento.
- `workflow.json` corresponde a `Potencial Entregable`, contiene 47 nodos y está inactivo (`active: false`).
- El directorio está bajo `Completados/`; no moverlo ni eliminar su historial en esta primera pasada.

## Workflows y documentación relevante

| Recurso | Rol observado |
|---|---|
| [`workflow.json`](workflow.json) | Export n8n de 47 nodos. |
| [`README.md`](README.md) | Descripción funcional, mantenimiento y fuentes. |
| [`decisiones.md`](decisiones.md) | Decisiones técnicas. |
| [`entrega.md`](entrega.md) | Registro de entrega y sanitización descrita. |

## Demo, pruebas y datos

- No se observó una carpeta dedicada de demos, pruebas automatizadas ni datos locales dentro de este proyecto.
- La documentación menciona una planilla externa y un paquete `entrega-cliente/`, pero esa ruta no existe bajo este proyecto ni en la ruta relativa documentada.

## Decisiones pendientes

1. Confirmar la ubicación o el sistema externo que conserva el paquete de entrega antes de reparar referencias o mover artefactos.
2. Confirmar si `workflow.json` es la copia de mantenimiento vigente frente a la instancia n8n o a una entrega externa.
3. Mantener el estado de completado hasta que exista una decisión explícita de archivo histórico.

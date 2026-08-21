# Manifiesto — 02 Agente de minutas

## Propósito

Automatizar la generación y el envío a Slack de minutas para Hunting, Integraciones y Engagement mediante un sistema parametrizado por área.

## Estado observado

- `README.md` lo describe como workflow construido y bloqueado por accesos y configuración pendiente.
- `workflow.json` está inactivo (`active: false`).
- La documentación declara 21 nodos, mientras que el export actual contiene 24; esta diferencia requiere confirmación antes de considerar un artefacto como canónico.

## Workflows y documentación relevante

| Recurso | Rol observado |
|---|---|
| [`workflow.json`](workflow.json) | Export n8n del agente de minutas para las tres áreas. |
| [`README.md`](README.md) | Alcance, arquitectura y requisitos pendientes. |
| [`investigacion.md`](investigacion.md) | Decisiones sobre fuente de transcripciones y trigger. |
| [`accesos-requeridos.md`](accesos-requeridos.md) | Inventario de accesos solicitados; no reproducir secretos en otros documentos. |

## Demo, pruebas y datos

- `Ejemplos/` contiene cinco documentos de ejemplo de discovery. Son material de referencia/datos de trabajo, no un export n8n ni una prueba automatizada.
- No se observó una carpeta de demos ni de pruebas automatizadas en este proyecto.

## Decisiones pendientes

1. Confirmar los accesos y valores de configuración necesarios para una prueba controlada.
2. Resolver la discrepancia de cantidad de nodos entre `README.md` y `workflow.json`.
3. Confirmar si `workflow.json` es el export vigente antes de moverlo, renombrarlo o archivarlo.

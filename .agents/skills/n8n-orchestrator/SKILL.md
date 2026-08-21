---
name: n8n-orchestrator
description: "Trigger: automatizar, crear workflow, nuevo flujo, pipeline n8n, integrar API, orquestar. Convierte intenciones en workflows testeados en n8n."
license: Apache-2.0
metadata:
  author: santiagowuerich
  version: "1.0"
---

## Activation Contract

Activar cuando el usuario exprese una intención de automatización o pida crear/modificar workflows de n8n.
No activar para tareas que sean puramente de documentación estática o consultas de texto sin ejecución.

## Hard Rules

- **DEV First:** Todo diseño, modificación y prueba se realiza ÚNICAMENTE en la instancia DEV (`n8n.santiagowuerich.info`).
- **PROD Protegido:** NUNCA modificar ni publicar directamente en PROD (`n8n.xtract.app`) sin pasar por validación y gate de aprobación humana.
- **Sin Secretos:** Usar siempre los identificadores de credenciales de `docs/brain/credenciales.md`. Nunca hardcodear tokens.
- **Auto-verificación:** No entregar un workflow sin haber ejecutado al menos una prueba con datos mock y verificado el schema de salida.

## Decision Gates

| Escenario | Acción |
| :--- | :--- |
| Falta una credencial en n8n | Detenerse y consultar al usuario indicando servicio y entorno. |
| Error en ejecución de prueba (sintaxis/expresión) | Corregir automáticamente el nodo y re-testear (hasta 3 intentos). |
| Error de conexión o permisos externos | Notificar causa raíz al usuario con los logs exactos. |
| Workflow listo y validado en DEV | Generar reporte con diff y solicitar aprobación para pase a PROD. |

## Execution Steps

1. **Analizar intención:** Extraer trigger, servicios a conectar, transformaciones de datos y destino final.
2. **Consultar contexto:**
   - Leer `docs/brain/credenciales.md` para resolver IDs de nodos y credenciales.
   - Revisar `CLAUDE.md` para convenciones de nombres y código.
3. **Construir en DEV:**
   - Crear el workflow mediante la API/MCP de `n8n` (DEV).
   - Configurar nodos, conexiones y expresiones `{{ $json.campo }}`.
4. **Ejecutar Testing:**
   - Invocar la skill `n8n-testing` para generar payload mock y disparar ejecución.
   - Validar que el nodo final emita los datos esperados.
5. **Reportar resultado:**
   - Presentar resumen de nodos, prueba ejecutada y estado.
   - Si el destino es producción, preparar el pase con `n8n-deploy-prod`.

## Output Contract

- Resumen claro del workflow creado/modificado (ID en n8n DEV y nodos clave).
- Evidencia de la prueba ejecutada (payload de entrada y salida obtenida).
- Estado de las credenciales utilizadas.

## References

- [sistemas.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/sistemas.md)
- [credenciales.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/credenciales.md)
- [testing-protocol.md](file:///Users/santi/Downloads/n8n-automatizaciones/docs/brain/testing-protocol.md)

# Second Brain — Agente de Orquestación y Automatización

Este repositorio implementa un sistema personal de orquestación autónoma sobre instancias de n8n, APIs y servicios externos.

---

## Skills del Repositorio (`.agents/skills/`)

| Skill | Descripción | Triggers |
| :--- | :--- | :--- |
| [`n8n-architect`](.agents/skills/n8n-architect/SKILL.md) | Brainstorming, búsqueda de plantillas/patrones de n8n, diseño de topologías y crítica adversarial antes de construir. | `brainstorm`, `nueva idea`, `disenar workflow`, `arquitectura n8n`, `criticar diseno`, `nuevo proyecto` |
| [`n8n-orchestrator`](.agents/skills/n8n-orchestrator/SKILL.md) | Ciclo completo: Intención natural → Diseño → Construcción DEV → Mock Testing → Diff → Aprobación. | `automatizar`, `crear workflow`, `nuevo flujo`, `pipeline n8n`, `integrar API` |
| [`n8n-testing`](.agents/skills/n8n-testing/SKILL.md) | Inyección de mock data, inspección de ejecuciones en n8n y auto-corrección de nodos. | `testear workflow`, `probar n8n`, `verificar workflow`, `ejecutar webhook prueba` |
| [`n8n-deploy-prod`](.agents/skills/n8n-deploy-prod/SKILL.md) | Sanitización de credenciales, generación de diff, gate de aprobación y publicación a PROD. | `desplegar a produccion`, `pasar a prod`, `deploy n8n`, `publicar workflow` |

---

## Memoria Operativa (`docs/brain/`)

- [`catalogo-patrones.md`](docs/brain/catalogo-patrones.md): Catálogo de topologías estándar (event-driven, cron polling, fallback de IA).
- [`criterios-critica.md`](docs/brain/criterios-critica.md): Checklist de stress test, rate limits y evaluación adversarial.
- [`sistemas.md`](docs/brain/sistemas.md): Definición de instancias DEV (`santiagowuerich.info`) y PROD (`xtract.app`).
- [`credenciales.md`](docs/brain/credenciales.md): Catálogo de IDs y nombres de credenciales disponibles en cada entorno.
- [`testing-protocol.md`](docs/brain/testing-protocol.md): Reglas de testing, estructura de mocks y política de reintentos.
- [`n8n-reglas-construccion.md`](docs/brain/n8n-reglas-construccion.md): Reglas arquitectónicas de topología, sincronización (Merges), OAuth2 y referencias seguras.

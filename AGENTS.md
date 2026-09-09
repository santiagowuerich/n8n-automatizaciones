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

## Reglas Duras de Operación (Hard Rules)

🛑 **PROHIBIDO TOCAR PRODUCCIÓN SIN APROBACIÓN HUMANA EXPLÍCITA:**
Cualquier modificación, creación, actualización, borrado, activación o desactivación de workflows en entornos de **PRODUCCIÓN** (`n8n.xtract.app` o workflows propios protegidos en `n8n.santiagowuerich.info`):
1. **Requiere validación previa en DEV + Diff explícito.**
2. **El agente DEBE DETENERSE y pedir confirmación expresa al usuario antes de ejecutar cualquier mutación en PROD.**
3. **Jamás ejecutar un cambio en producción de forma autónoma o implícita.**

### Disciplina de Alcance y Ejecución
- **Sin refactors especulativos:** Modificar estrictamente lo necesario para resolver la tarea. No tocar ni reescribir lógica adyacente que ya funciona.
- **Entorno Limpio:** Archivos temporales o scripts de prueba van en `scratch/` o se eliminan tras validar.
- **Verificación Obligatoria:** Antes de dar por finalizada una tarea, verificar siempre con ejecuciones reales, logs y respuestas de API.

---

## Memoria Operativa (`docs/brain/`)

Empezá por el índice: [`README.md`](docs/brain/README.md) — define el orden de lectura y el ciclo de trabajo.

- [`sistemas.md`](docs/brain/sistemas.md): Instancias DEV (`santiagowuerich.info`) y PROD (`xtract.app`), **matriz de acceso MCP por host** y protocolo de transición.
- [`credenciales.md`](docs/brain/credenciales.md): Catálogo de IDs y nombres de credenciales por entorno, convención de exports y cómo re-verificar.
- [`catalogo-patrones.md`](docs/brain/catalogo-patrones.md): Catálogo de topologías estándar (event-driven, cron polling, fallback de IA, ledger, handoff a humano, verificación post-acción).
- [`n8n-reglas-construccion.md`](docs/brain/n8n-reglas-construccion.md): Reglas arquitectónicas de topología, sincronización (Merges), OAuth2, referencias seguras y organización de archivos.
- [`criterios-critica.md`](docs/brain/criterios-critica.md): Checklist de stress test, rate limits y evaluación adversarial.
- [`testing-protocol.md`](docs/brain/testing-protocol.md): Reglas de testing, mocks, política de reintentos y limpieza del entorno.
- [`lecciones.md`](docs/brain/lecciones.md): Comportamientos no obvios de n8n y el porqué de cada regla.

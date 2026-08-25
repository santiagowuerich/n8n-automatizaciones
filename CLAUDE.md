# Contexto del proyecto

Repositorio de automatizaciones en **n8n + Google Sheets / Slides / Docs / Slack**, con
integraciones a APIs externas. Conviven **dos líneas de trabajo**:

- **Cliente:** trabajo freelance para **Xtract** (contacto: Tomás). Las tarjetas llegan por
  **Trello** (board del equipo de Xtract). Vive en `clientes/xtract/`.
- **Propio:** automatizaciones mías, no facturables. Vive en `personal/`.

Instancias de n8n y su rol según de quién sea el proyecto:

| Instancia | Proyectos Xtract | Proyectos propios |
|---|---|---|
| `n8n.santiagowuerich.info` | DEV / staging | 🔴 **PRODUCCIÓN** |
| `n8n.xtract.app` | 🔴 **PRODUCCIÓN** | no aplica |

⚠️ **Verificar el acceso antes de escribir.** Los servidores MCP se configuran por host.
Hoy Antigravity (`n8n` + `n8n_prod`) y Claude Code (`n8n-mcp` + `n8n_prod`) llegan a los dos
entornos, pero eso se comprueba, no se asume:
[matriz de acceso](docs/brain/sistemas.md#3-matriz-de-acceso-por-host).

---

## Proyectos de cliente — Xtract

| # | Proyecto | Tarjetas Trello | Estado | Detalle |
|---|---|---|---|---|
| 01 | Mapeo de medios / *Potencial Entregable* | — | ✅ Entregado, en mantenimiento | [ver](clientes/xtract/proyectos/01-mapeo-medios/README.md) |
| 02 | Agente de minutas | **3** (Hunting · Integraciones · Engagement) | 🔵 Sin arrancar — falta definir alcance ⚠️ | [ver](clientes/xtract/proyectos/02-agente-minutas/README.md) |
| 03 | Análisis de churn (Grafana) | 1 | 🟡 Bloqueado — esperando token de Grafana | [ver](clientes/xtract/proyectos/03-churn-grafana/README.md) |
| 04 | Reactivación de Closed Lost | 1 | 🟢 **Corriendo en PROD** — WF2 y WF3 activos | [ver](clientes/xtract/proyectos/04-reactivacion-closed-lost/README.md) |
| 05 | Generador de slides y ROI (Discovery) | 1 | ✅ Activo en PROD (`bAh0FYSFTM0UeXSc`) | [ver](clientes/xtract/proyectos/05-generador-slides/README.md) |

> **5 tarjetas activas en Trello, 3 proyectos pendientes.** Las tres tarjetas de minutas son
> **un solo sistema parametrizado por área** — no tres workflows. Ver el README de 02.

> ⚠️ **02:** existe en PROD un workflow `Agente Minutas Hunting` (`m5tb2mdgtowxYMXA`) **activo
> pero vacío** — un único nodo Webhook sin conexiones. Cualquier POST que le llegue se descarta
> en silencio. Completarlo o desactivarlo.
>
> **04 (verificado 2026-08-24):** `HIYvqfItsrPk4CGc` (Recepción) y `KYqttVyQPTvG8xg6`
> (Seguimiento) están **activos en producción** con las 13 credenciales enlazadas y
> funcionando. `YMyp0HVPQygTa5Qn` (Envío por tanda) está inactivo, que es lo esperable: se
> dispara a demanda. El estado anterior ("falta credenciales") estaba viejo.

---

## Proyectos propios

Automatizaciones **mías, no de cliente**. Corren en `n8n.santiagowuerich.info`, que para ellas
**es producción** — no un entorno de pruebas. Índice completo en
[`personal/README.md`](personal/README.md).

| # | Proyecto | Estado | Detalle |
|---|---|---|---|
| 01 | Marketplace Auto-Reply (Facebook + IA) | 🟢 Activo en producción | [ver](personal/proyectos/01-marketplace-autoreply/README.md) |
| 02 | Prospector B2B (Apify → WhatsApp) | 🟢 Activo en producción | [ver](personal/proyectos/02-prospector-b2b/README.md) |
| 03 | Doc Reader Bot (Telegram → R2 CDN) | 🟢 Activo | [ver](personal/proyectos/03-doc-reader-bot/README.md) |

> 🔴 **La misma instancia cumple dos roles.** `n8n.santiagowuerich.info` es el staging de Xtract
> **y** el servidor productivo de estos proyectos. Nunca desactivar, borrar ni re-disparar un
> workflow propio como parte de un trabajo de Xtract — su caída es una caída real. Lista de
> workflows protegidos en
> [`sistemas.md`](docs/brain/sistemas.md#workflows-propios-en-producción-no-tocar-sin-intención-explícita).

---

## Cómo trabaja el agente

- **Memoria operativa:** [`docs/brain/README.md`](docs/brain/README.md) — índice y orden de lectura. Es normativo.
- **Skills del repo:** [`AGENTS.md`](AGENTS.md) — `n8n-architect`, `n8n-orchestrator`, `n8n-testing`, `n8n-deploy-prod`. Viven en [`.agents/skills/`](.agents/skills/) y Claude Code las ve a través del symlink `.claude/skills`.
- **Antes de tocar n8n:** [`sistemas.md`](docs/brain/sistemas.md) → [`credenciales.md`](docs/brain/credenciales.md).
- **Antes de construir:** [`catalogo-patrones.md`](docs/brain/catalogo-patrones.md) → [`criterios-critica.md`](docs/brain/criterios-critica.md).

---

## Convenciones del repo

- Un `workflow.json` versionado es siempre el export de **la instancia donde ese proyecto es producción**: `n8n.xtract.app` para los de cliente, `n8n.santiagowuerich.info` para los propios. En los de Xtract eso implica que traen IDs de credenciales productivos y hay que remapearlos para probarlos en DEV ([`credenciales.md §3`](docs/brain/credenciales.md#3-convención-de-exports-en-el-repositorio)).
- Cada proyecto contiene su propio `workflow.json` sanitizado (sin claves ni tokens privados).
- Las claves de API **nunca** van hardcodeadas en un JSON de entrega — se reemplazan por placeholders `REEMPLAZAR_*` o se gestionan a través del catálogo de credenciales en [`docs/brain/credenciales.md`](docs/brain/credenciales.md).
- Toda decisión técnica no obvia se anota en el `decisiones.md` (o `MANIFESTO.md`) del proyecto, con el **motivo**, no solo el qué.
- Antes de mover o archivar cualquier archivo, actualizar primero el manifiesto del proyecto.

## Convenciones de código

- Los nodos Code de n8n van en **español** (nombres de nodos, comentarios), para que el cliente pueda leerlos.
- Normalización de nombres para deduplicar: NFD, sin acentos, minúsculas, espacios colapsados.

---

## Comercial y Operaciones

- Memoria Operativa & Arquitectura: [`docs/brain/`](docs/brain/)
- Tarifa y cotizaciones: [`docs/operacion/tarifas.md`](docs/operacion/tarifas.md)
- Ficha del cliente Xtract: [`docs/clientes/xtract.md`](docs/clientes/xtract.md)
- Base de Conocimiento de Producto: [`clientes/xtract/base-conocimiento.md`](clientes/xtract/base-conocimiento.md)

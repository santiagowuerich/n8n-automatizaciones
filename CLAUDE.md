# Contexto del proyecto

Trabajo freelance para **Xtract** (contacto: Tomás). Automatizaciones en **n8n +
Google Sheets / Slides / Docs / Slack**, con integraciones a APIs externas.

Instancias de n8n:
- **DEV:** `https://n8n.santiagowuerich.info`
- **PROD:** `https://n8n.xtract.app`

Las tarjetas de trabajo llegan por **Trello** (board del equipo de Xtract).

---

## Proyectos

| # | Proyecto | Tarjetas Trello | Estado | Detalle |
|---|---|---|---|---|
| 01 | Mapeo de medios / *Potencial Entregable* | — | ✅ Entregado, en mantenimiento | [ver](clientes/xtract/proyectos/01-mapeo-medios/README.md) |
| 02 | Agente de minutas | **3** (Hunting · Integraciones · Engagement) | 🔵 Sin arrancar — falta definir alcance | [ver](clientes/xtract/proyectos/02-agente-minutas/README.md) |
| 03 | Análisis de churn (Grafana) | 1 | 🟡 Bloqueado — esperando token de Grafana | [ver](clientes/xtract/proyectos/03-churn-grafana/README.md) |
| 04 | Reactivación de Closed Lost | 1 | 🟢 Piloto WA construido (Notion→Chatwoot) — falta credenciales | [ver](clientes/xtract/proyectos/04-reactivacion-closed-lost/README.md) |
| 05 | Generador de slides y ROI (Discovery) | 1 | ✅ Activo en PROD (`bAh0FYSFTM0UeXSc`) | [ver](clientes/xtract/proyectos/05-generador-slides/README.md) |

> **5 tarjetas activas en Trello, 3 proyectos pendientes.** Las tres tarjetas de minutas son
> **un solo sistema parametrizado por área** — no tres workflows. Ver el README de 02.

---

## Convenciones del repo

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

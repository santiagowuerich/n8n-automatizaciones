# Contexto del proyecto

Trabajo freelance para **Xtract** (contacto: Tomás). Automatizaciones en **n8n +
Google Sheets**, con integraciones a APIs externas.

Instancia de n8n: `http://localhost:5678`
Las tarjetas de trabajo llegan por **Trello** (board del equipo de Xtract).

---

## Proyectos

| # | Proyecto | Tarjetas Trello | Estado | Detalle |
|---|---|---|---|---|
| 01 | Mapeo de medios / *Potencial Entregable* | — | ✅ Entregado, en mantenimiento | [ver](clientes/xtract/proyectos/01-mapeo-medios/README.md) |
| 02 | Agente de minutas | **3** (Hunting · Integraciones · Engagement) | 🔵 Sin arrancar — falta definir alcance | [ver](clientes/xtract/proyectos/02-agente-minutas/README.md) |
| 03 | Análisis de churn (Grafana) | 1 | 🟡 Bloqueado — esperando token de Grafana | [ver](clientes/xtract/proyectos/03-churn-grafana/README.md) |
| 04 | Reactivación de Closed Lost | 1 | 🟢 Piloto WA construido (Notion→Chatwoot) — falta credenciales | [ver](clientes/xtract/proyectos/04-reactivacion-closed-lost/README.md) |

> **5 tarjetas activas en Trello, 3 proyectos.** Las tres tarjetas de minutas son
> **un solo sistema parametrizado por área** — no tres workflows. Ver el README de 02.

---

## Convenciones del repo

- Los workflows de n8n se exportan a `workflows/` **sin credenciales**.
- Las claves de API **nunca** van hardcodeadas en un JSON de entrega — se
  reemplazan por placeholders `REEMPLAZAR_*` y se verifica con un barrido antes
  de mandar nada.
- Toda decisión técnica no obvia se anota en el `decisiones.md` del proyecto,
  con el **motivo**, no solo el qué.
- Los paquetes de entrega al cliente van a `entrega-cliente/`.

## Convenciones de código

- Los nodos Code de n8n van en **español** (nombres de nodos, comentarios),
  para que el cliente pueda leerlos.
- Normalización de nombres para deduplicar: NFD, sin acentos, minúsculas,
  espacios colapsados. Está repetida en varios nodos como `normKey()`.

---

## Comercial

Tarifa y cotizaciones: [`docs/operacion/tarifas.md`](docs/operacion/tarifas.md)
Ficha del cliente: [`docs/clientes/xtract.md`](docs/clientes/xtract.md)

**Regla vigente:** los proyectos se cotizan **cerrados por alcance**, no por hora.
Ver el archivo de tarifas para el porqué.

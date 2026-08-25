# 01 · Marketplace Auto-Reply

Respuesta automática a compradores de Facebook Marketplace, con IA.

- **Estado:** 🟢 Activo en producción desde 2026-08-11.
- **Instancia:** `n8n.santiagowuerich.info` (producción para este proyecto).
- **Workflow:** `Marketplace Auto-Reply — Cerebro (Webhook + IA)` — `o1hQpxHMFMbj3Nnw`.

---

## Arquitectura

El sistema está partido en dos mitades por una razón concreta: **n8n no puede abrir sesión en
Facebook**.

```text
[Extensión de navegador]  ──webhook──▶  [Cerebro en n8n]  ──respuesta──▶  [Extensión]
 (dispositivo con sesión                (Dokploy, server-side)                │
  de Facebook abierta)                                                       ▼
                                                                    [Alertas Telegram]
```

- **Extensión de navegador:** corre en un dispositivo con la sesión de Facebook abierta. Es la
  única parte que toca Marketplace.
- **Cerebro (este workflow):** recibe el mensaje del comprador, genera la respuesta con IA
  (Groq) y la devuelve. No toca Facebook nunca.

## Superficie del workflow

7 triggers de webhook, cada uno con su propósito:

| Webhook | Para qué |
| :--- | :--- |
| `Mensaje Marketplace` | Entrada principal: mensaje del comprador → respuesta generada. |
| `Alerta de la Extensión` | La extensión reporta un problema propio (sesión caída, DOM cambiado). |
| `Resumen Diario` | Dispara el resumen de actividad a Telegram. |
| `Pendientes` | Conversaciones sin responder de una cuenta. |
| `Leads Recientes` | Consulta de leads capturados. |

Ruta principal: `Normalizar Payload` → `¿Es el primer mensaje?` → apertura / seguimiento /
mensaje web → `IA: Armar Respuesta` (Groq) → `Variar Estilo` → `Filtrar Precios` →
`Formatear Respuesta` → `Responder al Webhook`.

## Lo que lo hace un sistema productivo, no un experimento

- **Captura de leads:** `Detectar Número` / `¿Compartió el número?` → aviso por Telegram y
  confirmación al comprador.
- **Escalamiento a humano:** `¿Necesita un humano?` → `Avisar Derivación por Telegram`
  (ver [patrón 8](../../../docs/brain/catalogo-patrones.md)).
- **Monitoreo propio (heartbeat):** `Registrar Latido` + cron `Cada Hora` → `¿Alguna Cuenta Muda?`
  → `Avisar Bot Caído` → `Marcar Como Avisada`. El sistema se vigila solo y avisa si una cuenta
  deja de reportar.
- **Estado persistido:** `Leer Estado` / `Guardar Estado`
  (ver [patrón 5](../../../docs/brain/catalogo-patrones.md)).
- **Anti-repetición:** `Variar Estilo` evita que todos los compradores reciban el mismo texto.

## Reglas de intervención

1. Es un sistema **con tráfico real**. Cualquier cambio se prueba con payload mock antes de
   guardar, y se verifica el heartbeat después.
2. El `Filtrar Precios` existe por una razón comercial: no dejar que la IA negocie sola.
   No relajarlo sin decisión explícita.
3. Si se desactiva el workflow, la extensión queda hablando sola: los compradores dejan de
   recibir respuesta sin ningún error visible del lado del navegador.

## Pendiente de documentar

- [ ] Versionar el `workflow.json` en este directorio.
- [ ] Repo / ubicación del código de la extensión de navegador.
- [ ] Formato exacto del payload que envía la extensión.
- [ ] Dónde vive el estado (`Leer Estado` / `Guardar Estado`) y su esquema.

# Cliente — Xtract

Automatización de contabilidad y facturas con IA para empresas LATAM.
Sitio: `xtract.app`

## Contactos

| Persona | Rol observado |
|---|---|
| **Tomás** | Contacto principal. Asigna y prioriza tarjetas en Trello. |
| **Ian Brandan** | Crea tarjetas en *Ideas*. Perfil técnico / producto. |

## Cómo llega el trabajo

Por **Trello** — board del equipo. Las tarjetas nacen en `Ideas` y cuando pasan a
`To do` con un miembro asignado, es trabajo confirmado.

> **Cada tarjeta es un proyecto distinto.** Se cotiza aparte, aunque venga del
> mismo cliente y del mismo board.

## Infraestructura del cliente

| Sistema | Estado |
|---|---|
| n8n | Instancia propia. Los workflows se entregan como JSON importable. |
| Google Sheets | Service Account `n8n-sheets-connector@n8n-automatizaciones-502518.iam.gserviceaccount.com` |
| Grafana | Existe, conectado a la base de facturación. **Falta acceso.** |
| CRM | 4.057 opps en Closed Lost. **Falta saber cuál es.** |
| Chatwoot | Mencionado en tarjetas. Estado sin confirmar. |
| Instantly | Aparece en una tarjeta del board — confirmar si está contratado. |
| Slack | Canal de comunicación del equipo y destino de varias alertas. |

## Relación comercial

- Modalidad: freelance, por proyecto.
- Ver [`../operacion/tarifas.md`](../operacion/tarifas.md) para el historial de
  cotizaciones y la regla de precios vigente.
- Hay disponibilidad para tomar más trabajo — planteado sin presión.

## Notas

- El primer proyecto (mapeo de medios) se cobró **muy por debajo** de lo que valía.
  El ajuste se hace desde el próximo proyecto y desde la conversación de
  mantenimiento, no re-negociando el anterior.
- Al 29/07/2026 hay **tres tarjetas asignadas sin cotizar**: agente de minutas,
  churn Grafana y reactivación de Closed Lost.

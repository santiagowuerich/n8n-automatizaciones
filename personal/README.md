# Proyectos Propios

Automatizaciones propias, **no facturables a ningún cliente**. Viven y corren en
`https://n8n.santiagowuerich.info`, que para estos proyectos **es producción**, no un entorno
de pruebas (ver [`sistemas.md`](../docs/brain/sistemas.md#propiedad-de-los-proyectos-y-rol-de-cada-instancia)).

## Diferencias con `clientes/`

| | Proyectos propios (`personal/`) | Proyectos de cliente (`clientes/xtract/`) |
| :--- | :--- | :--- |
| Instancia productiva | `n8n.santiagowuerich.info` | `n8n.xtract.app` |
| Pase DEV → PROD | ❌ no aplica: se construye donde vive | ✅ obligatorio, con gate humano |
| Skill `n8n-deploy-prod` | ❌ no aplica | ✅ aplica |
| Credenciales | tabla DEV de [`credenciales.md`](../docs/brain/credenciales.md) | tabla PROD |
| `workflow.json` versionado | export de la instancia Santiago | export de PROD Xtract |
| Entregables al cliente | no hay | README, decisiones, workflow sanitizado |

**Consecuencia práctica:** al no haber staging, un cambio en un proyecto propio se prueba con
el mismo rigor que un pase a producción de cliente. No hay red abajo.

---

## Índice

| # | Proyecto | Workflows en n8n | Estado |
| :--- | :--- | :--- | :--- |
| 01 | [Marketplace Auto-Reply](proyectos/01-marketplace-autoreply/README.md) | `o1hQpxHMFMbj3Nnw` | 🟢 Activo en producción |
| 02 | [Prospector B2B](proyectos/02-prospector-b2b/README.md) | `P4wJyMXre5zrUqMx`, `Q4Xsr3JepmCu02p8` (+2 utilitarios) | 🟢 Activo en producción |
| 03 | [Doc Reader Bot](proyectos/03-doc-reader-bot/README.md) | `d3DXwvdeeK8eB7zN` | 🟢 Activo |

## Convenciones

Las mismas que el resto del repo ([`CLAUDE.md`](../CLAUDE.md)): nodos y comentarios en español,
nada de secretos en los JSON versionados, y toda decisión no obvia anotada con su **motivo**.

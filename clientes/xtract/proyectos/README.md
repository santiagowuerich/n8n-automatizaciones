# Índice de proyectos de Xtract

Estructura canónica de los proyectos de automatización para Xtract. Cada carpeta contiene su `README.md`, `MANIFESTO.md` (o `decisiones.md`), y el `workflow.json` sanitizado.

| Proyecto | Estado observado | Documentación |
|---|---|---|
| [01 — Mapeo de medios](01-mapeo-medios/README.md) | Completado; en mantenimiento. | [README](01-mapeo-medios/README.md) · [Manifiesto](01-mapeo-medios/MANIFESTO.md) |
| [02 — Agente de minutas](02-agente-minutas/README.md) | Workflow construido; bloqueado por accesos y configuración. | [README](02-agente-minutas/README.md) · [Manifiesto](02-agente-minutas/MANIFESTO.md) |
| [03 — Churn Grafana](03-churn-grafana/README.md) | Bloqueado a la espera de un token de servicio de Grafana. | [README](03-churn-grafana/README.md) · [Manifiesto](03-churn-grafana/MANIFESTO.md) |
| [04 — Reactivación Closed Lost](04-reactivacion-closed-lost/README.md) | Piloto construido; faltan credenciales y plantilla. | [README](04-reactivacion-closed-lost/README.md) · [Manifiesto](04-reactivacion-closed-lost/MANIFESTO.md) |
| [05 — Generador de Slides y ROI](05-generador-slides/README.md) | ✅ Activo y verificado en PROD (`bAh0FYSFTM0UeXSc`). | [README](05-generador-slides/README.md) · [Decisiones](05-generador-slides/decisiones.md) |

---

## Estructura estándar de cada proyecto

```
clientes/xtract/proyectos/XX-nombre-proyecto/
├── README.md           # Resumen ejecutivo, inputs, outputs y lógica del negocio
├── MANIFESTO.md / decisiones.md # Registro de decisiones técnicas y arquitectura
├── workflow.json       # Export canónico del workflow sanitizado (sin credenciales)
└── mock_data/          # Payloads de prueba y testing
```

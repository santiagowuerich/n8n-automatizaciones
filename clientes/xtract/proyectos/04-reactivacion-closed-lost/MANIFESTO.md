# Manifiesto — 04 Reactivación Closed Lost

## Propósito

Pilotear la reactivación por WhatsApp de oportunidades Closed Lost con un workflow de envío y otro de recepción, usando Chatwoot y una planilla de control.

## Estado en Producción (`n8n.xtract.app`)

| Workflow | ID en PROD | Estado | Nodos | Rol |
|---|---|---|---|---|
| **Closed Lost WhatsApp — 1. Envío vía Chatwoot** | `YMyp0HVPQygTa5Qn` | Inactivo (`false`) | 28 nodos | Despacho masivo controlado a leads de Closed Lost vía API de Chatwoot. |
| **Closed Lost WhatsApp — 2. Recepción vía Chatwoot** | `HIYvqfItsrPk4CGc` | Activo (`true`) | 37 nodos | Webhook de recepción de mensajes entrantes de Chatwoot, procesamiento con IA y seguimiento. |
| **Xtract Demo — Simulador WhatsApp (Agente IA n8n)** | `q15OfWTln72jtdnf` | Activo (`true`) | 13 nodos | Simulador interactivo web de conversación WhatsApp con IA para demostraciones comerciales. |

---

## Archivos y Recursos del Proyecto

```
clientes/xtract/proyectos/04-reactivacion-closed-lost/
├── README.md           # Especificación completa del piloto comercial y flujo
├── MANIFESTO.md        # Estado observado y mapeo con IDs de Producción
├── CONFIGURACION.md    # Guía de variables y parámetros de Chatwoot
├── plantilla-meta.md   # Plantilla HSM aprobada para Meta / WhatsApp
├── investigacion.md    # Relevamiento de 4.000+ oportunidades Closed Lost
├── workflows/          # JSONs canónicos sincronizados desde PROD (sanitizados)
│   ├── Closed Lost WhatsApp — 1. Envío vía Chatwoot.json
│   └── Closed Lost WhatsApp — 2. Recepción vía Chatwoot.json
├── demos/              # Simulador HTML y workflow del agente de demostración
│   ├── Xtract Demo — Simulador WhatsApp (Agente IA n8n).json
│   └── demo_simulador_whatsapp.html
├── pruebas/            # Scripts JS de validación de lógica de nodos
└── datos/              # Planillas del piloto y base de conocimiento
```

# Xtract — 06 Resumen Discovery Call a Slack (Borrador de Email)

Workflow independiente diseñado para procesar llamadas de Discovery desde Google Drive / Notion, extraer con IA los puntos clave del negocio y generar un borrador de correo ejecutivo listo para copiar y enviar en Gmail o Outlook, entregado en el Slack del comercial responsable.

---

## 1. Ficha Técnica

| Parámetro | Valor |
| :--- | :--- |
| **ID del Workflow (PROD)** | `xP2LYks5hHkcmgN5` |
| **Nombre en n8n** | `Xtract - 06 Resumen Discovery Call a Slack (Borrador de Email)` |
| **Webhook Endpoint** | `POST https://n8n.xtract.app/webhook/discovery-email-slack` |
| **Modelo de IA** | DeepSeek Chat (`deepseek-chat` vía `deepSeekApi` / `H5fC2aZoNphCCole`) |
| **Latencia promedio** | ~6.5 segundos de punta a punta |
| **Destino de Notificación** | Canal de DM privado del Comercial responsable en Slack oficial de Xtract (con fallback a Santiago `D0BRPUE84UA`) |
| **Token de Envío Slack** | Credencial oficial `Xtract notifications` (`y1DaRieOF29GQnxm` / Workspace `T019FLW78AJ`) |

---

## 2. Diagrama de Topología

```
[Webhook: Link a discovery cargado]
              │
              ├──────────────────────────────────┐
              ▼                                  ▼
    [Code - Extraer Datos]             [Slack - Traer usuarios] (112 miembros)
              │
              ├──────────────────────────────────┐
              ▼                                  ▼
            [JWT]                         [Preparar transcripcion]
              │                                  │
              ▼                                  │
    [HTTP - Generar Access Token]                │
              │                                  │
              ▼                                  │
    [Drive - export texto (Doc)]                 │
              │                                  │
              └────────────────► [Merge] ◄───────┘
                                   │
                                   ▼
                      [IA - Redactar borrador] (DeepSeek)
                                   │
                                   ▼
                       [Armar mensaje de Slack] (Matching Comercial + Recursos + Casos de Éxito)
                                   │
                                   ▼
                  [Slack - Enviar borrador al Comercial] (DM oficial)
```

---

## 3. Estructura del Borrador Generado

El modelo sigue estrictamente el formato comercial enriquecido con recursos de Apiary y testimonios de YouTube:

1. **Cabecera `*Para:*`** Detección automática de emails en Notion y en la transcripción.
2. **`*Subject:*`** `Resumen de nuestra reunión + Próximos pasos — Xtract`.
3. **Saludo e Intro:** Saludo cercano y agradecimiento ejecutivo por el tiempo.
4. **`Diagnóstico en Bullets`:** Diagnóstico estructurado con datos duros reales (volumen mensual de facturas, estacionalidad, ERP actual, canales de recepción, validación contra OC/remito, rendiciones de gastos, aprobadores, retenciones y carga manual).
5. **`Solución y Encaje`:** Párrafo continuo detallando conexión API/nativa con su ERP, ingesta por repositorio único, lectura inteligente, reglas contables y plazos de implementación (30 a 60 días).
6. **`Documentación API (Condicional)`:** Si se habló de integraciones técnicas, incluye el link a la **[Documentación de la API Rest de Xtract](https://xtractapi.docs.apiary.io/#)**.
7. **`Próximos pasos`:** Coordinación de videollamada / demo de 30 min + propuesta comercial adaptada.
8. **`Casos de Éxito`:**
   * `• <https://www.youtube.com/watch?v=k2uYl5kSGBQ|MODO x Xtract: la experiencia real de un equipo contable en Fintech>`
   * `• <https://www.youtube.com/watch?v=k2uYl5kSGBQ|Pomelo + Xtract: Contabilización Automática de Facturas en SAP con IA>`
9. **Despedida y Firma:** Despedida ejecutiva y firma con el nombre del comercial responsable.

---

## 4. Historial de Pruebas y Validaciones en Producción

* **Ejecución 547114 (Rotunda):** Verificación de conexión directa a bot personal `Xtract n8n`.
* **Ejecución 547157 (Formato exacto):** Adopción de la estructura de `ejemplo.md`.
* **Ejecución 547352 (Naturaceites):** Extracción de correo `miguel.crispin@naturaceites.com`.
* **Ejecución 547356 (Tecnoedil):** Extracción de correo `marcio.lima@tecnoedil.com.py` y detección de SAP 4 Hana.
* **Ejecución 547363 (Procter & Gamble):** Extracción de correo `tomas.gonzalez@pg.com` y parametrización a 3 niveles.
* **Ejecución 557273 (Comercializadora Andina - Intec):** Validación exitosa con entrega directa al Slack de Nicolás González (`U02MCAHHM1T`), inclusión de link de Apiary y bloque de casos de éxito de YouTube.

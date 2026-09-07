# Xtract — 07 Agente de Contacto Automático a KDM (Instantly Referral)

Procesa las respuestas de campañas de cold email en **Instantly**, detecta derivaciones
escritas en texto libre (*lead referrals*), extrae al **KDM** (*Key Decision Maker*) y
activa el contacto citando la referencia.

> **Estado:** 🔵 Diseño — no construido.
> 🛑 **Bloqueado:** falta confirmar el plan de Instantly de Xtract (ver [§5](#5-accesos-credenciales-y-bloqueantes)).
> Si no hay webhooks disponibles, este diseño no aplica y hay que rehacerlo con polling.

---

## 1. Contexto y problema de negocio

En las secuencias de prospección outbound en frío:

1. Un prospecto recibe un email de Xtract y responde:
   > *"Hola, yo no manejo la parte de facturación y pagos. Escribile a Carlos Gómez, que es
   > el Gerente de Administración: `cgomez@empresa.com`"*
2. **El cuello de botella:** el prospecto pasa el correo en el cuerpo del mensaje pero
   **NO pone al KDM en copia (CC)**.
3. **Pérdida de oportunidad:** si un comercial no lee la respuesta en el día, la referencia
   se enfría.

---

## 2. Por qué hace falta n8n y no alcanza con configurar Instantly

Verificado contra la documentación oficial el **2026-08-26**. Esta sección existe para no
volver a discutirlo: la pregunta "¿no lo hace Instantly solo?" es razonable y la respuesta
es no, por un motivo puntual.

**Instantly clasifica respuestas. No extrae entidades de un texto libre.**

| Capacidad | ¿Nativa en Instantly? | Detalle |
| :--- | :---: | :--- |
| Categorizar la respuesta (`Wrong Person`, `Interested`, …) | ✅ | Unibox AI. Emite el evento `lead_wrong_person`. |
| Webhook con el cuerpo completo de la respuesta | ✅ | Evento `reply_received`, campo `reply_text`. |
| Crear un lead vía API y asignarlo a una campaña | ✅ | API v2. |
| **Leer el cuerpo y extraer nombre + email + cargo de un tercero** | ❌ | Ninguna feature nativa lo hace. |
| **Dar de alta a una persona que no existe en el sistema** | ❌ | — |

Las dos features que podrían tapar ese hueco, y por qué no lo hacen:

- **AI Copilot** → tareas recurrentes (crear campañas, resúmenes semanales, avisos a Slack).
  No extrae contactos de replies.
- **AI Reply Agent** → responde **dentro del hilo**, sobre **leads que ya existen**. Crear
  leads nuevos está explícitamente fuera de su alcance documentado.

**Conclusión:** el hueco es *extracción de entidad desde texto libre* + *alta de un contacto
nuevo*. Eso es el workflow de n8n. Todo lo demás lo pone Instantly.

---

## 3. Arquitectura y flujo

```
              [Webhook Instantly: reply_received]
                              │
                              │  El payload YA trae reply_text.
                              │  No hace falta ir a buscar el mensaje por API.
                              ▼
              [Pre-filtro barato: ¿hay un @ en el cuerpo
               que no sea el del remitente?]
                              │
               ┌──────────────┴──────────────┐
               │ No                          │ Sí
               ▼                             ▼
        [Fin / Ignorar]        [IA: clasificar y extraer]
                                             │
                              ┌──────────────┴──────────────┐
                              │ No es referral              │ Es referral
                              ▼                             ▼
                       [Fin / Ignorar]        Datos extraídos:
                                              - Nombre KDM
                                              - Email KDM
                                              - Rol / cargo
                                              - Quién refirió
                                              - Empresa y contexto
                                                            │
                                                            ▼
                                    🔴 [Verificar email — Instantly API]
                                                            │
                                              ┌─────────────┴─────────────┐
                                              │ Inválido / riesgoso       │ Válido
                                              ▼                           ▼
                                   [Slack: aviso, sin        🔴 [¿Ya existe el lead?
                                    enviar nada]                 ¿Dominio bloqueado?]
                                                                          │
                                                            ┌─────────────┴─────────────┐
                                                            │ Ya existe / bloqueado     │ Nuevo
                                                            ▼                           ▼
                                                  [Slack: aviso,         🟠 [Gate: modo de envío]
                                                   sin duplicar]                        │
                                              ┌─────────────────────────────────────────┤
                                              │ HITL (recomendado)          Autopilot   │
                                              ▼                                         ▼
                              [Slack: botón Aprobar/Descartar]      [Instantly API: crear lead
                                              │                      en campaña Warm Referral]
                                              └──────── aprobado ──────────────┘
                                                                          │
                                                                          ▼
                                                        [Instantly envía el email al KDM]
                                                                          │
                                                                          ▼
                                                          [Slack: confirmación + unibox_url]
```

Los tres pasos marcados en 🔴 son los que faltaban en la primera versión de este documento.
No son adornos: ver [§6](#6-candados-obligatorios).

---

## 4. El payload que llega — `reply_received`

Esto es lo que hace viable el diseño sin llamadas extra a la API.

| Campo | Uso en este flujo |
| :--- | :--- |
| `reply_text` | **El insumo principal.** Texto plano completo de la respuesta. |
| `reply_html` | Respaldo si el texto plano viene degradado. |
| `reply_text_snippet` | Preview corto — útil para la notificación de Slack. |
| `reply_subject` | Contexto del hilo. |
| `lead_email` | **Quién refirió.** Va en el asunto del email al KDM. |
| `campaign_id` / `campaign_name` | Campaña de origen, para trazar de dónde salió. |
| `unibox_url` | Link directo al hilo en Unibox. Va en el aviso de Slack. |
| `email_account` | Casilla que envió el original. |
| `timestamp`, `event_type`, `workspace` | Trazabilidad. |

**Ojo con el evento.** `reply_received` dispara solo con respuestas humanas de leads. Los
out-of-office llegan por un evento **separado**, `auto_reply_received`. Si te suscribís solo
a `reply_received`, no hace falta ningún filtro de "es respuesta entrante".

### Por qué el trigger es `reply_received` y no `lead_wrong_person`

Existe `lead_wrong_person`, que dispara cuando el Unibox AI ya clasificó la respuesta. Usarlo
ahorraría pasarle todas las respuestas al LLM.

Se descarta igual: **hay referrals que no son "wrong person"**. Por ejemplo
*"yo lo veo, pero sumá a Carlos que es el que aprueba"* — el prospecto sigue siendo válido y
además refiere. Ese caso no dispara `lead_wrong_person` y se perdería.

La solución es `reply_received` + el pre-filtro por regex del diagrama: si el cuerpo no tiene
ningún `@` distinto al del remitente, no hay nada que extraer y no se gasta una llamada al
modelo. Cobertura completa a costo casi cero.

---

## 5. Accesos, credenciales y bloqueantes

| Recurso | Tipo | Finalidad |
| :--- | :--- | :--- |
| **Instantly API Key** | Bearer token, API v2 | Verificar emails, consultar leads existentes, crear leads. |
| **Instantly Webhook** | Config en panel | Evento `reply_received` apuntando al endpoint de n8n. |
| **Campaña Warm Referral** | Config funcional | Campaña/secuencia y casillas desde donde salen las intros. |
| **Slack Channel ID** | Notificación | Canal de avisos + botones de aprobación (si va HITL). |

### 🛑 Bloqueante a confirmar antes de cotizar

- **API v2** requiere plan **Growth o superior**.
- **Webhooks:** fuentes en conflicto. Un análisis de terceros indica **Hypergrowth (~USD 97/mes)
  o superior**; la documentación oficial no menciona requisito de plan. **No está cerrado.**

**Acción:** confirmar con Tomás qué plan tiene Xtract **antes de comprometer alcance**. Si el
plan no incluye webhooks, todo este diseño se cae y hay que rehacerlo con polling — que es
otro proyecto, con otro costo.

---

## 6. Candados obligatorios

Estos tres no son "nice to have". Sin ellos el sistema hace daño real y en silencio.

### 6.1 🔴 Verificación del email extraído — antes de crear el lead

El modelo puede alucinar un email, o el prospecto puede escribirlo mal (`cgomez@empresa` sin
el `.com`, un typo, un dominio viejo). Ese email se envía **desde una casilla calentada**.

El resultado es un **bounce**, y el bounce rate es lo único que mata la deliverability en cold
email. Se estaría arriesgando la infraestructura de envío completa de Xtract por ahorrar un paso.

**Regla:** el endpoint de *email verification* de la API v2 corre **siempre**, antes de dar de
alta nada. Si el email no verifica, no se envía: se avisa por Slack y decide una persona.

### 6.2 🔴 Anti-duplicado y block list

Tres escenarios que rompen el flujo ingenuo:

- Dos prospectos de la misma empresa refieren al mismo Carlos → **dos intros al mismo tipo**.
- Carlos **ya está** en otra campaña activa de Xtract → se le pisa la secuencia.
- El dominio está en la **block list global** de Instantly (alguien marcó *not interested*) →
  se lo re-contacta después de que pidieron que no.

**Regla:** consultar si el email ya existe en el workspace antes de crear el lead. Un `GET` de
más evita un incidente con el cliente.

### 6.3 🟠 Gate humano al principio

Un falso positivo acá **no es un error silencioso**: es un email frío a una persona real
diciendo *"Pedro me recomendó escribirte"* cuando Pedro nunca dijo eso. Quema la relación con
el prospecto original y con el KDM al mismo tiempo, y nadie se entera.

**Regla:** HITL (botón Aprobar / Descartar en Slack) las primeras 3–4 semanas. Con ~30 casos
revisados y extracción estable, se evalúa pasar a Autopilot. El modo vive en un solo nodo de
config, para que el cambio sea tocar una variable.

---

## 7. Especificación del email al KDM (*warm intro*)

- **Asunto:** `Intro de parte de [Persona que refirió] - [Empresa]`
- **Cuerpo sugerido:**

  > *Hola [Nombre KDM],*
  >
  > *Te escribo porque conversamos con [Persona que refirió] y me sugirió ponerme en contacto
  > contigo para este tema.*
  >
  > *En Xtract automatizamos la contabilización y conciliación de facturas para empresas que
  > usan [ERP / Sistema], eliminando la carga manual línea por línea con 99% de precisión
  > determinística.*
  >
  > *¿Te parece que coordinemos una breve llamada de 15 minutos esta semana para mostrarte
  > cómo funciona?*
  >
  > *Saludos,*
  > *[Comercial Xtract]*

**Pendiente de definir:** el `[ERP / Sistema]` no siempre se conoce en el momento de la
derivación. Hay que decidir si se omite la frase cuando falta el dato, o si se usa una
redacción genérica. Nunca inventarlo.

---

## 8. Decisiones pendientes

| # | Decisión | Recomendación | Estado |
| :--- | :--- | :--- | :---: |
| 1 | ¿Autopilot o HITL? | **HITL primero.** Ver [§6.3](#63--gate-humano-al-principio). | ⬜ |
| 2 | ¿Email nuevo o responder el hilo con el KDM en CC? | **Email nuevo** citando la intro. Meter a un tercero en un hilo de cold email sin su consentimiento es peor práctica y ensucia la métrica del hilo original. | ⬜ |
| 3 | ¿Se crea la oportunidad en Notion / CRM? | Definir con Tomás. Si va, engancha después de la confirmación de envío. | ⬜ |
| 4 | ¿Qué pasa con el prospecto que refirió? | Definir: ¿se lo marca como *wrong person* y se lo saca de la secuencia, o sigue? Depende del caso 6.2. | ⬜ |
| 5 | Redacción cuando falta el ERP | Ver [§7](#7-especificación-del-email-al-kdm-warm-intro). | ⬜ |

---

## 9. Fuentes

Verificado el 2026-08-26:

- [Webhook Events — Instantly API Docs](https://developer.instantly.ai/webhook-events)
- [Instantly API & Webhooks: Custom Integrations Guide](https://instantly.ai/blog/api-webhooks-custom-integrations-for-outreach/)
- [AI Reply Agent — Instantly Help Center](https://help.instantly.ai/en/articles/11774076-ai-reply-agent)
- [AI Copilot — Smart Replies and Automation](https://instantly.ai/copilot)
- [AI Lead Qualification Tools for B2B Sales Teams](https://instantly.ai/blog/automating-lead-qualification-ai-sdr-tools/)
- [Instantly API: We Used It — Here's Our No-BS Review](https://www.salesforge.ai/blog/instantly-api)

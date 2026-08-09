# Investigación — Canales, costos, IA y riesgo regulatorio

Investigado y verificado el 29–30/07/2026.

---

## 🚨 WhatsApp: el riesgo está confirmado

Las reglas de Meta hacen que mandar a 4.057 contactos en Closed Lost sea, en el
mejor caso, caro, y en el peor, la pérdida del número.

### Lo que confirmé

**1. Aprobación previa de plantillas — obligatoria**
Meta exige pre-aprobación de **todas** las plantillas antes de poder enviarlas, y
clasifica cada una según contenido y propósito en el momento de aprobarla.

→ **El primer mensaje no lo escribe el agente.** Lo dicta una plantilla aprobada.
Recién si la persona responde se abre la ventana de 24 h para conversar libre.
Esto **cambia el diseño**, no es un detalle administrativo.

**2. Opt-in — obligatorio**
Las plantillas de utilidad requieren aprobación de Meta **y opt-in confirmado del
destinatario**.

**3. 🔴 El hallazgo más importante**

> *El principal factor de baja calidad: mandar mensajes de marketing a listas
> opt-in que no interactuaron en 90+ días.*

**Ese es exactamente este caso.** 4.057 oportunidades dormidas, muchas de hace más
de un año. Incluso si dieron opt-in en su momento, Meta lo considera el peor patrón
posible. La degradación de calidad del número es automática.

**4. Precio por mensaje, sin descuento por volumen**
Desde el **1 de julio de 2025** el modelo es **por mensaje entregado**, según
categoría (marketing / utility / authentication), país del destinatario y volumen
mensual.

Los mensajes de **marketing no tienen tier de descuento por volumen** — cada uno se
cobra a tarifa completa. Rango aproximado: **USD 0,01 – 0,14 por mensaje** según
mercado.

### Costo estimado de una sola tanda

| Escenario | 4.057 mensajes |
|---|---|
| Tarifa baja (USD 0,01) | ~USD 40 |
| Tarifa media (USD 0,05) | ~USD 200 |
| Tarifa alta (USD 0,14) | ~USD 570 |

Y eso es **solo el primer envío**. Las respuestas y el ida y vuelta suman.

> ⚠️ Una plantilla mal clasificada como *marketing* cuando debería ser *utility* se
> cobra más caro. Vale revisar la categorización.

### Conclusión

**Arrancar por email.** No tiene aprobación de plantillas, ni opt-in de plataforma,
ni costo por mensaje, ni riesgo de perder el canal. WhatsApp queda para contactos
con conversación previa o consentimiento explícito y reciente.

---

## Email: opciones de envío

| Servicio | Plan gratuito | Pago | Notas |
|---|---|---|---|
| **Brevo** | 300/día (~9.000/mes) | desde ~USD 9/mes | El límite diario **es una ventaja**: reparte los 4.057 en ~14 días |
| **Amazon SES** | — | USD 0,10 / 1.000 | Los 4.057 salen **USD 0,40**. Requiere verificar dominio |
| **Resend** | 3.000/mes | USD 20/mes por 50k | Buena entregabilidad, API cómoda |
| **Instantly** | — | pago | ⭐ Ver abajo |

### ⭐ Verificar si ya tienen Instantly

En el board de Trello hay una tarjeta que menciona **"AI Agent Outbound … en
Instantly HITL"**. Si el cliente ya lo tiene contratado, **usarlo para el envío**:
ya trae warm-up de dominio, rotación de casillas y manejo de respuestas.

Eso resuelve la **entregabilidad**, que es la parte más traicionera del cold email y
la que más tiempo consume hacer bien desde cero.

### El límite gratuito juega a favor

Mandar 4.057 mails de golpe es la receta para caer en spam. Repartirlos en ~14 días
con volumen parejo es lo que hace cualquier equipo serio de outbound. La restricción
de Brevo **obliga a hacerlo bien**.

---

## 🤖 IA: dónde entra, qué modelo, y cuánto cuesta

### Los 3 puntos de integración

La IA **no** reemplaza toda la lógica — entra en 3 puntos específicos donde aporta
valor que las reglas no pueden dar:

| # | Punto de IA | Qué hace | Modelo |
|---|---|---|---|
| 1 | **Redacción de email** | Genera mail personalizado con contexto real del CRM | Gemini Flash |
| 2 | **Clasificación de respuesta** | Detecta intención: interesado / consulta / no interesado | Gemini Flash |
| 3 | **Respuesta a consulta** | Responde 1 vez con info de producto; si no alcanza → Chatwoot | Gemini Flash/Pro |

### Dónde NO entra IA (y por qué)

| Paso | Método | Razón |
|---|---|---|
| Scoring/priorización | Reglas en nodo Code | Determinístico, explicable, gratis |
| Envío de email | Brevo/SES API | Infraestructura, no inteligencia |
| Mover tarjeta en Notion | API directa (PATCH) | Un update al CRM |
| Agendar llamada | Link de Cal.com | Ya existe, no reinventar |

---

### Detalle de cada punto de IA

#### 1. Redacción de email personalizado

El LLM recibe el contexto real del CRM y genera un email que parece escrito a mano.
**Esto no se puede hacer con plantillas fijas** — cada mail sale distinto porque el
contexto es distinto.

```
PROMPT → Gemini Flash

Sos un ejecutivo comercial de Xtract. Escribí un email corto y directo
para reactivar esta oportunidad perdida.

CONTEXTO DEL CLIENTE:
- Nombre: {{nombre}}
- Empresa: {{empresa}}
- Etapa alcanzada: {{etapa}}
- Motivo de pérdida: {{motivo}}
- Fecha de pérdida: {{fecha}}
- Monto del deal: {{monto}}
- Notas del comercial: {{notas}}

REGLAS:
- Máximo 4 oraciones
- Mencioná algo ESPECÍFICO de su caso
- Si perdió por precio → mencioná que las condiciones cambiaron
- Si perdió por timing → mencioná que pasó tiempo
- Terminá con pregunta abierta, no con "agendá acá"
- Tono: colega, no vendedor
```

**Output ejemplo:**
> *Hola Juan, en marzo estuvimos charlando por la integración con tu ERP y quedó
> frenado por presupuesto. Desde entonces sacamos un plan que entra en la mitad de
> lo que habíamos cotizado. ¿Tiene sentido que lo miremos de nuevo?*

Tokens estimados: ~800 por llamada (prompt + respuesta).

#### 2. Clasificación de intención

Cuando alguien responde al email (entra por webhook), el LLM clasifica qué quiere:

```
PROMPT → Gemini Flash

Clasificá la intención de esta respuesta a un email comercial.

EMAIL ORIGINAL: {{email_enviado}}
RESPUESTA: {{respuesta_cliente}}

Respondé SOLO con una de estas categorías:
- INTERESADO (quiere saber más, pide info, acepta reunión)
- CONSULTA (pregunta técnica o de producto)
- NO_INTERESADO (rechaza, pide no ser contactado)
- FUERA_DE_OFICINA (respuesta automática)
- IRRELEVANTE (spam, error)
```

Tokens estimados: ~300 por llamada.

**Según el resultado, el workflow actúa:**
- `INTERESADO` → mover tarjeta a "Contactado" + Slack al comercial + link Cal.com
- `CONSULTA` → responder 1 vez con IA, si no sabe → Chatwoot
- `NO_INTERESADO` → marcar "No contactar" y nunca más molestar
- `FUERA_DE_OFICINA` → reintentar en 7 días
- `IRRELEVANTE` → ignorar

#### 3. Respuesta a consultas (1 turno)

Si la clasificación es CONSULTA, el LLM responde **una sola vez**:

```
PROMPT → Gemini Pro (modelo mejor, acá se juega la reunión)

El cliente respondió con una consulta. Respondé con información precisa
y cerrá sugiriendo una llamada corta.

Consulta: {{consulta}}
Contexto del cliente: {{contexto_crm}}
Info de producto: {{knowledge_base}}
```

Si la respuesta no es suficiente → **escala a Chatwoot** (humano).

Tokens estimados: ~1.000 por llamada.

---

### Análisis de costos de IA — escenario 50 contactos/día

#### Consumo diario

| Punto de IA | Llamadas/día | Tokens/llamada | Total tokens/día |
|---|---|---|---|
| Redactar email | 50 | ~800 | ~40.000 |
| Clasificar respuesta | ~10 (20% responde) | ~300 | ~3.000 |
| Responder consulta | ~3 (30% de respuestas) | ~1.000 | ~3.000 |
| **TOTAL** | **~63** | | **~46.000** |

#### Límites gratuitos de Gemini

| Modelo | RPM | TPM | RPD (requests/día) |
|---|---|---|---|
| **Gemini 2.0 Flash** | 10 | 250.000 | **1.500** |
| **Gemini 2.5 Flash** | 10 | 250.000 | **500** |

#### Resultado

| Métrica | Necesitamos | Tenemos gratis | Margen |
|---|---|---|---|
| Requests/día | 63 | 1.500 (2.0) / 500 (2.5) | **24x — 8x de sobra** |
| Tokens/día | 46.000 | 250.000/min | **ni se acerca al límite** |
| Costo | | | **USD 0,00** |

> **Con 50 contactos/día no se gasta un peso en IA.** Recién pasando ~200/día
> sostenidos habría que considerar plan pago (~USD 0,01 por los 50 emails).

#### Restricción de rate limit: 10 RPM

El único límite relevante es **10 requests por minuto**. Solución:

- **SplitInBatches** de 10 emails → Wait 1 min → siguiente batch
- Los 50 emails se generan en **~5 minutos**
- En n8n se configura con el nodo `SplitInBatches` + `Wait`

---

### DeepSeek como backup

Si en algún momento el free tier de Gemini se restringe:

| Modelo | Costo input | Costo output | 50 emails |
|---|---|---|---|
| DeepSeek V3 | $0,27/M tokens | $1,10/M tokens | ~USD 0,06 |
| DeepSeek R1 | $0,55/M tokens | $2,19/M tokens | ~USD 0,12 |

Incluso pagando, el costo es despreciable.

---

## Costo operativo total del diseño recomendado

| Pieza | Costo |
|---|---|
| n8n | $0 (instancia propia) |
| Clasificación/scoring | $0 (reglas) |
| IA (Gemini Flash free) | $0 |
| Envío de email (Brevo 300/día) | $0 |
| Cal.com (agenda) | $0 |
| Chatwoot (escalación) | $0 (self-hosted) |
| **Total** | **USD 0/mes** |

Contra los **USD 240 – 970/mes** que costaría la versión con WhatsApp.

---

## Fuentes

- [WhatsApp Business API Pricing 2026: Per-Message Rates | SetSmart](https://setsmart.io/blog/whatsapp-business-api-pricing)
- [WhatsApp Marketing Message Pricing in 2026 | Blueticks](https://blueticks.co/blog/whatsapp-business-pricing-marketing-messages-2026)
- [WhatsApp Business API Pricing 2026: Exact Per-Message Costs | Uptail](https://www.uptail.ai/blog/whatsapp-business-api-pricing-2026-what-it-costs-and-how-billing-works)
- [WhatsApp Business API Pricing: 2026 Complete Cost Guide | EngageLab](https://www.engagelab.com/blog/whatsapp-business-api-pricing)
- [Gemini API Pricing — Google AI for Developers](https://ai.google.dev/pricing)
- [DeepSeek API Pricing](https://api-docs.deepseek.com/quick_start/pricing)

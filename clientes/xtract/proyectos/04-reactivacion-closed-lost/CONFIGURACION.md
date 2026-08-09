# Guía de configuración — Piloto Closed Lost por WhatsApp

Todo lo que hay que cargar para poner el piloto en marcha, **en el orden en que
conviene hacerlo**. Cada paso dice de dónde sale el dato, dónde se pega y cómo
verificar que quedó bien antes de seguir.

Los dos workflows están construidos y probados en todo lo que se puede probar sin
credenciales. **Lo que falta de acá no es código: es material que tiene que venir
de Xtract.**

---

## Antes de empezar: dónde está cada cosa

```
04-reactivacion-closed-lost/
├── CONFIGURACION.md      ← este documento
├── README.md             ← decisiones de diseño y por qué de cada cosa
├── plantilla-meta.md     ← la plantilla para copiar y pegar en Meta
├── investigacion.md      ← por qué WhatsApp es riesgoso acá
├── workflows/            ← los dos JSON para importar en n8n
├── datos/                ← leads del piloto y base de conocimiento
├── pruebas/              ← banco de pruebas de los nodos Code
└── demos/                ← el simulador HTML y sus workflows de prueba
```

### Antes de tocar un nodo Code, corré las pruebas

```bash
node pruebas/nodos-wf1.js && node pruebas/nodos-wf2.js
```

Son 50 casos sobre la lógica de `Preparar Datos Lead`, `Procesar Respuesta` y
`Filtrar solo entrantes`: opt-out, el falso positivo de *"dar de baja un
usuario"*, el tope de turnos, las ráfagas, los candados terminales, el marcador
`[AGENDADO]`, el contexto que llega por `custom_attributes` y el prefijo
cacheable del prompt. Leen el JSON del workflow directamente, así que **si
editás un nodo en n8n, reexportá el JSON y volvé a correrlas**. Encontraron ocho
bugs reales; no son decorativas.

### Cómo se configuran los workflows

**No hay variables de entorno.** Esta instancia de n8n corre con
`N8N_BLOCK_ENV_ACCESS_IN_NODE`: cualquier `$env` tira *"access to env vars denied"*.
Toda la configuración vive en un nodo **`Config`** (tipo Code) al principio de cada
workflow. Se abre, se editan los valores, se guarda.

> ⚠️ **Cuatro valores están duplicados en los dos workflows** y tienen que quedar
> idénticos: `CHATWOOT_URL`, `CHATWOOT_ACCOUNT_ID`, `CHATWOOT_INBOX_ID` y
> `WA_SHEET_URL`. Si cambiás uno, cambialo en los dos.

---

## Paso 1 · Chatwoot 🔴 sin esto no se puede probar nada

### 1.1 Los cuatro datos

| Dato | Dónde sale | Ejemplo |
|---|---|---|
| **URL de la instancia** | La barra del navegador, sin barra final | `https://app.chatwoot.com` |
| **Account ID** | En la URL: `/app/accounts/`**`3`**`/dashboard` | `3` |
| **Inbox ID** | Settings → Inboxes → entrar al de WhatsApp → el ID está en la URL | `12` |
| **Access token** | Profile Settings → Access Token | `xxxxxxxx…` |

⚠️ El inbox tiene que ser **el de WhatsApp**. El bot tiene un candado que ignora todo
lo que venga de otro inbox — si ponés el ID equivocado, no responde nunca y parece
que está roto.

### 1.2 Crear la credencial en n8n

**Credentials → New → Header Auth**

| Campo | Valor |
|---|---|
| Nombre | `Chatwoot API` |
| Name | `api_access_token` |
| Value | el token del paso anterior |

### 1.3 Asignarla a los nodos

**Workflow 1 — Envío** (6 nodos)
`Chatwoot - Buscar contacto` · `Chatwoot - Crear contacto` ·
`Chatwoot - Crear conversacion` · `Chatwoot - Enviar plantilla WA` ·
`Chatwoot - Etiquetar piloto` · `Chatwoot - Guardar contexto CRM`

**Workflow 2 — Recepción** (4 nodos)
`Chatwoot - Traer historial` · `Chatwoot - Responder` · `Chatwoot - Nota estado` ·
`Chatwoot - Etiquetar`

### 1.4 Cargar los valores en el `Config` de **los dos** workflows

```javascript
CHATWOOT_URL: 'https://…',        // sin barra final
CHATWOOT_ACCOUNT_ID: '3',
CHATWOOT_INBOX_ID: '12',
```

### ✅ Cómo verificar

Abrí el workflow 1, seleccioná **solo** el nodo `Chatwoot - Buscar contacto` y
ejecutalo. Si devuelve **200**, la conexión está. Si devuelve 401, el token está mal.

---

## Paso 2 · Hoja de control del piloto 🔴

Una planilla de Google con **tres pestañas**. Los encabezados van en la fila 1.

### Pestaña `Leads Piloto` — la fuente de los envíos

**Es de donde salen los números.** Antes esto venía de Notion; se sacó a pedido
y el piloto se maneja 100% con la hoja.

Pegá acá el contenido de [`datos/piloto_whatsapp_listo.csv`](datos/piloto_whatsapp_listo.csv)
(144 leads, ya filtrados a Verdes y con los teléfonos normalizados):

```
Empresa | Contacto | Primer Nombre | Teléfono Normalizado | Email |
Motivo Pérdida | Sistema Actual | País | Comercial | Días desde Pérdida |
Hubo Reunión | Facturas/Mes
```

> A diferencia de las otras dos pestañas, **acá los encabezados NO tienen que
> ser exactos**. El nodo los normaliza (sin acentos, minúsculas, guiones bajos),
> así que `Teléfono Normalizado`, `telefono_normalizado` y `TELEFONO NORMALIZADO`
> son lo mismo. También acepta los nombres del export viejo de Notion.

> ⚠️ Si agregás una columna `Calificacion`, `WA_SOLO_VERDES` empieza a filtrar
> por ella. Si **no** existe la columna, no filtra nada — la lista del piloto ya
> viene filtrada. Es a propósito: filtrar por una columna ausente dejaría la
> tanda vacía sin ningún error visible.

### Pestaña `Enviados WA` — 20 columnas

Estas dos sí mapean **carácter por carácter**: los nodos escriben por nombre de
columna, no por posición.

```
telefono | nombre | empresa | motivo_perdida | sistema | notion_page_id |
chatwoot_contact_id | chatwoot_conversation_id | fecha_envio | estado | pais |
email | fecha_propuesta | calificacion | owner | cantidad_facturas |
fecha_discovery | fecha_reunion | dias_desde_perdida | hubo_reunion
```

### Pestaña `Interacciones` — 7 columnas

```
fecha | conversation_id | telefono | nombre | empresa | mensaje_cliente | intencion
```

**Credencial:** la de Google Sheets que ya existe en la instancia. Asignarla a
`Leer leads del piloto`, `Leer enviados` y `Marcar como enviado` (WF1), y a
`Leer Enviados WA` y `Registrar interaccion` (WF2).

> ⚠️ `Marcar como enviado` está configurado como **Service Account** y los otros
> como **OAuth2**. Conviene unificar en Service Account: no vence, no necesita
> pantalla de consentimiento y solo hay que compartirle la planilla al
> `client_email` de la cuenta de servicio.

**Config de los dos workflows:** `WA_SHEET_URL: 'https://docs.google.com/…'`

> `Enviados WA` no es solo tracking: **es el dedupe.** El workflow 1 la lee antes de
> enviar para no mandarle dos veces la plantilla al mismo teléfono. La columna
> `estado` es la que decide: solo bloquea a los que dicen `enviado`. Si un envío
> falla, queda `error: …` y ese lead vuelve a entrar en la próxima tanda.

---

## Paso 3 · Opt-in 🔴 decisión, no dato

**Esta es la pregunta más importante del proyecto y no la puedo responder yo.**

Meta exige consentimiento previo para mandar plantillas de marketing. Un lead que se
perdió hace dos años difícilmente lo haya dado, y **en Notion no hay campo que lo
registre**. Si un porcentaje de los 144 marca "Bloquear" o "Reportar", Meta degrada
la calidad del número — y le pega al número de toda la empresa, no solo al piloto.

Marco legal: Ley 25.326 (AR), LGPD (BR), LFPDPPP (MX).

**Para responder con Tomás, por escrito:**
- [ ] ¿Estos contactos aceptaron recibir WhatsApp? ¿Dónde consta?
- [ ] Si no consta, ¿avanzamos igual asumiendo el riesgo, o arrancamos por email?
- [ ] ¿Con qué número se manda? ¿Es el número comercial principal?

Detalle en [`investigacion.md`](investigacion.md).

---

## Paso 4 · Plantilla aprobada por Meta 🔴

Fuera de la ventana de 24 h, el primer mensaje **tiene que ser una plantilla
aprobada**. No se puede mandar texto libre generado por IA.

👉 **Está lista para copiar y pegar en [`plantilla-meta.md`](plantilla-meta.md).**

La aprobación tarda entre unas horas y varios días: conviene mandarla temprano, en
paralelo con el resto.

**Prerrequisitos:**
- [ ] WABA (WhatsApp Business Account) activa
- [ ] Número verificado y conectado al inbox de Chatwoot
- [ ] Calidad del número en verde (Meta Business → WhatsApp Manager)

**Cuando la aprueben, en el `Config` del workflow 1:**

```javascript
WA_TEMPLATE_NAME: 'reactivacion_closed_lost',
WA_TEMPLATE_LANG: 'es_AR',
WA_TEMPLATE_PREVIEW: 'Hola {{1}}, como estas? Te escribo de parte del equipo de Xtract.',
```

> ⚠️ La plantilla tiene **una sola variable** (`{{1}}` = primer nombre) y el workflow
> manda exactamente una. Si le agregás una variable a la plantilla, hay que tocar el
> nodo `Chatwoot - Enviar plantilla WA`: Meta rechaza el envío cuando la cantidad no
> coincide.

---

## Paso 5 · Webhook de Chatwoot 🟡

Es lo que hace que el bot se entere de las respuestas.

1. Activá el **workflow 2** en n8n y copiá la URL del nodo `Chatwoot - message_created`.
2. En Chatwoot: **Settings → Integrations → Webhooks → Add new webhook**
3. Pegá la URL y marcá **únicamente** el evento `message_created`.

### ✅ Cómo verificar

Escribile un WhatsApp al número desde tu celular. En n8n tenés que ver una ejecución
del workflow 2. Va a cortar enseguida (tu teléfono no está en la lista del piloto) —
**eso es lo correcto**: el candado funciona.

---

## Paso 6 · ~~Notion~~ ✅ ya no hace falta

**Notion salió del circuito.** El WF1 leía la base de Closed Lost por API; ahora
los leads salen de la pestaña `Leads Piloto` de la misma planilla (Paso 2).

No hay que configurar credencial de Notion ni confirmar nombres de propiedades.
Si en algún momento se quiere volver a conectar el CRM, el mapeo viejo de
propiedades está en el historial de git.

> El nodo `Filtrar elegibles y armar tanda` sigue aceptando los nombres de
> columna del export de Notion (`Nombre Oportunidad`, `Whatsapp KDM`,
> `Motivo Lost`…), así que una exportación cruda de la base también funciona
> sin tocar nada.

---

## Paso 7 · Slack 🟡

| Qué | Dónde |
|---|---|
| Credencial de Slack | Nodo `Avisar al comercial` (WF2) |
| **Channel ID** | `WA_SLACK_CHANNEL` en el `Config` del WF2 |

El Channel ID va en formato `C01ABCDEF`, **no** `#canal`. Se saca desde Slack:
click derecho en el canal → *Ver detalles del canal* → abajo de todo.

Se avisa cuando la conversación pasa a una persona o cuando se agenda una reunión.

---

## Paso 8 · Calendly 🟢 solo afecta el agendamiento

⚠️ **La Scheduling API requiere plan pago de Calendly.** Textual de la documentación:
*"Calendly customers are required to be on a paid plan in order to access or use
applications calling the Scheduling API."*

- [ ] **¿En qué plan está Xtract?** Si están en free, esta rama no funciona y hay
      que rediseñarla con links de un solo uso por horario.

| Dato | Dónde sale |
|---|---|
| **Personal Access Token** | Calendly → Integrations → API & Webhooks → Personal Access Tokens |
| **Event Type URI** | `GET https://api.calendly.com/event_types?user=<uri>` → copiar el `uri` del evento |

**Credencial en n8n → New → Header Auth** (una segunda, distinta de la de Chatwoot):

| Campo | Valor |
|---|---|
| Nombre | `Calendly API` |
| Name | `Authorization` |
| Value | `Bearer <token>` |

Asignarla a los dos nodos **herramienta** colgados del Agente IA:
`Calendly - Consultar disponibilidad` y `Calendly - Agendar reunion`.

**En el `Config` del workflow 2:**

```javascript
CALENDLY_EVENT_TYPE: 'https://api.calendly.com/event_types/XXXX',
CALENDLY_LOCATION_KIND: 'zoom_conference',   // o google_conference, physical…
```

### El agendamiento lo hace el modelo, no una máquina de estados

Desde el refactor, Calendly cuelga del Agente IA como **dos herramientas** y el
modelo decide solo cuándo consultar la agenda y cuándo reservar. Eso sacó 10
nodos del canvas y hace que el bot pueda responder cosas como *"¿tenés algo el
jueves a la tarde?"*, que antes no entendía.

Lo que **queda fijo en el nodo y el modelo no puede tocar**: el tipo de evento,
la modalidad y la **zona horaria** (`America/Argentina/Buenos_Aires`). La
invitación sale en hora argentina aunque el modelo se equivoque contando.

Lo que **depende del prompt y no de un candado de código** —y por eso hay que
mirarlo en las primeras conversaciones reales:

1. **La hora que dice en el chat.** Calendly devuelve UTC y el modelo resta 3
   horas de cabeza. El horario *reservado* es correcto (copia el texto exacto),
   pero puede *describirlo* mal.
2. **Que pida el correo antes de agendar.** Es un paso obligatorio del prompt.
3. **Que no se olvide el marcador `[AGENDADO]`.** Si se lo come, la reunión
   queda hecha pero sin etiqueta terminal, y el bot sigue conversando.

---

## Paso 9 · Modelos de IA 🟡 falta la credencial de DeepSeek

El bot usa **dos modelos**: DeepSeek como principal y Groq como respaldo automático.

| | Modelo | Credencial |
|---|---|---|
| **Principal** | `deepseek-chat` | ⚠️ **Falta crearla.** n8n → Credentials → New → *DeepSeek* → API key de [platform.deepseek.com](https://platform.deepseek.com) |
| **Respaldo** | `llama-3.3-70b-versatile` (Groq) | ✅ Ya existe en la instancia |

### Por qué DeepSeek de titular

No es por precio, es por el techo. El plan free de Groq da **12K tokens por minuto**
y **100K por día**. Con este prompt (~2.700 tokens de system + memoria + herramientas
≈ 3.500 por mensaje), eso son **~3 mensajes por minuto y ~28 por día** — contra un
piloto de 144 leads. No alcanza ni para el primer día.

DeepSeek no limita por tokens por minuto: limita por **concurrencia**, 500 conexiones
simultáneas. Diez personas conversando a la vez son un puñado. Ese techo desaparece.

**Lo que hay que mirar:** DeepSeek es más lento que Groq, y su *function calling* es
menos confiable. Ahora que el agendamiento depende de herramientas, revisá las
primeras conversaciones que agenden.

### El respaldo es nativo, no una rama

El nodo `Agente IA` tiene `needsFallback: true`. Eso le agrega un **segundo puerto de
modelo**: si DeepSeek no responde, el agente cambia en caliente en vez de escalar a un
humano por una caída pasajera. No hay IF ni segundo agente.

### Los cinco sub-nodos del agente

| Sub-nodo | Para qué |
|---|---|
| `Modelo principal (DeepSeek)` | El que redacta |
| `Modelo de respaldo (Groq)` | Entra solo si el principal falla |
| `Memoria por telefono` | Le pasa la conversación previa, con la sesión atada al **número de teléfono** |
| `Calendly - Consultar disponibilidad` | Herramienta de lectura |
| `Calendly - Agendar reunion` | Herramienta de escritura (irreversible) |

**La memoria y el historial de Chatwoot no se pisan, hacen cosas distintas:**

- **Chatwoot** alimenta la *lógica de control* — contar turnos, detectar la ráfaga,
  leer los candados terminales. Tiene que ser exacto y sobrevivir a un reinicio.
- **`Memoria por telefono`** alimenta al *modelo* — le pasa la charla como turnos
  reales en vez de un bloque de texto.

Por eso la transcripción **ya no va dentro del prompt**. Si estuviera en los dos
lados, el modelo recibiría la misma conversación dos veces: el doble de tokens y dos
versiones que pueden no coincidir cuando el recorte corta en distinto lugar.
Hay una prueba en `pruebas/nodos-wf2.js` que falla si alguien la vuelve a agregar.

> ⚠️ **El buffer vive en el proceso de n8n.** Si reiniciás n8n en medio de una
> conversación, la memoria se vacía: los candados y el conteo de turnos sobreviven
> (salen de Chatwoot), pero el modelo arranca sin recordar lo que ya hablaron.
> Si eso llega a molestar en el piloto, el reemplazo directo es **Postgres Chat
> Memory** con la misma clave — persiste y no cambia nada más del flujo.

---

## Los tres tipos de conversación

El bot no contesta igual a todo el mundo. `Preparar Datos Lead` decide el tipo
**antes** de llamar al modelo y se lo pasa ya resuelto, en el campo
`tipo_conversacion`. El prompt lo lee en su primer bloque y de ahí sale a la
sección que corresponde.

| `tipo_conversacion` | Cuándo | Qué hace | Etiqueta |
|---|---|---|---|
| **REACTIVACION** | Lead del piloto respondiendo la plantilla, sin reunión | Reconecta, propone y **agenda** con las herramientas de Calendly | `reactivacion` |
| **POST_AGENDAMIENTO** | Ya tiene reunión agendada y vuelve a escribir | Solo logística. No vende, no re-agenda | `reactivacion` + `agendado` |
| **CONSULTA_GENERAL** | Cualquiera que escriba y **no** esté en el piloto | Responde con la base de conocimiento y la logística. **No agenda.** Lo comercial y lo de soporte van a una persona | `consulta-general` |

> **Por qué se lo damos calculado y no lo deduce el modelo.** Para deducirlo
> tendría que adivinar si la persona está en el piloto, y el error caro es en una
> sola dirección: una consulta general tratada como reactivación arranca con un
> *"retomando lo que veníamos hablando"* dirigido a alguien que nunca habló con
> nosotros. Eso no se le pide por favor a un modelo — se calcula con el CRM y las
> etiquetas de Chatwoot.
>
> Internamente el nodo sigue teniendo el campo `modo`
> (`normal` / `postventa` / `general`): `tipo_conversacion` se deriva de él.
> `modo` es el que leen `Procesar Respuesta` y `Armar salida` para elegir la
> etiqueta de Chatwoot.

> Creá la etiqueta **`consulta-general`** en Chatwoot. Es lo que te permite separar,
> al medir el piloto, a los 144 leads de la gente que escribió por su cuenta. Sin
> eso, la tasa de respuesta del piloto queda contaminada.

### El candado que reemplazó al filtro por lista

Antes, quien no estaba en la hoja `Enviados WA` era **descartado**. Esa era la
protección para no contestarle a un cliente de soporte real. Ahora que el bot también
atiende consultas generales, esa protección ya no existe, y en su lugar hay otra:

**Si la conversación tiene un agente asignado en Chatwoot, el bot se calla.**

Es el único límite que queda entre el bot y una persona trabajando. Solo corta cuando
*hay* asignado: si el campo no viene en el payload, no descarta nada — mismo criterio
defensivo que con las etiquetas.

> ⚠️ **Esto cambia quién le habla al bot.** Si ese número de WhatsApp es también el
> comercial principal de Xtract, el bot ahora contesta a **todo el que escriba**, no
> solo a los 144 del piloto. Lo que no está en la base de conocimiento lo deriva a un
> humano, así que el peor caso es un *"le derivo la conversación"* de más. Pero
> conviene que Tomás lo sepa antes de activarlo.

---

## Perillas que podés mover sin tocar código

Todas viven en el nodo `Config`.

### Workflow 1 — Envío

| Clave | Default | Qué hace |
|---|---|---|
| `WA_LEADS_TAB` | `'Leads Piloto'` | Pestaña de donde salen los leads a contactar |
| `WA_LIMITE_TANDA` | `20` | Máximo de envíos por corrida. Es la protección para no quemar el número |
| `WA_ESPERA_ENTRE_ENVIOS_SEG` | `8` | Pausa entre un envío y el siguiente. **No es cosmético:** mandar 144 plantillas de corrido es la forma más rápida de que Meta te degrade la calidad del número. Con 8 s, una tanda de 20 tarda menos de 3 minutos |
| `WA_SOLO_VERDES` | `'true'` | Solo leads calificados Verde. **Solo aplica si la pestaña tiene columna `Calificacion`** |

### Workflow 2 — Recepción

| Clave | Default | Qué hace |
|---|---|---|
| `WA_MAX_TURNOS` | `12` | Turnos de historial que se le pasan al modelo |
| `WA_MAX_TURNOS_BOT` | `12` | Mensajes conversados con el modelo antes de pasarlo a un humano. **Ahora incluye los de coordinar la reunión**, porque los contesta el modelo. Por eso subió de 8 a 12: con 8 se escalaba a alguien en medio de confirmar su correo. `0` lo desactiva |
| `WA_ESPERA_RAFAGA_SEG` | `8` | Segundos de silencio que espera antes de contestar. En WhatsApp la gente manda "hola" / "che" / "una consulta" en 5 segundos: espera, junta todo y contesta **una vez**. Subilo si el equipo nota que corta gente que escribe lento |
| `CALENDLY_DIAS` | `21` | Ventana de disponibilidad a consultar. **El endpoint admite hasta 31 días** (antes 7, ver release notes de Calendly); el clamp del nodo HTTP lo recorta a 31 si ponés más |
| `CALENDLY_OPCIONES` | `3` | Horarios que se le pide al modelo que ofrezca |
| `CALENDLY_HORA_DESDE` / `HASTA` | `9` / `18` | Horario laboral **argentino**. Todo se maneja en hora AR y el mensaje lo aclara |
| `CALENDLY_DURACION_MIN` | `10` | Duración real del evento en Calendly. El bot la dice cuando le preguntan *"¿cuánto dura?"* y también al proponer la reunión. **Si cambiás el event type, cambiala acá**: es lo único que hace que las dos respuestas no se contradigan |

> La **modalidad** (Zoom / Meet / Teams / presencial) no se escribe a mano en ningún
> lado: el bot la deduce de `CALENDLY_LOCATION_KIND`. Si mañana el evento pasa a
> Google Meet, deja de decir "es por Zoom" solo.

---

## Orden recomendado y verificación en cada paso

| # | Paso | Cómo sabés que funcionó |
|---|---|---|
| 1 | Chatwoot | `Chatwoot - Buscar contacto` devuelve 200 |
| 2 | Hoja de Sheets | El WF1 corre entero salvo el envío |
| 3 | Opt-in | Respuesta por escrito de Tomás |
| 4 | Plantilla a Meta | Estado "Aprobada" en WhatsApp Manager |
| 5 | Webhook | Escribís al número y aparece una ejecución del WF2 |
| 6 | Notion | El WF1 devuelve leads elegibles |
| 7 | Slack | Llega un mensaje de prueba al canal |
| 8 | Calendly | `Calendly - Consultar disponibilidad` devuelve horarios |

**La primera corrida de verdad: poné `WA_LIMITE_TANDA` en 1** y mandale la plantilla
a un teléfono tuyo que esté cargado en la hoja. Recién cuando esa conversación
completa funcione de punta a punta —respuesta, agendamiento, etiquetas— subilo a 20.

---

## Cómo maneja los mensajes en ráfaga

En WhatsApp nadie escribe un párrafo: manda tres mensajes cortos en cinco segundos.
Cada uno dispara una ejecución del workflow.

El nodo **`Esperar la rafaga`** espera `WA_ESPERA_RAFAGA_SEG` segundos y después
relee el historial. Si ya entró un mensaje más nuevo, **esa ejecución se calla** y
contesta la última. Los tres mensajes se le pasan al modelo unidos
(`"hola. che. una consulta"`) y cuentan como **un solo turno**.

Eso último importa tanto como lo primero: si tres mensajes contaran como tres turnos,
el bot saltaría de la etapa 1 a la 3 y propondría una reunión antes de reconectar.

**Si el equipo nota que corta a gente que escribe lento, subí `WA_ESPERA_RAFAGA_SEG`.**
El costo de esperar de más es que el bot tarda un poco en contestar; el de esperar de
menos es que contesta tres veces pisándose.

---

## Lo que todavía no se pudo verificar

Es honesto decirlo: hay dos cosas que solo se comprueban con Chatwoot conectado.

1. **Que el payload de `message_created` traiga las etiquetas de la conversación.**
   El bot las usa para saber que una charla ya está cerrada. Se leen tres variantes
   conocidas (`conversation.labels`, `conversation.label_list`, `labels`). Si no
   viene ninguna, hay que traerlas con un `GET /conversations/{id}/labels`.
2. **El cableado real contra Chatwoot y Calendly.** La lógica de los nodos Code está
   probada con datos sintéticos; las llamadas HTTP no.
3. **Que `$('Config')` se lea desde los nodos herramienta.** Los tools son sub-nodos
   del agente y no comparten el contexto de la fila principal. La referencia por
   nombre debería funcionar, pero no lo pude comprobar sin credenciales. Si al
   primer intento Calendly devuelve error de `event_type`, es esto: la solución es
   pegar el URI del evento directo en el nodo.
4. **Que el modelo use bien las herramientas.** Groq `llama-3.3-70b` es sólido, pero
   el uso de tools con formato estricto es justo donde más se degrada. Las tres
   cosas a mirar están en el paso 8.

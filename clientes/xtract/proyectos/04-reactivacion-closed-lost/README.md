# 04 — Reactivación de oportunidades Closed Lost

**Estado:** 🟢 Piloto construido — falta credenciales/plantilla para probar
**Origen:** tarjeta de Trello + confirmación de Tomás (piloto WA de ~100, paralelo al flujo de mails que ya corre)
**Volumen:** 4.057 oportunidades en el CRM · piloto sobre los calificados **Verde**

---

## Workflows construidos (n8n)

| # | Workflow | ID | Estado |
|---|---|---|---|
| 1 | Envío vía Chatwoot | `sy3y87QO0o9yFvcD` | Inactivo · `$env` migrado a nodo `Config` · faltan valores + credencial |
| 2 | Recepción vía Chatwoot | `MGdGx00totptRQV1` | Inactivo · `$env` migrado · cerebro del simulador portado · faltan valores + credencial |

> Ninguno de los dos tiene ejecuciones. Nunca corrieron.

⚙️ **Guía de configuración paso a paso:** [`CONFIGURACION.md`](CONFIGURACION.md)
📱 **Plantilla lista para mandar a Meta:** [`plantilla-meta.md`](plantilla-meta.md)

```
workflows/   los dos JSON para importar en n8n
datos/       leads del piloto + base de conocimiento
demos/       el simulador HTML y sus workflows de prueba
```

### 🚨 Bloqueante que hacía imposible correrlos: `$env`

Los dos workflows se construyeron leyendo toda su configuración de variables de
entorno. **Esta instancia de n8n las bloquea.** Verificado contra una ejecución real
(workflow de minutas, ejecución 617):

```
error:         "access to env vars denied"
causeDetailed: "...remove the environment variable 'N8N_BLOCK_ENV_ACCESS_IN_NODE'"
```

Y el patrón `{{ $env.X || 'default' }}` **no protege**: la excepción se tira al
*tocar* `$env`, antes de evaluar el `||`. La expresión entera falla.

**Solución:** un nodo `Config` (Code) justo después del trigger, con toda la
configuración en un solo lugar. Los nodos de abajo leen
`$('Config').first().json.LO_QUE_SEA`. Mismo criterio que en el proyecto 02, pero
centralizado en vez de repetido nodo por nodo.

| Qué se configura | Dónde |
|---|---|
| URL, account ID e inbox ID de Chatwoot | Nodo `Config` |
| URL de la hoja de control del piloto | Nodo `Config` |
| Nombre, idioma y preview de la plantilla de Meta | Nodo `Config` |
| Límite de envíos por tanda y filtro de Verdes | Nodo `Config` |

Los 5 nodos HTTP de Chatwoot usan **Header Auth** (`api_access_token`) y todavía
**no tienen credencial asignada**.

El último de la cadena es `Chatwoot - Etiquetar piloto`: le pone `reactivacion` a la
conversación apenas se manda la plantilla. Es una etiqueta de **identidad**, no de
resultado. Sin ella, los leads que no contestan quedan en Chatwoot sin ninguna marca
—de 144 enviados, si contestan 30 son 114 conversaciones indistinguibles de un
cliente de soporte real— y no se pueden filtrar hasta que responden, que es
justamente cuando interesa mirar a los que **no** respondieron.

### 🧠 El cerebro del simulador, portado a producción

`demos/workflow_demo_gemini_native.json` (el simulador HTML) tenía todo el trabajo fino
—base de conocimiento, FAQ, límites, candados— que el workflow 2 de producción no
tenía. Se portó. **No fue copiar y pegar:** el simulador guardaba el estado en el
cliente HTML (`optOutPrevio`, `conversacionCerrada`, `turnoCliente`), y en
producción ese cliente no existe.

**Decisión: el estado vive en las etiquetas de Chatwoot.** Mismo criterio que la
memoria de la conversación — Chatwoot ya es el dueño del hilo, no se abre una
segunda fuente de verdad. `opt-out`, `no-contactar`, `necesita-humano` y `escalado`
marcan la conversación como terminal.

| Candado | Qué hace | Por qué determinista |
|---|---|---|
| **Opt-out** | Detecta la baja por regex y confirma; etiqueta `opt-out` + `no-contactar` | Meta lo exige y la Ley 25.326 también. No puede depender de que el LLM lo clasifique bien |
| **Estado terminal** | Si la conversación ya está escalada o dada de baja, **silencio absoluto** | Sin esto el bot le contesta por encima al agente humano que ya la tomó |
| **Tope de turnos** | Pasados `WA_MAX_TURNOS_BOT` (12) mensajes del cliente, va a un humano | El objetivo es agendar, no sostener soporte. Hilo largo = más chances de que el modelo diga algo que no debía |

Los tres corren **antes** que la IA y no dependen de ella.

Además, el prompt de `IA - Responder consulta` ahora se arma en un nodo Code
(`Armar prompt de consulta`) con la base de conocimiento, las respuestas aprobadas
y la lista de lo que no puede afirmar. Antes el prompt solo decía "automatizamos
carga contable con IA" — con eso, el modelo inventa.

#### Tres bugs que aparecieron al portar

1. **La escalación se calculaba y se tiraba.** `Responder o escalar` seteaba
   `escalar: true` y el flujo iba derecho a `Chatwoot - Responder`. Se le mandaba
   un texto de relleno al cliente y la conversación **nunca se escalaba**: ni
   etiqueta, ni aviso. Ahora hay un `Hubo escalacion?` que la deriva de verdad.
2. **El tope de turnos nunca disparaba.** Se contaban los mensajes del cliente
   *después* de recortar el historial a `WA_MAX_TURNOS` (12), así que el contador
   se topeaba en 6 y jamás superaba el límite de 6. Ahora se cuenta sobre el
   historial completo, antes del recorte.
3. **"Dar de baja" daba de baja al lead equivocado.** La regex de opt-out
   (heredada del simulador) matcheaba `dar de baja` suelto. En un producto de
   facturación y ERP, *"¿puedo dar de baja un usuario?"* es la consulta más común
   que hay — y dejaba al lead sin contacto para siempre. Se agregó un lookahead
   que descarta el objeto del sistema (usuario, proveedor, factura, comprobante…)
   y deja pasar `darme de baja` / `dar de baja mi contacto`.

Verificado local contra los nodos Code reales: 13/13 casos de opt-out, la cadena
completa webhook→candados con payload de Chatwoot, y el tope de turnos disparando
recién a partir del 7.º mensaje.

### ⚡ Tres optimizaciones sobre el flujo 2

#### 1. El prompt anulaba el cache de DeepSeek

El `systemPrompt` arrancaba con *"…retomar la conversacion con `${nombre}` de
`${empresa}`"*. El cache de contexto de DeepSeek funciona por **prefijo
idéntico**: con el nombre del lead en el primer renglón, el prefijo cambiaba en
cada conversación y **no había un solo cache hit** — ni siquiera entre turnos del
mismo lead. Se pagaban los ~2.300 tokens de base de conocimiento, FAQ y barandas
**enteros, en cada mensaje, de cada lead**.

Ahora todo lo estático va primero (conocimiento, FAQ, límites, anti-invento,
tono, las tres etapas, cortesía, seguridad) y lo variable **al final**, en un
único bloque `ESTA CONVERSACION` (tipo, ficha, etapa actual, correo del CRM).
Mismo texto, mismo comportamiento del modelo: cambia solo el orden.

> Los valores que salen de `Config` —`CALENDLY_OPCIONES`, `HORA_DESDE`,
> `HORA_HASTA`, `CALENDLY_DURACION_MIN`— son constantes entre leads, así que
> pueden vivir en el medio del prompt sin romper el prefijo.

#### 1.b El prompt vive en el nodo del agente, no en un nodo Code

Se armaba dentro de `Preparar Datos Lead`, como un template string de
JavaScript. Funcionaba, pero para cambiarle una coma al pitch había que abrir un
nodo Code y editar código — y desde la UI de n8n el prompt **no se veía por
ningún lado**: el campo *System Message* del agente decía `{{ $json.promptSystem }}`
y nada más.

Ahora el texto completo está escrito en el **System Message** del nodo
`Agente IA`. `Preparar Datos Lead` bajó de 513 a ~290 líneas y solo calcula
datos: `tipo_conversacion`, `ficha`, `paso`, `email_crm`, `modalidad`,
`instalar` — que el prompt interpola al final con expresiones `{{ }}`.

> El texto es editable por cualquiera desde la UI. Los **candados** (opt-out,
> tope de turnos, mensajes sin texto, tipo de conversación) siguen en el nodo
> Code, que es donde tienen que estar: un requisito legal no se le pide por
> favor a un modelo.

**Hay una prueba que falla si alguien vuelve a meter una variable arriba de la
ficha.** Es un error invisible: el bot sigue funcionando igual, solo cuesta 10x.

#### 2. Google Sheets salió del camino caliente

Cada mensaje entrante leía **la hoja entera** para encontrar una fila. El WF1 ya
crea el contacto en Chatwoot, así que ahora también le escribe el contexto del
CRM en los `custom_attributes` (nodo `Chatwoot - Guardar contexto CRM`, un `PUT
/contacts/{id}`). El WF2 lo lee directo del payload del webhook: **cero llamadas
a Google** en el camino feliz.

El nodo va **al final** de la cadena del WF1 a propósito: `Chatwoot - Crear
conversacion` lee `$json.telefono_e164`, así que meter un nodo HTTP antes le
cambia el `$json` y lo rompe.

Sheets sigue ahí como **camino de respaldo**, detrás de un IF
(`Hay contexto en Chatwoot?`). Se usa cuando el contacto existía en Chatwoot pero
nunca pasó por el WF1, o si el `PUT` falló.

> ⚠️ **Sin verificar contra la instancia real:** que el payload de
> `message_created` traiga los `custom_attributes` del `sender`. Es la misma
> incógnita que las etiquetas. Si no vienen, el IF manda todo por la rama de
> Sheets y el comportamiento es exactamente el de antes — **degrada, no rompe**.

Efecto secundario que también se arregla: antes, si Sheets fallaba, el cruce no
encontraba nada, devolvía 0 items y **el bot se quedaba mudo sin ningún error
visible**.

### 📤 WF1: sin Notion y con loop de envío

Notion salió del circuito. El workflow 1 leía la base de Closed Lost por API;
ahora los leads salen de la pestaña **`Leads Piloto`** de la misma planilla que
ya se usa para el tracking.

```
Config → Leer leads del piloto → Leer enviados → Filtrar elegibles y armar tanda
  → Loop de envio (de a 1)
       ├─ [done] fin de la tanda
       └─ [loop] Buscar contacto → … → Enviar plantilla → Marcar enviado
                  → Etiquetar → Guardar contexto CRM → Esperar → vuelve al loop
```

**Por qué el loop y no todo de una.** Antes los envíos salían en paralelo, tan
rápido como respondiera Chatwoot. Mandar 144 plantillas de corrido es la forma
más rápida de que Meta te degrade la calidad del número — y le pega al número de
toda la empresa, no solo al piloto. Ahora sale de a uno, con
`WA_ESPERA_ENTRE_ENVIOS_SEG` (8 s por default) entre cada uno.

**Los encabezados de la hoja ya no tienen que ser exactos.** Los escribe una
persona, así que el nodo los normaliza con `normKey` (NFD, sin acentos,
minúsculas, separadores colapsados): `Teléfono Normalizado`,
`telefono_normalizado` y `TELEFONO NORMALIZADO` son lo mismo. También siguen
aceptándose los nombres del export de Notion, así que una exportación cruda de
la base funciona sin tocar nada.

> ⚠️ `WA_SOLO_VERDES` solo filtra **si la pestaña tiene columna `Calificacion`**.
> Si no la tiene, no filtra: la lista del piloto ya viene filtrada a Verdes.
> Filtrar por una columna ausente dejaría la tanda vacía sin ningún error
> visible — la clase de fallo silencioso que este proyecto viene evitando.

**El WF1 no tenía pruebas.** Ahora tiene 27 en
[`pruebas/nodos-wf1.js`](pruebas/nodos-wf1.js), corriendo contra el CSV real de
144 leads. Era el agujero más grande del proyecto: `Filtrar elegibles y armar
tanda` es el nodo que decide **a quién se le manda un WhatsApp**, y un bug ahí no
tira un error — le manda un mensaje a la persona equivocada. Cubren la
normalización de teléfonos (incluido el `9` argentino, sin el cual el mensaje no
se entrega y Meta no avisa), el dedupe, la tolerancia de encabezados y el cierre
del ciclo del loop.

### 🧭 Clasificador de intención (quién contesta)

Antes, todo mensaje que pasaba los candados iba derecho al Agente IA — y el
agente contestaba **todo**: un "ok", un pulgar arriba, un "quiero hablar con
alguien". Ahora hay un `Text Classifier` en el medio que decide entre tres
caminos.

```
Que hacer? [bot]
  └→ IA - Clasificar intencion
       ├─ responde_bot    → Agente IA          (el caso normal)
       ├─ derivar_humano  → Marcar derivacion  → necesita-humano + Slack
       ├─ no_responder    → Marcar silencio    → no se contesta nada
       ├─ other           → Agente IA          (no clasificó: contesta igual)
       └─ (error)         → Agente IA          (se cayó: contesta igual)
```

**Cuelga de la salida `bot`, no del principio.** Solo ve mensajes que ya
pasaron opt-out, estado terminal y tope de turnos. Puede *agregar*
restricciones, nunca sacar una. Los candados deterministas siguen siendo
deterministas.

#### Las tres decisiones que hacen que esto no sea peligroso

**1. Falla hacia adelante.** Es un nodo nuevo delante de *todas* las
respuestas: si se cae, el bot se queda mudo con todo el mundo. Por eso tiene
`onError: continueErrorOutput` y la salida `other` habilitada, y las **dos**
van al agente. Cualquier falla —modelo sin crédito, 429, timeout, respuesta
que no clasifica— degrada al comportamiento anterior en vez de romper.

**2. `no_responder` NO es terminal.** Esta es la más importante. Si etiquetara
la conversación como terminal, un error del clasificador dejaría al lead sin
contacto **para siempre y sin traza en n8n**. Así, el costo máximo de un falso
positivo es un mensaje sin contestar: cuando el cliente vuelva a escribir, se
procesa normal. Hay una prueba que falla si alguien lo hace terminal.

**3. Se puede medir.** El silencio se registra en `Interacciones` con
`intencion: sin_respuesta`. Si el clasificador empieza a callar gente que sí
esperaba respuesta, se ve en la hoja. Un clasificador que ignora leads sin
dejar rastro es exactamente el tipo de falla que este proyecto viene evitando.

> El clasificador recibe **la conversación reciente además del último
> mensaje**. Sin contexto, *"dale"* es ambiguo: puede ser un acuse o la
> aceptación de una reunión, y confundirlos te hace perder justo la conversión.
> Para eso se usa `transcripcion`, que ya se calculaba en `Preparar Datos Lead`
> y hasta ahora no la consumía nadie.

Se sumó también un IF **`Hay algo que responder?`** entre `Armar salida` y
`Chatwoot - Responder`: es lo que evita mandarle un mensaje vacío al cliente en
la rama de silencio.

#### 3. El switch `Que hacer?` tiraba items en silencio

Tenía dos salidas (`bot` y `fija`) y ninguna de descarte. Hoy `accion` no puede
ser otra cosa, pero el día que alguien agregue un tercer valor, ese mensaje se
perdía sin traza. Ahora tiene una salida `Sin accion (revisar)` visible en el
canvas.

### 📅 Agendamiento real en Calendly

El bot ya no manda "acá tenés mi Calendly". Consulta la disponibilidad real,
propone horarios concretos y **reserva por API**.

**Sí se puede agendar sin redirigir.** Calendly sumó una *Scheduling API* con
`POST /invitees` que crea el evento sin iframe ni página intermedia.

> ⚠️ **Requiere plan pago de Calendly.** La documentación es explícita: *"Calendly
> customers are required to be on a paid plan in order to access or use
> applications calling the Scheduling API."* **Hay que confirmar con Xtract en qué
> plan están** — si están en free, esta rama no funciona y hay que volver al link
> de un solo uso.

#### Cómo está armado: dos herramientas del agente

Calendly cuelga del Agente IA como **dos herramientas** (`Calendly - Consultar
disponibilidad` y `Calendly - Agendar reunion`). El modelo decide solo cuándo
consultar la agenda y cuándo reservar.

```
El cliente acepta una reunión
  → el modelo llama a "Consultar disponibilidad" (ventana de 7 días)
  → ofrece hasta 3 horarios, en días distintos, aclarando "horario de Argentina"
  → el cliente elige
  → el modelo pide el correo y ESPERA la confirmación
  → llama a "Agendar reunion" con el start_time exacto
  → cierra su mensaje con [AGENDADO] → etiqueta terminal + aviso por Slack
```

**Horario argentino, siempre.** La agenda es la del equipo comercial de Xtract, no
la del lead. El piloto tiene contactos en 16 países y un horario sin zona es la
forma más común de no-show.

**Por qué se pregunta el mail aunque esté en el CRM.** El dato puede tener dos años
—la persona pudo cambiar de puesto o de empresa— y la invitación se manda ahí: si
está mal, el cliente confirma una reunión y no le llega nada. Además deja registro
escrito de que aceptó.

#### Decisión: agendamiento determinista → herramientas del modelo

**Antes** esto eran 10 nodos: una máquina de estados que mapeaba *"el 2"* a un
instante exacto, guardaba las opciones en una nota privada y solo llamaba a
Calendly con `slot` + mail válido. Nada de eso lo decidía el modelo.

**Se cambió a herramientas** a pedido explícito: menos nodos y configuración más
simple. Lo que se gana, además de los 10 nodos, es que el bot ahora entiende
*"¿tenés algo el jueves a la tarde?"* — antes solo sabía mapear números.

Lo que se pierde hay que decirlo con todas las letras: **el modelo puede agendar
mal.** No va a haber un error en n8n; va a haber una reunión a otra hora en el
calendario de un cliente real. Se mitigó lo que se podía:

| Riesgo | Mitigación |
|---|---|
| Zona horaria equivocada | `timezone` va **fijo** en el nodo (`America/Argentina/Buenos_Aires`). El modelo no la puede tocar |
| Horario inventado | El `start_time` se copia **literal** de lo que devolvió la consulta; no hay aritmética de por medio |
| Evento o modalidad equivocados | `event_type` y `location.kind` salen del `Config`, fijos |
| Agendar sin confirmar el correo | Paso obligatorio del prompt — **esto sí depende del modelo**, no hay candado de código |

Los candados que **no** se tocaron y siguen siendo deterministas: opt-out, estado
terminal y tope de turnos. Esos corren antes de la IA y no dependen de ella.

> ⚠️ El tope de turnos ahora incluye los mensajes de coordinar la reunión, porque
> los contesta el modelo. Por eso `WA_MAX_TURNOS_BOT` pasó de 8 a 12: con 8, un
> cliente en medio de confirmar su correo se escalaba solo.

> Falta una segunda credencial **Header Auth para Calendly** (`Authorization:
> Bearer <token>`), aparte de la de Chatwoot, asignada a los dos nodos herramienta.

---

> ⚠️ **Sin verificar contra la instancia real:** que el payload de
> `message_created` traiga las etiquetas de la conversación. Se leen tres variantes
> conocidas (`conversation.labels`, `conversation.label_list`, `labels`). Si
> ninguna viene, el candado de estado terminal no se activa y hay que traerlas con
> un `GET /conversations/{id}/labels`.

**Arquitectura final:** `Notion (CRM, solo lectura) → Chatwoot (dueño del canal) → WhatsApp`.
Tracking del piloto en la hoja **`Enviados WA`** (+ `Interacciones`); **no se escribe en
Notion** — es el CRM del cliente y el piloto no toca su esquema.

**Verificado contra los 5 registros reales** (`5 Closed Lost VERDES.txt`):
el parser + normalizador de teléfonos produce 4 elegibles correctos
(`+5493471565084`, `+59898276718`, `+5493517567151`, `+5491127129056` — con el `9`
argentino insertado donde faltaba) y excluye al que no tiene teléfono.
Ver [`datos/datos-piloto.md`](datos/datos-piloto.md).

### Dónde entra la IA y con qué contexto

La IA vive en el **workflow 2** (recepción), en dos nodos Gemini vía HTTP:

| Nodo | Rol | Config |
|---|---|---|
| `IA - Clasificar intencion` | Etiqueta el último mensaje: `INTERESADO` / `CONSULTA` / `NO_INTERESADO` / `OTRO` | `temperature 0`, `maxOutputTokens 10` |
| `IA - Responder consulta` | Redacta la respuesta en la rama `CONSULTA` | `temperature 0.4`, `maxOutputTokens 300` |

**La memoria de la conversación es Chatwoot.** Antes de clasificar, el nodo
`Chatwoot - Traer historial` hace `GET /conversations/{id}/messages` y
`Armar contexto` reconstruye el hilo en formato Gemini (`role: user | model`).

> No se guarda historial en paralelo **a propósito**, por dos razones concretas:
>
> 1. **Son dos workflows sobre un mismo hilo.** La plantilla inicial la manda el
>    workflow 1. Un buffer creado en el workflow 2 arrancaría vacío y nunca vería
>    el mensaje que abrió la conversación.
> 2. **Estas conversaciones duran días.** El Simple Memory de n8n es estado de la
>    instancia: si n8n se reinicia, el hilo se pierde a mitad de camino. Y la doc
>    de n8n avisa que en queue mode directamente no funciona en producción.
>
> *Corrección:* antes acá decía que el motivo era la desincronización cuando un
> agente humano contesta desde la bandeja. **Ese argumento es falso en este
> diseño:** el humano recién aparece al escalar, y al escalar el bot queda mudo
> por el candado de estado terminal. Ese escenario no puede ocurrir.

Detalles del armado:

- Se descartan las **notas privadas** (`private: true`) y los **eventos de
  actividad** (`message_type: 2`) — no son conversación.
- Se recortan los últimos `WA_MAX_TURNOS` (default **12**).
- Gemini exige que el historial arranque con un turno del cliente. La plantilla
  inicial es nuestra, así que se descarta el arranque `model`.
- Si Chatwoot no responde, cae al mensaje que disparó el webhook: **degrada, no rompe**.

**El contexto del CRM va aparte, en `systemInstruction`** — separado de la
conversación para que el modelo no lo confunda con algo que dijo el cliente:

```
- Nombre del contacto: Gabriela Carrizo
- Empresa: SRK
- Pais: Argentina
- Sistema que usan hoy: Tango
- Motivo por el que se perdio la oportunidad: Precio alto / sin presupuesto…
- Fecha de la propuesta original: 2026-02-14
- Calificacion interna del lead: Verde (Mucho match)
```

Esos campos salen de Notion en el workflow 1 y viajan por la hoja `Enviados WA`.

**Barandas del prompt** (son las que evitan el desastre comercial):
prohibido inventar precios, plazos o funcionalidades; el motivo de pérdida se
propone como *algo para mostrar en la llamada*, nunca se afirma como resuelto; y si
no le alcanza la información, devuelve `ESCALAR` y la conversación va a un humano.

**Protecciones incorporadas:**
- Candado por inbox (`CHATWOOT_INBOX_ID`) y por lista del piloto — Chatwoot se usa
  para más cosas; el bot ignora toda conversación ajena.
- Anti-loop: solo `message_type = incoming` (Chatwoot dispara el webhook también
  para los mensajes del propio bot).
- `WA_LIMITE_TANDA` (default 20) para no quemar el número.
- Dedupe contra `Enviados WA`: nunca dos plantillas al mismo teléfono.

**Falta para probar:** token de Chatwoot + `CHATWOOT_URL/ACCOUNT_ID/INBOX_ID`
(el nodo `Chatwoot - Traer historial` también necesita la credencial header),
plantilla aprobada en Meta (con el link de Calendly), API key de Gemini, canal de
Slack, hoja con pestañas `Enviados WA` e `Interacciones`, y la respuesta sobre
**opt-in** (no hay campo en Notion).

---

## Lo que pide la tarjeta

> Agent activación de Closed lost via WhatsApp. Que tenga una conversación y si no
> sabe qué responder que vaya a Chatwoot. Objetivo que agende reunión.
>
> Trabaja los 4.057 opps dormidos del CRM. Clasifica por probabilidad de cierre,
> genera el mensaje correcto según etapa e historial, y lo ejecuta por
> WhatsApp/email. Revenue escondido que hoy nadie tiene tiempo de trabajar.

---

## 🚨 Riesgo a plantear antes de construir nada

Mandar WhatsApp a 4.057 contactos en Closed Lost es la vía más rápida a que le
**baneen el número** al cliente.

1. **Los mensajes iniciados por la empresa requieren plantilla aprobada por Meta.**
   Fuera de la ventana de 24 h no se puede mandar texto libre generado por IA.
   Esto cambia el diseño: el primer mensaje lo dicta la plantilla, no el agente.
   Recién si la persona responde se abre la ventana para conversar libre.
2. **Opt-in.** Meta exige consentimiento previo. Un lead perdido hace dos años
   difícilmente lo haya dado.
3. **Volumen + tasa de bloqueo.** Si un porcentaje marca "Bloquear" o "Reportar",
   Meta degrada la calidad del número y lo restringe. Es automático.
4. **Marco legal.** Ley 25.326 (AR), LGPD (BR), LFPDPPP (MX).

**Recomendación: arrancar por email.** No tiene ninguna de estas restricciones.
WhatsApp queda para quienes ya tengan conversación previa o consentimiento
explícito.

Ver detalles completos en [`investigacion.md`](./investigacion.md).

---

## Arquitectura del agente

```
                    ┌─────────────────────┐
                    │   NOTION CRM        │
                    │  (Closed Lost DB)    │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │  EXTRAER OPPS       │
                    │  Notion API Query   │
                    │  Status = "Closed"  │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │  SCORING            │
                    │  Reglas (sin IA)    │
                    │  Nodo Code          │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │  SEGMENTAR          │
                    │  Top 50/día         │
                    │  SplitInBatches     │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │  🤖 REDACTAR EMAIL  │
                    │  Gemini Flash       │
                    │  (free tier)        │
                    └────────┬────────────┘
                             │
                    ┌────────▼────────────┐
                    │  ENVIAR EMAIL       │
                    │  Brevo / SES        │
                    └────────┬────────────┘
                             │
              ═══════════════╪═══════════════
              WEBHOOK DE RESPUESTA
              ═══════════════╪═══════════════
                             │
                    ┌────────▼────────────┐
                    │  🤖 CLASIFICAR      │
                    │  INTENCIÓN          │
                    │  Gemini Flash       │
                    └────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
    ┌─────────▼──────┐ ┌────▼─────┐ ┌──────▼───────┐
    │  INTERESADO    │ │ CONSULTA │ │ NO INTERESADO│
    │                │ │          │ │              │
    │ → Notion:      │ │ 🤖 Resp. │ │ → Notion:    │
    │   "Contactado" │ │   1 turno│ │   "No        │
    │ → Slack al     │ │ → si no  │ │   contactar" │
    │   comercial    │ │   sabe:  │ │              │
    │ → Link Cal.com │ │ Chatwoot │ │              │
    └────────────────┘ └──────────┘ └──────────────┘
```

---

## 🤖 Los 3 puntos de IA

La IA entra en 3 puntos específicos del flujo. Todo lo demás es reglas o APIs
directas.

### 1. Redacción de email personalizado

**Modelo:** Gemini 2.0 Flash (free tier)
**Tokens:** ~800/llamada
**Por qué IA:** cada mail sale distinto porque el contexto del CRM es distinto.
Plantillas fijas no pueden mencionar datos específicos del historial de cada lead.

**Prompt:**
```
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

### 2. Clasificación de intención de respuestas

**Modelo:** Gemini 2.0 Flash (free tier)
**Tokens:** ~300/llamada
**Por qué IA:** la respuesta es texto libre, no hay forma de clasificarla con
reglas. El LLM detecta intención en cualquier idioma y estilo.

**Prompt:**
```
Clasificá la intención de esta respuesta a un email comercial.

EMAIL ORIGINAL: {{email_enviado}}
RESPUESTA: {{respuesta_cliente}}

Respondé SOLO con:
- INTERESADO
- CONSULTA
- NO_INTERESADO
- FUERA_DE_OFICINA
- IRRELEVANTE
```

**Acciones por categoría:**

| Categoría | Acción |
|---|---|
| `INTERESADO` | Notion → "Contactado" + Slack al comercial + link Cal.com |
| `CONSULTA` | Responder 1 vez con IA (punto 3) |
| `NO_INTERESADO` | Notion → "No contactar" + nunca más molestar |
| `FUERA_DE_OFICINA` | Reintentar en 7 días |
| `IRRELEVANTE` | Ignorar |

### 3. Respuesta a consultas (1 turno máximo)

**Modelo:** Gemini Pro o Flash (acá se juega la reunión)
**Tokens:** ~1.000/llamada
**Por qué IA:** necesita responder una pregunta técnica o de producto con
información precisa y cerrar sugiriendo una llamada.

**Prompt:**
```
El cliente respondió con una consulta. Respondé con información precisa
y cerrá sugiriendo una llamada corta.

Consulta: {{consulta}}
Contexto del cliente: {{contexto_crm}}
Info de producto: {{knowledge_base}}
```

Si la respuesta no es suficiente o el cliente sigue preguntando →
**escala a Chatwoot** (humano).

---

## Scoring: por qué sin IA

Es una fórmula con pesos en un nodo Code. Gratis, determinística y **explicable**
—si el comercial pregunta por qué uno está primero, hay respuesta.

```javascript
function calcularScore(opp) {
  let score = 0;

  // Etapa alcanzada (más avanzó = más probable que vuelva)
  const etapaPesos = {
    'Propuesta enviada': 5,
    'Demo realizada': 4,
    'Reunión agendada': 3,
    'Contacto inicial': 1
  };
  score += etapaPesos[opp.etapa] || 0;

  // Motivo de pérdida (precio/timing = segmento de oro)
  if (['precio', 'presupuesto', 'timing'].includes(opp.motivoPerdida)) {
    score += 4;  // no dijeron que no al producto
  } else if (opp.motivoPerdida === 'no interesado') {
    score -= 5;  // este realmente no quiere
  } else if (opp.motivoPerdida === 'competencia') {
    score += 1;  // ya eligió pero puede cambiar
  }

  // Recencia (perdidos hace menos de 12 meses = más frescos)
  const mesesDesde = calcularMeses(opp.fechaPerdida);
  if (mesesDesde < 6) score += 3;
  else if (mesesDesde < 12) score += 2;
  else if (mesesDesde > 24) score -= 2;

  // Engagement previo (más interacciones = más interés hubo)
  if (opp.cantidadInteracciones > 5) score += 3;
  else if (opp.cantidadInteracciones > 3) score += 2;

  // Monto del deal (priorizar deals grandes)
  if (opp.montoDeal > promedioDeals) score += 2;

  return score;
}
```

> Los perdidos por **precio** o **timing** son el segmento de oro: no dijeron que
> no al producto, dijeron que no en ese momento.

---

## Costos de IA — 50 contactos/día

### Consumo diario

| Punto de IA | Llamadas/día | Tokens/llamada | Total/día |
|---|---|---|---|
| Redactar email | 50 | ~800 | ~40.000 |
| Clasificar respuesta | ~10 | ~300 | ~3.000 |
| Responder consulta | ~3 | ~1.000 | ~3.000 |
| **TOTAL** | **~63** | | **~46.000** |

### vs. límites gratuitos de Gemini

| Modelo | RPD gratis | Necesitamos | Margen |
|---|---|---|---|
| Gemini 2.0 Flash | 1.500 | 63 | **24x de sobra** |
| Gemini 2.5 Flash | 500 | 63 | **8x de sobra** |

**Resultado: USD 0,00/mes en IA con 50 contactos/día.**

### Rate limit: 10 RPM

Solución: `SplitInBatches(10)` → `Wait(1 min)` → siguiente batch.
Los 50 emails se generan en ~5 minutos.

### Backup si el free tier cambia

| Modelo | 50 emails/día |
|---|---|
| DeepSeek V3 | ~USD 0,06 |
| DeepSeek R1 | ~USD 0,12 |

---

## Diseño recomendado vs. lo que pide la tarjeta

Más simple, más barato y probablemente con mejor conversión. La IA **consigue la
respuesta**; el humano cierra con el contexto cargado.

### Por qué así y no un agente conversacional completo

Para deals ya perdidos una vez, quien vuelve a levantar la mano quiere hablar con
una persona. El bot abre la puerta; cerrar es trabajo del comercial. Se evita
además la parte más difícil y riesgosa: sostener conversación multi-turno
coherente con 4.000 personas.

---

## Decisiones de diseño

### No se generan 4.057 mensajes únicos

Segmentar en 8–12 grupos (etapa × motivo de pérdida) con plantilla por grupo.
El LLM se reserva para el top del ranking (~300–500), donde la personalización paga.

### La personalización sale de los datos, no del modelo

El contexto real del CRM le gana a cualquier LLM inventando. El prompt incluye
datos específicos del historial de cada lead, no genéricos.

### No construir el sistema de agendamiento

Mandar un link de **Cal.com** (free). Ahorra 5–10 h y resuelve disponibilidad,
confirmaciones y recordatorios.

---

## Stack y costos operativos

| Pieza | Herramienta | Costo |
|---|---|---|
| Orquestación | n8n (ya lo tienen) | $0 |
| CRM / fuente de datos | Notion (ya lo tienen) | $0 |
| Clasificación | Nodo Code, reglas | $0 |
| LLM | Gemini Flash (free tier) | $0 |
| Envío | Brevo (300/día gratis) o Amazon SES ($0.10/1.000) | $0 – 0.50 |
| Agenda | Cal.com free | $0 |
| Handoff | Chatwoot self-hosted | $0 |

**Total operativo: USD 0/mes** (con Brevo free + Gemini free).

> ⚠️ Si el cliente ya tiene **Instantly**, usarlo para el envío: ya trae warm-up
> de dominio, rotación de casillas y manejo de respuestas.

---

## Nodos del workflow n8n

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO PRINCIPAL (outbound)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Schedule Trigger (diario, 9am)                              │
│     │                                                           │
│  2. Notion: Query Database                                      │
│     │  filter: Status = "Closed Lost"                           │
│     │  + NOT "No contactar"                                     │
│     │  + NOT ya enviado                                         │
│     │                                                           │
│  3. Code: Scoring (reglas, sin IA)                              │
│     │  → score por etapa, motivo, recencia, monto               │
│     │  → sort desc, tomar top 50                                │
│     │                                                           │
│  4. SplitInBatches (size: 10)                                   │
│     │                                                           │
│  5. Gemini Flash: Redactar email                                │
│     │  → prompt con contexto del CRM                            │
│     │                                                           │
│  6. Brevo/SES: Enviar email                                     │
│     │                                                           │
│  7. Notion: Update page                                         │
│     │  → Status = "Email enviado"                               │
│     │  → Fecha de envío = now                                   │
│     │                                                           │
│  8. Wait (1 min entre batches)                                  │
│     │                                                           │
│  └──→ volver a 4 hasta terminar                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE RESPUESTA (inbound)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Webhook: recibir respuesta de email                         │
│     │                                                           │
│  2. Notion: buscar opp original por email del remitente         │
│     │                                                           │
│  3. Gemini Flash: Clasificar intención                          │
│     │                                                           │
│  4. Switch (por categoría)                                      │
│     │                                                           │
│     ├── INTERESADO:                                             │
│     │   ├── Notion: Status → "Contactado"                       │
│     │   ├── Slack: notificar al comercial dueño                 │
│     │   └── Email: responder con link Cal.com                   │
│     │                                                           │
│     ├── CONSULTA:                                               │
│     │   ├── Gemini Pro: responder 1 vez                         │
│     │   ├── Email: enviar respuesta                             │
│     │   └── If segunda consulta → Chatwoot                      │
│     │                                                           │
│     ├── NO_INTERESADO:                                          │
│     │   └── Notion: Status → "No contactar"                     │
│     │                                                           │
│     ├── FUERA_DE_OFICINA:                                       │
│     │   └── Wait 7 días → reenviar                              │
│     │                                                           │
│     └── IRRELEVANTE:                                            │
│         └── (no hacer nada)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Esfuerzo estimado

| Versión | Horas |
|---|---|
| Con WhatsApp (lo que pide la tarjeta) | 60 – 110 |
| Agente conversacional por email | 35 – 60 |
| **Diseño recomendado (email + IA + CRM)** | **20 – 35** |

## Precio sugerido

- Fase 1 sola (clasificación y priorización): **USD 400 – 700**
- Diseño recomendado completo: **USD 1.200 – 2.000**
- Con WhatsApp: **USD 2.500 – 4.500**
- Mantenimiento: **USD 300 – 500/mes**

---

## Plan por fases

Cotizar y facturar **cada fase por separado**:

1. **Clasificación y priorización** — extraer los 4.057, puntuarlos, entregar
   lista ordenada. Valor inmediato: el equipo sabe a quién llamar primero.
   *Entregable en 1–2 semanas.*
2. **Agente por email con IA** — redacción personalizada con Gemini Flash,
   clasificación de respuestas, reactivación automática en Notion.
   Valida si la idea convierte.
3. **WhatsApp** — recién con 1 y 2 andando y el opt-in resuelto por el cliente.

---

## Preguntas abiertas

- [ ] **¿ID de la base de Notion?** — necesario para configurar la query
- [ ] **¿Qué propiedades tiene cada registro?** — nombre, email, empresa, etapa,
      motivo de pérdida, fecha, monto, comercial dueño, etc.
- [ ] **¿Cómo se llama el estado "Contactado" en Notion?** — el valor exacto del
      select/status al que hay que mover la tarjeta
- [ ] ¿Ya tienen WhatsApp Business API? ¿Número verificado, WABA activa?
- [ ] ¿Los 4.057 contactos dieron consentimiento para WhatsApp?
- [ ] ¿Chatwoot ya está funcionando y hay alguien atendiendo las escalaciones?
- [ ] ¿Cómo se procesa un "no me contacten más"? (baja automática obligatoria)
- [ ] ¿Tienen Instantly? ¿Con qué dominio/casillas?
- [ ] ¿Qué dominio/casilla de email se va a usar para enviar?
- [ ] ¿Tienen Cal.com configurado? ¿Qué calendarios?



**Asunto:** Accesos y definiciones para arrancar el piloto de Closed Lost por WhatsApp

Hola IAN

El piloto de reactivación de Closed Lost ya está construido y probado en todo lo que
se puede probar sin credenciales: los dos workflows de n8n (envío y recepción), el
bot que responde, el agendamiento contra Calendly y los controles para que no se
dispare de más.

Lo que falta ya no es desarrollo, son **accesos y tres definiciones**. Te lo ordeno
por lo que bloquea primero.

---

### 🔴 Bloqueante — sin esto no puedo probar nada

**1. Chatwoot — cuatro datos**

| Dato | De dónde sale |
|---|---|
| URL de la instancia | La barra del navegador, sin la barra final. Ej: `https://app.chatwoot.com` |
| Account ID | Está en la URL: `/app/accounts/`**`3`**`/dashboard` |
| **Inbox ID de WhatsApp** | Settings → Inboxes → entrar al inbox de WhatsApp → el ID queda en la URL |
| Access Token | Profile Settings → Access Token |

> Importante: el Inbox ID tiene que ser **el de WhatsApp**, no el de otro canal. El
> bot ignora todo lo que venga de otro inbox, así que con el ID equivocado no
> responde nunca y parece roto.

**2. Permiso para crear un webhook en Chatwoot**

En Settings → Integrations → Webhooks. Es lo que hace que el bot se entere de las
respuestas. Si preferís lo configuro yo con el acceso, o te paso la URL y lo cargás vos.

**3. Google Sheets — hoja de control del piloto**

La creo yo si me das permiso de edición, o me pasás una en blanco compartida. Lleva
dos pestañas con nombres exactos: `Enviados WA` e `Interacciones`. Esa hoja no es
solo tracking: **es lo que evita que le mandemos dos veces el mensaje al mismo
contacto.**

**4. Notion**

La integración ya está conectada, solo necesito que confirmes que tiene acceso a la
base correcta de Closed Lost.

---

### 🔴 Bloqueante — pero son decisiones, no accesos

**5. Opt-in — la pregunta más importante del proyecto**

Meta exige consentimiento previo para mandar plantillas de marketing. Un lead que se
perdió hace dos años difícilmente lo haya dado, y en Notion no hay ningún campo que
lo registre.

Si un porcentaje de los 144 marca "Bloquear" o "Reportar", **Meta le baja la
calificación al número — y le pega al número de toda la empresa, no solo al piloto.**

Necesito tu respuesta por escrito a tres cosas:

- ¿Estos contactos aceptaron alguna vez recibir WhatsApp nuestro? ¿Dónde consta?
- Si no consta, ¿avanzamos igual asumiendo el riesgo, o arrancamos por mail?
- ¿Con qué número se manda? ¿Es el número comercial principal de Xtract?

Marco legal aplicable: Ley 25.326 (AR), LGPD (BR), LFPDPPP (MX).

**6. Plantilla de Meta — hay que mandarla a aprobar ya**

Fuera de la ventana de 24 h, el primer mensaje tiene que ser una plantilla aprobada
por Meta: no se puede mandar texto libre. **La aprobación tarda entre unas horas y
varios días**, así que conviene mandarla en paralelo con todo lo demás.

Ya está redactada y lista para cargar. Necesito de tu lado:

- WABA (WhatsApp Business Account) activa
- Número verificado y conectado al inbox de Chatwoot
- Calidad del número en verde (Meta Business → WhatsApp Manager)
- Quién carga la plantilla: ¿vos o te paso el texto y lo hago yo?

Un detalle a definir: la plantilla trata de **vos** y el bot está configurado para
tratar de **usted**. Hay que unificar. Mi recomendación es usted en los dos, porque
son contactos fríos de hace tiempo y en varios países.

---

### 🟡 Necesario antes de salir en serio

**7. Slack**

- Credencial de Slack para n8n
- **Channel ID** del canal donde quieren los avisos (formato `C01ABCDEF`, no `#canal`).
  Se saca con click derecho en el canal → Ver detalles del canal → abajo de todo.

Se avisa en dos casos: cuando la conversación pasa a una persona y cuando se agenda
una reunión.

---

### 🟢 Solo afecta el agendamiento automático

**8. Calendly**

⚠️ Antes que nada: **la Scheduling API requiere plan pago de Calendly.** Textual de
la documentación: *"Calendly customers are required to be on a paid plan in order to
access or use applications calling the Scheduling API."*

- **¿En qué plan está Xtract?** Si están en free, esta parte no funciona como está y
  hay que rediseñarla con links por horario. Es la primera que necesito confirmar.

Si están en plan pago, necesito:

| Dato | De dónde sale |
|---|---|
| Personal Access Token | Calendly → Integrations → API & Webhooks → Personal Access Tokens |
| Event Type | Cuál es el evento que se usa para estas reuniones (el link de Calendly alcanza, el URI lo saco yo) |
| Modalidad | Zoom, Google Meet o presencial |

Todo el agendamiento trabaja en **horario argentino** y los mensajes lo aclaran
explícitamente.

---

### Lo que ya está resuelto y no necesita nada tuyo

- El modelo de IA que responde (Groq), con la credencial que ya está en la instancia
- Los dos workflows completos y probados con datos sintéticos
- Los controles: tope de mensajes antes de derivar a una persona, detección de bajas,
  manejo de mensajes en ráfaga y candado para no seguir hablando después de agendar

---

### Orden que propongo

1. Chatwoot (los cuatro datos) → puedo empezar a probar
2. Plantilla a Meta → mientras se aprueba, avanzo con el resto
3. Opt-in → definirlo antes del primer envío real
4. Sheets, Notion, Slack
5. Calendly

**La primera corrida real la haría con un solo envío a un teléfono nuestro**, no a los
144. Recién cuando esa conversación funcione de punta a punta —respuesta,
agendamiento, etiquetas— lo subimos.

Cualquier cosa me avisás y lo vemos juntos.

Saludos,
Santiago

---
# Accesos e información necesarios

Checklist para desbloquear el proyecto. Ordenado por quién lo tiene que dar.

> ✅ **Confirmado por el cliente (30/07/2026): tienen transcripciones disponibles.**
> Eso valida la edición de Workspace y que la función esté habilitada a nivel dominio.

---

## 🟠 Lo que queda por confirmar: ¿automática o manual?

Que la transcripción esté **disponible** no es lo mismo que se **active sola**.

Google Meet no transcribe por defecto en cada reunión: alguien la prende, o el
anfitrión la deja configurada como automática al crear el evento.

| Modo | Cómo funciona | Riesgo |
|---|---|---|
| **Manual** | Alguien la activa en cada reunión | 🔴 Alto — depende de que se acuerden |
| **Automática** | El anfitrión la deja configurada al crear la reunión | 🟢 Bajo — **recomendado** |

> **Por qué importa:** si nadie la activa, no hay transcripción, y sin transcripción
> no hay minuta. El sistema **no falla con error** — simplemente no encuentra nada y
> no manda nada. Va a parecer roto cuando nunca tuvo con qué trabajar.

**Pedido concreto:** dejar la transcripción en **automático** para las reuniones de
las tres áreas.

### Quién puede activarla

- **"Gestión de anfitriones"** desactivada → cualquier usuario del dominio.
- Activada → solo el anfitrión y coanfitriones.

Conviene saber en qué modo están.

---

## Requisitos de la plataforma (confirmados)

**Ediciones que incluyen transcripción** *(la de Xtract ya está validada)*:
Business Standard · Business Plus · Enterprise Starter · Enterprise Standard ·
Enterprise Plus · Teaching and Learning Upgrade · Education Plus · Workspace Individual

> Referencia: **Business Starter** es el único plan pago que NO la incluye.
> *(Ojo con el nombre: "Enterprise Starter" sí la tiene.)*

**Otras limitaciones:**

| Ítem | Detalle |
|---|---|
| Dispositivos | Computadora, notebook o **Android**. ❌ No desde iOS |
| Idiomas | Incluye **español** ✅ |
| Contenido | Solo palabras habladas — **no** captura el chat |
| Almacenamiento | Requiere espacio libre en el Drive del organizador |
| Ubicación | Carpeta `Google Meet` del Drive **del organizador**, con subcarpeta por reunión |

> El límite de iOS importa: si un owner entra siempre desde iPhone, no va a poder
> activar la transcripción.

---

## 🔑 Decisión de arquitectura: Drive, no Meet API

**Fuente única: Google Drive.** Se descartó la cadena Calendar → Meet API
(`conferenceRecords` → `transcripts` → `entries`) porque exige **Domain-Wide
Delegation** — un admin de Workspace tiene que habilitarla, y sin eso la API
devuelve vacío **sin ningún error** (falla en silencio).

En su lugar, el workflow mira directamente la carpeta de Drive donde Meet ya deja
la transcripción (`Google Meet` del Drive del organizador, subcarpeta por reunión)
con un **Google Drive Trigger**. Sin Calendar, sin Meet API, sin DWD — solo hace
falta que esa carpeta esté compartida con la cuenta que usa n8n.

## 🔑 Accesos a solicitar

### 1. Google Drive (fuente de la transcripción)

- [ ] **ID de la carpeta de Drive** de cada área (Hunting, Integraciones, Engagement)
      — o una carpeta compartida única si concentran ahí las transcripciones
- [ ] Esas carpetas **compartidas** con la cuenta/credencial que use n8n
- [ ] **Credencial OAuth2 de Google Drive** con acceso a esas carpetas

### 2. Google Drive (destino de la minuta generada)

El resumen que genera el LLM se guarda como un Google Doc nuevo, y ese link se
manda por Slack junto con el texto.

- [ ] **ID de la carpeta** donde van a quedar los Docs con las minutas generadas
      (puede ser una sola, no hace falta una por área)

### 3. Slack

- [ ] **Bot token** con permiso `chat:write`
- [ ] **IDs de los canales** de destino (el ID tipo `C05G…`, no el nombre)
      — uno por área, o uno solo si va todo al mismo lugar

---

## 📋 Información a definir con el equipo

### Identificación de las áreas

- [ ] **¿Quién organiza las reuniones de cada área?** La transcripción queda en el
      Drive **del organizador**. Si el organizador no es siempre el owner, hay que
      contemplar a los dos a la hora de compartir la carpeta.

### Formato de la minuta

- [ ] ¿Campos fijos (temas, decisiones, action items, próximos pasos) o texto libre?
      *(hoy: estructura fija — resumen, temas, decisiones, próximos pasos)*
- [ ] ¿Va al canal del área o DM al owner?
- [ ] ¿Se manda siempre, o solo si la reunión superó cierta duración?

---

## Resumen: qué destraba qué

| Necesito | De quién | Estado | Sin esto |
|---|---|---|---|
| Edición de Workspace con transcripción | Admin | ✅ **Confirmado** | — |
| Transcripción en **automático** | Admin / equipo | 🟠 A confirmar | Falla seguido y sin error visible |
| IDs de carpeta de Drive por área | Equipo | 🔴 Pendiente | No hay qué mirar |
| Carpetas compartidas + credencial de Drive | Admin / Ian | 🔴 Pendiente | El trigger no puede leer nada |
| Carpeta de destino para las minutas | Equipo | 🔴 Pendiente | No se puede crear el Doc con el resumen |
| Slack bot token + channel IDs | Ian / Admin | 🔴 Pendiente | No puedo enviar nada |

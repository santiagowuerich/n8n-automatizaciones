# Investigación — Fuente de transcripción y arquitectura del trigger

Investigado el 29/07/2026.

## ✅ Decidido

**Confirmado por el cliente:** Xtract usa **Google Meet** y paga **Google Workspace**.

→ Camino elegido: **Google Meet REST API**. Costo adicional **$0**, sin sumar
herramientas de terceros.

**Y una decisión de arquitectura:** el trigger se resuelve por **polling**, no con la
Workspace Events API. El porqué está en la sección de abajo — la Events API agrega
Pub/Sub y suscripciones que expiran sin poder renovarse.

---

## 🔴 El riesgo operativo #1: que nadie active la transcripción

Confirmado en la documentación oficial: **Meet no transcribe por defecto en cada
reunión**. Alguien la tiene que activar, o el anfitrión la tiene que dejar
configurada como automática al crear la reunión.

> Si no hay transcripción, **el sistema no falla con error: simplemente no encuentra
> nada y no manda nada.** Va a parecer que está roto cuando en realidad nunca tuvo
> con qué trabajar.

**Hay que confirmar que se puede dejar la transcripción en automático** para las
reuniones de las tres áreas. Si depende de que alguien se acuerde de apretar un
botón, el proyecto va a tener una tasa de fallo alta y difícil de diagnosticar.

Quién puede activarla depende de la config de **"Gestión de anfitriones"**:
desactivada → cualquier usuario del dominio; activada → solo anfitrión y coanfitriones.

---

## ⚠️ Ediciones que soportan transcripción

"Pagar Workspace" no alcanza. Lista oficial:

**Business Standard · Business Plus · Enterprise Starter · Enterprise Standard ·
Enterprise Plus · Teaching and Learning Upgrade · Education Plus · Workspace Individual**

> ❌ **Business Starter NO está en la lista** — es pago pero sin transcripción.
>
> ⚠️ Ojo con el nombre: **Enterprise Starter SÍ la tiene**. No confundirlo con
> *Business* Starter, que es el que no sirve.

→ Si están en Business Starter, hay que subir de edición o ir al plan B (Fireflies).
**Es la primera cosa a validar.**

### Otras limitaciones confirmadas

| Ítem | Detalle |
|---|---|
| Dispositivos | Computadora, notebook o **Android**. ❌ **No desde iOS** |
| Idiomas | Incluye **español** ✅ |
| Contenido | Solo palabras habladas — **no** captura el chat |
| Almacenamiento | Requiere espacio libre en el Drive del organizador |
| Ubicación | Carpeta `Google Meet` del Drive **del organizador**, subcarpeta por reunión |

> El límite de iOS importa: si un owner entra siempre desde iPhone, no puede activar
> la transcripción.

---

## 🚨 Domain-Wide Delegation — bloqueante, y con una trampa

Un service account **no puede autenticarse como sí mismo** contra la Meet API.
Necesita **domain-wide delegation**, que se habilita en la consola de administración
(*Security › API Controls › Domain-wide delegation*) y le permite **impersonar
usuarios**.

> 🔴 **La trampa del fallo silencioso:** el scope `meetings.space.created` es
> *principal-scoped*. Usado desde un service account **sin** delegación, **devuelve
> vacío o parcial sin lanzar ningún error**.
>
> Parece funcionar en las pruebas y falla en producción. Si al probar salen listas
> vacías y ningún error, **es esto** — no es un bug del código.

### 🎁 A cambio, resuelve el problema de las 3 cuentas

Con delegación, **un solo service account impersona a los tres owners**. No hacen
falta 3 licencias ni 3 configuraciones separadas, como sí requeriría Fireflies.

Y ya existe un service account en el proyecto (`n8n-sheets-connector@…`) usado para
Sheets: se le pueden sumar los scopes de Meet.

---

## Arquitectura del trigger: polling, no Events API

Evalué las dos formas de enterarse de que una reunión terminó.

### ❌ Workspace Events API — descartada

Es la opción "correcta" en teoría (push, tiempo real), pero trae dos problemas
serios:

**1. Exige Pub/Sub, no admite webhook directo.**
El `notificationEndpoint` es obligatorio y soporta **topics de Cloud Pub/Sub**. O
sea que la cadena sería:

```
Meet → Workspace Events → Pub/Sub topic → push subscription → webhook n8n
```

Dos piezas más de infraestructura en GCP para mantener.

**2. Las suscripciones expiran y NO se pueden renovar después.**
Cuando una suscripción expira, la API **la borra de forma permanente** — no se puede
renovar ni reactivar. Google avisa con eventos de ciclo de vida 12 h y 1 h antes, y
la práctica recomendada es tener una **tarea programada que las renueve** antes de
que caduquen.

Traducido: haría falta **un segundo workflow cuyo único trabajo es mantener vivo el
primero**. Y si esa renovación falla un fin de semana, la suscripción muere y hay
que recrearla a mano.

### ✅ Polling — elegida

```
Schedule (cada 15 min)
  → Meet API: listar conference records recientes
  → ¿alguno nuevo sin procesar?
  → traer transcript + entries
  → filtrar por área / owner
  → LLM arma la minuta
  → Slack
```

**Por qué gana acá:**

- Sin Pub/Sub, sin suscripciones, sin expiración, sin workflow de renovación.
- **La latencia no importa.** El pedido es "la minuta cuando salís de la reunión", y
  la transcripción de Meet igual tarda un rato en procesarse. 15 minutos es
  perfectamente aceptable.
- Mucho menos que pueda romperse en silencio.

**Contra:** hay que llevar registro de qué reuniones ya se procesaron (una hoja o
tabla con los IDs ya vistos). Es trivial comparado con mantener suscripciones vivas.

---

## Detalle técnico de la Meet API

- Los artefactos (grabación, transcripción) se guardan en el **Drive del organizador**
  y suelen estar listos poco después de que termina la reunión.
- Las `transcriptEntries` traen el texto por participante, con timestamps y código
  de idioma (IETF BCP 47).
- Máximo **10.000 palabras** por entrada.
- Los datos quedan disponibles **30 días** después de la reunión.
- ⚠️ **No hay API para captions en vivo** — solo post-reunión. Que es exactamente lo
  que necesita este proyecto.

---

## Lo que hay que pedirle al admin de Workspace

1. Confirmar la **edición** (Business Standard o superior).
2. Habilitar **domain-wide delegation** para el service account en
   *Security › API Controls › Domain-wide delegation*.
3. Autorizar los **scopes de la Meet API**.
4. Confirmar que la transcripción de Meet esté **activada** para los usuarios de las
   tres áreas.

> Requiere **permisos de administrador de Workspace**. Hay que identificar quién es
> el admin — no lo puede hacer cualquiera del equipo.

---

## Plan B — Fireflies Pro

Solo si están en Business Starter o si no se consigue el acceso de administrador.

| Plan | Precio | API |
|---|---|---|
| Free | $0 | ❌ |
| **Pro** | **USD 10/asiento/mes** (anual) | ✅ acá arranca la API |
| Business | USD 19/asiento/mes | ✅ |

Tiene **nodo oficial de n8n** ([`firefliesai/n8n-nodes-fireflies`](https://github.com/firefliesai/n8n-nodes-fireflies))
y trigger `transcription completed` configurable desde
*Settings › Developer Settings › Webhooks*. Setup mucho más simple.

**Pero:** solo dispara webhooks para reuniones donde la cuenta conectada es la
**organizadora**. Con 3 owners organizando sus propias reuniones → 3 asientos
(USD 30/mes) y 3 configuraciones.

> Los créditos de Fireflies (AskFred, resúmenes avanzados) no nos afectan: la minuta
> la genera nuestro propio LLM desde el texto crudo.

### Descartadas

**Fathom** (verificar si el free expone API), **tl;dv** (más caro, sin ventaja),
**Otter.ai** (sin ventaja), **Recall.ai / Vexa** (bots propios, overkill para un
flujo interno).

---

## Comparación final

| | Google Meet API *(elegida)* | Fireflies Pro |
|---|---|---|
| Costo mensual | **$0** | USD 30 (3 asientos) |
| Cuentas a conectar | **1** service account | 3 |
| Trigger | Polling cada 15 min | Webhook push |
| Setup | Requiere admin de Workspace | Autoservicio |
| Plataformas | Solo Meet | Meet, Zoom, Teams |
| Piezas que pueden romperse | Pocas | Pocas |

---

## Fuentes

- [Usar transcripciones con Google Meet | Ayuda de Meet (ES)](https://support.google.com/meet/answer/12849897?hl=es)
- [Google Meet REST API overview](https://developers.google.com/workspace/meet/api/guides/overview)
- [Work with artifacts | Google Meet](https://developers.google.com/workspace/meet/api/guides/artifacts)
- [Authenticate and authorize Meet REST API requests](https://developers.google.com/workspace/meet/api/guides/authenticate-authorize)
- [Create a Google Workspace subscription | Events API](https://developers.google.com/workspace/events/guides/create-subscription)
- [Receive and respond to lifecycle events | Events API](https://developers.google.com/workspace/events/guides/events-lifecycle)
- [Choose Google Workspace Events API scopes](https://developers.google.com/workspace/events/guides/auth)
- [Control API access with domain-wide delegation | Workspace Help](https://support.google.com/a/answer/162106?hl=en)
- [Use Transcripts with Google Meet | Meet Help](https://support.google.com/meet/answer/12849897?hl=en)
- [Turn meeting transcription on or off | Workspace Admin](https://knowledge.workspace.google.com/admin/meet/turn-meeting-transcription-on-or-off)
- [Google Meet User Management API Guide | Stitchflow](https://www.stitchflow.com/user-management/google-meet/api)
- [firefliesai/n8n-nodes-fireflies | GitHub](https://github.com/firefliesai/n8n-nodes-fireflies)
- [Pricing & Plans | Fireflies.ai](https://fireflies.ai/pricing)
- [Fireflies.ai Pricing Breakdown 2026 | Lindy](https://www.lindy.ai/blog/fireflies-ai-pricing)

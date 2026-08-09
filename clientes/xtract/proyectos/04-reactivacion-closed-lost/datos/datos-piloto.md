# Datos del piloto — análisis de los 5 "Verdes"

Analizado el 31/07/2026 sobre `5 Closed Lost VERDES.txt`.

## 🎯 El CRM es Notion

Confirmado por la estructura del export (`object: "page"`, `parent.database_id`).

| Dato | Valor |
|---|---|
| **Database ID** | `09549c92-28ea-4e15-9350-055b079ce9ac` |
| **Credencial en n8n** | Ya existe — `Notion account` (`Qzl01WxRKYH3HIrt`) |

→ Se puede leer directo de Notion, sin exportar a Sheet. Ver sección final.

---

## Campos útiles para la reactivación

| Propiedad Notion | Tipo | Uso |
|---|---|---|
| `Nombre Oportunidad` | title | Empresa |
| `Nombre KDM (SDR)` | rich_text | Nombre del contacto |
| `Whatsapp KDM` | phone_number | **El teléfono** |
| `Email KDM (SDR)` | email | Canal alternativo |
| `Motivo Lost` | multi_select | Contexto para el mensaje |
| `Calificacion` | status | Ya trae "Verde (Mucho match)" |
| `Que sistema usan?(*)` | select | **Excelente para personalizar** |
| `Fecha Discovery` / `Fecha Envío Propuesta` | date | Cuándo fue |
| `Owner(*)` | people | A quién avisar |
| `Pais(*)` | multi_select | Prefijo telefónico |
| `MRR(*)` / `One shot(*)` | number | Valor del deal |

> `Calificacion` ya hace el trabajo de scoring. **No hace falta reinventar la
> priorización** — el equipo ya calificó estos leads a mano.

---

## 🔴 Los 5 registros, uno por uno

| Oportunidad | KDM | WhatsApp | Estado |
|---|---|---|---|
| **Crucianelli** | Damian Tiberi | `3471565084` | ⚠️ **Sin prefijo de país** |
| **beitlermarcel@gmail.com** | Marcel Beitler | `+598 98 276 718` | ✅ Uruguay, OK |
| **IngeniaSA** | *(vacío)* | `+54 9 3517 567151` | ⚠️ Sin nombre de contacto |
| **SRK** | Gabriela Carrizo | `+54 11 2712-9056` | ⚠️ **Le falta el 9 de móvil** |
| **Santiago Perez** | *(vacío)* | *(vacío)* | ❌ **No contactable por WA** |

**De 5, solo 4 tienen teléfono. Y de esos 4, 2 necesitan corrección.**

### Problema 1 — Formato de teléfono

WhatsApp exige E.164 (`549XXXXXXXXXX`). Los números vienen cargados a mano y sin
criterio uniforme:

- `3471565084` → falta el país entero. Correcto: `5493471565084`
- `+54 11 2712-9056` → **le falta el `9`** que Argentina exige para móviles.
  Correcto: `5491127129056`. Sin el 9, WhatsApp lo trata como fijo y falla.

> Este es el error que **rompe todo en silencio**: el mensaje no se entrega, no hay
> excepción visible, y parece que el sistema anda pero nadie recibe nada.
> **Hay que normalizar antes de enviar.**

### Problema 2 — Faltan nombres

2 de 5 no tienen `Nombre KDM`. Sin fallback, el saludo sale *"Hola !"*.
→ Ya está cubierto en el código con un default, pero conviene completarlos.

### Problema 3 — Datos sucios en `Motivo Lost`

IngeniaSA tiene como motivo un mensaje pegado completo:
*"Hola Tomás! Disculpa la demora en r..."*

No es un motivo, es una conversación copiada. Si eso entra al prompt, la IA genera
cualquier cosa. **Hay que limpiarlo o truncarlo.**

### Problema 4 — Un `Nombre Oportunidad` es un email

`beitlermarcel@gmail.com` está cargado como nombre de la oportunidad. Si se usa como
"empresa" en el mensaje, queda ridículo.

---

## 🔥 Lo más importante: estos NO son leads dormidos

La tarjeta habla de *"4.057 opps dormidos"*. Los 5 Verdes **no lo son**:

| Empresa | Discovery | Propuesta | Se perdió hace |
|---|---|---|---|
| Crucianelli | 15/07 | 22/07 | **1 día** |
| SRK | 29/06 | 06/07 | **1 día** |
| Santiago Perez | 24/06 | — | 5 días |
| IngeniaSA | 22/05 | 26/05 | 7 días |
| Marcel Beitler | 15/07 | 15/07 | 8 días |

*(medido al 01/08/2026 sobre `Último cambio de Status`)*

Esto es **seguimiento caliente**, no reactivación de base fría. El comercial que
la trabajó probablemente todavía la tenga en la cabeza — o encima.

### Y ninguno dijo que no

Los cuatro motivos son de **timing**, no de rechazo:

| | Textual |
|---|---|
| Marcel Beitler | *"no es el momento va para mas adelante"* |
| IngeniaSA | *"cambios a nivel sistema TANGO… cualquier cambio de decisión **los vamos a contactar nuevamente**"* |
| SRK | *"Están en cambio de sistema"* (migrando de SOFTLAND) |
| Santiago Perez | *"Superó 30 días en Info recibida"* |
| Crucianelli | *(vacío)* |

> **Dos casos delicados:**
> **IngeniaSA** pidió expresamente que ellos contactaran. Un WhatsApp 7 días después,
> sin nada nuevo que ofrecer, va en contra de lo que pidieron.
> **Santiago Perez** ni siquiera es un rechazo: se cayó por inactividad **interna**.
> Nunca dijo que no — se le dejó de responder.

### Campos que existían y no se usaban

`Owner(*)` · `Cantidad de facturas(*)` · `Fecha Discovery` · `Fecha Primera Reunión` ·
`Reunión confirmada` · `Company Size` · `Origen` · `Link a Discovery(*)`

Todos menos el último ya alimentan la ficha que consume la IA. `Link a Discovery(*)`
es un **Google Doc con las notas del discovery** — es la conversación previa real, y
sigue sin leerse.

> El historial de Chatwoot arranca en la plantilla de este piloto. **La conversación
> comercial previa no está ahí**: toda tiene que inyectarse desde el CRM.

---

## ⚠️ Y el que no está en los datos: el opt-in

**No hay ningún campo de consentimiento** en la base de Notion.

Es el requisito de Meta y no se puede deducir de acá. Hay que preguntarlo antes de
mandar el primer mensaje.

---

## Recomendación: leer Notion directo

Ya existe la credencial, y el export a Sheet agrega un paso manual que se va a
desincronizar. Cambios necesarios:

1. Reemplazar `Leer Closed Lost` (Sheets) por un nodo **Notion → Database Page: Get Many**
   con filtro `Status(*) = Closed Lost` y `Calificacion = Verde (Mucho match)`.
2. Agregar un nodo **Normalizar teléfonos** justo después:
   - quitar todo lo que no sea dígito
   - si no empieza con código de país → anteponer el de `Pais(*)`
   - Argentina: asegurar el `9` después del `54`
   - descartar los que queden con menos de 10 dígitos
3. Escribir el resultado de vuelta en Notion (estado, fecha de envío,
   `conversation_id` de Chatwoot) en vez de en el Sheet.

Con 5 registros el Sheet alcanza para probar. Para los 100 conviene ir a Notion directo.

---

## Cuentas realistas del piloto

| | |
|---|---|
| Registros "Verdes" | 5 |
| Con teléfono | 4 |
| Contactables tras normalizar | 4 |
| **Sin normalizar el teléfono** | **2** (fallarían en silencio) |

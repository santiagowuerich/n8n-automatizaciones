# 02 — Agente de minutas (Hunting · Integraciones · Engagement)

**Estado:** 🟡 Workflow construido — bloqueado esperando accesos
**Origen:** 3 tarjetas de Trello asignadas por Tomás
**Workflow n8n:** `a3A4ncxQBVpBHSfi` · 21 nodos · **inactivo**
**Cotización:** pendiente

## Para poder probarlo faltan

| Qué | De quién |
|---|---|
| IDs de las 3 carpetas de Drive (transcripciones) + credencial con acceso | Ian / owners |
| ID de la carpeta destino para las minutas generadas | Equipo |
| Credencial de Slack + IDs de canal | Ian |
| API key de Gemini | ✅ ya configurada |

Detalle completo en [`accesos-requeridos.md`](accesos-requeridos.md).

### Dónde se configura cada cosa

Esta instancia de n8n **bloquea el acceso a variables de entorno** (`$env`) desde
Code nodes y expresiones — no es un tema de este proyecto, es una restricción de la
instancia. Por eso los valores por área están hardcodeados directamente en los nodos,
no en variables de entorno:

| Qué | Dónde se edita |
|---|---|
| ID de carpeta de Drive por área | Nodo `Drive - Nueva transcripcion <Área>` → `folderToWatch` |
| Canal de Slack por área | Nodo `Marcar area <Área>` → campo `slackChannel` |
| Carpeta destino de las minutas | Nodo `Crear documento con la minuta` → `folderId` |
| Modelo de Gemini | Nodo `Google Gemini Chat Model` → `modelName` |
| Límite de caracteres de la transcripción | Nodo `Armar prompt de la minuta` → constante `MAX` |
| Roster de ejecutivos comerciales | Nodo `Detectar ejecutivo comercial` → constante `EJECUTIVOS` |
| Base de conocimiento de Xtract | Nodo `Armar prompt de la minuta` → constante `BASE_CONOCIMIENTO` |
| Reglas de lo que la IA no debe pedir | Nodo `Armar prompt de la minuta` → constante `REGLAS` |

Agregar una cuarta área = un trigger de Drive + un Set de más, no un workflow nuevo.

---

## Las tres tarjetas

En Trello esto llegó como **tres tarjetas separadas**, una por área:

| Tarjeta | Reuniones que mira | Owner que dispara |
|---|---|---|
| Agente Minutas **Hunting** | discovery | owner de Hunting |
| Agente Minutas **Integraciones** | reuniones de integraciones | owner de Integraciones |
| Agente Minutas **Engagement** | reuniones de Engagement | owner de Engagement |

Las tres tienen la **misma descripción**:

> Que te mande la minuta de la reunión a Slack, cuando salís de la reunión.

Y el mismo condicional en el título: mandar **solo** cuando se presenta la cuenta
y está el owner del área correspondiente.

---

## 🔑 Decisión de arquitectura: UN workflow, no tres

Las tres tarjetas son **el mismo sistema con un parámetro distinto**. Comparten
generación de minuta y envío a Slack. Lo único que cambia es qué carpeta de Drive
mira, a qué canal llega y cómo se llama.

Construir tres workflows separados significa **triplicar los bugs y triplicar cada
actualización**. Si mañana hay que cambiar el prompt de la minuta, hay que
cambiarlo en tres lugares.

**Diseño:** un trigger de Drive + un nodo de etiquetado por área, todos convergiendo
en el mismo tramo de generación y envío.

> **Nota comercial:** son 3 tarjetas pero ~1,3× el trabajo de una, no 3×. Tampoco
> es ⅓ — el valor entregado son las tres.
> Ver [`tarifas.md`](../../../../docs/operacion/tarifas.md).

---

## Arquitectura

```
Google Drive Trigger (una por área, mira su carpeta de transcripciones)
  → Etiquetar área + canal de Slack
  → Descargar el Doc como texto plano
  → Extraer texto
  → Detectar ejecutivo comercial (match contra el roster)
  → Armar prompt de la minuta (+ base de conocimiento de Xtract + reglas)
  → LLM (Gemini) arma la minuta (resumen, temas, decisiones, próximos pasos)
  → Crear un Google Doc con la minuta (carpeta de resúmenes)
  → Formatear mensaje (texto + link al Doc)
  → Slack (canal del área)
  → Registrar en la hoja de control
```

**Por qué esta fuente y no Calendar → Meet API:** la Meet API exige Domain-Wide
Delegation, que solo puede habilitar un admin de Workspace a nivel dominio — y sin
eso devuelve vacío **sin ningún error** (falla en silencio). Mirar directamente la
carpeta de Drive donde Meet ya deja la transcripción evita ese bloqueante: alcanza
con que el owner comparta su carpeta con la cuenta que usa n8n. Detalle completo en
[`investigacion.md`](investigacion.md).

**Por qué un trigger por área:** el Google Drive Trigger solo puede mirar una
carpeta a la vez — no admite una tabla de configuración como hubiera sido posible
con Calendar. Tres triggers idénticos en estructura, cada uno con su carpeta.

---

## 🔑 Decisión: la base de conocimiento va entera en el prompt, no en un RAG

**Síntoma:** en una corrida real, la IA pidió *"una factura de ejemplo de Tango
para verificar que podemos leerla"*. Xtract lee cualquier factura de compra en PDF
sin importar el diseño. Ese pedido no solo sobra: le da al cliente la impresión de
que no sabemos si nuestro propio producto funciona.

**Por qué no RAG.** La base de conocimiento son **6.492 caracteres** (~2.000
tokens). Gemini 2.5 Flash tiene 1M de contexto y la transcripción ya viaja recortada
a 40.000 caracteres. El prompt completo queda en **~9.600 tokens** — 1% de la
ventana. Un vector store resuelve el problema de "el corpus no entra en el prompt",
que acá no existe. A cambio agrega embeddings, base vectorial y reindexado, y
**empeora la precisión**: el retriever puede devolver el chunk equivocado y la IA
queda ciega justo en el dato que necesitaba. Entera en el prompt no falla nunca.

**Dos piezas, no una.** Meter la base de conocimiento sola no alcanzaba: el prompt
viejo pedía explícitamente *"la versión exacta del ERP"*, y eso es lo que empujaba
a la IA a pedir la factura de muestra. Por eso van dos constantes:

- `BASE_CONOCIMIENTO` — qué es Xtract, módulos, integraciones, métricas, y **qué no
  está definido** (precios, formatos no-PDF, límites de API). La IA lo da por sabido.
- `REGLAS` — la lista de lo que **no** debe pedir. Cada regla existe porque la IA
  ya se equivocó de esa forma. Van **después** de la transcripción, no antes: lo
  último que lee es lo que más pesa.

Fuente editable en prosa: [`../../base-conocimiento.md`](../../base-conocimiento.md).

> ⚠️ El texto está **duplicado** entre ese `.md` y la constante del nodo. Al editar
> uno hay que replicar el otro. Se puede unificar leyendo un Doc de Drive en cada
> corrida — ver abajo.

**Alternativa: la base de conocimiento en un Doc de Drive.** Deja que Xtract la
edite sin tocar n8n, y elimina la duplicación. Cuesta un nodo de descarga más y
**un guardrail**: si la descarga falla, el prompt sale sin base de conocimiento y
la IA vuelve a alucinar *en silencio*. Habría que cortar la ejecución, no seguir
sin contexto. Vale la pena solo cuando el cliente quiera mantenerla él.

---

## 🔑 Decisión: el ejecutivo comercial se detecta por match, no con la IA

El documento y el mensaje de Slack abren con **quién de Xtract estuvo en la reunión**.

Ese dato **no se le pregunta a Gemini**. La transcripción ya lo trae de forma
estructurada: la sección `Asistentes` y el prefijo `Nombre:` de cada línea del
cuerpo. Pedírselo al LLM sería cambiar un dato exacto por uno probable — devolvería
"Juan" donde el CRM dice "Juan Alvarez", o inventaría un nombre en una reunión donde
no estuvo ninguno. El nombre del ejecutivo se cruza después con el CRM: tiene que
coincidir exacto.

**Cómo matchea** (nodo `Detectar ejecutivo comercial`):

- Normaliza con el `normKey()` del repo (NFD, sin acentos, minúsculas) — así
  `Nicolas Gonzalez` en la transcripción matchea `Nicolás Gonzalez` del roster.
- Un ejecutivo coincide solo si **todos** sus tokens están en el candidato
  (ignorando partículas: `de`, `del`, `la`…). `Juan Alvarez` matchea
  `Juan Alvarez (Xtract)` pero **no** `Juan Perez`.
- Descarta notetakers (`Juan's Fathom Notetaker`, Otter, Fireflies, Read AI).
- Busca en `Asistentes` **y** en quién habla. Si alguien estuvo mudo, igual lo detecta.
- Si hay más de uno, el **principal es el que más intervino**; los demás quedan
  listados como "también presentes".

**Roster actual** (editable en la constante `EJECUTIVOS` del nodo):

| Ejecutivo | Cuentas asignadas |
|---|---|
| Nicolás Gonzalez | 394 |
| Juan Alvarez | 127 |
| Tomas Marconi | 60 |
| Jesús De Gruttola | 26 |
| Damian Deggeller | 16 |
| Matías Febré | 3 |
| Wenceslao Hoepner | 1 |
| Jesús Soria | — (sin dato) |

**Probado** contra `Ejemplos/DISCOVERY - VERDE - QUENTO.docx`: detecta
`Juan Alvarez` (277 intervenciones), descarta el notetaker y no confunde al cliente
`Rodrigo Carril`.

**Cuando no identifica a nadie**, el mensaje igual se manda, con
`Sin identificar` y un `:warning:` en Slack en vez del ícono de persona. Preferible
un aviso visible a un silencio: si la detección falla, el área se entera en el momento.

> ⚠️ La hoja de control necesita una columna nueva `ejecutivo`.

---

## A definir antes de cotizar

### Bloqueantes técnicos

- [ ] **¿La transcripción de Meet está activada** para los usuarios de las 3 áreas,
      y en automático (no depende de que alguien la prenda a mano)?
- [ ] **¿Cada owner puede compartir su carpeta de Drive** con la cuenta de n8n, o
      hace falta pedírselo a un admin?

### Alcance funcional — sigue abierto

- [ ] **¿Se procesa cualquier archivo nuevo en la carpeta, o hace falta filtrar por
      tipo de reunión?** Antes, el filtro por título del evento de Calendar
      resolvía esto (`Discovery — [Cliente]` vs. una reunión interna). Al detectar
      por carpeta de Drive, **se perdió ese filtro**: si el owner tiene reuniones
      de otro tipo en la misma carpeta de Meet, hoy generarían minuta igual.
      Si hace falta, se puede agregar un filtro por nombre del archivo/reunión
      antes de generar la minuta — falta definir el criterio.
- [ ] **¿Formato de la minuta?** Hoy es estructura fija (resumen, temas,
      decisiones, próximos pasos). ¿Sirve así o hace falta otra cosa?
- [ ] **¿Se manda siempre, o solo si la reunión superó cierta duración?**
- [ ] **Si no se detecta ningún ejecutivo del roster, ¿se manda igual con el aviso,
      o no se manda?** Hoy se manda con `Sin identificar` + `:warning:`. El título
      de las tarjetas dice "solo cuando está el owner del área" — si eso es literal,
      hay que cortar el envío, y para eso hace falta saber **qué ejecutivo pertenece
      a qué área** (el roster que pasaron no lo trae).

> Antes de escribir una línea de código más: preguntar esto en el comentario de las
> tarjetas. Define alcance y da la información real para cotizar.

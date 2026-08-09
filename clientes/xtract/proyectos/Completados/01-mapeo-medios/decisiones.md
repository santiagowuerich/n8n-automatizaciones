# Decisiones — Mapeo de medios / Potencial Entregable

Cada entrada dice **qué** se decidió y, sobre todo, **por qué**. Si algo acá parece
raro, probablemente resolvió un problema concreto que no es obvio desde el código.

---

## Upsert en lugar de borrar y reescribir

La versión original **borraba la hoja `Potenciales` completa** cada semana y la
reescribía con los nuevos 120.

Eso destruía todo lo que se había agregado encima: enriquecimiento, artículos,
notas del comercial. Y convertía los hipervínculos en texto plano.

**Ahora:** el nodo `Ya existe?` bifurca. Los que ya están van a `Actualizar Flags`
(que toca **solo** `En Cola`, `Ranking` y `Verificado`); los nuevos van a
`Agregar Nuevos`. Ninguna fila se borra. La hoja acumula.

**Consecuencia esperada:** `Potenciales` tiene más de 120 filas. La lista de
trabajo es la vista filtrada por `En Cola = Sí`, que siempre da exactamente 120.

---

## `Seguimiento` es la fuente de verdad de "ya contactado"

Antes el filtro era por `Status`, contra una lista de estados cerrados:
`contactado, respondio, descartado, no interesa, cliente`.

**El problema:** el desplegable de la hoja tiene además **"Reunión Agendada"** y
**"Lista de Espera"**, que no estaban en esa lista. Esos contactos volvían a
entrar al Top 120 semana tras semana.

**Ahora:** se lee la hoja `Seguimiento` y se excluye a cualquiera que esté ahí,
sin importar su Status. Como el Apps Script copia a Seguimiento en los dos
sentidos (cambio desde Potenciales o desde Influencers), alcanza con estar ahí
para no volver nunca más.

Esto agregó `Leer Hoja Seguimiento` como tercer input del merge `Combinar Hojas`
(pasó a `numberInputs: 3`). El nodo tiene que ser **ancestro** de `Filtrar Top 120`
para que `$('Leer Hoja Seguimiento')` tenga datos.

---

## Lectura de esquema dual (Influencers vs Potenciales)

Las dos hojas usan **nombres distintos para los mismos campos**. Esto causó un bug
donde **todos los leads recibían Score 7**: el código leía `row["Score"]`, pero
Influencers tiene la columna como `Score de Relevancia`, así que caía siempre al
default.

**Ahora** se lee con fallback en cadena:

| Campo interno | Influencers | Potenciales |
|---|---|---|
| `Score` | `Score de Relevancia` | `Score` |
| `Tipo` | `Tipo de contacto` | `Tipo` |
| `Email` | `Correo electronico` | `Email` |
| `Instagram` | `Twitter - Bluesky` | `Instagram / X` |
| `LinkedIn` | `Linkedin` (minúscula) | `LinkedIn` |
| `Nicho` | `Dedicación / Nicho` | `Nicho` |
| `Mensaje` | columna larga del pitch | `Mensaje` |

> ⚠️ Al tocar `Filtrar Top 120`, respetar estos fallbacks. Es el bug que más veces
> volvió.

---

## `executeOnce` en `Leer Potenciales`

Después de que `Agregar Nuevos` escribe, pasa 120 items aguas abajo. Sumado a los
de `Actualizar Flags`, `Leer Potenciales` recibía ~240 items y **leía la hoja 240
veces**.

Resultado: `Quota exceeded for quota metric 'Read requests per minute per user'`.
El nodo fallaba, `Preparar Feeds` recibía 0 items utilizables y la cadena de RSS
nunca corría.

**Ahora:** `executeOnce: true`. Lee una sola vez.

---

## Rotación semanal de dominios en Hunter

`Lista de Dominios Hunter` devolvía los **63 medios en cada corrida** → 63 llamadas
semanales. El plan gratuito de Hunter son ~25/mes, así que la mayoría fallaba
silenciosamente (tienen Continue On Fail).

**Ahora:** rota por número de semana ISO, `BATCH = 15` por corrida.

```javascript
const week   = Math.floor((now - startOfYear) / (7*24*60*60*1000));
const offset = (week * BATCH) % medios.length;
```

Determinística (dos corridas en la misma semana dan el mismo lote) y circular.
Recorre los 63 en ~5 semanas. Como 63 no es múltiplo de 15, el punto de arranque
se corre entre ciclos y los lotes no se repiten idénticos.

Bajar `BATCH` para consumir menos cuota.

---

## Columna `Verificado`

Marca si el email vino de Hunter, que los entrega verificados.

Regla: `Fuente de Prospección` contiene "hunter" → `Sí`, si no → `No`.
**Preserva un `Sí` previo**, para no pisar una verificación puesta a mano.

`Agregar Nuevos` usa `autoMapInputData`, así que le alcanzó con que el campo
existiera en la salida. `Actualizar Flags` usa `defineBelow`, así que hubo que
sumarlo al `schema` **y** al `value`.

---

## Deduplicación por nombre normalizado

```javascript
function normKey(s){
  return (s||"").toString().normalize("NFD").replace(/[̀-ͯ]/g,"")
                .toLowerCase().replace(/\s+/g," ").trim();
}
```

Sin esto, `André Lopes` y `Andre Lopes` entraban como dos personas distintas.

> Ojo: en el flujo de **descubrimiento**, `Deduplicar candidatos` usa otro criterio
> —prioriza la URL de perfil (LinkedIn → Twitter → GitHub) y solo cae al nombre si
> no hay ninguna. Es a propósito: ahí hay URLs confiables, en la selección se
> trabaja sobre nombres ya cargados.

---

## Google News RSS en lugar de Apify para artículos

Se evaluó Apify (`google-search-scraper`) pero tarda ~45 s por query — inviable
para 120 contactos.

**Google News RSS** es gratis, instantáneo y sin API key:
`news.google.com/rss/search?q="Nombre" Medio`

Cobertura ~70%. Los que no traen suelen tener nombres muy comunes.
Los links apuntan a `news.google.com` y redirigen a la nota real.

---

## Bright Data: async con polling, no sync

El endpoint síncrono devolvía `"still in progress"` en vez de datos.

**Patrón correcto:** `/trigger` → `Wait 60s` → `/progress/{id}` → IF listo →
`/snapshot/{id}`.

También hubo un problema de matching por acentos en las URLs
(`andr%C3%A9-lopes` vs `andré-lopes`): se resolvió con `decodeURIComponent()`
dentro de try/catch, usando el campo `input_url` directo.

---

## Continue On Fail en todos los nodos ejecutables

Si una fuente se cae o un dominio no devuelve nada, esa rama queda vacía pero el
resto del flujo llega hasta el final. Sin esto, un feed RSS roto mataba la corrida
entera.

Contrapartida: los errores no gritan. Si un lunes hay menos resultados de lo
esperado, hay que mirar el historial de ejecuciones y buscar qué nodo quedó gris.

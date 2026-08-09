# Decisiones — Análisis de Churn (Grafana)

Cada entrada dice **qué** se decidió y, sobre todo, **por qué**. Si algo acá parece
raro, probablemente resolvió un problema concreto que no es obvio desde el código.

---

## Grafana Query API en lugar de acceso directo a BD

Se podría conectar n8n directo a PostgreSQL/MySQL con un nodo de base de datos.
**No se hace así** porque:

1. El cliente ya tiene Grafana configurado con permisos y conexión a la base de
   facturación. Sería duplicar configuración y exponer otra credencial.
2. La API de Grafana (`/api/ds/query`) permite reutilizar esa conexión sin dar
   acceso directo a la BD. Es más seguro: el token de service account se puede
   rotar sin tocar la base de datos.
3. Si en el futuro cambian la base de datos o la conexión, se actualiza solo en
   Grafana — el workflow de n8n no se entera.

**Contrapartida:** dependemos de que Grafana esté levantado y responda. Si Grafana
cae, el workflow no puede correr.

---

## Mediana en lugar de promedio para líneas base

Tanto en Señal A (cadencia) como en Señal B (volumen histórico) se usa la
**mediana**, no el promedio aritmético.

**Por qué:** el promedio es sensible a valores extremos. Si un cliente emite una
factura de prueba de $1 y otra de $10.000, el promedio da ~$5.000 y no representa
la realidad. La mediana da $5.000 también en ese caso, pero en una serie de gaps
`[28, 30, 35, 90]` el promedio da ~46 mientras la mediana da 32 — mucho más
representativa de la cadencia típica.

En volumen: un mes con 20 facturas y otro con 0 por vacaciones no deberían
sesgar la línea base. La mediana maneja eso naturalmente.

---

## Ventana día-a-día en Señal B

El cálculo de caída de volumen compara el **mismo día del mes**. Si hoy es 15,
compara los primeros 15 días de cada mes.

**Problema que resuelve:** una corrida el día 1 del mes siempre mostraría
"caída del 100%" si comparamos el mes completo contra meses anteriores, porque
el mes actual tiene 1 día de datos y los anteriores tienen 30.

Sin esta corrección, el sistema generaría falsos positivos los primeros días
de cada mes para virtualmente todos los clientes.

---

## Persistencia de 3 días para clientes nuevos

Los clientes con menos de 12 meses de historia tienen poca data para establecer
una cadencia confiable. Una semana sin facturar puede ser normal (por ejemplo,
recién están configurando el sistema).

**Regla:** alertar solo si se mantienen en nivel de riesgo por **3 días consecutivos**.

Se implementa leyendo el sheet del día anterior y acumulando un contador
`dias_consecutivos_riesgo`. Si el cliente sale de riesgo un día, el contador se
reinicia a 0. Esto evita que se acumulen días no consecutivos.

---

## Ajuste estacional por YoY (año contra año)

Negocios como contadores o agencias tienen picos estacionales predecibles
(cierre fiscal, temporada de impuestos, etc.).

**Regla:** si el cliente tiene ≥12 meses de historia Y el volumen del mismo mes
del año anterior es similar (diferencia ≤20%), se resta 1 nivel de severidad.

**Por qué es conservador:** solo aplica si el cliente ya tiene al menos una señal
activa (no descuenta sobre un cliente sano). El ajuste es de a lo sumo -1 nivel,
nunca lleva a 0 si había señales fuertes.

---

## Reescribir sheet completo en lugar de upsert

La hoja `Estado Clientes` se limpia y reescribe completa en cada corrida.

**Por qué:** el tablero es un snapshot diario. Si hiciéramos upsert, cualquier
cambio de schema (columnas nuevas, renombres) dejaría datos huérfanos. Además,
es más simple: no hay que mantener un identity column ni reconciliar IDs.

**Contrapartida:** si el workflow falla después de limpiar el sheet pero antes
de reescribir, el sheet queda vacío hasta la próxima corrida. Esto es aceptable
porque:
- La próxima corrida es al día siguiente a las 7 AM
- El sheet `Estado Clientes` es un tablero de consulta, no una fuente de verdad crítica
- El sheet `Historial Alertas` mantiene el registro histórico por separado

---

## NoOp como terminador de rama "sin cambios"

Cuando no hay alertas, el flujo termina en un nodo `noOp` en lugar de simplemente
no conectar la salida `false` del IF.

**Por qué:** n8n sin una rama conectada no la muestra en el canvas, y si se
desconecta la salida false, cualquier persona que abra el workflow puede pensar
que falta cablear algo. El noOp hace explícito que "no hacer nada" es el
comportamiento esperado.

---

## Mensaje consolidado vs alertas individuales en Slack

Todas las alertas del día se consolidan en **un solo mensaje**, no un mensaje
por cliente.

**Por qué:** si 15 clientes empeoran el mismo día, 15 mensajes individuales
son ruido. Un solo mensaje con la lista ordenada por MRR permite al equipo
evaluar el panorama completo de un vistazo.

**Excepción:** la primera corrida envía una línea base con estadísticas generales
y top 10, marcando el estado inicial para que las corridas siguientes solo
reporten cambios (delta).

---

## MRR estimado con ventana fija de 3 meses

El MRR se calcula como promedio simple de los últimos 3 meses.

**Por qué:** 3 meses dan suficiente ventana para suavizar variaciones sin
volverse insensible a cambios recientes. Usar 12 meses haría que el MRR sea
lento en reflejar una caída actual. Usar 1 mes sería demasiado volátil.

---

## ContinueOnFail en Webhook CRM (Opcional)

El nodo `Webhook CRM Action (Opcional)` tiene `continueOnFail: true`.

**Problema que resuelve:** el webhook corre en paralelo con Slack y el Historial
Alertas. Si el webhook fallaba (timeout, 500, URL vacía), toda la ejecución
fallaba y se perdían las alertas de Slack y el historial. Con `continueOnFail`,
el error del webhook se registra pero no mata la ejecución.

**Por qué no se usó `neverError` o rama separada:**
- `continueOnFail` es una línea y resuelve el problema con mínimo riesgo
- `neverError` no existe en HTTP Request (solo `response.neverError` que es distinto)
- Separar en rama propia con IF duplicado agregaba complejidad innecesaria
- El webhook es opcional — si falla, el sistema igual funciona

**Contrapartida:** no hay retroalimentación si el webhook falla. El error queda
en el historial de ejecución de n8n pero no salta a la vista. Aceptable porque es
un componente opcional de la arquitectura.

---

## Columnas explícitas en Sheet en lugar de autoMapInputData

La hoja `Estado Clientes` usa `defineBelow` con 26 columnas explícitas en lugar
de `autoMapInputData`.

**Problema que resuelve:** `autoMapInputData` mapea **todas** las propiedades
del JSON como columnas. Los objetos intermedios del algoritmo (`facturas`,
`mesesMap`, `mesesKeys`, `insuficiente_historia`) terminaban como columnas en
el sheet, ensuciando el tablero y haciendo confusa la visualización.

**Columnas incluidas (26):**
`cliente_id`, `cliente_nombre`, `estado_final`, `nivel_numerico`, `mrr_estimado`,
`meses_historia`, `ultima_factura`, `cadencia_dias`, `silencio_dias`,
`ratio_recencia`, `estado_recencia`, `nivel_recencia`, `estado_volumen`,
`nivel_volumen`, `caida_volumen_pct`, `racha_descendente`, `ajuste_estacional`,
`dias_consecutivos_riesgo`, `estado_ayer`, `transicion`, `empeoro`, `mejoro`,
`es_primera_corrida`, `tiene_alerta`, `tipo`, `slack_message`

**Por qué `defineBelow` y no `autoMapInputData`:**
- Control explícito de qué columnas aparecen
- Si en el futuro se agregan campos intermedios, no contaminan el sheet
- La hoja es más predecible y fácil de leer para el cliente
- La desventaja (mantener el mapping al agregar/quitar columnas) es menor
  comparado con el ruido visual de tener 15 columnas basura

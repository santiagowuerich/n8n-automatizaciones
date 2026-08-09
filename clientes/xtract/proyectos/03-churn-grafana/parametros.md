# Parámetros del análisis de desvíos

Referencia completa de todos los valores que gobiernan el sistema, extraídos del
workflow `v6`. Sirve para calibrar y para la conversación con el cliente.

> **Principio de fondo:** todos los umbrales son **relativos al propio cliente**,
> nunca contra un promedio de la cartera.

---

## 1. Ventanas temporales

| Parámetro | Valor | Dónde se usa |
|---|---|---|
| Historia para calcular cadencia | **6 meses** | Señal A |
| Base histórica de volumen | **6 meses previos** (excluye el actual) | Señal B / D |
| Cálculo de MRR | **últimos 3 meses** | Estacionalidad & MRR |
| Racha descendente | **3 meses cerrados** | Señal C |
| Comparación interanual | requiere **12+ meses** | Estacionalidad |
| Aceleración de cadencia | **últimos 30 días** | Señal D |
| Ventana de comparación mensual | **día 1 → día actual** | Señal B / D |

> ⚠️ La ventana mensual es proporcional a propósito: si hoy es día 10, compara los
> días 1–10 de los meses previos. Comparar 10 días contra 30 haría que toda la
> cartera pareciera estar cayendo.

---

## 2. Señal A — Recencia

```
cadencia = mediana(días entre facturas consecutivas, últimos 6 meses)
silencio = días desde la última factura
ratio    = silencio / cadencia
```

| Umbral | Estado | Nivel |
|---|---|---|
| ratio > 2 | 🟡 Amarillo | 1 |
| ratio > 3 | 🟠 Naranja | 2 |
| ratio > 5 | 🔴 Rojo | 3 |

**Casos borde:**

| Situación | Comportamiento |
|---|---|
| Menos de **2 facturas** en total | `insuficiente_historia` → se marca ⚪ Sin datos |
| Menos de 2 facturas en los últimos 6 meses | cadencia default = **30 días** |
| cadencia = 0 | ratio = **999** (fuerza rojo) |

---

## 3. Señal B — Caída de volumen

```
base   = mediana(facturas por mes, últimos 6 meses, misma ventana)
actual = facturas del mes en curso hasta hoy
caída% = (base − actual) / base
```

| Umbral | Estado | Nivel |
|---|---|---|
| ≥ 30% | 🟡 Amarillo | 1 |
| ≥ 50% | 🟠 Naranja | 2 |
| ≥ 70% | 🔴 Rojo | 3 |

**Requiere:** al menos **2 meses previos** con datos.
**Nota:** el valor se recorta a 0 — las subas se procesan en la Señal D.

---

## 4. Señal C — Racha descendente

Se cumple si los **3 meses cerrados** anteriores fueron cada uno menor al previo:
`M-3 > M-2 > M-1`. Excluye el mes en curso.

**Efecto:** no dispara sola. **Suma +1 nivel** de gravedad (con tope en 3), y solo
si ya hay algún nivel de riesgo.

---

## 5. Señal D — Desvío positivo *(agregada por pedido de Tomás)*

| Umbral | Estado | Nivel |
|---|---|---|
| ≥ `UMBRAL` (default **50%**) | 🟢 Crecimiento | 1 |
| ≥ `UMBRAL × 2` (default **100%**) | 🟢 Crecimiento fuerte | 2 |

**Aceleración de cadencia** — segunda vía de detección:

```
cadencia_reciente(30 días) ≤ cadencia_histórica / 2
```

Requiere **≥3 facturas** en los últimos 30 días. Si se cumple y no había suba de
volumen, marca nivel 1.

> Es una categoría **independiente**: no escala la gravedad de churn.
> Y siempre reporta el **valor absoluto** junto al % (`34 facturas vs. 12 habituales`)
> para distinguir crecimiento real de una carga acumulada.

---

## 6. Estacionalidad

| Parámetro | Valor |
|---|---|
| Historia mínima requerida | **12 meses** |
| Comparación | mes actual vs. **mismo mes del año anterior** |
| Tolerancia | **±20%** |
| Efecto | **−1 nivel** de gravedad |

Solo se aplica si el cliente ya tiene algún nivel de riesgo
(`nivel_recencia > 0 || nivel_volumen > 0`).

---

## 7. Persistencia *(anti falsos positivos)*

| Parámetro | Valor |
|---|---|
| Aplica a | clientes con **menos de 12 meses** de historia |
| Días consecutivos en riesgo requeridos | **3** |

Un cliente con poca historia tiene que sostener la señal 3 días seguidos antes de
generar alerta. Los con 12+ meses alertan de inmediato.

---

## 8. Cómo se combina el nivel final

```
nivel = max(nivel_recencia, nivel_volumen)
si racha_descendente y nivel > 0  →  nivel = min(nivel + 1, 3)
nivel = max(nivel + ajuste_estacional, 0)
```

| Nivel | Estado |
|---|---|
| 0 | 🟢 Normal |
| 1 | 🟡 Amarillo |
| 2 | 🟠 Naranja |
| 3 | 🔴 Rojo |
| — | ⚪ Sin datos *(historia insuficiente)* |

---

## 9. Detección de transiciones

Solo se reporta lo que **cambió respecto de ayer**:

| Evento | Condición |
|---|---|
| `empeoro` | nivel hoy > nivel ayer, hoy > 0, cumple persistencia |
| `mejoro` | nivel hoy < nivel ayer, ayer > 0 |
| `entro_crecimiento` | nivel positivo hoy > nivel positivo ayer, hoy > 0 |

Ninguno aplica en la **primera corrida** — esa genera una línea base con el estado
completo de la cartera.

---

## 10. MRR estimado

```
MRR = suma(facturación últimos 3 meses) / 3
```

Se usa para **ordenar** el resumen de Slack dentro de cada grupo: primero el de mayor
impacto económico.

---

## 11. Variables de entorno

| Variable | Default | Para qué |
|---|---|---|
| `GRAFANA_URL` | — | Endpoint base de Grafana |
| `GRAFANA_DATASOURCE_UID` | — | UID de la datasource de facturación |
| `CHURN_SHEET_URL` | placeholder | Planilla del tablero |
| `CHURN_SLACK_CHANNEL` | placeholder | **ID** del canal `#engagement-team` |
| `CHURN_EXCLUDED_CLIENT_IDS` | — | IDs a ignorar (pausados, test) |
| `CHURN_ACTION_WEBHOOK_URL` | — | Webhook a CRM/Make *(opcional)* |
| `CHURN_UMBRAL_POSITIVO` | `50` | % de suba para marcar crecimiento |
| `CHURN_ENVIAR_SIN_DESVIOS` | `false` | Si mandar mensaje en días sin novedades |

**Frecuencia:** cron `0 7 * * *` → todos los días a las 07:00.

---

## 12. Qué calibrar primero

No todos los parámetros pesan igual. En orden de impacto:

| Prioridad | Parámetro | Por qué |
|---|---|---|
| 🔴 Alta | **Umbrales de ratio de recencia** (2 / 3 / 5) | Es la señal más temprana y la que más alertas genera |
| 🔴 Alta | **`CHURN_EXCLUDED_CLIENT_IDS`** | Sin esto, los clientes pausados o de test generan ruido desde el día uno |
| 🟠 Media | **Umbrales de caída** (30 / 50 / 70%) | Definen cuántos entran en cada nivel |
| 🟠 Media | **`CHURN_UMBRAL_POSITIVO`** (50%) | Sin datos reales es el más arbitrario de todos |
| 🟡 Baja | Tolerancia estacional (±20%) | Solo afecta a clientes con 12+ meses |
| 🟡 Baja | Persistencia (3 días) | Solo afecta a clientes nuevos |

> **Los umbrales actuales son un punto de partida razonable, no un resultado
> calibrado.** Hay que correr el sistema contra datos históricos reales y ajustar:
> si la primera corrida marca en rojo a media cartera, están muy laxos; si no marca
> a nadie, muy estrictos.

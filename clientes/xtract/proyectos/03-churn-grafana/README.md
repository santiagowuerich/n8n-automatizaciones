# 03 — Análisis de clientes para evitar CHURN [Grafana]

**Estado:** 🟡 Bloqueado — esperando Service Account Token de Grafana  
**Origen:** Tarjeta de Trello asignada por el equipo de Xtract  
**Cotización:** Pendiente  
**Workflow Actualizado:** `v5` (Modular & Visual: Separación de reglas en 5 nodos de código independientes + notas explicativas)

---

## 🎯 Objetivo del Sistema

Detectar **desvíos de comportamiento** en la facturación de cada cliente —tanto caídas
(riesgo de churn) como subas atípicas (crecimiento / oportunidad de upsell)— analizando
su **volumen e intervalo de facturación** contra su propia línea de base histórica.
Emite un resumen diario a Slack y mantiene un tablero actualizado en Google Sheets.

> **Alcance ampliado el 30/07/2026** a pedido de Tomás: originalmente el sistema solo
> detectaba caídas. Ahora reporta **desvíos en ambas direcciones**.

---

## 📬 Formato de notificación (definido con Tomás)

Requisitos acordados:

| Requisito | Definición |
|---|---|
| **Canal** | `#engagement-team` |
| **Frecuencia** | **Máximo 1 mensaje por día** |
| **Formato** | Un único resumen consolidado con **todos** los desvíos del día |
| **Dirección** | Desvíos **positivos y negativos** |
| **Días sin desvíos** | *A definir* — propuesta: no enviar nada |

### Mockup del mensaje diario

```
📊 Desvíos de facturación — 30/07

🔴 Caída fuerte (2)
• Distribuidora Sur — sin facturar hace 12 días (habitual: cada 3) · −54% · MRR $4.200
• Textiles del Norte — sin facturar hace 21 días (habitual: cada 7) · −80% · MRR $1.800

🟠 Caída moderada (1)
• Metalúrgica Paraná — −38% vs. su base · 3er mes consecutivo en baja · MRR $3.100

🟢 Crecimiento (2)
• Logística Andes — +180% (34 facturas vs. 12 habituales) · MRR $2.400
• Farmacias del Sur — +95% sostenido hace 2 meses · MRR $5.600

Solo aparecen los que cambiaron de estado respecto de ayer.
Ver cartera completa → [tablero]
```

> ⚠️ **Los desvíos positivos muestran siempre el dato crudo** junto al porcentaje
> (`34 facturas vs. 12 habituales`), no solo el %. Un salto grande hacia arriba a veces
> no es crecimiento sino **facturación acumulada cargada toda junta o un error de carga**.
> Con el número absoluto al lado, quien lee lo distingue solo.

Ordenado por **impacto en MRR** dentro de cada grupo.

---

## 📊 Salidas del Sistema

| Destino | Frecuencia / Condición | Contenido |
|---|---|---|
| **Google Sheet (`Estado Clientes`)** | En cada corrida diaria | Reescritura completa con el estado, ratio de silencio, días de persistencia en riesgo y caída% de **todos** los clientes. |
| **Google Sheet (`Historial Alertas`)** | Solo cuando hay alertas | Registro incremental (append) de cada notificación emitida (timestamp, tipo de alerta, mensaje). |
| **Slack (`#engagement-team`)** | **1 vez al día como máximo**, solo si hubo cambios de estado | Resumen único consolidado con desvíos **positivos y negativos**, ordenado por impacto en MRR. |
| **Webhook CRM / Automations** | Solo si hay clientes con desvío | Evento JSON con el payload de clientes afectados para auto-crear tareas en CRM / Make. |

---

## 🏗️ Arquitectura Modular del Workflow (v5)

A diferencia de las versiones monolíticas, la versión `v5` desacopla cada regla de negocio en su **propio nodo con su propia nota visual (Sticky Note)** en el canvas de n8n:

```text
[Schedule Diario 7AM]
       │
       ▼
[Grafana API - Facturación]
       │
       ▼
[1. Filtro Clientes Excluidos] ──► Elimina clientes pausados / test (CHURN_EXCLUDED_CLIENT_IDS)
       │
       ▼
[2. Señal A: Recencia] ─────────► Calcula cadencia mediana, días de silencio y ratio
       │
       ▼
[3. Señal B: Caída Volumen] ────► Compara misma ventana mensual vs mediana 6M
       │
       ▼
[4. Señal C: Racha Descendente] ► Detecta 3 meses consecutivos a la baja (+1 gravedad)
       │
       ▼
[4b. Señal D: Desvío Positivo] ─► Detecta subas atípicas vs. su propia base (🟢)
       │
       ▼
[5. Estacionalidad & MRR] ──────► Aplica descuento YoY (12M+) y calcula MRR estimado ($)
       │
       ▼
[Leer Sheet (estado ayer)] ─────► Obtiene línea base anterior
       │
       ▼
[Detectar Transiciones] ────────► Aplica regla de persistencia de 3 días en clientes <12M
       │
       ├───► [Limpiar Sheet] ──► [Sheet Update (estado hoy)]
       │
       └───► [Consolidar Alertas]
                     │
                     ▼
              [IF ¿Hay alerta?]
                     ├── YES ──► [Slack Alerta Churn]
                     │     ├──► [Historial Alertas (Sheet)]
                     │     └──► [Webhook CRM Action (Opcional)]
                     └── NO  ──► [Sin cambios (no alertar)]
```

---

## 🧮 Reglas de Negocio Desacopladas (Nodos en n8n)

### Nodo 1: `Filtro Clientes Excluidos`
* Valida estado HTTP de Grafana (`neverError`).
* Filtra los clientes cuyos IDs estén definidos en `CHURN_EXCLUDED_CLIENT_IDS`.

### Nodo 2: `Señal A: Recencia`
* Cadencia = Mediana de días transcurridos entre facturas (últimos 6 meses).
* Silencio = Días transcurridos desde la última factura.
* Ratio = Silencio / Cadencia (`>2 🟡`, `>3 🟠`, `>5 🔴`).

### Nodo 3: `Señal B: Caída Volumen`
* Compara el volumen facturado en la ventana del día 1 al día actual del mes contra la mediana de la misma ventana de los últimos 6 meses.
* Caída (`≥30% 🟡`, `≥50% 🟠`, `≥70% 🔴`).

### Nodo 4: `Señal C: Racha Descendente`
* Evalúa si los últimos 3 meses cerrados muestran caída consecutiva ($M_{-3} > M_{-2} > M_{-1}$).
* Suma +1 nivel de gravedad al estado final.

### Nodo 4b: `Señal D: Desvío Positivo`
* Detecta subas atípicas: volumen del mes en curso **por encima** de su base histórica
  (misma ventana temporal que la Señal B).
* Umbrales: `≥50% 🟢 Crecimiento`, `≥100% 🟢 Crecimiento fuerte`.
* También considera **aceleración de cadencia**: si el cliente pasó a facturar
  significativamente más seguido que su mediana histórica.
* **Siempre reporta el valor absoluto junto al %** (`34 facturas vs. 12 habituales`),
  para poder distinguir crecimiento real de una carga acumulada o un error de carga.
* No escala gravedad de churn — es una categoría **independiente** en el resumen.

### Nodo 5: `Estacionalidad & MRR`
* **Estacionalidad:** En clientes con 12M+ de datos, si la caída es similar a la del año anterior (±20%), descuenta -1 nivel de gravedad.
* **MRR Estimado:** Calcula el promedio mensual ingresado en los últimos 3 meses.
* El MRR ordena el resumen de Slack dentro de cada grupo (mayor impacto primero).

---

## 🛠️ Variables de Entorno en n8n

| Variable | Descripción | Ejemplo / Opcional |
|---|---|---|
| `GRAFANA_URL` | Endpoint base de Grafana | `https://grafana.empresa.com` |
| `GRAFANA_DATASOURCE_UID` | Identifier de la datasource | `PDS19482A0` |
| `CHURN_SHEET_URL` | URL de la planilla en Google Sheets | `https://docs.google.com/spreadsheets/d/1ABC.../edit` |
| `CHURN_SLACK_CHANNEL` | ID del canal de notificaciones (`#engagement-team`) | `C05GXXXXXXX` |
| `CHURN_UMBRAL_POSITIVO` | % de suba para marcar crecimiento | `50` *(Opcional, default 50)* |
| `CHURN_ENVIAR_SIN_DESVIOS` | Si mandar mensaje en días sin novedades | `false` *(Opcional)* |
| `CHURN_EXCLUDED_CLIENT_IDS` | Lista de IDs a ignorar | `102,154,89` *(Opcional)* |
| `CHURN_ACTION_WEBHOOK_URL` | Endpoint de Webhook para CRM/Make | `https://hook.us1.make.com/abc...` *(Opcional)* |

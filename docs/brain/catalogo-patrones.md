# Catálogo de Patrones Arquitectónicos en n8n

Este documento define los patrones estándar de topología y flujo de datos que deben reutilizarse al diseñar automatizaciones en el ecosistema de Xtract.

---

## 1. Patrón: Event-Driven Webhook con Buffer de Ráfagas
* **Cuándo usarlo:** Mensajería instantánea (WhatsApp, Slack) donde los usuarios envían múltiples mensajes fragmentados en segundos.
* **Topología:**
  ```text
  Webhook ➔ Filtrar entrantes ➔ Esperar Ráfaga (5-8s) ➔ Cruzar Contexto ➔ Agente IA ➔ Responder
  ```
* **Ventaja:** Consolida 4 mensajes cortos en una sola ejecución, ahorrando un 75% de llamadas a LLMs y evitando que el bot conteste múltiples veces.

---

## 2. Patrón: Asynchronous Polling Cron (Desacople de Esperas Largas)
* **Cuándo usarlo:** Procesos que requieren esperar horas o días (seguimientos de ventas, recordatorios, verificaciones de estado).
* **Topología:**
  ```text
  Workflow 1 (Envío Inmediato): Dispara ➔ Registra 'fecha_envio' y 'estado=pendiente' ➔ Termina.
  Workflow 2 (Cron Recurrente): Schedule Trigger (cada 30 min) ➔ Lee Pendientes >= 2hs ➔ Valida ➔ Dispara.
  ```
* **Ventaja:** Elimina los nodos `Wait` de larga duración dentro de loops, evitando ejecuciones colgadas en estado `waiting` y saturación de memoria.

---

## 3. Patrón: AI Agent con Fallback de Proveedor
* **Cuándo usarlo:** Agentes conversacionales o de extracción donde no se puede tolerar caída por rate limit (429) o indisponibilidad del proveedor.
* **Topología:**
  ```text
  Modelo Principal (DeepSeek Chat) ➔ [Fallback automático] ➔ Modelo Secundario (Groq Llama 3)
  ```
* **Ventaja:** Si el proveedor principal sufre un microcorte o demora, el agente conmuta de forma transparente sin cortar la conversación con el usuario.

---

## 4. Patrón: Deduplicación e Idempotencia
* **Cuándo usarlo:** Ingesta masiva desde hojas de cálculo o webhooks que pueden reintentar llamadas duplicadas.
* **Topología:**
  ```text
  Entrada ➔ Hash / Normalización de ID ➔ Verificar contra Set de Procesados ➔ IF ya existe? (Descartar) ➔ Procesar
  ```
* **Ventaja:** Garantiza que un mismo cliente o registro nunca reciba dos veces el mismo mensaje o acción.

# Catálogo de Patrones Arquitectónicos en n8n

Este documento define los patrones estándar de topología y flujo de datos que deben reutilizarse al diseñar automatizaciones en el ecosistema de Xtract.

> **Cómo se mantiene:** cada workflow entregado debe dejar acá el patrón que inauguró, o
> confirmar que reutilizó uno existente. Un catálogo que no crece con lo entregado deja de
> ser memoria y pasa a ser decoración.

---

## 1. Patrón: Event-Driven Webhook con Buffer de Ráfagas
* **Cuándo usarlo:** Mensajería instantánea (WhatsApp, Slack) donde los usuarios envían múltiples mensajes fragmentados en segundos.
* **Topología:**
  ```text
  Webhook ➔ Filtrar entrantes ➔ Esperar Ráfaga (5-8s) ➔ Cruzar Contexto ➔ Agente IA ➔ Responder
  ```
* **Ventaja:** Consolida 4 mensajes cortos en una sola ejecución, ahorrando un 75% de llamadas a LLMs y evitando que el bot conteste múltiples veces.
* **En producción:** `04 · WF2 Recepción` (`Esperar la rafaga`).

---

## 2. Patrón: Asynchronous Polling Cron (Desacople de Esperas Largas)
* **Cuándo usarlo:** Procesos que requieren esperar horas o días (seguimientos de ventas, recordatorios, verificaciones de estado).
* **Topología:**
  ```text
  Workflow 1 (Envío Inmediato): Dispara ➔ Registra 'fecha_envio' y 'estado=pendiente' ➔ Termina.
  Workflow 2 (Cron Recurrente): Schedule Trigger (cada 30 min) ➔ Lee Pendientes >= 2hs ➔ Valida ➔ Dispara.
  ```
* **Ventaja:** Elimina los nodos `Wait` de larga duración dentro de loops, evitando ejecuciones colgadas en estado `waiting` y saturación de memoria.
* **En producción:** `04 · WF3 Seguimiento automático vía Cron`.

---

## 3. Patrón: AI Agent con Fallback de Proveedor
* **Cuándo usarlo:** Agentes conversacionales o de extracción donde no se puede tolerar caída por rate limit (429) o indisponibilidad del proveedor.
* **Topología:**
  ```text
  Modelo Principal (DeepSeek Chat) ➔ [Fallback automático] ➔ Modelo Secundario (Groq Llama 3)
  ```
* **Ventaja:** Si el proveedor principal sufre un microcorte o demora, el agente conmuta de forma transparente sin cortar la conversación con el usuario.
* **En producción:** `04 · WF2` (`DeepSeek Chat Model` + `Modelo de respaldo (Groq)`).

---

## 4. Patrón: Deduplicación e Idempotencia
* **Cuándo usarlo:** Ingesta masiva desde hojas de cálculo o webhooks que pueden reintentar llamadas duplicadas.
* **Topología:**
  ```text
  Entrada ➔ Hash / Normalización de ID ➔ Verificar contra Set de Procesados ➔ IF ya existe? (Descartar) ➔ Procesar
  ```
* **Ventaja:** Garantiza que un mismo cliente o registro nunca reciba dos veces el mismo mensaje o acción.

---

## 5. Patrón: Ledger Externo como Estado del Proceso
* **Cuándo usarlo:** Cualquier proceso multi-etapa que atraviesa varias ejecuciones o varios workflows: no hay memoria compartida entre ejecuciones de n8n.
* **Topología:**
  ```text
  WF1 escribe fila (estado=enviado, fecha) ➔ Google Sheet (ledger)
  WF2/WF3 leen el ledger ➔ filtran por estado ➔ actúan ➔ vuelven a marcar (respondio / seguimiento_enviado)
  ```
* **Ventaja:** Da idempotencia (patrón 4), cursor para el cron (patrón 2) y auditoría legible por el cliente, todo en el mismo lugar y sin base de datos propia.
* **Cuidado:** El ledger es el punto único de falla del proceso. Toda escritura tiene que ocurrir **después** de la acción externa confirmada, nunca antes.
* **En producción:** `04 · Leer/Marcar enviados WA`.

---

## 6. Patrón: Estado Conversacional en el Canal
* **Cuándo usarlo:** Conversaciones que necesitan contexto persistente por contacto pero donde el ledger central es demasiado grueso (o el operador humano necesita ver ese estado).
* **Topología:**
  ```text
  Entrada ➔ Leer notas/etiquetas de la conversación ➔ ¿Hay estado? ➔ Agente ➔ Escribir nota de estado + etiqueta
  ```
* **Ventaja:** El estado vive **junto a la conversación**, visible para el humano que después la toma. No requiere almacenamiento extra ni sincronización.
* **Cuidado:** No sustituye a la memoria del agente para el hilo inmediato; es estado de negocio (etapa, intención detectada), no historial de chat.
* **En producción:** `04 · WF2` (`Chatwoot - Traer historial de Estado`, `Chatwoot - Nota estado`, `Chatwoot - Etiquetar`).

---

## 7. Patrón: Verificación Post-Acción (No Confiar en el 200)
* **Cuándo usarlo:** Acciones sobre sistemas donde la respuesta HTTP exitosa **no garantiza** el efecto: envío de plantillas WhatsApp, agendamiento en calendarios, entregas asíncronas.
* **Topología:**
  ```text
  Ejecutar acción ➔ Esperar ventana corta ➔ Consultar estado real ➔ Determinar resultado ➔ Confirmar o revertir
  ```
* **Ventaja:** Evita ledgers mintiendo. Un `201 Created` de Chatwoot significa "encolado", no "entregado por Meta"; un agendamiento puede fallar del lado de Calendly después del OK.
* **En producción:** `04 · WF1` (`Esperar confirmacion de envio` → `Chatwoot - Verificar estado del mensaje` → `Determinar estado real del envio`) y `04 · WF2` (`Calendly - Verificar reunion` → `Confirmar o revertir agendamiento`).

---

## 8. Patrón: Escalamiento a Humano (Human Handoff)
* **Cuándo usarlo:** Todo agente conversacional que trate con clientes reales. No existe agente autónomo aceptable sin salida a humano.
* **Topología:**
  ```text
  Salida del agente ➔ ¿Necesita humano? ➔ Asignar agente en el canal
                                        ➔ Notificar al comercial (Slack, mención directa)
                                        ➔ Marcar la conversación como escalada
  ```
* **Disparadores típicos:** intención de compra fuerte, queja, pedido explícito de hablar con alguien, mensaje que el agente no puede interpretar (ej. nota de voz), o baja confianza del modelo.
* **Ventaja:** Convierte el peor caso del bot (no entender) en el mejor caso comercial (contacto humano oportuno).
* **En producción:** `04 · WF2` (`Filtrar necesita-humano`, `Chatwoot - Asignar agente`, `Postear en Slack`).

---

## 9. Patrón: Loop con Throttling
* **Cuándo usarlo:** Envíos masivos o llamadas a APIs con límite de tasa (WhatsApp, Notion, Sheets).
* **Topología:**
  ```text
  Armar tanda ➔ Loop (SplitInBatches) ➔ Acción ➔ Esperar N segundos ➔ siguiente
  ```
* **Ventaja:** Respeta rate limits sin depender de reintentos, y hace el volumen predecible por ventana de tiempo.
* **Cuidado:** El `Wait` acá es corto y **dentro** del loop de una tanda acotada. Si la espera pasa de 5 minutos o la tanda es abierta, el patrón correcto es el 2, no este.
* **En producción:** `04 · WF1` (`Loop de envio` + `Esperar entre envios`), `04 · WF3` (`Esperar entre seguimientos`).

---

## 10. Patrón: Agente con Herramientas de Acción
* **Cuándo usarlo:** Cuando el agente no solo responde, sino que **ejecuta** operaciones de negocio (agendar, cancelar, consultar disponibilidad, buscar en base de conocimiento).
* **Topología:**
  ```text
  Agente IA ─┬─ tool: consultar_disponibilidad
             ├─ tool: agendar_reunion
             ├─ tool: cancelar_reunion
             └─ tool: consultar_base_conocimiento
  ```
* **Reglas:**
  - Toda herramienta que **muta** estado externo se combina con el patrón 7 (verificación post-acción).
  - El nombre y la descripción de la herramienta son parte del prompt: nombres verbales y explícitos.
  - Las herramientas de solo lectura van primero en el diseño; las de escritura se agregan cuando el agente ya demuestra criterio.
* **En producción:** `04 · WF2` (herramientas de Calendly + base de conocimiento).

---

## 11. Patrón: Entorno de Prueba Embebido con Redirect Seguro (2026-09-10)
* **Cuándo usarlo:** Proyectos **nuevos de Xtract** que dependan de credenciales exclusivas de
  cliente (Notion, Chatwoot, Calendly, Slack Xtract) — servicios que **no existen** en la
  instancia Santiago (`n8n.santiagowuerich.info`), lo que vuelve inútil el split DEV/PROD por
  instancia para esos casos. Ver [`sistemas.md §4`](sistemas.md#4-protocolo-de-transición-dev-a-prod)
  para cuándo preferir este patrón sobre el modelo de instancia separada.
* **Topología:**
  ```text
  Workflow PROD (n8n.xtract.app)      — real, se toca muy de vez en cuando, gate humano de siempre.
  Workflow DEV-en-Xtract (misma instancia) — mismos nodos, mismas credenciales reales (sin remapeo).
    Entrada ➔ Lógica de negocio ➔ Resolver Destinatario (fail-safe) ➔ Envío / Escritura
                                          │
                                          ├─ MODO_PRUEBA=false + destinatarios explícitos ➔ envío real
                                          └─ default (bandera ausente, vacía o mal seteada) ➔ SIEMPRE a Santiago
  ```
* **Ventaja:** Resuelve la falta de paridad de credenciales de raíz — el DEV corre en la misma
  instancia que PROD, con las credenciales reales, sin remapeo. El pase a PROD deja de requerir
  el protocolo de sanitización de IDs (`credenciales.md §3`); solo hace falta quitar el redirect
  y activar el workflow gemelo.
* **Cuidado — el diseño es fail-safe, no fail-open:**
  - El nodo `Resolver Destinatario` es central: si falta la bandera de modo prueba, si viene vacía
    o con un valor inesperado, el **default siempre es el modo seguro** (redirige a Santiago, no
    manda a nadie más). Nunca al revés.
  - El modo prueba tiene que cubrir **todo efecto externo**, no solo mensajería. Si el workflow
    también escribe en Sheets/Notion/Calendly, esas escrituras siguen pegando en datos reales del
    cliente aunque el mensaje se redirija — necesitan su propio modo prueba (fila/tag de staging,
    ver [patrón 4](#4-patrón-deduplicación-e-idempotencia) y [patrón 5](#5-patrón-ledger-externo-como-estado-del-proceso)).
  - Este patrón nace de dos incidentes reales por el error inverso (fail-open): un `FORZAR_DESTINATARIO`
    vacío que mandó un borrador a un DM real (06, 2026-08-28) y tres workflows `TEMP` que quedaron
    9 días activos en `n8n.xtract.app` filtrando PII sin autenticación (2026-09-10, ver
    [`lecciones.md`](lecciones.md)). Ver también los dos ítems nuevos de
    [`criterios-critica.md §4`](criterios-critica.md).
* **En producción:** ninguno todavía — patrón recién definido el 2026-09-10 para proyectos Xtract
  nuevos. El primero que lo use debe dejar acá la referencia.

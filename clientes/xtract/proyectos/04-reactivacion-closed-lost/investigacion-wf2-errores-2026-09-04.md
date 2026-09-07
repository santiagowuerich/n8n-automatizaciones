# Investigación WF2 — `Closed Lost WhatsApp — 2. Recepción vía Chatwoot`

- **Fecha:** 2026-09-04
- **Workflow PROD:** `HIYvqfItsrPk4CGc` (activo, v634, actualizado 2026-09-03T13:38Z, 44 nodos)
- **Instancia:** `https://n8n.xtract.app` (PROD Xtract)
- **Método:** solo lectura (GET workflow + GET executions con `includeData=true`). Ninguna mutación en PROD.
- **Ventana analizada:** últimas 200 ejecuciones del WF2 + detalle de ~12 ejecuciones largas + errores recientes del WF3 vecino.

## Resumen

| # | Error / hallazgo | Severidad | Estado |
|---|---|---|---|
| E1 | `sin_respuesta_del_modelo`: el modelo devuelve vacío y el bot escala con mensaje genérico (exec `581311`) | Alta | Confirmado en 1 ejecución, patrón visto en 2/12 largas |
| E2 | `Buscar card en Notion` trae ~2652 páginas por cada mensaje (scan completo, filtro solo `Whatsapp KDM is_not_empty`) | Alta (costo/latencia/fragilidad) | Confirmado en `581311` |
| E3 | Sin rutas de error reales: 8 nodos con `onError: continueRegularOutput`, 0 `error outputs` cableados, casi sin `retryOnFail` | Alta | Confirmado contra JSON PROD |
| E4 | Drift PROD vs repo + docs desactualizadas + PROD sin modelo de respaldo | Media-Alta | Confirmado (44 vs 45 nodos) |
| E5 | Ramas que terminan en silencio: fallback de `Que hacer?` sin cablear, rama `false` de `Hay que asignar?` sin cablear, `Preparar Datos Lead` puede devolver 0 items (caso `580653` truncado, 81 s sin respuesta) | Media-Alta | Confirmado (`580653` muere en `Preparar Datos Lead`) |
| E6 | Rama de audio silenciosa (`neverError: true`) + `Simple Memory` con `sessionKey = telefono_v7` | Media | Confirmado contra JSON PROD |
| E7 | `Filtrar necesita-humano` (Filter) lee solo `body.conversation.labels`, mientras `Filtrar solo entrantes` (Code) lee 3 variantes | Media | Confirmado contra JSON PROD |
| E8 | WF3 vecino (`KYqttVyQPTvG8xg6`) falla cada 30 min: credencial `SheetCuentaSantiago` revocada/expirada | Alta (para el piloto, no es WF2) | Confirmado (`581711`, `581666`) |
| E9 | `cierre: ''` con mensaje saliente válido en casos de soporte (Boris/Transfuel): terminan en `Hay que asignar?` sin asignar ni avisar | Observación (verificar si es esperado) | Confirmado (`580537`, `578531`, `580523`) |

Nota de contexto: el tráfico real del WF2 es mayormente `modo: general` (9/12 ejecuciones largas muestreadas), no piloto. Teléfonos y nombres abajo van enmascarados (`549358***`).

---

## E1 — `sin_respuesta_del_modelo` (exec `581311`)

**Evidencia:**
- Exec `581311` — 2026-09-03T18:21:27Z, 76.7 s, `status: success`, 31 nodos, `lastNode: Postear en Slack`.
- Input: `Perfecto`, conv `1094`, tel `573169***`, `nombre_wa: Konecta Group`.
- `Filtrar solo entrantes`: `es_piloto: false`, `es_general: false`, `crm: {}`, `tiene_contexto: false`.
- `Procesar Respuesta`: `accion: fija`, `bloqueado: confirmacion_sin_contexto`, `respuestaFija` presente.
- `Armar salida`: `modo: normal`, `cierre: escalado`, `mensaje_saliente: "Hola Konecta, dame un momento que reviso ese detalle con el equipo técnico y te respondo por acá a la brevedad."`, `etiquetas: [reactivacion, necesita-humano]`, `nota_agenda: ESCALAR_DEBUG {"motivo":"sin_respuesta_del_modelo","output_crudo":""}`.
- `Agente IA` **no aparece** entre los nodos ejecutados de esa corrida (el path fue `Que hacer? [fija] → Procesar Respuesta`, sin pasar por el modelo).

**Por qué importa:** el cliente recibe un genérico y la conversación se escala a humano + Slack con etiqueta `necesita-humano`. Funciona como degradación, pero el motivo dice que el modelo no devolvió nada en un path donde el modelo ni siquiera corrió. Hay una inconsistencia entre el motivo registrado y el path real.

**Causa probable:** `Procesar Respuesta` marca `escalar = !r` con `motivo = sin_respuesta_del_modelo` cuando `r` (output del input) está vacío. En la rama `fija`, el input no es el modelo sino el resultado de la rama fija; si ese campo viene vacío, se registra como fallo del modelo aunque el modelo nunca fue invocado. A verificar en el código completo de `Procesar Respuesta` (solo se leyó el tramo inicial).

**Cómo verificar:** releer `Procesar Respuesta` entero y trazar qué `$input` recibe en la rama `fija` vs la rama `bot`; agregar al `ESCALAR_DEBUG` la rama de origen (`accion`, `bloqueado`) además del motivo.

## E2 — `Buscar card en Notion` trae la base entera (~2652 items por mensaje)

**Evidencia:**
- Exec `581311`: `Buscar card en Notion: items=2652`.
- Config PROD del nodo: `resource: databasePage`, `operation: getAll`, `databaseId: Sales - XT (09549c92-...)`, `returnAll: true`, `filters: { Whatsapp KDM|phone_number is_not_empty }`, `onError: continueRegularOutput`, `retry: true`.

**Por qué importa:** cada mensaje entrante (incluido tráfico general que no es piloto) dispara una lectura completa de la base de Notion. Es latencia (~segundos), consumo de API y fragilidad: si Notion falla o rate-limitea, el error entra como data normal por `continueRegularOutput` (E3) y contamina el cruce con el CRM.

**Cómo verificar:** medir duración del nodo en ejecuciones largas; evaluar filtrar por teléfono a nivel de query en vez de traer todo y filtrar en Code (`Cruzar con contexto del CRM`).

## E3 — Sin rutas de error reales

**Evidencia (JSON PROD):**
- `onError: continueRegularOutput` en 8 nodos: `Agente IA`, `Chatwoot - Traer historial de Estado`, `Chatwoot - Etiquetar`, `Chatwoot - Nota estado`, `Chatwoot - Responder`, `Leer Enviados WA`, `Registrar interaccion`, `Buscar card en Notion`.
- `retryOnFail: true` solo en 2: `Agente IA` y `Buscar card en Notion`.
- Sin `retry` en: 4 HTTP de Chatwoot, 2 Sheets, `Postear en Slack`, `Calendly - Verificar reunion`, `Descargar Audio Chatwoot`, `Transcribir Audio con OpenRouter`, las 4 tools de Calendly.
- Sin `onError` en: todas las tools de Calendly, `DeepSeek Chat Model`, `Chatwoot - Asignar agente`, `Postear en Slack`, `Calendly - Verificar`, `Descargar/Transcribir audio`, `Armar salida`, `Procesar Respuesta`, `Preparar Datos Lead`, `Que hacer?` y los IF.
- `connections`: no hay ningún `main[1]` de error cableado. Los 7 `main[1]` existentes son ramas `false`/fallback de IF/Switch, no handlers de error.
- `settings`: sin error workflow asignado visible desde la API (`executionOrder: v1`, `availableInMCP: false`).

**Por qué importa:** `continueRegularOutput` hace que un fallo (HTTP 429/500, credencial caída, timeout) entre por la rama de éxito con forma de error. El workflow marca `success` y sigue (etiqueta, responde, registra) con datos corruptos. Y donde no hay `onError`, un fallo puntual voltea el webhook entero.

**Cómo verificar:** provocar fallos sintéticos en DEV (Chatwoot 500, Sheets sin permiso, DeepSeek 429) y observar si el workflow marca `success` igual.

## E4 — Drift PROD vs repo + docs + sin fallback en PROD

**Evidencia:**
- PROD: 44 nodos, tiene `avisar_al_equipo_sumar_invitado` (ai_tool del agente).
- Repo (`workflows/Closed Lost WhatsApp — 2. Recepción vía Chatwoot.json`): 45 nodos, tiene `Modelo de respaldo (Groq)` (ai_languageModel index 1 del agente) + `agregar_invitado_reunion`, que PROD no tiene.
- PROD `Agente IA`: solo `DeepSeek Chat Model (deepseek-v4-flash, temp 0.3, maxTokens 8000)` en `ai_languageModel[0]`. Sin respaldo.
- `README.md` del proyecto 04 dice que WF1/WF2 están "Inactivo" y que "ninguno de los dos tiene ejecuciones. Nunca corrieron." Falso al 2026-09-03: WF2 activo con ~200 ejecuciones recientes y conversaciones reales (`1094`, `1090`, etc.).
- `credenciales.md §2` dice que WF2 pasó de 43 a 44 nodos y sigue activo — consistente con PROD, pero el JSON del repo ya no coincide.

**Por qué importa:** si DeepSeek cae (429, timeout, output vacío como E1), PROD no tiene a dónde caerse. El repo sugiere que el fallback existió en algún momento y PROD lo perdió (o nunca se desplegó).

**Cómo verificar:** `git log` del JSON del 04 + comparar `versionCounter` 634 contra el último backup (`workflows/backups/HIYvqfItsrPk4CGc_backup_*.json`).

## E5 — Ramas que terminan en silencio

**E5a — Fallback de `Que hacer?` sin cablear.**
- Switch con `bot → Agente IA`, `fija → Procesar Respuesta`, `fallbackOutput: extra` renombrado `Sin accion (revisar)`.
- `connections["Que hacer?"]` solo tiene 2 salidas. La tercera no va a ningún nodo: si `accion` algún día trae un tercer valor, el item se pierde con `success`.

**E5b — `Hay que asignar?` rama `false` sin cablear.**
- Solo la rama `true` va a `Chatwoot - Asignar agente`. La `false` termina el workflow. Puede ser intencional (no asignar = nada que hacer), pero entonces `cierre: ''` (E9) queda como estado final ambiguo.

**E5c — `Preparar Datos Lead` puede devolver 0 items: caso `580653`.**
- Exec `580653` — 81 s, `status: success`, `lastNode: Preparar Datos Lead`, 15 nodos, SIN `Armar salida`.
- Path: `... → Descargar Audio → Transcribir → Inyectar → Preparar Datos Lead` y ahí muere.
- Input original: `Buen día` (conv `1090`, tel `549358***`, `Euge`, sin CRM). El cliente no recibió respuesta ni traza posterior.
- Hipótesis: `Preparar Datos Lead` tiene returns `[]` para estados terminales/opt-out/tope (correcto en esos casos), pero acá silenció un `Buen día` legítimo. O la transcripción tardó y el nodo devolvió vacío.

**Cómo verificar:** leer los `return []` de `Preparar Datos Lead` y cruzar con `580653` (¿etiquetas previas? ¿tope de turnos? ¿transcripción vacía?).

## E6 — Rama de audio silenciosa + memoria por teléfono

**Evidencia:**
- `Descargar Audio Chatwoot`: `neverError: true`, `responseFormat: file`, `url: {{ $json.audio_url }}`, timeout 20 s. Sin `onError`/`retry`.
- `Transcribir Audio con OpenRouter`: `neverError: true`, `openai/whisper-large-v3` vía OpenRouter, timeout 30 s. Sin `retry`.
- `Inyectar Transcripcion`: si no hay texto, inyecta `[Audio inaudible o sin voz detectada]` y sigue como si fuera contenido real.
- `Simple Memory`: `sessionKey: {{ $json.telefono }}_v7` (por teléfono, no por conversación).

**Por qué importa:** un audio que falla al descargar/transcribir no genera error visible: entra al prompt como "inaudible" y el modelo responde a ciegas. Y la memoria por teléfono mezcla hilos si el mismo número tiene varias conversaciones (piloto + soporte), además del riesgo conocido de `memoryBufferWindow` en queue mode (ver `README.md` del 04).

## E7 — `Filtrar necesita-humano` vs `Filtrar solo entrantes` leen etiquetas de lugares distintos

**Evidencia:**
- `Filtrar necesita-humano` (Filter, primer nodo tras el webhook): `{{ $json.body.conversation.labels }}` `notContains necesita-humano`.
- `Filtrar solo entrantes` (Code): concatena `conversation.labels + conversation.label_list + labels`, mapeando `title` si es objeto.
- El propio comentario del Code admite que la forma exacta del payload hay que verificarla contra la instancia real.

**Por qué importa:** si Chatwoot manda las etiquetas en `label_list` o en otro nivel, el Filter deja pasar conversaciones ya escaladas (el bot le contesta por encima al humano) o frena de más. Son dos implementaciones del mismo candado con distinta lectura.

**Cómo verificar:** comparar `body.conversation` real de `581311`/`580653` contra lo que cada nodo lee.

## E8 — WF3 vecino roto (contexto, no es WF2)

**Evidencia:**
- `Closed Lost WhatsApp — 3. Seguimiento automático vía Cron` (`KYqttVyQPTvG8xg6`): errores cada 30 min (`581711` 22:30Z, `581666` 22:00Z, ...).
- `lastNode: Leer enviados WA`, `NodeApiError: The credential "SheetCuentaSantiago" needs to be reconnected` (OAuth revocado/expirado). Tiene `retryOnFail` 3x2s pero el refresh no puede recuperarse solo.

**Por qué importa para WF2:** el fallback `Hay contexto en Chatwoot? → false → Leer Enviados WA` usa la misma credencial/hoja. En `581311` la lectura funcionó (18:21Z), así que la caída es posterior o intermitente; igual, si Sheets cae, el WF2 degrada todo al path lento y el WF3 deja de seguir.

## E9 — Observación: `cierre: ''` con respuesta válida (casos Boris/Transfuel)

**Evidencia (todas `success`, todas `modo: general`, todas `lastNode: Hay que asignar?`):**
- `580537` (683.7 s): input con emails `bespinoza@... ggherardi@...`, respuesta sobre sumar invitado a Meet, `cierre: ''`, `etiquetas: [consulta-general]`.
- `578531` (101 s): propone horarios jueves/viernes, `cierre: ''`.
- `580523` (78 s): pide el correo para agregar invitado, `cierre: ''`.
- Las 3 terminan en `Hay que asignar?` sin asignar, sin Slack, sin etiqueta terminal.

**Pregunta abierta:** ¿es el comportamiento esperado para `consulta-general` (responder y cerrar sin asignar)? Si sí, `cierre: ''` debería tener un nombre explícito (`resuelto`/`informativo`) porque hoy es indistinguible de "no se decidió nada". Si no, hay un path que responde pero nunca cierra ni deriva.

---

## Distribución observada (últimas 200 ejecuciones WF2)

- Duraciones: p50 `0.11 s`, p90 `62.7 s`, max `683.7 s`; `<1 s: 134`, `>10 s: 53`, `>60 s: 37`.
- Muestra de 12 largas: `modo general: 9`, `normal/reactivación: 2`, sin `Armar salida: 1` (`580653`).
- Cierres en la muestra: `escalado: 7`, `''`: 4, más `581311` escalado por `sin_respuesta_del_modelo`.
- Motivos `ESCALAR_DEBUG` en la muestra: `modelo_decidio_escalar: 5`, `sin_respuesta_del_modelo: 2`, sin nota: 4.

## Archivos y referencias

- PROD export analizado: `/tmp/wf2_prod.json` (280 KB, v634) — temporal local, no versionado.
- Repo: `clientes/xtract/proyectos/04-reactivacion-closed-lost/workflows/Closed Lost WhatsApp — 2. Recepción vía Chatwoot.json` (45 nodos, desactualizado vs PROD).
- Backups: `clientes/xtract/proyectos/04-reactivacion-closed-lost/workflows/backups/HIYvqfItsrPk4CGc_backup_*.json`.
- Docs: `README.md` (04), `CONFIGURACION.md`, `docs/brain/{sistemas,credenciales,testing-protocol}.md`.
- Ejecuciones citadas: WF2 `581311`, `580727`, `580874`, `580656`, `581232`, `580537`, `578531`, `580523`, `580653`, `579022`, `580507`; WF3 `581711`, `581666`.

## Próximos pasos propuestos (sin tocar PROD)

1. Leer `Procesar Respuesta` y `Preparar Datos Lead` completos y fijar E1/E5c en DEV.
2. Decidir filtro de Notion por teléfono (E2) y política de `cierre` explícito (E9).
3. Definir manejo de errores: `continueErrorOutput` + ramas reales o error workflow + `retryOnFail` en red (E3, E6).
4. Resolver drift: desplegar o descartar fallback Groq y actualizar `README` del 04 (E4).
5. Reconectar `SheetCuentaSantiago` desde la UI de PROD (E8, acto humano).
6. Recién después: diff DEV→PROD + gate humano según reglas del repo.

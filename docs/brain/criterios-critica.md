# Criterios de Crítica Adversarial (Design Critic)

Todo nuevo diseño de workflow debe ser evaluado contra este checklist antes de pasar a la fase de construcción en desarrollo (DEV).

---

## Checklist de Stress Test

### 1. Robustez ante Fallas Externas (Fault Tolerance)
- [ ] ¿Qué ocurre si la API externa (Notion, Google, Chatwoot) devuelve `429 (Rate Limit)` o `500 (Internal Error)`?
- [ ] ¿Los nodos críticos declaran su política de error de forma explícita? Los tres mecanismos de n8n son distintos y no intercambiables:
  - `"onError": "continueRegularOutput"` / `"continueErrorOutput"` — propiedad **a nivel de nodo**. Es el mecanismo general (reemplaza al viejo `continueOnFail`). Con `continueErrorOutput` hay que **cablear la rama de error**, si no el fallo se pierde en silencio.
  - `"retryOnFail": true` (+ `maxTries`, `waitBetweenTries`) — reintento del nodo. Es la respuesta correcta a un `429` o a un `500` transitorio, no `onError`.
  - `neverError: true` — opción **específica del nodo HTTP Request**, dentro de `options.response.response`. Hace que un `4xx/5xx` se devuelva como dato en vez de romper. Útil cuando el código de estado **es** la información que querés evaluar; peligroso si nadie revisa el `statusCode` río abajo.
- [ ] ¿Se cuenta con un modelo de IA de respaldo (fallback) en caso de caída del proveedor principal?
- [ ] ¿Existe un `Error Trigger` o una notificación para los fallos que ocurren fuera del horario en que alguien mira los logs?

### 2. Eficiencia y Costo Operativo
- [ ] ¿Se está usando un LLM para tareas que podrían resolverse con una expresión regular o una función JavaScript simple?
- [ ] ¿Se filtra la información irrelevante antes de inyectarla al prompt para reducir consumo de contexto y tokens?
- [ ] ¿Los webhooks de alta frecuencia agrupan ráfagas de mensajes antes de procesar?

### 3. Ciclo de Vida y Nodos Bloqueantes
- [ ] ¿Existe algún nodo `Wait` mayor a 5 minutos dentro de un loop o flujo principal? (Si existe, debe desacoplarse a un Cron — ver [patrón 2](catalogo-patrones.md)).
- [ ] ¿Hay algún nodo `n8n-nodes-base.form` en una ruta que se ejecuta **sin humano presente**?
  - 🛑 **Prohibido** en flujos 100% desatendidos (cron, webhook servidor-a-servidor): deja la ejecución colgada en `waiting` indefinidamente.
  - ✅ **Permitido y esperado** como fallback interactivo explícito, según la [Estrategia Zero-Touch](n8n-reglas-construccion.md#4-estrategia-zero-touch-one-shot-vs-fallback). El proyecto 05 lo usa así en producción, por diseño.
  - La pregunta correcta no es "¿hay un form?" sino **"¿existe una ruta automática que pueda caer en el form sin que nadie lo complete?"**.
- [ ] ¿Los workflows temporales o de diagnóstico tienen nombre `TEMP - ...` y plan de borrado? (Ver [protocolo de testing](testing-protocol.md#3-limpieza-del-entorno-de-desarrollo)).

### 4. Seguridad e Integridad de Datos
- [ ] ¿Las credenciales están referenciadas por ID/nombre (`credentials`) y nunca hardcodeadas en código o headers planos?
- [ ] ¿Los IDs de credenciales corresponden al **entorno de destino**? Un ID de PROD en un workflow que va a DEV rompe todos los nodos (ver [credenciales.md §3](credenciales.md#3-convención-de-exports-en-el-repositorio)).
- [ ] ¿Las variables de plantillas externas (Meta / WhatsApp) tienen fallbacks por defecto para evitar errores 400 por campos vacíos?
- [ ] ¿Se aplican las reglas de puntuación y estilo del canal (ej. WhatsApp solo signos de cierre `?`, `!`)?
- [ ] ¿El workflow escribe en registros reales (Notion, Sheets, Chatwoot) durante una prueba? Si sí, ¿usa fila/conversación de staging?

---

## Salida esperada de la crítica

No alcanza con marcar casilleros. El resultado del stress test es una lista de
**riesgos concretos con su mitigación propuesta**, ordenados por impacto:

| Riesgo | Escenario disparador | Mitigación | ¿Bloquea el pase a DEV? |
| :--- | :--- | :--- | :--- |
| ... | ... | ... | Sí / No |

Un riesgo sin escenario disparador concreto no es un riesgo: es una intuición. Descartarlo o
convertirlo en un caso de prueba.

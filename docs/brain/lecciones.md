# Lecciones Aprendidas

Registro de comportamientos no obvios de n8n y de este stack. Cada entrada existe porque
**costó tiempo descubrirla**. Las reglas de los otros documentos salen de acá; este archivo
guarda el *por qué* y el *cuándo*.

**Formato:** fecha · síntoma observado · causa real · regla que quedó.

---

## 2026-08-24 · "Config global" de Antigravity, según su propia doc, no es la que corre

- **Síntoma:** `~/.gemini/antigravity-ide/mcp_config.json` (la config real de la IDE abierta)
  no tenía `n8n` ni `n8n_prod`, aunque `~/.gemini/config/mcp_config.json` sí — y la doc interna
  de Antigravity dice textualmente que ese segundo archivo es el **"Global Configuration
  (applies to all sessions)"**.
- **Causa:** hay más de un binario de Antigravity instalado en la máquina
  (`Antigravity IDE.app`, `antigravity-cli`, y una versión "Antigravity" sin `-ide`), y cada
  uno resultó tener su **propio** `mcp_config.json` bajo `~/.gemini/<variante>/` — la doc
  describe el caso de un solo binario, no esta instalación con varios.
- **Cómo se confirmó cuál corre de verdad:** no por la doc, sino leyendo `ps aux` y buscando el
  flag `--app_data_dir` del proceso activo. Coincidió con el nombre de una de las carpetas
  (`antigravity-ide`), no con la que la doc llama "global".
- **Regla:** [`sistemas.md §2`](sistemas.md#2-fuentes-de-verdad-de-la-configuración-mcp) — ante
  cualquier duda sobre qué config lee un host con varias instalaciones, verificar por proceso
  corriendo, nunca confiar en la doc del producto a ciegas cuando hay múltiples variantes en
  la misma máquina.

---

## 2026-08-24 · Un dato mal cargado en el catálogo pasó como si estuviera verificado

- **Síntoma:** `credenciales.md` tenía el ID de la credencial OpenRouter de PROD escrito como
  el literal `"OpenRouter Xtract"` — el **nombre**, copiado en la columna del **ID**.
- **Causa:** alguien (probablemente otra sesión trabajando en paralelo sobre el mismo workflow)
  cargó la fila a mano sin copiar el ID real (`LW8I48MvSQglFqrJ`), y quedó sin marcar como
  pendiente de verificar.
- **Regla:** un ID con la forma de un nombre legible (espacios, mayúsculas) es sospechoso por
  definición — los IDs de n8n son strings alfanuméricos cortos sin espacios. Cuando algo así
  aparece en una tabla ya "verificada", volver a chequear esa fila puntual antes de confiar en
  la fecha de verificación general del documento.

---

## 2026-08-24 · Los `workflow.json` del repo son exports de PROD

- **Síntoma:** los IDs de credenciales de los workflows versionados no existen en la instancia DEV.
- **Causa:** el repo versiona el export productivo. La copia en DEV es otro workflow, con otro
  ID y otras credenciales (ej. proyecto 05: `bAh0FYSFTM0UeXSc` en PROD vs `XToQjOesjjENHm1n` en DEV).
- **Confirmado el 2026-08-24** contra la instancia: los cuatro IDs del repo
  (`YMyp0HVPQygTa5Qn`, `HIYvqfItsrPk4CGc`, `KYqttVyQPTvG8xg6`, `bAh0FYSFTM0UeXSc`) existen en
  `n8n.xtract.app` con esos IDs exactos, y sus 13 credenciales coinciden una por una.
- **Regla:** [`credenciales.md §3`](credenciales.md#3-convención-de-exports-en-el-repositorio) —
  remapear credenciales antes de importar en cualquier dirección.
- **Impacto si se ignora:** todos los nodos de servicio fallan a la vez y parece un bug de diseño.

---

## 2026-08-24 · El acceso a PROD depende del host de agente

- **Síntoma:** la documentación prometía un servidor MCP `n8n_prod` que en Claude Code no existe.
- **Causa:** los servidores MCP se configuran por host. Antigravity
  (`~/.gemini/config/mcp_config.json`) tiene `n8n` + `n8n_prod`; Claude Code (`~/.claude.json`)
  tiene solo `n8n-mcp` apuntando a DEV.
- **Regla:** [`sistemas.md §3`](sistemas.md#3-matriz-de-acceso-por-host) — verificar las
  herramientas disponibles antes de escribir, y usar la ruta de despliegue manual cuando falte
  `n8n_prod`.
- **Riesgo real:** no es quedarse sin acceso, es **confundir el servidor genérico `n8n` con
  producción**.

---

## 2026-08-24 · La instancia "DEV" es producción de los proyectos propios

- **Síntoma:** el brain trataba `n8n.santiagowuerich.info` como laboratorio descartable, pero
  aloja `Marketplace Auto-Reply — Cerebro` con 7 webhooks, heartbeat propio (`Registrar Latido`
  → `¿Alguna Cuenta Muda?` → `Avisar Bot Caído`) y alertas por Telegram, más los dos workflows
  del Prospector B2B.
- **Causa:** faltaba el eje de **propiedad**. "Entorno" y "de quién es el proyecto" son
  independientes: la misma instancia es staging para Xtract y producción para lo propio.
- **Regla:** [`sistemas.md`](sistemas.md#propiedad-de-los-proyectos-y-rol-de-cada-instancia) —
  matriz instancia × propietario, lista de workflows protegidos, y `personal/` separado de
  `clientes/`.
- **Riesgo real:** desactivar un workflow propio "porque estamos en DEV" es una caída productiva
  silenciosa — del lado de la extensión de navegador no aparece ningún error.

---

## 2026-08-24 · `availableInMCP` bloquea al servidor MCP nativo, no a la API pública

- **Síntoma:** `get_workflow_details` (servidor `n8n-mcp` nativo) devuelve *"Workflow is not
  available in MCP"* para los dos workflows del Prospector B2B, aunque `search_workflows` sí
  los lista.
- **Causa:** n8n expone un flag `settings.availableInMCP` por workflow. El servidor MCP nativo
  lo respeta y niega el detalle.
- **Matiz importante:** los servidores MCP que hablan contra la **API pública**
  (`@leonardsellem/n8n-mcp-server`, que es lo que usa `n8n_prod`) **ignoran el flag**. Todos los
  workflows productivos de Xtract tienen `availableInMCP: false` y aun así se leen sin problema
  por esa vía.
- **Regla:** si el servidor nativo bloquea un workflow, no es permisos ni credencial. Las
  salidas son dos: habilitar el flag desde la tarjeta del workflow, o leerlo por un servidor
  basado en la API pública.

---

## 2026-08-24 · DEV no es un entorno descartable

- **Síntoma:** la instancia de desarrollo tiene workflows con `active: true` y triggers vivos,
  además de restos `TEMP - ...` de sesiones viejas que nadie borró.
- **Causa:** no había regla de limpieza ni advertencia sobre trabajo propio corriendo en DEV.
- **Regla:** [`testing-protocol.md §3`](testing-protocol.md#3-limpieza-del-entorno-de-desarrollo) —
  prefijo `TEMP - `, borrado en la misma sesión, barrido con confirmación humana.

---

## 2026-08-26 · Google Sheets Update omite silenciosamente columnas ausentes en cabeceras

- **Síntoma:** El nodo de Google Sheets en modo `update` finaliza con estado `success` pero devuelve
  `data: [[]]` (0 filas afectadas), sin arrojar ningún error fatal.
- **Causa:** Las columnas mapeadas para actualizar (`seguimiento`, `fecha_seguimiento`) no existían
  físicamente en la fila 1 (cabeceras) de la hoja. La API de Google Sheets ignora campos sin columna
  asociada y no actualiza nada.
- **Impacto:** Los workflows basados en Cron que filtran por estado (`seguimiento !== "enviado"`)
  vuelven a seleccionar a los mismos destinatarios en cada intervalo (ej: cada 30 min), enviando
  mensajes duplicados en bucle continuo.
- **Regla:** Antes de configurar un nodo de `update` por coincidencia en Google Sheets, verificar
  que todas las columnas destino existan en la primera fila de la pestaña correspondiente.

---

## 2026-08-26 · Chatwoot `content` vs Meta `processed_params` en plantillas de WhatsApp

- **Síntoma:** El chat de Chatwoot muestra textos de plantilla con números literales como
  `"Hola 1, te escribe 2 del equipo..."` en lugar de los nombres reales.
- **Causa:** En la API de Chatwoot, `content` es el texto de previsualización que se renderiza
  en la bandeja de entrada y sirve de fallback. Si se deja un string con los placeholders crudos
  `1` y `2`, ese es el texto que queda visible en la conversación.
- **Regla:** Interpolar siempre las variables dinámicas (`${empresa}`, `${sistema}`, etc.) tanto en
  el campo `content` como dentro del objeto `template_params.processed_params`.

---

## 2026-08-26 · Multi-workspace de Slack y Bot Direct Messages (DMs)

- **Síntoma:** Error `channel_not_found` al intentar enviar mensajes a través de la API de Slack.
- **Causa:** Los IDs de usuario (`U...`) y de canal directo (`D...`) pertenecen exclusivamente a un
  `team_id` (Workspace). Un Bot Token corporativo de Xtract (`T019FLW78AJ`) no puede enviar a canales
  DMs de un workspace personal (`T0BJPS3C3NH`).
- **Regla:** Para enviar notificaciones privadas a un Slack personal, usar el Bot Token (`xoxb-...`)
  de la aplicación instalada en ese workspace específico y su `channel_id` correspondiente (`D0BRPUE84UA`).

---

## Reglas heredadas (origen sin fecha registrada)

Estas quedaron documentadas antes de existir este registro. Si volvés a toparte con el caso,
agregá acá la fecha y el contexto concreto.

### Nodos intermedios conectados antes de un `Merge` disparan alertas falsas
Conectar un nodo de una rama paralela directamente a una notificación, antes del `Merge`
(`waitForAll`), produce disparos con datos incompletos.
→ [`n8n-reglas-construccion.md §1`](n8n-reglas-construccion.md).

### Slack `slackOAuth2Api` exige `authentication: "oAuth2"` explícito
Desde n8n v2.5+, omitir el parámetro hace que n8n pida una credencial de tipo Bot (`slackApi`)
y falle la validación, aunque la credencial OAuth2 esté bien configurada.
→ [`n8n-reglas-construccion.md §3`](n8n-reglas-construccion.md).

### Referenciar un nodo que no corrió rompe la ejecución
`$('Nodo_X')` sobre un nodo de una rama no ejecutada tira error. Hay que guardar con
`.isExecuted`.
→ [`n8n-reglas-construccion.md §2`](n8n-reglas-construccion.md).


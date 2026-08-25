# Lecciones Aprendidas

Registro de comportamientos no obvios de n8n y de este stack. Cada entrada existe porque
**costó tiempo descubrirla**. Las reglas de los otros documentos salen de acá; este archivo
guarda el *por qué* y el *cuándo*.

**Formato:** fecha · síntoma observado · causa real · regla que quedó.

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

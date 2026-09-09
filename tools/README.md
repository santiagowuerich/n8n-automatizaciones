# Tooling de Automatización y Testing n8n

Suite de herramientas CLI para validación estática, testing interactivo y monitoreo en tiempo real de workflows en **n8n DEV** (`n8n.santiagowuerich.info`) y **n8n PROD** (`n8n.xtract.app`).

---

## 1. `n8n-runner.js` — Execution, Testing & Node Inspector

Permite disparar webhooks, pollear resultados automáticamente, listar ejecuciones históricas e inspeccionar el output exacto de cualquier nodo en la terminal.

### Comandos de Ejemplo:

```bash
# 1. Disparar webhook y ver inspección completa de ejecución en PROD:
node tools/n8n-runner.js --env prod --webhook discovery-email-slack --payload @scratch/test_payload.json

# 2. Disparar webhook y ver el texto final generado por un nodo específico:
node tools/n8n-runner.js --env prod --webhook discovery-email-slack --payload @scratch/test_payload.json --node "Armar mensaje de Slack"

# 3. Inspeccionar una ejecución histórica por su ID:
node tools/n8n-runner.js --env prod --exec 590155 --node "Armar mensaje de Slack"

# 4. Listar las últimas 10 ejecuciones en DEV o PROD:
node tools/n8n-runner.js --env prod --list 10
node tools/n8n-runner.js --env dev --list 5 --status error

# 5. Testing automatizado con assertions (para scripts o CI):
node tools/n8n-runner.js --env prod --exec 590155 --node "Armar mensaje de Slack" --assert-contains "Acompanhamento"
```

### Opciones de `n8n-runner`:
| Flag | Descripción |
| :--- | :--- |
| `--env, -e <dev\|prod>` | Entorno objetivo (por defecto `prod`). |
| `--webhook, -h <slug>` | Slug del webhook a disparar (ej: `discovery-email-slack`). |
| `--test` | Dispara al endpoint de prueba de n8n (`/webhook-test/...`). |
| `--payload, -p <json\|@file>` | Payload JSON directo o ruta a un archivo `.json` usando `@`. |
| `--wf, -w <id>` | ID del workflow en n8n para pollear su última ejecución. |
| `--file, -f <path>` | Ruta a un `workflow.json` local (extrae el ID automáticamente). |
| `--node, -n "<nombre>"` | Filtra y formatea el output del nodo especificado. |
| `--exec, -x <id>` | Inspecciona directamente una ejecución por ID numérico. |
| `--list, -l [N]` | Lista las últimas N ejecuciones con tabla visual y tiempos. |
| `--status <success\|error>` | Filtra la lista de ejecuciones por estado. |
| `--assert-contains "<txt>"` | Valida que el output del nodo contenga el texto (exit 0 / 1). |

---

## 2. `n8n-validator.js` — Linter Estático & Pre-Deploy Checker

Audita estáticamente la arquitectura de los workflows locales, verifica reglas duras y corre un Sandbox VM emulado para Code nodes antes de desplegar a producción.

### Comandos de Ejemplo:

```bash
# Validar un workflow específico:
node tools/n8n-validator.js clientes/xtract/proyectos/06-discovery-email-slack/workflow.json

# Auditar todos los workflows activos del repositorio:
node tools/n8n-validator.js --all

# Modo estricto (falla si hay warnings):
node tools/n8n-validator.js clientes/xtract/proyectos/06-discovery-email-slack/workflow.json --strict
```

### Reglas Auditadas por `n8n-validator`:
1. **Regla Dura `$env` / `process.env`:** Detecta y bloquea el uso de variables de entorno en Code nodes (bloqueadas en las instancias n8n).
2. **LangChain Output Unnesting:** Verifica que los nodos posteriores a un Extractor de LangChain desenvuelvan correctamente `.output` (`$input.first().json.output || $input.first().json`).
3. **Slack Unfurl Links / Media:** Revisa que las llamadas a Slack tengan `"unfurl_links": false` y `"unfurl_media": false` para evitar previews gigantes.
4. **Credenciales Placeholders:** Detecta credenciales no configuradas (`REEMPLAZAR_`, `TODO`, etc.).
5. **Topología y Conexiones:** Detecta nodos huérfanos, orígenes o destinos inexistentes. Soporta grafos principales y subgrafos de IA (`ai_languageModel`, `ai_tool`, etc.).
6. **Sandbox VM Tester:** Emula el entorno de runtime de n8n (`$input`, `$`, Luxon, etc.) para detectar errores de JavaScript en nodos Code antes de ejecutar en el servidor.

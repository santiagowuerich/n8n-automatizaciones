# Catálogo de Credenciales — Second Brain

> **REGLA DE SEGURIDAD ESTRICTA:** Este archivo **NUNCA** almacena claves privadas, tokens, contraseñas o secretos de API. Solo registra nombres de referencia, IDs de nodo n8n y su disponibilidad por entorno.

> **Los IDs de credenciales son por instancia.** Un ID válido en DEV no existe en PROD y viceversa.
> Antes de reutilizar un ID, confirmar contra la tabla del entorno correcto.

---

## 1. Instancia Santiago (`n8n.santiagowuerich.info`)

<!-- Verificado el 2026-08-24 vía list_credentials (11/11 credenciales) -->
**Última verificación:** 2026-08-24 — completa (11 de 11).

⚠️ Estas credenciales sirven **dos roles a la vez**: el staging de Xtract y la producción de los
[proyectos propios](../../personal/README.md). Rotar o borrar una de acá puede tirar abajo un
sistema propio en producción — no son credenciales descartables de laboratorio.

| Servicio | Tipo de Credencial en n8n | Nombre en n8n | Credential ID |
| :--- | :--- | :--- | :--- |
| Google Docs | `googleDocsOAuth2Api` | `Google Docs account` | `u7afUNn3OQlC26Ee` |
| Google Slides | `googleSlidesOAuth2Api` | `Google Slides account` | `fhLLBIVb1wUH3rsa` |
| Google Drive | `googleDriveOAuth2Api` | `Cuenta Wuerich n8n` | `hxMQlpG3Haq3z8dR` |
| Google Sheets | `googleSheetsOAuth2Api` | `Wuerich` | `vB1bfFFyDiA59OJt` |
| DeepSeek | `deepSeekApi` | `Deepseek Wuerich` | `TVq8PqRWr7qNS7Zk` |
| Groq | `groqApi` | `Groq account` | `Qa47kiif6fRN0Qb8` |
| Telegram | `telegramApi` | `Telegram account` | `f3LD7RSRhhIq5QZc` |
| AWS S3 | `s3` | `S3 account` | `m4rg3rLWhEbxxQso` |
| AWS IAM | `aws` | `AWS (IAM) account 2` | `7mpZLxQojEk9Ofqw` |
| AWS IAM (duplicada) | `aws` | `AWS (IAM) account` | `k7pXvdJLOUMFHGdg` |
| Webhook Auth | `httpHeaderAuth` | `webapp-api-key` | `dHAs9JUgy5W0wq0Y` |
| OpenRouter | `openRouterApi` | `OpenRouter Xtract` | `GZJLtPsNDjGQdoMI` |

---

## 2. Instancia Xtract (`n8n.xtract.app`)

**Última verificación:** 2026-08-24 — las 14 confirmadas contra la instancia vía `n8n_prod`,
leyendo los `credentials` de los nodos de los workflows productivos `HIYvqfItsrPk4CGc` (04-WF2)
y `bAh0FYSFTM0UeXSc` (05).

| Servicio | Tipo de Credencial en n8n | Nombre en n8n | Credential ID | Confirmado en workflow |
| :--- | :--- | :--- | :--- | :--- |
| Notion | `notionApi` | `Xtract Notion` | `hCkfHhloIjGdaqmd` | 04-WF2, 05 |
| Slack (Bot/Token) | `slackApi` | `Xtract notifications` | `y1DaRieOF29GQnxm` | 04-WF2 |
| Slack (OAuth2) | `slackOAuth2Api` | `Slack personal Santi` | `LOGlZWLcdTggazKj` | 05 |
| Google Sheets | `googleSheetsOAuth2Api` | `SheetCuentaSantiago` | `sgEH8OTRXcjJiTTc` | 04-WF1/2/3 |
| Google Docs | `googleDocsOAuth2Api` | `GoogleDocsSantiago` | `jf5Hewywe5abdtTj` | 04-WF2 |
| Google Docs (alt.) | `googleDocsOAuth2Api` | `Xtract cred-santiagow` | `llGqVQqRBjrz3XhU` | 05 |
| Google Slides | `googleSlidesOAuth2Api` | `Xtract cred-santiagow` | `2zf62ANt1cqLYK9N` | 05 |
| Google Drive | `googleDriveOAuth2Api` | `Xtract cred-santiagow` | `2nHeE2yjp5ghofd4` | 05 |
| Service Account | `jwtAuth` | `Service Account Xtract transcripts-reader` | `B3KwxGmlrCCTgAHk` | 05 |
| Chatwoot | `httpHeaderAuth` | `Chatwoot API` | `BjYt68eHeT61ihqb` | 04-WF1/2/3 |
| Calendly | `calendlyOAuth2Api` | `Calendly micaela.marcos` | `VJnAlINTOaMmBHc6` | 04-WF2 |
| DeepSeek | `deepSeekApi` | `SantiagoApikey` | `H5fC2aZoNphCCole` | 05 |
| Groq | `groqApi` | `Groq Xtract` | `eBM64OF1E854MM7I` | 04-WF2 |
| OpenRouter | `openRouterApi` | `OpenRouter Xtract` | `OpenRouter Xtract` | 04-WF2 |

**✅ Discrepancia cerrada — `LOGlZWLcdTggazKj`:** el catálogo decía `Slack account 3`; la
instancia dice **`Slack personal Santi`**. El nombre viejo era el del catálogo, ya corregido.
Nota: la credencial de Slack OAuth2 que usa el proyecto 05 es **personal, no de Xtract** — si
algún día se cambia por una del workspace del cliente, hay que actualizar el ID acá.

**Faltantes conocidos:** no hay credencial registrada para Google Gemini (`googlePalmApi`) en
ningún entorno — los workflows que la usan (demos del 04, proyecto 02) llevan placeholders
`REEMPLAZAR_*`. Tampoco hay credencial de Meta / WhatsApp Cloud API: el envío de WhatsApp del
proyecto 04 se hace **a través de Chatwoot**, no contra Meta directamente.

---

## 3. Convención de exports en el repositorio

Verificado el 2026-08-24: **los `workflow.json` versionados en `clientes/` son exports de PROD**,
no de DEV.

- El proyecto 05 del repo tiene `id: bAh0FYSFTM0UeXSc`, que es el ID productivo. En DEV el mismo
  workflow vive bajo `XToQjOesjjENHm1n`.
- Los tres workflows del proyecto 04 en el repo (`YMyp0HVPQygTa5Qn`, `HIYvqfItsrPk4CGc`,
  `KYqttVyQPTvG8xg6`) no existen en DEV; DEV tiene una copia distinta bajo `tMBXHDSHP9Er6NQG`.
- Consecuencia: **importar un `workflow.json` del repo directamente en DEV deja todos los nodos
  con credenciales rotas**, porque los IDs son de PROD.

**Regla:** al llevar un workflow del repo a DEV, remapear los IDs de la tabla §2 a los de §1
antes de importar. En sentido inverso (DEV → PROD), aplicar el remapeo opuesto según el
[protocolo de transición](sistemas.md#4-protocolo-de-transición-dev-a-prod).

---

## 4. Protocolo de Enlace Automático

Cuando el Second Brain diseñe un nodo en DEV o PROD:
1. Determinar el entorno de destino y consultar **la tabla de ese entorno** (§1 o §2) para
   obtener el `id` y `name` exactos.
2. Inyectar la referencia en el nodo (ej: `"credentials": { "notionApi": { "id": "hCkfHhloIjGdaqmd", "name": "Xtract Notion" } }`).
3. Si la credencial no figura en la tabla, **primero re-verificar contra la instancia** (§5)
   antes de dar por faltante. Solo si tampoco existe ahí, detenerse y solicitar al usuario
   que la configure en la UI de n8n.

---

## 5. Cómo re-verificar este catálogo

- **Instancia Santiago, desde cualquier host con MCP de n8n:** `list_credentials` (o
  `GET /credentials` según el servidor MCP). Devuelve id, nombre y tipo; nunca secretos.
- **Instancia Xtract:** requiere un host con `n8n_prod` configurado — comprobar contra la
  [matriz de acceso](sistemas.md#3-matriz-de-acceso-por-host) antes de asumir que está.
- La API pública de n8n **no expone un listado de credenciales**; si el servidor MCP no ofrece
  `list_credentials`, la alternativa es leer los `credentials` de los nodos de los workflows
  existentes en esa instancia.
- Tras cada verificación, actualizar la línea **"Última verificación"** de la tabla
  correspondiente. Una tabla sin fecha reciente se trata como sospechosa, no como verdad.

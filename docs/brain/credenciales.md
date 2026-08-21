# Catálogo de Credenciales — Second Brain

> **REGLA DE SEGURIDAD ESTRICTA:** Este archivo **NUNCA** almacena claves privadas, tokens, contraseñas o secretos de API. Solo registra nombres de referencia, IDs de nodo n8n y su disponibilidad por entorno.

---

## 1. Instancia Desarrollo (`n8n.santiagowuerich.info`)

| Servicio | Tipo de Credencial en n8n | Nombre en n8n | Credential ID |
| :--- | :--- | :--- | :--- |
| Google Docs | `googleDocsOAuth2Api` | `Google Docs account` | `u7afUNn3OQlC26Ee` |
| Google Slides | `googleSlidesOAuth2Api` | `Google Slides account` | `fhLLBIVb1wUH3rsa` |
| Google Drive | `googleDriveOAuth2Api` | `Cuenta Wuerich n8n` | `hxMQlpG3Haq3z8dR` |
| DeepSeek | `deepSeekApi` | `Deepseek Wuerich` | `TVq8PqRWr7qNS7Zk` |
| Groq | `groqApi` | `Groq account` | `Qa47kiif6fRN0Qb8` |
| Telegram | `telegramApi` | `Telegram account` | `f3LD7RSRhhIq5QZc` |
| AWS S3 | `s3` | `S3 account` | `m4rg3rLWhEbxxQso` |
| AWS IAM | `aws` | `AWS (IAM) account 2` | `7mpZLxQojEk9Ofqw` |
| Webhook Auth | `httpHeaderAuth` | `webapp-api-key` | `dHAs9JUgy5W0wq0Y` |

---

## 2. Instancia Producción (`Xtract - n8n.xtract.app`)

| Servicio | Tipo de Credencial en n8n | Nombre en n8n | Credential ID |
| :--- | :--- | :--- | :--- |
| Notion | `notionApi` | `Xtract Notion` | `hCkfHhloIjGdaqmd` |
| Slack (Bot/Token) | `slackApi` | `Xtract notifications` | `y1DaRieOF29GQnxm` |
| Slack (OAuth2) | `slackOAuth2Api` | `Slack account 3` | `LOGlZWLcdTggazKj` |
| Google Sheets | `googleSheetsOAuth2Api` | `SheetCuentaSantiago` | `sgEH8OTRXcjJiTTc` |
| Google Docs | `googleDocsOAuth2Api` | `GoogleDocsSantiago` / `Xtract cred-santiagow` | `jf5Hewywe5abdtTj` / `llGqVQqRBjrz3XhU` |
| Google Slides | `googleSlidesOAuth2Api` | `Xtract cred-santiagow` | `2zf62ANt1cqLYK9N` |
| Google Drive | `googleDriveOAuth2Api` | `Xtract cred-santiagow` | `2nHeE2yjp5ghofd4` |
| Service Account | `jwtAuth` | `Service Account Xtract transcripts-reader` | `B3KwxGmlrCCTgAHk` |
| Chatwoot | `httpHeaderAuth` | `Chatwoot API` | `BjYt68eHeT61ihqb` |
| Calendly | `calendlyOAuth2Api` | `Calendly micaela.marcos` | `VJnAlINTOaMmBHc6` |
| DeepSeek | `deepSeekApi` | `SantiagoApikey` | `H5fC2aZoNphCCole` |
| Groq | `groqApi` | `Groq Xtract` | `eBM64OF1E854MM7I` |

---

## 3. Protocolo de Enlace Automático

Cuando el Second Brain diseñe un nodo en DEV o PROD:
1. Consulta esta tabla para obtener el `id` y `name` exactos correspondientes al servicio y entorno.
2. Inyecta la referencia en el nodo (ej: `"credentials": { "notionApi": { "id": "hCkfHhloIjGdaqmd", "name": "Xtract Notion" } }`).
3. Si la credencial no existe o no tiene ID, se detiene y solicita al usuario configurarla en la UI de n8n.

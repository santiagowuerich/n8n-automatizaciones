# Reglas Arquitectónicas de Construcción en n8n — Second Brain

Normas obligatorias para diseñar, modificar y validar workflows de n8n en desarrollo y producción.

---

## 1. Topología y Sincronización de Ramas (Merges)

1. **Aislamiento de Ramas Paralelas:**
   - Si un workflow bifurca en dos tareas paralelas (ej: escribir Google Slides + crear Google Doc) que se unen en un nodo `Merge` (`waitForAll`), **ninguno de los nodos de las ramas debe conectarse a nodos de salida o notificación antes del Merge**.
   - Conectar un nodo intermedio directamente a una alerta causa disparos falsos con datos incompletos.
2. **Nodos Dedicados por Flujo:**
   - Si una operación (ej: completar Slide) participa tanto en una ruta automática (One-Shot) como en una ruta interactiva (Formulario), **usar nodos diferenciados** para cada ruta para evitar ciclos o efectos secundarios de conexión cruzada.

---

## 2. Referencias Dinámicas entre Nodos

1. **Nodos Condicionales y Bifurcaciones:**
   - Si un dato puede provenir de dos nodos alternativos según la ruta ejecutada, usar expresiones seguras con fallback:
     ```javascript
     const data = $('Nodo_A').isExecuted ? $('Nodo_A').first().json : $('Nodo_B').first().json;
     ```
   - Nunca referenciar de forma estática `$('Nodo_Inexistente')` en expresiones, porque n8n rompe la ejecución si el nodo referenciado no corrió.

---

## 3. Integración con Slack

1. **Autenticación en n8n v2.5+:**
   - Al usar credenciales `slackOAuth2Api`, el nodo DEBE incluir explícitamente el parámetro:
     ```json
     "parameters": {
       "authentication": "oAuth2",
       ...
     }
     ```
   - Omitir `"authentication": "oAuth2"` hace que n8n exija credencial de tipo Bot (`slackApi`) y falle la validación.
2. **Formato de Mensajes:**
   - Mensajes limpios y directos en producción: links a documentos, bullets con métricas claras y mención al owner con `<@ID_SLACK>`.
   - No incluir banners ni disclaimers de prueba en flujos de producción.

---

## 4. Estrategia Zero-Touch (One-Shot vs Fallback)

1. **Prioridad al Contexto Existente:**
   - Si el webhook de entrada (Notion / CRM / Webhook) ya contiene variables clave (`property_one_shot`, `property_mrr`, etc.), el flujo debe ejecutar el camino **One-Shot** directo.
2. **Fallback Interactivo:**
   - Si faltan datos críticos, derivar al formulario interactivo sin romper el flujo ni dejar campos vacíos en documentos generados.

---

## 5. Organización de Archivos en el Repositorio

| Directorio | Propósito Exclusivo |
| :--- | :--- |
| `docs/brain/` | **Solo documentación operativa en Markdown** (`sistemas.md`, `credenciales.md`, etc.). Prohibido crear scripts `.js` o archivos temporales aquí. |
| `clientes/<cliente>/proyectos/<id>/` | **Trabajo facturable.** Workflows limpios (`workflow.json`), `README.md`, `decisiones.md` y `MANIFESTO.md`. |
| `personal/proyectos/<id>/` | **Proyectos propios.** Misma estructura, sin entregables de cliente. |
| `.agents/skills/` | Skills de automatización y testing del Second Brain (expuestas a Claude Code vía el symlink `.claude/skills`). |
| `scratch/` | Scripts temporales, dumps de API y diagnósticos de una sola ejecución. **Ignorado por git.** |

**Regla de propiedad:** antes de crear un directorio de proyecto, definir de quién es. Un
proyecto propio en `clientes/` termina facturado o entregado por error; uno de cliente en
`personal/` se pierde del alcance contratado.

**Regla de raíz limpia:** ningún `.json`, `.js` o dump suelto en la raíz del repositorio.
Si es un volcado de una consulta a una API para inspeccionar, va a `scratch/`. Si es un
entregable, va al proyecto que le corresponde en `clientes/`.

---

## 6. Entorno de origen de los `workflow.json`

Un `workflow.json` versionado es siempre el export de **la instancia donde ese proyecto es
producción** (ver [propiedad y roles](sistemas.md#propiedad-de-los-proyectos-y-rol-de-cada-instancia)).

### Proyectos de cliente (`clientes/`)
Los exports vienen de `n8n.xtract.app`: llevan IDs de workflow y de credenciales productivos.
La copia en DEV del mismo workflow vive bajo **otro ID** y con **otras credenciales**.

1. Antes de importar un JSON del repo a DEV, remapear las credenciales según
   [`credenciales.md §3`](credenciales.md#3-convención-de-exports-en-el-repositorio).
2. Al versionar un workflow nuevo, dejar registrado en el `README.md` del proyecto el par
   **ID en DEV ↔ ID en PROD**. Sin ese mapeo, la próxima modificación arranca a ciegas.
3. Nunca sobrescribir un `workflow.json` del repo con un export de DEV sin antes remapear:
   se pierde la referencia productiva.

### Proyectos propios (`personal/`)
Los exports vienen de `n8n.santiagowuerich.info` y ya traen las credenciales correctas: **no
hay remapeo**, porque no hay segunda instancia. A cambio, el repo es la **única copia de
respaldo** del workflow — versionar el JSON después de cada cambio relevante deja de ser
prolijidad y pasa a ser el backup.

# Decisiones Técnicas — Proyecto 05 (Generador de Slides y ROI)

Registro de decisiones arquitectónicas y técnicas tomadas en la construcción y evolución de este flujo.

---

## 1. Bifurcación One-Shot vs Fallback por Formulario

- **Contexto:** Inicialmente el flujo siempre enviaba un DM por Slack pidiendo cargar el `One-Shot` y el `Fee Mensual` mediante un formulario interactivo de n8n antes de generar el Google Doc de ROI.
- **Evidencia observada:** En la mayoría de los casos donde el comercial ya cotizó la oportunidad en Notion, los campos `property_one_shot` y `property_mrr` vienen cargados en el payload inicial del webhook.
- **Decisión:** Implementar un nodo condicional `Tiene precio?`. Si ambos valores (o alguno > 0) están presentes, el flujo genera la página 4 y el Google Doc en paralelo sin intermediación humana. Si faltan, mantiene el envío del formulario a Slack como fallback.

---

## 2. Aislamiento de Ramas en Notificaciones Slack

- **Problema encontrado:** El nodo `Completar pagina 4` estaba conectado directamente al pipeline de notificación inicial de Slack, causando que al correr la rama OneShot se enviara el mensaje intermedio pidiendo el precio antes de terminar el documento ROI.
- **Decisión:** Separar la ejecución de la página 4 en dos nodos/rutas: `Completar pagina 4 (OneShot)` que apunta exclusivamente al `Merge (waitForAll)` con el Doc ROI, y `Completar pagina 4` que alimenta el fallback interactivo.

---

## 3. Configuración de Autenticación en Nodos Slack n8n

- **Problema encontrado:** En n8n v2.5+, al usar credenciales `slackOAuth2Api`, n8n requiere explícitamente el parámetro `"authentication": "oAuth2"`. Si se omite, el motor asume `slackApi` (bot token) y bloquea la publicación con error de credencial faltante.
- **Decisión:** Fijar `"authentication": "oAuth2"` en todos los nodos de Slack del repositorio.

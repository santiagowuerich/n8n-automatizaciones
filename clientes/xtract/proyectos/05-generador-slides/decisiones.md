# Decisiones Técnicas — Proyecto 05 (Generador de Slides y ROI)

Registro de decisiones arquitectónicas y técnicas tomadas en la construcción y evolución de este flujo.

---

## 1. Bifurcación Inteligente: One-Shot Automático vs Notificación por Falta de Facturas (2026-08-25)

- **Contexto:** Si el lead ya cuenta con la cantidad de facturas (en Notion o dicha en la llamada), el sistema debe generar todo de punta a punta sin intervención humana. Sin embargo, si ese dato no existe, el ROI no puede inventarse en base a números arbitrarios.
- **Decisión:** 
  1. Si `facturasMes` está presente $\to$ El flujo corre en **One-Shot directo**, generando la Página 4 de Slides y el Google Doc de ROI en paralelo.
  2. Si `facturasMes` falta $\to$ Se activa la rama de notificación que le envía un **Slack DM al owner del lead** avisando que las Slides (Páginas 1 a 3) están listas pero falta la cantidad de facturas para calcular el impacto y el ROI, con un link interactivo al formulario de n8n prellenado con los datos del deal.
  3. Cuando el owner envía el formulario, este genera la Página 4 y el Documento ROI, converge en el `Merge (waitForAll)` y emite el aviso final de Slack y el comentario en Notion con ambos enlaces listos.

---

## 2. Configuración de Autenticación en Nodos Slack n8n

- **Problema encontrado:** En n8n v2.5+, al usar credenciales `slackOAuth2Api`, n8n requiere explícitamente el parámetro `"authentication": "oAuth2"`. Si se omite, el motor asume `slackApi` (bot token) y bloquea la publicación con error de credencial faltante.
- **Decisión:** Fijar `"authentication": "oAuth2"` en todos los nodos de Slack del repositorio.

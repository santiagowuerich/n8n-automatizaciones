# Workflow: Seguimiento de Chats de WhatsApp (Evolution API)

*   **Estado:** En desarrollo / Configuración de Instancia.
*   **Motor de Mensajería:** Evolution API corriendo en Docker (`evoapicloud/evolution-api:latest`).
*   **Base de Datos de Sesiones:** PostgreSQL corriendo en contenedor `evolution-db`.

---

## 🛠️ Diseño Conceptual y Requerimientos

El objetivo de este flujo es identificar a los clientes que quedaron esperando respuesta por parte del negocio de sillas por más de 24 horas.

### 1. Conexión de WhatsApp Web (QR)
*   **Nombre de Instancia:** `tienda_sillas`
*   **Parámetro de autenticación:** API Key de Evolution (`st_evolution_key_2026`).
*   **Inicialización:** Llamada POST a `http://localhost:8080/instance/create` con la configuración de la instancia para generar el código QR que se escanea en el celular.

### 2. Recepción de Mensajes (Webhooks de Evolution API)
*   Evolution API enviará webhooks en tiempo real hacia n8n para eventos como:
    *   `MESSAGES_UPSERT` (Mensajes nuevos recibidos).
    *   `SEND_MESSAGE` (Mensajes enviados desde el celular).
*   **n8n Webhook Endpoint:** `/webhook/whatsapp-events`

### 3. Base de Datos de Mensajes en n8n
*   n8n registrará en una pequeña base de datos local (o en Notion) la última actividad del chat de cada cliente.
*   **Campos mínimos a guardar:**
    *   `phone_number`: Número de WhatsApp del cliente.
    *   `last_direction`: `incoming` (si el cliente envió el último mensaje) o `outgoing` (si el negocio envió el último mensaje).
    *   `last_timestamp`: Fecha y hora del último mensaje.

### 4. Detección y Notificación Diaria (Cron)
*   Un cron job diario en n8n filtrará los registros donde:
    *   `last_direction` sea `outgoing` (le escribimos nosotros al cliente).
    *   `last_timestamp` sea mayor a 24 horas atrás.
*   **Acción de Alerta:** Compila una lista con los números de teléfono pendientes de responder y envía un reporte por correo o al propio WhatsApp del administrador con enlaces rápidos de recontacto:
    *   Formato de enlace rápido: `https://wa.me/[phone_number]`

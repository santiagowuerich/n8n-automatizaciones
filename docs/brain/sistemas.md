# Entornos y Sistemas — Second Brain

Mapa de infraestructura y motores de ejecución disponibles para el Second Brain.

---

## 1. Motores de Automatización (n8n)

### Desarrollo (`DEV`) — Espacio de Experimentación
- **URL Base:** `https://n8n.santiagowuerich.info`
- **API Endpoint:** `https://n8n.santiagowuerich.info/api/v1`
- **Servidor MCP:** `n8n` (o `n8n_dev`)
- **Permisos del Agente:**
  - ✅ Crear, editar, clonar y eliminar workflows.
  - ✅ Disparar ejecuciones de prueba (webhooks, manual).
  - ✅ Leer logs y payloads completos de error.
  - ✅ Manipular nodos y mock data libremente.
- **Objetivo:** Construcción, testing automatizado, corrección de bugs y refinamiento antes de cualquier entrega o despliegue.

---

### Producción / Cliente (`PROD - Xtract`) — Entorno Protegido
- **URL Base:** `https://n8n.xtract.app`
- **API Endpoint:** `https://n8n.xtract.app/api/v1`
- **Servidor MCP:** `n8n_prod`
- **Permisos del Agente:**
  - ✅ Inspeccionar workflows existentes (lectura/auditoría).
  - ✅ Listar ejecuciones recientes para diagnóstico.
  - 🛑 **Bloqueo de Modificación/Activación Directa:** Requiere validación previa en DEV + Diff explícito + Aprobación humana del usuario.

---

## 2. Protocolo de Transición (DEV → PROD)

1. **Desarrollo en DEV:** El workflow se crea o modifica y se somete al [Protocolo de Testing](testing-protocol.md).
2. **Sanitización:** Se limpian credenciales duras y se usan referencias estándar.
3. **Diff & Reporte:** El agente genera el reporte de cambios y resultados de pruebas.
4. **Gate de Aprobación:** El usuario aprueba explícitamente el despliegue.
5. **Importación a PROD:** Se importa el JSON validado o se aplica el cambio en la instancia de producción.

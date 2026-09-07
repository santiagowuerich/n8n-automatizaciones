# Propuesta de Optimización: Reactivación B2B por WhatsApp (Closed Lost)

**Objetivo:** Incrementar la tasa de respuesta y apertura de conversaciones en la campaña de reactivación de cuentas *Closed Lost*, reduciendo la fricción de entrada y aumentando la relevancia del mensaje inicial.

---

## 1. Diagnóstico Actual: ¿Por qué la tasa de respuesta es baja?

Actualmente, la estrategia de salida se apoya en dos impactos:

1. **Mensaje 1 (Inmediato):** Saludo genérico sin contexto de negocio.
   > *"Hola {{1}}, ¿cómo estás? Te escribe Nico del equipo de Xtract"*
2. **Mensaje 2 (A las 3 horas vía seguimiento):** Se entrega el contexto del dolor y la reunión pasada.
   > *"Nos juntamos hace un tiempo cuando en {{1}} estaban buscando automatizar el ingreso de facturas en {{2}}..."*

### Fricciones identificadas:

* **Efecto "Spam Desconocido":** Los decisores de compras o finanzas reciben decenas de mensajes comerciales al día. Un número corporativo que saluda sin identificador de valor ni motivo genera desconfianza o es archivado sin responder.
* **Sobrecarga de memoria en el lead:** Tras 3 a 6 meses de inactividad, el cliente no asocia inmediatamente el nombre de la empresa ni recuerda con quién habló.
* **Postergación del valor:** Guardar el motivo de contacto para el segundo mensaje (3 horas después) desperdicia la ventana de atención primaria del usuario en WhatsApp.

---

## 2. Las 3 Palancas Estratégicas de Mejora

```
[ Enfoque Actual ]   ───►  Saludo genérico (Fricción alta)   ───►  Baja tasa de respuesta
[ Nuevo Enfoque ]    ───►  Contexto + Pregunta binaria        ───►  Mayor apertura y reactivación
```

### Palanca 1: Contexto Inmediato desde el Segundo Cero
En lugar de fragmentar la comunicación, el primer mensaje debe conectar de inmediato con la reunión previa y el problema operativo que evaluaron en su momento.

* **Fórmula:** `[Saludo personalizado]` + `[Referencia a dolor/ERP concreto]` + `[Novedad o motivo de contacto]`
* **Ejemplo:**
  > *"Hola Juan, nos juntamos hace unos meses por la carga de facturas en SAP para Creta. Incorporamos una mejora clave para ese caso y me acordé de ustedes. ¿Siguen con ese tema pendiente o ya lo resolvieron?"*

### Palanca 2: Pregunta de Respuesta Binaria (Baja Fricción)
Preguntas abiertas como *«¿Cómo vienen con ese proceso?»* obligan al lead a redactar un párrafo desde el móvil, lo que posterga la respuesta.

* **Problema:** Alta carga cognitiva.
* **Solución:** Preguntas cerradas que puedan responderse con una palabra (*"Sí"*, *"No"*, *"Ya lo resolvimos"*, *"Sigue igual"*). Una vez que el lead responde, el bot o el ejecutivo comercial toma la conversación con fluidez.

### Palanca 3: Segmentación por 'Motivo de Pérdida' Real (CRM)
El CRM ya registra la causa por la que la oportunidad no avanzó. La plantilla o el enfoque inicial debe hablarle a esa causa particular:

| Motivo de Pérdida en CRM | Dolores Operativos / Objeción | Ángulo del Mensaje de Reactivación |
| :--- | :--- | :--- |
| **Falta de Integración ERP** | No tenían conector nativo con su sistema (ej. Odoo, Siigo, Intec). | Notificar la disponibilidad de la integración o API nativa. |
| **Presupuesto / Precio** | Costo percibido alto frente al volumen inicial. | Presentar modelos de entrada escalables o análisis de ROI ajustado. |
| **Falta de Tiempo / Prioridad** | Equipo contable sobrepasado para implementar. | Enfatizar tiempos de puesta en marcha rápida (30 a 60 días sin fricción técnica). |
| **Quedaron en enviar info** | Proceso congelado por falta de seguimiento mutuo. | Reactivación directa recordando el volumen mensual de facturas estimado. |

---

## 3. Comparativa: Antes vs. Después

| Variable | Flujo Actual | Flujo Propuesto |
| :--- | :--- | :--- |
| **Mensaje 1** | Saludo plano (*"Hola Juan, ¿cómo estás?"*). | Saludo + Empresa + Dolor operativo + Pregunta directa. |
| **Entrega de contexto** | Diferida (3 horas después). | Inmediata (0 segundos). |
| **Tipo de pregunta** | Ninguna en el mensaje 1. Abierta en el mensaje 2. | Binaria / Opción simple en el mensaje 1. |
| **Percepción del lead** | Mensaje masivo / telemarketing. | Mensaje uno a uno, informado y relevante. |

---

## 4. Próximos Pasos Recomendados

1. **Revisión del catálogo de plantillas en Meta:** Seleccionar o dar de alta en WhatsApp Manager una plantilla que combine el nombre, la empresa y la pregunta cerrada.
2. **Prueba piloto A/B:** Enviar una tanda de 15 a 20 leads con la plantilla contextualizada y medir la tasa de respuesta frente a la métrica histórica.
3. **Alineación del Bot:** Calibrar las respuestas del asistente para que tome las respuestas cortas (*"Ya lo resolvimos"*, *"Seguimos manual"*, *"Contame más"*) y conduzca directamente a la agenda comercial.

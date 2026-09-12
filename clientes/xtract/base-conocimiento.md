# Xtract.app — Base de Conocimiento y Documento de Referencia (RAG)

Fuente de verdad oficial de **qué es y qué hace Xtract**, para todo workflow y agente que le pase contexto a un LLM (agente de WhatsApp Chatwoot, generación de minutas, reactivación, etc.).

---

## 1. Resumen Ejecutivo y Perfil de la Empresa

Xtract es una plataforma SaaS 100% en la nube impulsada por Inteligencia Artificial especializada en la automatización del procesamiento de facturas de compra, flujos de aprobación y gestión de gastos corporativos.

- **Nombre de la Empresa / Producto:** Xtract (sitio web: [https://xtract.app/](https://xtract.app/))
- **Propósito Principal:** Eliminar la carga operativa del tipeo manual de facturas, reducir errores de digitación, evitar pagos duplicados y agilizar los tiempos de contabilización en el ERP sin necesidad de modificar el sistema contable existente.
- **Público Objetivo / Buyer Persona:** Directores Financieros (CFO), Gerentes Administrativos y Financieros, Equipos de Cuentas por Pagar (AP) / Tesorería, Contadores y Departamentos de Sistemas/IT.

| Métrica Clave | Beneficio del Producto |
| :--- | :--- |
| **Reducción de Costos** | Hasta un 40% en costos administrativos. |
| **Ahorro de Tiempo** | Hasta 110 horas mensuales por empresa. |
| **Velocidad de IA** | Procesamiento de hasta 100 facturas por segundo. |
| **Tiempo de Implementación** | Alrededor de 20 días hábiles (estándar). |

---

## 2. Módulos y Productos Principales

### 2.1. Contabilización Automática de Facturas (Automatic Posting of Invoices)
- **Recepción e Ingesta:** Captura automática de comprobantes mediante la redirección de correos electrónicos desde casillas de proveedores (Gmail o Outlook). Configuración en menos de 10 minutos.
- **Lectura Inteligente con IA:** Extrae automáticamente todos los datos clave de facturas de compra en formato **PDF**, independientemente del diseño, país de origen, moneda o idioma.
- **Datos extraídos:** Datos del emisor/receptor, número de factura, fechas, importes, impuestos, ítems/líneas de detalle, órdenes de compra, cuentas contables y asignación de centros de costo o dimensiones.
- **Repositorio Digital Ilimitado:** Almacenamiento centralizado en la nube con búsquedas avanzadas por número, fecha, proveedor, estado de aprobación, centro de costo o importe.
- **Exportación y Registro:** Generación de archivos planos adaptados (CSV, TXT, XLS) para carga masiva o integración directa por API REST con el ERP.

### 2.2. Flujo de Aprobación de Facturas (Invoice Approval Workflow)
- **Proceso 100% Digital y Papel Cero:** Acceso web (escritorio y móvil) para la revisión y autorización de facturas.
- **Asignación Automática:** Ruteo inteligente de comprobantes a las personas responsables de autorizar según reglas predefinidas.
- **Recordatorios Automáticos:** Notificaciones y alertas para evitar cuellos de botella y reducir el intercambio constante de emails.
- **Trazabilidad y Auditoría:** Registro completo de estados (pendiente, aprobado, rechazado) y motivos de aprobación/rechazo en tiempo real.

### 2.3. Aplicación de Gestión de Gastos (Expense Management App)
- **Plataforma Móvil:** Aplicación disponible para dispositivos iOS y Android.
- **Digitalización de Rendiciones:** Los colaboradores presentan sus gastos de viaje o representación tomando fotos de los comprobantes, eliminando el papel.
- **Reportes de Gastos:** Generación automática de informes por usuario, categoría y estado sin tipeo manual.
- **Integración Contable:** Conexión directa con el ERP para contabilizar reembolsos y gastos corporativos.

---

## 3. Integraciones Técnicas y Arquitectura

- **Sistemas ERP Compatibles:** Conexión nativa y fluida con sistemas líderes del mercado como **SAP, Microsoft Dynamics 365, Oracle, NetSuite**, así como con cualquier ERP local o desarrollo a medida.
- **Métodos de Integración:**
  - **API REST:** APIs públicas y robustas con SDKs oficiales disponibles en múltiples lenguajes de programación (Ruby, NodeJS, Java, etc.). Permite sincronización bidireccional en tiempo real.
  - **Archivos Planos (Flat Files):** Exportación personalizada en formatos CSV, TXT o XLS adaptados a la estructura exacta de importación del ERP del cliente.
- **Business Intelligence (BI):** Integración directa con herramientas de visualización de datos como **Power BI** y **Tableau** para la creación de tableros de control de gastos en tiempo real.
- **Solución para Estudios Contables:** Funcionalidad multicuenta que permite a firmas contables gestionar la contabilidad de múltiples clientes con división de cuentas e interfaces centralizadas.

---

## 4. Preguntas Frecuentes para Asistencia por Bot (Base RAG)

| Pregunta | Respuesta |
| :--- | :--- |
| **¿Xtract requiere instalar algún programa local?** | No, Xtract es una plataforma 100% basada en la nube (SaaS), disponible 24/7 a través de cualquier navegador web y app móvil. |
| **¿Qué tipo de facturas puede leer Xtract?** | Xtract lee automáticamente facturas en formato PDF, sin importar el diseño, el idioma, la moneda o el país de origen del comprobante. |
| **¿Cuánto tiempo toma la implementación?** | La implementación estándar mediante archivos planos o API puede completarse en aproximadamente 20 días hábiles. |
| **¿Cómo llegan las facturas a la plataforma?** | Llegan automáticamente al configurar una regla de redirección desde la casilla de correo receptora de compras hacia la casilla asignada en Xtract (menos de 10 minutos). |
| **¿Puedo asignar Centros de Costo antes del registro?** | Sí, permite automatizar la asignación de centros de costo, cuentas contables y órdenes de compra durante la etapa de aprobación y lectura. |
| **¿Hay que cambiar de sistema contable?** | No, Xtract trabaja e integra sobre el ERP que la empresa ya utiliza sin reemplazarlo. |

---

## 5. Contacto y Soporte Técnico

- **Atención de Soporte:** Lunes a Viernes de 08:00 a 20:00 hs.
- **Email de Soporte Técnico:** support@xtract.app
- **Email de Consultas Generales y Ventas:** xtract@xtract.app
- **Sitio Web:** [https://xtract.app/](https://xtract.app/)

---

## 6. Fuentes e Incertidumbres (Límites de la IA / Lo que NO se debe afirmar)

### Fuentes Consultadas
- **Sitio oficial:** [Xtract.app](https://xtract.app/)
- **Documentación e Integraciones:** [Xtract Integrations](https://xtract.app/integration)
- **Centro de Ayuda y Soporte:** [Xtract Help & Support](https://xtract.app/help/)
- **Flujo de Aprobación:** [Xtract Approval Workflow](https://xtract.app/approval/)

### Incertidumbres y Límites Mandatorios para la IA
- **Estructura de Precios Exacta:** El sitio web no publica valores fijos de planes o tarifas públicas por volumen de facturas; la cotización se realiza a medida a través del equipo comercial (**Siempre DERIVAR a un humano**).
- **Soporte de Formatos No PDF:** La documentación enfatiza comprobantes en formato PDF; la capacidad de ingesta directa de imágenes (JPG/PNG) o XML directos no se especifica explícitamente en el portal público (**No afirmarlo**).
- **Límites de Almacenamiento/API:** No se detallan límites de cuotas de consumo o rate limits en los endpoints públicos de la API, a pesar de indicarse un repositorio digital ilimitado.
- **Conexión Nativa vs Integración:** Conexión nativa confirmada solo para SAP, Dynamics 365, Oracle y NetSuite. Para el resto de los ERPs, se integra por API REST o archivos planos.

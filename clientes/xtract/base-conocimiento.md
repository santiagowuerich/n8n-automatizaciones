# Base de conocimiento — Xtract

Fuente de verdad de **qué es y qué hace Xtract**, para todo workflow que le pase
contexto a un LLM (agente de minutas, reactivación de Closed Lost, etc.).

Si acá dice algo, la IA lo da por sabido y **no lo pregunta**.

> Origen: `04-reactivacion-closed-lost/base-conocimiento-xtract.txt` (extraído del
> PDF). Este archivo es la versión limpia y editable. **Al editarlo hay que
> replicar el cambio en la constante `BASE_CONOCIMIENTO` del nodo
> `Armar prompt de la minuta`** del workflow de minutas.

---

## Qué es

Plataforma SaaS 100% en la nube, con IA, para automatizar el procesamiento de
**facturas de compra**, flujos de aprobación y gestión de gastos corporativos.
Sitio: https://xtract.app/

Elimina el tipeo manual de facturas, reduce errores de digitación, evita pagos
duplicados y acelera la contabilización en el ERP **sin modificar el sistema
contable existente**.

**Buyer persona:** CFO, gerentes administrativos y financieros, equipos de Cuentas
por Pagar / Tesorería, contadores, Sistemas/IT.

| Métrica | Valor |
|---|---|
| Reducción de costos administrativos | hasta 40% |
| Ahorro de tiempo | hasta 110 horas mensuales por empresa |
| Velocidad de la IA | hasta 100 facturas por segundo |
| Tiempo de implementación | 5 días hábiles (estándar) |

## Módulos

**Contabilización automática de facturas**
- Ingesta por redirección de correo desde casillas de proveedores (Gmail u Outlook).
  Se configura en menos de 10 minutos.
- Lectura con IA de facturas de compra en **PDF**, sin importar diseño, país,
  moneda ni idioma.
- Extrae: emisor/receptor, número de factura, fechas, importes, impuestos, ítems
  de detalle, órdenes de compra, cuentas contables, centros de costo y dimensiones.
- Repositorio digital ilimitado en la nube, con búsqueda por número, fecha,
  proveedor, estado de aprobación, centro de costo o importe.
- Exportación en archivos planos (CSV, TXT, XLS) o integración directa por API REST.

**Flujo de aprobación de facturas**
- 100% digital, acceso web de escritorio y móvil.
- Ruteo automático a los responsables de autorizar, según reglas predefinidas.
- Recordatorios y alertas automáticas.
- Trazabilidad completa: estados (pendiente / aprobado / rechazado) y motivos.

**Gestión de gastos**
- App iOS y Android. Los colaboradores rinden gastos sacando foto del comprobante.
- Reportes automáticos por usuario, categoría y estado.
- Contabiliza reembolsos y gastos directamente contra el ERP.

## Integraciones

- **ERPs:** conexión nativa con SAP, Microsoft Dynamics 365, Oracle, NetSuite, y
  con cualquier ERP local o desarrollo a medida.
- **API REST:** APIs públicas con SDKs oficiales (Ruby, NodeJS, Java, etc.).
  Sincronización bidireccional en tiempo real.
- **Archivos planos:** CSV, TXT o XLS adaptados a la estructura exacta de
  importación del ERP del cliente.
- **BI:** integración con Power BI y Tableau.
- **Estudios contables:** funcionalidad multicuenta, con división de cuentas e
  interfaz centralizada para gestionar varios clientes.

## Preguntas frecuentes

| Pregunta | Respuesta |
|---|---|
| ¿Requiere instalar algo local? | No. 100% nube (SaaS), 24/7 desde navegador y app móvil. |
| ¿Qué facturas lee? | Facturas en PDF, sin importar diseño, idioma, moneda ni país. |
| ¿Cuánto tarda la implementación? | ~5 días hábiles por archivos planos o API. |
| ¿Cómo llegan las facturas? | Con una regla de redirección desde la casilla de compras hacia la casilla asignada en Xtract. |
| ¿Se pueden asignar centros de costo antes del registro? | Sí, y también cuentas contables y órdenes de compra, durante lectura y aprobación. |

## Contacto

- Soporte: lunes a viernes, 08:00 a 20:00 — support@xtract.app
- Consultas comerciales: xtract@xtract.app

## Lo que NO está definido

Esto es tan importante como lo anterior: son los temas donde la IA **no debe
afirmar nada** y tiene que derivar al equipo comercial.

- **Precios.** No hay tarifas públicas. La cotización es a medida.
- **Formatos que no sean PDF.** La ingesta directa de imágenes (JPG/PNG) o XML no
  está confirmada en la documentación pública.
- **Límites de API y almacenamiento.** No hay rate limits ni cuotas publicadas,
  aunque el repositorio se anuncia como ilimitado.

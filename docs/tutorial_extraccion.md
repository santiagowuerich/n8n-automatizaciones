# Guía de Extracción de Influencers B2B para Xtract

Esta guía explica paso a paso cómo utilizar herramientas de mercado para buscar, extraer y automatizar la carga de influencers B2B en la planilla de Notion (`39e3213d-aa9e-8181-9ad8-cfecfd3b2215`) en los 20 países donde opera Xtract.

---

## 🧭 Estrategia de Prospección por Canal

Para **Xtract** (automatización de facturas/contabilidad), el perfil del creador ideal se divide en:
1.  **LinkedIn (Directores Financieros, Contadores, Líderes IT):** El canal prioritario.
2.  **YouTube / TikTok (Gurús de Productividad, Automatización y Excel):** Excelente para patrocinios visuales y tutoriales.

---

## 🛠️ Método 1: Búsqueda y Scraping en LinkedIn (Con Phantombuster + Apollo)

Este es el método más efectivo para encontrar profesionales contables y de finanzas con presencia activa en redes.

### Paso 1: Configurar la búsqueda en LinkedIn / Sales Navigator
1. Ve a LinkedIn y haz una búsqueda con palabras clave como:
   `CFO OR "Director Financiero" OR "Gerente de Administración" OR "Contador Público" OR "Invoice Automation"`
2. Aplica filtros de **País** (elige los países objetivo de Xtract, ej: España, México, Colombia, etc.).
3. Copia la URL de la búsqueda de LinkedIn de tu navegador.

### Paso 2: Extraer perfiles con Phantombuster
1. Crea una cuenta gratuita en **Phantombuster** (tiene 14 días de prueba sin tarjeta).
2. Usa el Phantom **"LinkedIn Search Export"**.
3. Pega la URL de búsqueda que copiaste en el Paso 1.
4. Ejecuta el Phantom para exportar los perfiles a un archivo CSV. Tendrás los campos: `Nombre`, `LinkedIn URL`, `Cargo`, `Empresa`, `País`.

### Paso 3: Obtener correos corporativos con Apollo.io
1. Crea una cuenta gratuita en **Apollo.io**.
2. Sube la lista de perfiles extraídos de Phantombuster.
3. Apollo buscará en su base de datos global el **correo electrónico corporativo** verificado de cada persona.
4. Exporta la lista final enriquecida.

---

## 🛠️ Método 2: Prospección de Creadores de Video/Sociales (Con Modash.io)

Si buscas creadores en YouTube, Instagram o TikTok que hablen de automatización, finanzas personales o contabilidad:

1. Registra una cuenta en **Modash.io** (ofrece una prueba gratuita).
2. Ve al buscador de influencers y aplica los siguientes filtros:
   *   **Plataforma:** YouTube / Instagram.
   *   **País del Influencer:** Selecciona uno de tus 20 países (ej: México, España, Chile).
   *   **Seguidores:** `1,000 - 50,000` (los micro-influencers tienen mejor conversión B2B).
   *   **Palabras clave en Bio/Contenido:** `excel`, `finanzas`, `contabilidad`, `notion`, `automatizacion`, `productividad`.
   *   **Contacto:** Marca la casilla *Has Email* (Para asegurar que tengan correo público).
3. Modash te mostrará un listado de perfiles que cumplen con el criterio.
4. Haz clic en **Export** para descargar el CSV que contiene: `Nombre del Canal`, `Link`, `Email de contacto`, `País` y `Total de Seguidores`.

---

## ⚙️ Conexión y Automatización con n8n

Para evitar cargar el CSV manualmente a Notion, podemos crear un flujo simple en n8n:
1.  **Trigger:** Un nodo de subida de archivos (o lectura de una planilla de Google Sheets donde importas los CSV).
2.  **Enriquecimiento (Opcional):** Un nodo HTTP que consulte las APIs de Apollo o Hunter para validar los correos.
3.  **Carga en Notion:** Un nodo de **Notion** configurado para insertar cada fila en tu base de datos `Prospección de Influencers - Xtract` en tiempo real.

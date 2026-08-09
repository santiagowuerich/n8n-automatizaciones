# Análisis de Herramientas y Costos de Extracción - Xtract

Este documento analiza el funcionamiento, ventajas y costos de las herramientas recomendadas para la prospección de influencers y leads B2B en los 20 países donde opera Xtract.

---

## 🛠️ Las Herramientas Recomendadas

### 1. Apollo.io (La base de datos B2B líder)
*   **Cómo funciona:** Es un directorio global de empresas y profesionales. Puedes filtrar por cargo (ej: `CFO`, `Contador`, `Head of Finance`), por país (los 20 de Xtract) y por tamaño de empresa.
*   **Qué te da:** Te entrega el nombre, empresa, perfil de LinkedIn y el **correo electrónico verificado** de forma directa.
*   **Costo:**
    *   **Plan Gratis:** Te da **10.000 créditos de email por mes** (¡suficiente para empezar!).
    *   **Plan Básico:** USD $49/mes (exportaciones ilimitadas y más filtros).

### 2. Apify (El motor de Scraping masivo)
*   **Cómo funciona:** Es una plataforma en la nube que ejecuta "scrapers" (robots) listos para usar. Puedes usar el *Instagram Scraper*, *YouTube Scraper* o *TikTok Scraper*.
*   **Qué te da:** Extrae perfiles de creadores de contenido bajo palabras clave (ej: "Finanzas corporativas" o "Excel hacks") junto con sus emails públicos de contacto y cantidad de seguidores.
*   **Costo:**
    *   **Plan Gratis:** Te otorga **USD $5 mensuales de crédito** en la plataforma. Esto te alcanza para extraer entre **5.000 y 10.000 perfiles al mes** de forma gratuita.
    *   **Plan Starter:** USD $49/mes (para ejecuciones mucho más veloces y masivas).

### 3. Modash.io (Buscador especializado de creadores)
*   **Cómo funciona:** Es un buscador de influencers de redes sociales enfocado en marketing.
*   **Qué te da:** Permite filtrar micro-influencers de finanzas/tecnología con emails públicos en segundos.
*   **Costo:**
    *   **Prueba:** 14 días gratis (puedes registrarte, exportar las listas de los 20 países en CSV y cancelar la suscripción).
    *   **Plan de Pago:** Desde USD $120/mes (es costoso para proyectos iniciales).

---

## 💰 Comparación de Estrategias de Costos

### Estrategia A: El Stack de Costo $0 (Recomendado para iniciar)
Ideal para validar el canal de influencers sin gastar un centavo, utilizando n8n como integrador.
*   **Scraping de Redes (YouTube/IG):** Apify (Free Tier - USD $5 créditos de regalo) = **$0**
*   **Búsqueda B2B e Emails:** Apollo.io (Free Tier - 10.000 emails/mes) = **$0**
*   **Buscador de Influencers:** Modash (Prueba de 14 días - exportas todo y cancelas) = **$0**
*   **Base de Datos / CRM:** Notion = **$0**
*   **Automatización de Carga:** tu n8n en Oracle Cloud = **$0** (sin límites de ejecución)
*   **Costo Mensual Total: USD $0**

### Estrategia B: El Stack Profesional Automatizado (Para escalar a gran escala)
Ideal si quieres automatizar la prospección mensual de miles de creadores de forma constante sin límites de pruebas.
*   **Apollo.io (Plan Basic):** USD $49/mes
*   **Apify (Plan Starter):** USD $49/mes
*   **Notion + n8n:** USD $0/mes
*   **Costo Mensual Total: USD $98 / mes** (evitando pagar Modash de forma recurrente).

---

## 🔄 Flujo de Trabajo en n8n
Podemos configurar tu n8n para unir ambos mundos:
1.  **Apify** extrae la lista de perfiles sociales en un país determinado.
2.  Mediante webhook, le envía esa lista a **n8n**.
3.  **n8n** busca en **Apollo.io** el perfil de LinkedIn y el email verificado del influencer.
4.  **n8n** inserta automáticamente los datos en la base de datos de Notion que acabamos de crear.

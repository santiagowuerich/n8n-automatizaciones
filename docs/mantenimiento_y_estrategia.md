# Estrategia de Prospección y Mantenimiento de Datos - Xtract

Este documento define la estrategia para controlar el volumen de prospectos por país (Capping) y el mantenimiento preventivo del servidor n8n en Oracle Cloud.

---

## 🎯 1. Estrategia de Distribución por País (Evitar saturación)

No todos los 20 países donde opera Xtract tienen la misma prioridad ni el mismo volumen de creadores B2B. Proponemos clasificar los países en **3 Tiers (Niveles)** para establecer límites máximos (Caps):

### 🌎 Tier 1: Mercados Clave (Cap: 50 a 100 perfiles)
*   **Países sugeridos:** España, México, Colombia, Argentina.
*   **Enfoque:** Búsqueda exhaustiva. Buscamos CFOs de medianas empresas, influencers de finanzas corporativas y periodistas de economía locales.

### 🌎 Tier 2: Mercados Medios (Cap: 20 a 30 perfiles)
*   **Países sugeridos:** Chile, Perú, Ecuador, Costa Rica, Uruguay.
*   **Enfoque:** Calidad sobre cantidad. Solo importamos perfiles con un score de relevancia de **7 o más**.

### 🌎 Tier 3: Mercados de Nicho / Pequeños (Cap: 5 a 10 perfiles)
*   **Países sugeridos:** Países europeos menores o mercados muy específicos.
*   **Enfoque:** Prospección quirúrgica. Solo importamos perfiles de **Alta Prioridad** (Score 9 o 10), como el principal referente de automatización o contabilidad de ese país.

---

## ⚙️ 2. Control de Volumen Automático en n8n

Para que el sistema se auto-limite y no guarde leads de más en la hoja de cálculo de Google:
1.  **Nodo de Conteo en n8n:** Antes de insertar un nuevo contacto, n8n puede consultar la hoja de cálculo para ver cuántos contactos existen del país del lead entrante.
2.  **Filtro de Cap:** Si el conteo supera el límite asignado para ese país (según su Tier), el flujo detiene la ejecución del lead o lo marca como `📦 Lista de Espera` en lugar de `No Contactado`. Esto mantiene el foco de tu equipo comercial en los leads más calificados.

---

## 🔧 3. Plan de Mantenimiento Técnico del Servidor

Para garantizar la estabilidad a largo plazo del servidor de Oracle Cloud sin sorpresas:

### A. Backups Automáticos de n8n
La base de datos de n8n (`database.sqlite`) almacena todos tus flujos y ejecuciones. 
*   **Mantenimiento preventivo:** Hemos programado un script Bash en el servidor que copia la base de datos diariamente a un directorio seguro de respaldos `/home/ubuntu/backups/`.
*   **Limpieza de Ejecuciones:** n8n guarda por defecto el historial de cada ejecución. Si procesas 50 chats diarios en WhatsApp y miles de prospectos en Apify, la base de datos puede crecer gigabytes en pocos meses. 
    *   *Solución:* Configuramos n8n en Docker para auto-eliminar el historial de ejecuciones con más de 14 días de antigüedad (mediante variables de entorno `EXECUTIONS_DATA_PRUNE=true` y `EXECUTIONS_DATA_MAX_AGE=336`).

### B. Mantenimiento de Evolution API (WhatsApp)
*   **Reconexión automática:** Evolution API se reconecta de manera automática en caso de micro-cortes de internet.
*   **Limpieza de caché:** Evolution API almacena temporalmente archivos multimedia pesados (fotos/videos de los chats) que pueden llenar el disco.
    *   *Solución:* El motor está configurado para borrar automáticamente del servidor archivos temporales de chat de más de 48 horas de antigüedad.

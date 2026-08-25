# 02 · Prospector B2B

Prospección B2B en Hispanoamérica: scraping de negocios vía Apify → hoja de leads → contacto
por WhatsApp filtrando solo celulares.

- **Estado:** 🟢 Activo en producción desde 2026-08-23.
- **Instancia:** `n8n.santiagowuerich.info` (producción para este proyecto).

---

## Workflows

| Workflow | ID | Rol |
| :--- | :--- | :--- |
| `Prospector B2B — Scraper Apify + Leads Marketplace` | `Q4Xsr3JepmCu02p8` | Ingesta: corre el actor de Apify y vuelca los leads. |
| `Prospector B2B Hispanoamérica — Exclusivo Celulares WhatsApp` | `P4wJyMXre5zrUqMx` | Filtrado y contacto. 2 triggers. |
| `Formatear Google Sheet Leads — Ejecutor` | `qiqEu9mnIpCRfbDP` | Utilitario: da formato a la hoja de leads. |
| `Inspeccionar Google Sheet` | `bm0w1zdSgZKzJmxi` | Utilitario: lee la estructura de la hoja. |

## Forma del dato

El actor de Apify devuelve fichas de negocio (muestras en `scratch/apifyconsulta*.json`,
50 registros cada una) con estas claves:

```text
name · address · phone · email · website · social_links
place_id · primary_type · business_status · rating · review_count · query
```

`query` conserva la búsqueda que originó el registro — sirve para segmentar y para depurar
de dónde salió un lead.

## Decisión: solo celulares

El nombre del workflow no es decorativo. El filtro a números móviles es deliberado: los fijos
no reciben WhatsApp, y contactarlos quema cuota y ensucia las métricas de respuesta.

## Riesgos abiertos

- **Costo de Apify:** cada corrida consume créditos. Toda prueba debería usar una muestra
  guardada, no una corrida nueva del actor.
- **Deduplicación:** el mismo negocio puede aparecer en varias `query`. Verificar que el
  ledger deduplique por `place_id` (ver [patrón 4](../../../docs/brain/catalogo-patrones.md)).
- **Reputación del número de WhatsApp:** prospección en frío a volumen es la vía rápida a un
  baneo. Confirmar el throttling (ver [patrón 9](../../../docs/brain/catalogo-patrones.md)).

## Pendiente de documentar

- [ ] Versionar los `workflow.json` en este directorio.
- [ ] ⚠️ Los dos workflows principales tienen `availableInMCP: false`, así que un agente **no
      puede leerlos** por MCP. Habilitar el acceso desde la tarjeta del workflow si se quiere
      trabajarlos con asistencia.
- [ ] ID y estructura de la Google Sheet de leads.
- [ ] Qué actor de Apify se usa y con qué parámetros.
- [ ] Criterio exacto del filtro de celulares (prefijos por país).

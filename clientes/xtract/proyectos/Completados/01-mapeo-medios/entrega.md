# Entrega — Mapeo de medios

## Qué se entregó

Paquete en [`entrega-cliente/`](../../../entrega-cliente/), listo para que el
cliente lo levante en su propio servidor de n8n:

| Archivo | Contenido |
|---|---|
| `Potencial-Entregable.json` | Workflow completo, 47 nodos, importable |
| `SETUP.md` | Guía de instalación paso a paso (~30–45 min) |
| `apps-script-crm.js` | Script de sincronización entre pestañas |

## Cómo se sanitizó el JSON

El workflow tenía credenciales propias en texto plano. **No se entregan.**

| Secreto | Reemplazado por |
|---|---|
| Token de Apify (3 nodos) | `REEMPLAZAR_APIFY_TOKEN` |
| API key de Hunter (1 nodo) | `REEMPLAZAR_HUNTER_API_KEY` |
| ID de la planilla (10 lugares) | `REEMPLAZAR_ID_DE_TU_GOOGLE_SHEET` |

Verificado con barrido sobre toda la carpeta: **0 ocurrencias** de cualquiera de
los tres.

> **Criterio:** mandar las propias claves es irreversible — una vez que el cliente
> las tiene, las tiene. Y el consumo se factura a la cuenta de uno. Volver a
> ponerlas, si alguna vez se decide, es un find-replace.

## Detalles del export

- Importa **desactivado** (`active: false`) — no arranca a disparar solo.
- 0 conexiones rotas (verificado).
- Los 9 nodos de Sheets traen stub de credencial con nombre `Google Sheets account`.
  Si el cliente crea la suya con ese nombre exacto, se vinculan solas al importar.

## Advertencias que quedaron documentadas en el SETUP

- **Cuota de Hunter:** el workflow consulta 15 medios/semana (~60/mes) y el plan
  gratuito son 25/mes. Se documentó cómo bajar `BATCH` a 5 para entrar en el free
  tier.
- La planilla debe compartirse con el email del Service Account, o **todos** los
  nodos de Sheets fallan.

## Comercial

Cobrado: **USD 80**. Ver [`../../operacion/tarifas.md`](../../operacion/tarifas.md)
para el análisis y qué se hace distinto de acá en adelante.

**Pendiente:** proponer el mantenimiento mensual. Es una conversación separada y
con precio real — el sistema lo necesita sí o sí (los feeds RSS se rompen, Hunter
cambia cuotas, Apify sube precios).

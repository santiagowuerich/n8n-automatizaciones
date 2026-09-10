# Hallazgos del contract test 06 — 2026-09-09 (CORREGIDOS Y VERIFICADOS)

> El contract test `tests/contract.test.js` corre en verde (**22/22 pruebas ok**).
> Los 3 hallazgos documentados fueron subsanados tanto en `workflow.json` local como en el workflow activo en PROD (`xP2LYks5hHkcmgN5`).

## HALLAZGO-06-01 · ownerEmail ignora `property_owner` del payload — RESUELTO
- **Diagnóstico:** El extractor no revisaba `raw.property_owner` de los webhooks de Notion y caía a un default hardcodeado.
- **Solución aplicada:** Se prioriza `raw.property_owner[0]`, luego `raw.owner`, y finalmente los campos del objeto de Notion. Si no hay dato, cae al fallback controlado.

## HALLAZGO-06-02 · fileId vacío para links `docs.google.com/document/d/...` — RESUELTO
- **Diagnóstico:** El regex de extracción de ID y el match de claves no contemplaba `transcri` / `transcricao` en portugués ni la ruta `/document/d/` de Google Docs.
- **Solución aplicada:** Se amplió el regex a `/\/(?:d|document\/d)\/([a-zA-Z0-9_-]+)/` y la búsqueda de claves normalizada incluye `transcri`, `doc`, `drive` y `link`.

## HALLAZGO-06-03 · TypeError con `"Email cliente": null` — RESUELTO
- **Diagnóstico:** Iteración directa sobre propiedades de Notion que podían tener valor `null`.
- **Solución aplicada:** Validación de existencia segura (`if (!v) continue;` y `p && p.person`) antes de acceder a subpropiedades. Previene caídas con cards de Notion con campos vacíos.

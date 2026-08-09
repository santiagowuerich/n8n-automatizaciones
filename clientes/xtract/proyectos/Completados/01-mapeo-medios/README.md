# 01 — Mapeo de medios / *Potencial Entregable*

**Estado:** ✅ Entregado — en mantenimiento
**Workflow n8n:** `ctRqFJQeygyPh0Ce` · 47 nodos
**Planilla:** Google Sheet `1Aw8CPKDqgJXgwGGVKxMOj-vqCz73ZhfR8uZmZktMFcc`

Sistema automatizado de captación de contactos de prensa tech y de negocios en
LATAM. Descubre, enriquece, prioriza y documenta leads para outreach.

---

## Los tres flujos

| Flujo | Disparador | Qué hace |
|---|---|---|
| **Descubrimiento** | `Cada lunes 8am` | 6 fuentes en paralelo → dedup → suma al pool `Influencers` |
| **Selección Top 120** | `Trigger Semanal (Lunes 9 AM)` | Rankea el pool, marca los 120 mejores en `Potenciales` |
| **Artículos** | *encadenado* | Corre al terminar la selección. Sin trigger propio. |

> El flujo de artículos **no tiene disparador**: ambas salidas de `Ya existe?`
> apuntan a `Leer Potenciales`.

## Fuentes de descubrimiento

| Fuente | Trae | Herramienta |
|---|---|---|
| Medios + LinkedIn | Autores de notas vía RSS, con su perfil | RSS + Apify |
| Podcasts | Conductores del rubro | iTunes API |
| Newsletters | Autores de newsletters VC/tech | Apify |
| TikTok | Creadores tech | Apify |
| Dev.to | Autores técnicos AR | Dev.to API |
| Hunter.io | Emails verificados de 63 medios LATAM | Hunter Domain Search |

---

## Hojas

| Hoja | Rol |
|---|---|
| `Influencers` | Pool completo de candidatos. Destino del descubrimiento. |
| `Potenciales` | Lista de trabajo. Los 120 marcados con `En Cola = Sí`. |
| `Seguimiento` | Contactados. **Fuente de verdad de "no volver a proponer".** |
| `Emails Prensa` | Salida cruda de Hunter (opcional). |

> ⚠️ `Influencers` y `Potenciales` usan **nombres de columna distintos** para los
> mismos campos. Ver [`decisiones.md`](decisiones.md#lectura-de-esquema-dual-influencers-vs-potenciales).

## Criterio del Top 120

1. **Elegibilidad** — no estar en `Seguimiento`, no tener Status cerrado, y tener
   al menos un canal de contacto (Email / LinkedIn / Instagram / TikTok).
2. **Orden** — por `Score` descendente; a igualdad, por `Prioridad`
   (Alta 3 · Media 2 · Baja 1).
3. Los primeros 120 → `En Cola = Sí` + `Ranking`. El resto → `En Cola = No`.

---

## Mantenimiento

**Cuotas:**

| Servicio | Límite gratuito | Uso |
|---|---|---|
| Hunter.io | ~25 búsquedas/mes | 15/semana (rotando) → requiere plan pago |
| Apify | $5 USD/mes en créditos | ~3 búsquedas/semana |
| Google News RSS | sin límite práctico | ~120/semana |

**Si un lunes hay pocos resultados:** todos los nodos tienen Continue On Fail, así
que los errores no interrumpen. Revisar el historial de ejecuciones y buscar el
nodo en gris.

**Puntos de atención:**
- Hunter marca algunos emails como `accept_all` o `invalid` — no enviarles.
- Google News a veces devuelve notas que *mencionan* a la persona en vez de las
  que *escribió*.

## Documentación funcional

- Nodo `Documentacion Web` → sirve una página HTML en
  `/webhook/doc-potencial-entregable`
- Nota `README - Documentacion` dentro del canvas
- Versión online: https://claude.ai/code/artifact/5cf5595d-622f-428a-bba4-aaf53aadea09

## Archivos

- Paquete de entrega: [`entrega-cliente/`](../../../entrega-cliente/)
- Decisiones técnicas: [`decisiones.md`](decisiones.md)
- Registro de entrega: [`entrega.md`](entrega.md)

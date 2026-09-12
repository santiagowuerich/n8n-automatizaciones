# Second Brain — Índice

Memoria operativa del sistema de automatizaciones. Todo lo de acá es **normativo**: si un
documento y el código se contradicen, se arregla la contradicción, no se ignora.

---

## Lo primero: de quién es el proyecto

| Instancia | Proyectos Xtract (`clientes/`) | Proyectos propios (`personal/`) |
| :--- | :--- | :--- |
| `n8n.santiagowuerich.info` | DEV / staging descartable | 🔴 **PRODUCCIÓN** |
| `n8n.xtract.app` | 🔴 **PRODUCCIÓN** | no aplica |

La misma instancia cumple dos roles. Antes de tocar cualquier workflow, resolver a qué columna
pertenece — de eso dependen los permisos, el rigor de la prueba y si hay pase a producción o no.
Detalle en [`sistemas.md`](sistemas.md#propiedad-de-los-proyectos-y-rol-de-cada-instancia).

---

## Orden de lectura

| # | Documento | Cuándo leerlo |
| :--- | :--- | :--- |
| 1 | [`sistemas.md`](sistemas.md) | **Siempre, antes de tocar n8n.** Qué instancias existen, a cuáles llega el host actual y cómo se pasa a producción. |
| 2 | [`credenciales.md`](credenciales.md) | Al construir cualquier nodo que use un servicio externo, y antes de importar un workflow a otro entorno. |
| 3 | [`catalogo-patrones.md`](catalogo-patrones.md) | Al diseñar. Primero se busca un patrón existente; recién después se inventa uno. |
| 4 | [`n8n-reglas-construccion.md`](n8n-reglas-construccion.md) | Al escribir o modificar nodos. Reglas duras de topología, expresiones y organización de archivos. |
| 5 | [`criterios-critica.md`](criterios-critica.md) | Cuando el diseño está listo y antes de construir. Checklist adversarial. |
| 6 | [`testing-protocol.md`](testing-protocol.md) | Al validar en DEV y antes de proponer un pase a PROD. |
| 7 | [`lecciones.md`](lecciones.md) | Al toparte con un comportamiento raro de n8n. Probablemente ya nos pasó. |

---

## Ciclo de trabajo

```text
Idea ─▶ [3] patrón ─▶ diseño ─▶ [5] crítica ─▶ [4] construcción en DEV ─▶ [6] testing
                                                                              │
                                             [1] gate humano + remapeo [2] ◀──┘
                                                          │
                                                          ▼
                                                        PROD ─▶ [7] lección aprendida
```

---

## Reglas transversales

- **Nunca secretos acá.** Este directorio guarda IDs y nombres de referencia, jamás claves.
- **Solo Markdown.** Nada de scripts ni dumps en `docs/brain/`; eso va a `scratch/`.
- **Fechá lo verificable.** Toda tabla que refleje el estado de un sistema externo lleva su
  línea de "última verificación". Sin fecha, se trata como sospechosa.
- **El dato manda sobre el documento.** Si la instancia dice otra cosa que la tabla, se
  corrige la tabla en el mismo trabajo, no "después".
- **Workflows grandes vía MCP se delegan, no se cargan enteros.** Ver
  [`sistemas.md §5`](sistemas.md#5-manejo-de-respuestas-grandes-de-mcp-2026-09-10).

---

## Skills que consumen esta memoria

Las skills del repositorio viven en [`.agents/skills/`](../../.agents/skills/) y están
catalogadas en [`AGENTS.md`](../../AGENTS.md): `n8n-architect`, `n8n-orchestrator`,
`n8n-testing`, `n8n-deploy-prod`.

# Entornos y Sistemas — Second Brain

Mapa de infraestructura y motores de ejecución disponibles para el Second Brain.

> **Regla de oro:** el acceso a n8n depende del **host de agente** que esté corriendo.
> Antes de escribir en cualquier instancia, verificar contra la [matriz de acceso](#3-matriz-de-acceso-por-host).
> No asumir que "el servidor n8n que veo" es DEV.

---

## Propiedad de los proyectos y rol de cada instancia

Hay **dos ejes independientes**: en qué instancia corre un workflow, y de quién es el proyecto.
Confundirlos es el error más caro de este repo.

| Instancia | Para proyectos **Xtract** | Para proyectos **propios** |
| :--- | :--- | :--- |
| `n8n.santiagowuerich.info` | DEV — staging descartable | 🔴 **PRODUCCIÓN** |
| `n8n.xtract.app` | 🔴 **PRODUCCIÓN** | no aplica |

**La misma instancia cumple dos roles a la vez.** `n8n.santiagowuerich.info` es el banco de
pruebas del trabajo de Xtract **y**, al mismo tiempo, el servidor productivo de los proyectos
propios. Un workflow propio ahí no es un borrador: tiene tráfico real, clientes del otro lado
y monitoreo propio.

### Workflows propios en producción (no tocar sin intención explícita)

| Workflow | ID | Estado |
| :--- | :--- | :--- |
| `Marketplace Auto-Reply — Cerebro (Webhook + IA)` | `o1hQpxHMFMbj3Nnw` | activo · 7 webhooks · heartbeat + alertas Telegram |
| `Prospector B2B Hispanoamérica — Exclusivo Celulares WhatsApp` | `P4wJyMXre5zrUqMx` | activo · 2 triggers |
| `Prospector B2B — Scraper Apify + Leads Marketplace` | `Q4Xsr3JepmCu02p8` | activo · 1 trigger |
| `Doc Reader Bot - Telegram to R2 CDN` | `d3DXwvdeeK8eB7zN` | activo · 1 trigger |
| `Inspeccionar Google Sheet` / `Formatear Google Sheet Leads — Ejecutor` | `bm0w1zdSgZKzJmxi` / `qiqEu9mnIpCRfbDP` | activos · utilitarios del Prospector |

**Reglas duras:**
1. Nunca desactivar, renombrar, borrar ni re-disparar uno de estos workflows como parte de un
   trabajo de Xtract. Su caída es una caída productiva, aunque el dominio diga "santiagowuerich".
2. Los proyectos propios **no tienen pase a PROD**: se construyen y viven en la misma instancia.
   El [protocolo de transición](#4-protocolo-de-transición-dev-a-prod) y la skill `n8n-deploy-prod`
   aplican **solo a Xtract**.
3. A cambio, un cambio en un proyecto propio se prueba con el mismo rigor que un pase a producción:
   no hay red de contención abajo.
4. Documentación: Xtract vive en `clientes/xtract/proyectos/`; lo propio, en `personal/proyectos/`.

---

## 1. Motores de Automatización (n8n)

### Instancia Santiago (`n8n.santiagowuerich.info`) — DEV de Xtract · PROD propia
- **URL Base:** `https://n8n.santiagowuerich.info`
- **API Endpoint:** `https://n8n.santiagowuerich.info/api/v1`
- **Permisos del Agente sobre workflows de Xtract:**
  - ✅ Crear, editar, clonar y eliminar workflows.
  - ✅ Disparar ejecuciones de prueba (webhooks, manual).
  - ✅ Leer logs y payloads completos de error.
  - ✅ Manipular nodos y mock data libremente.
- **Permisos sobre workflows propios:** los mismos que en cualquier producción — cambios
  deliberados, probados y reversibles. Ver la
  [lista de workflows propios protegidos](#workflows-propios-en-producción-no-tocar-sin-intención-explícita).
- **Objetivo (Xtract):** Construcción, testing automatizado, corrección de bugs y refinamiento antes de cualquier entrega o despliegue.
- **Advertencia:** esta instancia **no es un laboratorio aislado**. Aloja sistemas propios en
  producción con tráfico real. "Es mi servidor" no significa "es descartable".

---

### Producción / Cliente (`PROD - Xtract`) — Entorno Protegido
- **URL Base:** `https://n8n.xtract.app`
- **API Endpoint:** `https://n8n.xtract.app/api/v1`
- **Permisos del Agente:**
  - ✅ Inspeccionar workflows existentes (lectura/auditoría).
  - ✅ Listar ejecuciones recientes para diagnóstico.
  - 🛑 **Bloqueo de Modificación/Activación Directa:** Requiere validación previa en DEV + Diff explícito + Aprobación humana del usuario.

---

## 2. Fuentes de verdad de la configuración MCP

⚠️ **"Antigravity" no es una sola app.** En esta máquina conviven al menos tres binarios
distintos (`Antigravity IDE.app`, un `antigravity-cli`, y una instalación "Antigravity" a secas),
cada uno con su **propio** `mcp_config.json` bajo `~/.gemini/<variante>/`. La documentación
interna de Antigravity llama a `~/.gemini/config/mcp_config.json` el **"Global Configuration"**
("applies to all sessions") — pero eso no es cierto en la práctica en este equipo: cada variante
lee su propio archivo, no el "global" documentado.

**Verificado el 2026-08-24** inspeccionando el proceso real (`ps aux`, buscando `--app_data_dir`):
esta sesión de Claude Code corre como extensión **dentro de `Antigravity IDE.app`**, cuyo
`app_data_dir` es `antigravity-ide`. Su config vive en `~/.gemini/antigravity-ide/mcp_config.json`
— **no** en `~/.gemini/config/mcp_config.json`.

| Archivo | Variante que lo consume | Servidores n8n definidos |
| :--- | :--- | :--- |
| `~/.gemini/antigravity-ide/mcp_config.json` | **Antigravity IDE** (app de escritorio) | `n8n` → Santiago · `n8n_prod` → Xtract |
| `~/.gemini/antigravity-cli/mcp_config.json` | **Antigravity CLI** (`antigravity-cli`) | `n8n` → Santiago · `n8n_prod` → Xtract *(sincronizado y verificado 2026-08-26)* |
| `~/.gemini/config/mcp_config.json` | Config global fallback | `n8n` → Santiago · `n8n_prod` → Xtract |
| `~/.claude.json` | Claude Code | `n8n-mcp` → Santiago · `n8n_prod` → Xtract |
| `~/.gemini/antigravity/mcp_config.json` | "Antigravity" sin `-ide` (legacy) | `n8n` → `https://157.151.13.179` (⚠️ ver deuda 1) |

---

## 3. Matriz de acceso por host

**Estado al 2026-08-26:** los dos entornos verificados en vivo en CLI e IDE.

| Host | Santiago (lectura) | Santiago (escritura) | Xtract (lectura) | Xtract (escritura) |
| :--- | :---: | :---: | :---: | :---: |
| **Antigravity CLI** | ✅ `n8n` | ✅ `n8n` | ✅ `n8n_prod` | ⚠️ solo tras gate humano |
| **Antigravity IDE** | ✅ `n8n` | ✅ `n8n` | ✅ `n8n_prod` | ⚠️ solo tras gate humano |
| **Claude Code** | ✅ `n8n-mcp` | ✅ `n8n-mcp` | ✅ `n8n_prod` | ⚠️ solo tras gate humano |

La matriz se verifica, no se asume: un host nuevo o una config borrada la cambian sin aviso.

---

## 3.1 Instrucciones y skills: qué lee cada host

Verificado el 2026-08-24 contra la documentación interna de Antigravity
(`agy-customizations/docs/{rules,skills}.md`, instalada localmente):

| Elemento | Claude Code | Antigravity IDE |
| :--- | :---: | :---: |
| `CLAUDE.md` | ✅ lo carga siempre | ❌ no lo lee |
| `AGENTS.md` | ✅ (convención de este repo) | ✅ nativo — camina de la carpeta actual hacia la raíz buscando `AGENTS.md` / `GEMINI.md` |
| `.agents/skills/<nombre>/SKILL.md` | ✅ vía el symlink `.claude/skills` | ✅ **nativo, sin symlink** — `.agents/skills/` es justo el ejemplo que da la propia doc de "customization root" |

**Consecuencia práctica, ya correcta en este repo:** la separación entre `CLAUDE.md`
(instrucciones solo para Claude Code) y `AGENTS.md` (leído por los dos hosts) no es cosmética,
es la única forma en que Antigravity ve algo de contexto del repo. No hace falta un `GEMINI.md`
aparte mientras `AGENTS.md` exista — sería contenido duplicado. Las 4 skills del repo
(`n8n-architect`, `n8n-orchestrator`, `n8n-testing`, `n8n-deploy-prod`) ya eran descubribles por
Antigravity IDE sin ningún cambio adicional.

### Protocolo de verificación antes de escribir
1. Listar las herramientas MCP disponibles en la sesión actual.
2. Si **no** existe un servidor `n8n_prod` (o equivalente apuntando a `xtract.app`),
   el host **no tiene acceso a PROD**: no inventar la capacidad ni asumir que el
   servidor genérico `n8n` es producción.
3. Ante la duda, resolver el `baseUrl` efectivo consultando un workflow conocido de cada
   entorno antes de cualquier operación de escritura.

### Ruta de despliegue sin acceso a PROD (fallback obligatorio)
Si el host corriente no tiene `n8n_prod` disponible, el pase a producción **no se cancela, se
degrada a manual**:
1. Exportar el JSON validado desde DEV con las credenciales ya remapeadas a los IDs de PROD
   (ver [`credenciales.md`](credenciales.md)).
2. Guardarlo en el proyecto correspondiente bajo `workflows/`.
3. Entregar al usuario la instrucción explícita de importarlo desde la UI de `n8n.xtract.app`,
   junto con el diff y el checklist de post-import (credenciales enlazadas, workflow activo,
   webhook respondiendo).
4. Registrar el resultado reportado por el usuario. **Nunca** dar por desplegado algo que
   el agente no pudo verificar.

---

## 4. Protocolo de Transición DEV a PROD

> Aplica **solo a proyectos de Xtract**. Los proyectos propios no migran de instancia: se
> construyen y viven en `n8n.santiagowuerich.info`.

Desde 2026-09-10 hay **dos rutas** para llegar a PROD en Xtract, según dónde vive el DEV del
proyecto. No son intercambiables a mitad de camino — se elige una al diseñar el proyecto.

### 4.1 Ruta recomendada para proyectos nuevos: DEV embebido en `n8n.xtract.app`

Motivo: `n8n.santiagowuerich.info` no tiene (ni va a tener siempre) las credenciales exclusivas
de cliente — Notion Xtract, Chatwoot, Calendly, Slack Xtract (ver tabla §2 de
[`credenciales.md`](credenciales.md)). Para cualquier proyecto que dependa de esos servicios,
DEV en la instancia Santiago está incompleto por diseño. La solución: construir DEV y PROD como
**dos workflows en la misma instancia** (`n8n.xtract.app`), usando el
[Patrón 11 — Entorno de Prueba Embebido con Redirect Seguro](catalogo-patrones.md#11-patrón-entorno-de-prueba-embebido-con-redirect-seguro-2026-09-10).

1. **Desarrollo en DEV-en-Xtract:** el workflow se construye y prueba en su variante DEV, en la
   misma instancia, con las credenciales reales y el nodo `Resolver Destinatario` fail-safe
   activo (redirige a Santiago por defecto — ver testing-protocol.md §1).
2. **Crítica adversarial:** checklist de [`criterios-critica.md`](criterios-critica.md), incluidos
   los ítems del redirect fail-safe (§4).
3. **Sin remapeo de credenciales:** misma instancia, mismos IDs — se salta el paso de
   sanitización de IDs del protocolo legacy (§4.2).
4. **Diff & Reporte:** igual que la ruta legacy.
5. **Gate de Aprobación:** el usuario aprueba explícitamente el pase.
6. **"Despliegue":** quitar el redirect fail-safe del workflow DEV-en-Xtract y activar el
   workflow PROD gemelo (o promoverlo, según cómo se haya construido el par). Ver
   [`n8n-deploy-prod`](../../.agents/skills/n8n-deploy-prod/SKILL.md).
7. **Verificación post-deploy:** igual que la ruta legacy — estado `active`, credenciales
   enlazadas, webhook respondiendo.

### 4.2 Ruta legacy: instancia separada (Santiago DEV → Xtract PROD)

Sigue aplicando a los proyectos que ya usan este modelo (04, 05, 06) y a cualquier feature nueva
que no dependa de ningún servicio exclusivo de cliente.

1. **Desarrollo en DEV:** El workflow se crea o modifica y se somete al [Protocolo de Testing](testing-protocol.md).
2. **Crítica adversarial:** Se aplica el checklist de [`criterios-critica.md`](criterios-critica.md).
3. **Sanitización:** Se limpian credenciales duras y se remapean los IDs de DEV a PROD.
4. **Diff & Reporte:** El agente genera el reporte de cambios y resultados de pruebas.
5. **Gate de Aprobación:** El usuario aprueba explícitamente el despliegue.
6. **Importación a PROD:** Vía `n8n_prod` si el host lo tiene; si no, por la ruta manual de §3.
7. **Verificación post-deploy:** Estado `active`, credenciales enlazadas y webhook respondiendo.

---

## 5. Manejo de respuestas grandes de MCP (2026-09-10)

Un `get_workflow` (`n8n_prod` o `n8n-mcp`) sobre un workflow con muchos nodos puede devolver un
JSON de cientos de miles de caracteres. Verificado en vivo el 2026-09-10: pedir `bAh0FYSFTM0UeXSc`
(proyecto 05) devolvió 233.023 caracteres y superó el límite de tokens de una sola respuesta —
la tool lo guardó en un archivo aparte y hubo que grepearlo. `04-WF2` (45 nodos) o cualquier
workflow de tamaño similar va a pegar el mismo problema.

**Regla:** antes de pedir el JSON completo de un workflow con muchos nodos (aprox. 15+, o
cualquiera ya conocido como grande — 04-WF2, 05, 06), delegar esa lectura a un subagente en vez
de traerla a la conversación principal. Si solo hace falta un dato puntual (un nodo, una
credencial, un parámetro), grepear el archivo resultante en vez de leerlo completo — no cargar
un dump gigante en contexto para responder una pregunta chica.

Esto aplica a cualquier agente que trabaje sobre este repo (Claude Code, Antigravity u otro), no
es una limitación exclusiva de una herramienta puntual.

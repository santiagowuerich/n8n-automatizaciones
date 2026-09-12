# Xtract — 06 Resumen Discovery Call a Slack (Borrador de Email)

Workflow independiente diseñado para procesar llamadas de Discovery desde Google Drive / Notion, extraer con IA los puntos clave del negocio y generar un borrador de correo ejecutivo listo para copiar y enviar en Gmail o Outlook, entregado en el Slack del comercial responsable.

---

## 1. Ficha Técnica

| Parámetro | Valor |
| :--- | :--- |
| **ID del Workflow (PROD)** | `xP2LYks5hHkcmgN5` |
| **Nombre en n8n** | `Xtract - 06 Resumen Discovery Call a Slack (Borrador de Email)` |
| **Webhook Endpoint** | `POST https://n8n.xtract.app/webhook/discovery-email-slack` |
| **Modelo de IA** | DeepSeek Chat (`deepseek-chat` vía `deepSeekApi` / `H5fC2aZoNphCCole`) |
| **Latencia promedio** | ~6.5 segundos de punta a punta |
| **Destino de Notificación** | Canal de DM privado del Comercial responsable en Slack oficial de Xtract (con fallback a Santiago `D0BRPUE84UA`) |
| **Token de Envío Slack** | Credencial oficial `Xtract notifications` (`y1DaRieOF29GQnxm` / Workspace `T019FLW78AJ`) |

---

## 2. Diagrama de Topología

```
[Webhook: Link a discovery cargado]
              │
              ├──────────────────────────────────┐
              ▼                                  ▼
    [Code - Extraer Datos]             [Slack - Traer usuarios] (112 miembros)
              │
              ├──────────────────────────────────┐
              ▼                                  ▼
            [JWT]                         [Preparar transcripcion]
              │                                  │
              ▼                                  │
    [HTTP - Generar Access Token]                │
              │                                  │
              ▼                                  │
    [Drive - export texto (Doc)]                 │
              │                                  │
              └────────────────► [Merge] ◄───────┘
                                   │
                                   ▼
                      [IA - Redactar borrador] (DeepSeek)
                                   │
                                   ▼
                       [Armar mensaje de Slack] (Matching Comercial + Recursos + Casos de Éxito)
                                   │
                                   ▼
                  [Slack - Enviar borrador al Comercial] (DM oficial)
```

> Nota: `JWT` → `HTTP - Generar Access Token` → `Drive - export texto` → `Merge` es la ruta
> vieja (export directo del Doc de Drive). Quedó sin conexiones en el workflow real: la
> transcripción llega hoy directo en el body del webhook (`raw.transcription`), ver
> `Code - Extraer Datos`. No se borraron los nodos por si hace falta volver al flujo viejo.

---

## 2.1 Resolución de ERP (2026-09-10)

Antes de generar el borrador, dos nodos Notion nuevos se disparan en paralelo desde
`Code - Extraer Datos`:

- **`Notion - Traer lista ERP`** (`database.get` sobre `Sales - XT`,
  `09549c92-28ea-4e15-9350-055b079ce9ac`): trae en vivo las opciones configuradas de la
  propiedad select `Que sistema usan?(*)`. Vivo y no hardcodeado a propósito — si en Notion se
  agrega un ERP nuevo a la lista, el workflow lo ve en la próxima corrida sin tocar código.
- **`Notion - Traer card completa`** (`databasePage.get` por `pageId`): trae el valor que un
  humano ya haya cargado a mano en esa propiedad para la card de este Discovery.

Después de la IA (que ahora también extrae `erp_llamada`, lo que el cliente dijo en la
llamada, tal cual sin corregir), el nodo **`Resolver ERP`** decide el ERP final:

1. Si la card de Notion ya tiene el campo cargado a mano → se usa ese valor tal cual (ya salió
   de la lista real, no necesita matching).
2. Si no, se toma `erp_llamada` y se lo compara (normalizado + distancia de edición chica)
   contra el listado vivo de Notion — mismo problema que ya se documentó en el proyecto 05:
   Fathom transcribe mal los nombres de ERP ("Finnegans" salió como Finance/Finex/Fan/Finegan/Fin
   en una sola llamada).
3. Si no matchea ninguna opción real, **no se inventa nada**: el ERP queda vacío/genérico en el
   correo y se agrega una línea de alerta en el mensaje de Slack para que el comercial complete
   el campo a mano. Decisión explícita del usuario (2026-09-10): mejor pedir revisión humana que
   arriesgar un nombre de ERP incorrecto en un email a un cliente.

Cobertura de tests: `tests/contract.test.js` sandboxea `Resolver ERP` con 5 casos (prioridad
Notion, typo chico que matchea, match exacto, sin match real, sin dato en ningún lado).

**Pendiente antes de pasar a PROD:** esto se armó y testeó en sandbox local (sin n8n corriendo
de por medio) — falta validar en DEV con datos reales de la card de Notion y mostrar el diff
para el gate de aprobación antes de tocar `xP2LYks5hHkcmgN5`.

---

## 3. Estructura del Borrador Generado y Soporte Multilingüe (ES / PT)

El modelo detecta automáticamente el idioma nativo de la llamada y adapta todo el contenido y estilo comercial de Nicolás González:

* **Español (`es` - Hispanoamérica):**
  - **`*Subject:*`** `Xtract + [Empresa]: Automatización de facturas en [ERP] y próximos pasos`
  - **Saludo:** `Hola [Interlocutores], buenas tardes.`
  - **Bullets:** Diagnóstico estructurado de dolores en Accounts Payable.
  - **Solución y Encaje:** Integración nativa/API con su ERP, centralización y reglas contables.
  - **Doc API (Condicional):** `[Documentación de la API Rest de Xtract](https://xtractapi.docs.apiary.io/#reference)`.
  - **Casos de Éxito:** MODO, Pomelo, InvGate, SanCor Salud.

* **Portugués (`pt` - Brasil / Ej. Flavio Melo):**
  - **`*Subject:*`** `Xtract + [Empresa]: Automação de notas fiscais no [ERP] e próximos passos`
  - **Saludo:** `Olá [Interlocutores], boa tarde! Tudo bem?`
  - **Bullets:** `Pelo que conversamos, hoje o principal desafio está em:` (recepção de notas fiscais contra CNPJ, validação, etc.).
  - **Solución y Encaje:** Automação de leitura e contabilização no ERP em até 5 minutos.
  - **Doc API (Condicional):** `[Documentação da API REST da Xtract](https://xtractapi.docs.apiary.io/#reference)` para validação de ticket/suporte técnico.
  - **Casos de Éxito:** MODO y Pomelo en portugués.

---

## 4. Historial de Pruebas y Validaciones

* **`ejemplo1.md` (Flavio Melo - Brasil):** Detección `idioma: pt`, generación 100% en portugués brasileño corporativo, inclusión de API Rest para soporte vía ticket.
* **`Ejemplo2-.md` (Lucas Mamolite - Argentina):** Detección `idioma: es`, relevamiento sobre Calipso (facturas de flete, rendiciones, órdenes de compra).
* **`ejemplo3.md` (Walter Sudich / Federico Bottino - Caldén):** Detección `idioma: es`, propuesta sobre compras y gestión de proveedores.
* **`ejemplo4.md` (Juan Pablo Zubiri / Luji Costa):** Detección `idioma: es`, validación de circuito de aprobaciones y reglas contables.
* **Ejecución 557273 (Comercializadora Andina - Intec):** Validación exitosa con entrega directa al Slack de Nicolás González (`U02MCAHHM1T`).


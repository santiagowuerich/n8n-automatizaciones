# Protocolo de Testing y Validación de Workflows

Este protocolo define el ciclo de verificación autónoma que ejecuta el Second Brain antes de dar por completado un workflow o proponer un pase a producción.

---

## Ciclo de Verificación (Loop Autónomo)

```text
[Diseño / Modificación]
         │
         ▼
[Generación de Payload Mock]
         │
         ▼
[Disparo de Ejecución de Prueba] ──▶ (run_webhook / trigger manual)
         │
         ▼
[Inspección de Ejecución] ─────────▶ (get_execution / logs)
         │
    ┌────┴───────────────────────────┐
    │                                │
[¿Hubo Error?]                  [¿Éxito?]
    │                                │
    ▼                                ▼
[Análisis de Causa Raíz]        [Validación de Schema de Salida]
    │                                │
    ▼                                ▼
[Corrección Automática de Nodos] [¿Output coincide con spec?]
    │                                │
    └───────────┬────────────────────┘
                │
                ▼
[Limpieza de artefactos temporales]
                │
                ▼
[Generación de Reporte de Prueba + Diff]
                │
                ▼
[Solicitud de Aprobación Humana para PROD]
```

---

## 1. Reglas de Ejecución de Pruebas

1. **Aislamiento en DEV:** Todas las pruebas de estrés o ejecución de proyectos de Xtract se realizan exclusivamente contra `n8n.santiagowuerich.info`.
2. **🔴 Esa instancia también es producción propia.** Aloja los sistemas de `personal/` con tráfico real y monitoreo propio ([lista de workflows protegidos](sistemas.md#workflows-propios-en-producción-no-tocar-sin-intención-explícita)). Antes de activar, desactivar, re-disparar, renombrar o borrar cualquier workflow que el agente no haya creado en esta sesión:
   - Confirmar de quién es el proyecto (`clientes/` vs `personal/`).
   - Si es propio y está activo, **no se toca** como efecto colateral de un trabajo de Xtract. Se pide confirmación explícita.
   - Los proyectos propios **no tienen staging**: probar contra ellos es probar en producción. Usar payloads mock y webhooks de test, nunca el trigger productivo.
3. **Uso de Mocks:**
   - Si el nodo escribe en una base de datos o envía mensajes a personas reales, se deben usar identificadores de prueba o tablas de staging (mock).
   - Para webhooks, el agente genera un JSON sintético representativo de casos felices y casos de borde (ej: teléfono sin formato internacional, campo nulo).
4. **Validación de Salida:**
   - No basta con que n8n devuelva `finished: true`.
   - Se debe verificar que la estructura de datos emitida por el último nodo contenga las claves y tipos esperados.
5. **Criterio de Auto-corrección:**
   - Errores de sintaxis en nodos `Code` (JavaScript), mapeo de expresiones JSON (`{{ $json.field }}`) o tipos de datos deben corregirse automáticamente hasta lograr una ejecución limpia (máximo 3 reintentos).
   - Errores de credenciales, conectividad o permisos se escalan inmediatamente al usuario.
6. **Proyectos con DEV embebido en Xtract (2026-09-10):** para proyectos que usan el
   [Patrón 11 — Entorno de Prueba Embebido con Redirect Seguro](catalogo-patrones.md#11-patrón-entorno-de-prueba-embebido-con-redirect-seguro-2026-09-10),
   las pruebas corren **siempre** contra el workflow DEV-en-Xtract, con el redirect fail-safe
   activo. Nunca se prueba contra el workflow PROD real, y nunca se desactiva la bandera de modo
   prueba (`MODO_PRUEBA`) sin un pedido explícito del usuario para esa corrida puntual.
   - **Principio fail-safe, no fail-open (regla general, reusable también en `personal/`):**
     cualquier bandera de modo prueba tiene que tener un default seguro. Si la bandera falta,
     viene vacía o con un valor inesperado, el workflow debe comportarse como si el modo prueba
     estuviera activo (redirigir a Santiago, no tocar datos reales) — nunca al revés. Nace de dos
     incidentes reales por el error inverso: `FORZAR_DESTINATARIO` vacío mandando un borrador a
     un DM real (06, 2026-08-28) y tres `TEMP` activos 9 días filtrando PII sin auth (2026-09-10,
     ver [`lecciones.md`](lecciones.md)).

---

## 2. Credenciales durante el testing

Un workflow importado desde el repositorio trae **IDs de credenciales de PROD** (ver
[credenciales.md §3](credenciales.md#3-convención-de-exports-en-el-repositorio)). Antes de la
primera ejecución de prueba en DEV hay que remapearlos a los IDs de la tabla DEV.

Síntoma típico de omitir este paso: todos los nodos de servicio fallan a la vez con error de
credencial. No es un bug del diseño — es el remapeo faltante.

---

## 3. Limpieza del entorno de desarrollo

Todo artefacto creado para diagnosticar o inspeccionar es **basura con fecha de vencimiento**.
Sin una regla explícita se acumula y termina siendo indistinguible del trabajo real.

1. **Nomenclatura obligatoria:** todo workflow desechable se crea con el prefijo `TEMP - `
   y una `description` que indique **para qué se creó y cuándo se borra**.
2. **Borrado en la misma sesión:** el workflow temporal se elimina apenas se obtuvo el dato
   que se buscaba. No se deja "por las dudas".
3. **Barrido periódico:** al iniciar un trabajo en DEV, listar los workflows y reportar al
   usuario los `TEMP - ` sobrevivientes de sesiones anteriores para confirmar su borrado.
   No borrar sin confirmación aquello que el agente no creó.
4. **Scripts locales:** cualquier script de diagnóstico de un solo uso va a `scratch/`
   (ignorado por git), nunca a la raíz del repo ni a `docs/brain/`.
5. **PROD también acumula.** La instancia de Xtract tiene restos sin dueño
   (`My workflow 8`, `AI agent chat`, `enviar leads 2`, y un
   `Xtract Demo — Simulador WhatsApp` **activo** desde 2026-08-05 más su duplicado inactivo).
   Un workflow de demo activo en la instancia del cliente es superficie expuesta: reportarlo
   al usuario y proponer su baja, nunca borrarlo por cuenta propia.

---

## 4. Reporte de prueba

El reporte que cierra el ciclo debe incluir, como mínimo:

- Workflow y entorno (nombre + ID + instancia).
- Payloads de entrada usados (feliz y de borde).
- Resultado por caso: `finished`, nodos ejecutados, y el schema de salida validado.
- Errores encontrados y qué se corrigió.
- Artefactos temporales creados **y si fueron borrados**.
- Veredicto explícito: listo para pase a PROD, o qué falta.

---

## 5. Fixtures y contract tests versionados (2026-09-09)

`scratch/*.json` está ignorado por git: sirve para un dump puntual, **no** como
base de pruebas. Todo payload que un test necesite para correr en CI o en otra
máquina vive versionado en el proyecto:

- `clientes/xtract/proyectos/<id>/fixtures/` — `happy-es.json`, `happy-pt.json`,
  `edge-*.json`. Datos 100% sintéticos (dominios `.test`, nada de transcripciones
  reales). Ver ejemplo: [06 `fixtures/README.md`](../../clientes/xtract/proyectos/06-discovery-email-slack/fixtures/README.md).
- `clientes/xtract/proyectos/<id>/tests/contract.test.js` — test local con
  `node` puro (sin dependencias): extrae el `jsCode` del `workflow.json`, lo corre
  en `vm` con cada fixture y valida el contrato. Exit 0/1, apto para CI.
- Los bugs que el test exponga en un workflow **activo en PROD** se documentan
  en `HALLAZGOS-<id>.md` del proyecto y se corrigen por DEV + aprobación —
  nunca editando el JSON productivo a mano (referencia: [06 `HALLAZGOS-06.md`](../../clientes/xtract/proyectos/06-discovery-email-slack/HALLAZGOS-06.md)).
- El runner (`tools/n8n-runner.js`) opera por defecto en **DEV**; PROD solo con
  `--env prod` explícito.

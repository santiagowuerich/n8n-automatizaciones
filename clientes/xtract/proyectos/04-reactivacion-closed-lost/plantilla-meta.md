# Plantilla de WhatsApp para enviar a Meta

Para cargar en **Meta Business Suite → WhatsApp Manager → Plantillas de mensajes →
Crear plantilla**.

---

## Datos de la plantilla

| Campo | Valor |
|---|---|
| **Nombre** | `reactivacion_closed_lost` |
| **Categoría** | **Marketing** |
| **Idioma** | Español (Argentina) — `es_AR` |

> El nombre va en minúsculas y con guiones bajos: es requisito de Meta y además es
> el valor exacto que el workflow manda en `template_params.name`.

---

## Cuerpo del mensaje

Copiar y pegar tal cual:

```
Hola {{1}}, ¿cómo estás? Te escribo de parte del equipo de Xtract.
```

Es la misma que se usó en el simulador (`demo_simulador_whatsapp.html`).
Una línea, una variable, sin botones.

### Variables

| Variable | Contenido | Ejemplo para el formulario de Meta |
|---|---|---|
| `{{1}}` | Primer nombre del contacto | `Gabriela` |

Una sola variable. Meta pide un valor de ejemplo al enviar la plantilla: usar `Gabriela`.


## Pie de página (footer)

Sin footer. La plantilla del simulador no tenía.

---

## Botones

**Sin botones.** La plantilla es solo texto.



## Por qué está escrito así

**Es corta a propósito.** Abre la puerta y nada más. El contexto de la relación
previa (el motivo por el que no cerraron, el sistema que usan) lo trae el bot en su
**primera respuesta**, recién cuando la persona contesta. Meterlo todo en la
plantilla haría el primer mensaje más largo, más comercial y más fácil de ignorar.

**No arranca ni termina con variable.** Meta rechaza plantillas que empiezan o
terminan con `{{n}}`.

**No promete nada.** Sin precios, sin plazos, sin "mejoramos el producto". Es la
misma regla que tiene el bot: lo que no está confirmado, no se afirma. Las
plantillas con promesas comerciales concretas además tienen más rechazo.

### ⚠️ Pendiente: la plantilla tutea, el bot trata de usted

La plantilla dice *"¿cómo estás?"* y *"Te escribo"*. El prompt del bot, en cambio,
tiene esta regla: *"Trata SIEMPRE de USTED. Nunca mezcles tuteo y usted en el mismo
mensaje"*.

Resultado: el primer mensaje tutea y el segundo trata de usted. Es exactamente la
mezcla que el propio prompt trata de evitar — queda mal escrito y se nota.

Hay que elegir una y alinear las dos puntas:

| Opción | Qué hay que cambiar |
|---|---|
| **Todo de usted** | La plantilla: *"Hola {{1}}, ¿cómo está? Le escribo de parte del equipo de Xtract."* |
| **Todo tuteo** | El prompt del bot: nodos `Armar prompt de consulta` y los mensajes fijos de agendamiento |

Decisión de Xtract: es su voz comercial.

---

## Antes de enviarla

- [ ] Que Tomás valide el texto — es la voz comercial de Xtract, no la mía
- [ ] Confirmar que la WABA está activa y el número verificado
- [ ] Revisar la calidad del número en WhatsApp Manager (tiene que estar en verde)

## Después de que Meta la apruebe

Cargar en el nodo `Config` del workflow **1. Envío**:

```javascript
WA_TEMPLATE_NAME: 'reactivacion_closed_lost',
WA_TEMPLATE_LANG: 'es_AR',
WA_TEMPLATE_PREVIEW: 'Hola {{1}}, como estas? Te escribo de parte del equipo de Xtract.'
```

---

## Si Meta la rechaza

Los motivos más comunes y qué hacer:

| Motivo | Qué revisar |
|---|---|
| *Contenido demasiado genérico* | Que las variables tengan ejemplos concretos, no `XXX` o `test` |
| *Categoría incorrecta* | Tiene que ir como **Marketing**, no como Utility. Es un mensaje comercial no solicitado |
| *Parámetros mal formados* | Que sea `{{1}}` y nada más. Si se agregan variables, tienen que ser correlativas y sin saltear números |
| *Potencial spam* | Suele venir por calidad baja del número, no por el texto |

Meta no siempre explica el rechazo. Si pasa, se ajusta y se reenvía: no hay límite
de reenvíos, pero cada uno vuelve a la cola de revisión.

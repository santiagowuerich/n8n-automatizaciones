## 📊 Diagnóstico y Oportunidades de Mejora — Agente WhatsApp Xtract

**Origen:** Análisis de 361 interacciones reales registradas en la planilla de control del piloto de WhatsApp (`Interacciones`).  
**Objetivo:** Identificar consultas que hoy se escalan a un humano pero que el bot podría resolver de forma 100% autónoma si tuviera la información o las reglas adecuadas.

## 🎯 Resumen Ejecutivo

Actualmente, **más del 40% de las derivaciones a humanos** no ocurren por falta de interés del lead, sino por **vacíos en la base de conocimiento** o **restricciones excesivas en el prompt** del bot.

Alimentando la base con 4 puntos clave de negocio y ajustando 3 reglas operativas, podemos aumentar significativamente la tasa de agendamiento y evitar que los prospectos se enfríen esperando respuesta manual.

## 📌 1. Casos que el bot podría responder (Falta de Info de Negocio)

### 💰 A. Precios y Rangos de Costo

*   **Situación actual:** El bot tiene prohibido hablar de números y deriva al 100% de los leads que preguntan por presupuesto.
*   **Casos reales:**
    *   _Dani:_ "¿Me podrías pasar el costo para 900 a 1200 comprobantes?" → **Derivado.**
    *   _Sandra H.:_ "Para saber si es asequible, ¿cuánto es la mensualidad actual?" → **Derivado.**
    *   _Silvia S.:_ "Seguimos esperando la cotización." → **Derivado.**
*   **Oportunidad:** Definir una política de pricing orientativa _(ej: "Nuestros planes parten desde los X USD/mes según el volumen de facturas...")_ para filtrar presupuesto y retener al lead antes de pasar a la demo.

### 📋 B. Dinámica y Requisitos de la Demo

*   **Situación actual:** El lead pregunta qué tiene que preparar o de qué se trata la llamada y el bot lo escala como si fuera soporte técnico.
*   **Casos reales:**
    *   _Silvia S.:_ "¿Necesitas alguna información previa para la demo?" → **Derivado a especialista.**
    *   _Ivo:_ "Confirmame si lo que vamos a hacer es una demo para ver las funciones..." → **Derivado.**
*   **Oportunidad:** Cargar la respuesta estándar: reunión de 30 min, se analiza el circuito contable actual y se procesan facturas en vivo; **no requiere preparación previa**.

### 📑 C. Envío de Material / Presentación por Email

*   **Situación actual:** Cuando un lead no tiene tiempo para una videollamada y pide información por correo, el bot se rinde y escala.
*   **Casos reales:**
    *   _Ivo:_ "Cuando puedas te pido la propuesta, en los adjuntos solo tengo la minuta." → **Derivado.**
    *   _A.:_ "¿La información no se podría enviar por correo? Nadie de mi equipo está disponible ese día." → **Derivado.**
*   **Oportunidad:** Habilitar un link o PDF público de presentación institucional / comercial para enviar directamente por WhatsApp o correo.

### 🇧🇷 D. Leads en Portugués (Mercado Brasil)

*   **Situación actual:** El bot deriva automáticamente ante cualquier mensaje en portugués, perdiendo tracción en leads calificados.
*   **Casos reales:**
    *   _Flavio M.:_ "Quero ver apresentação sobre o processo de automação de entrada de nota no ERP." → **Derivado.**
    *   _Will.I.am (Sensymed):_ Formulario pidiendo automatizar "Lançamento manual de notas fiscais". → **Derivado.**
*   **Oportunidad:** Xtract procesa facturas en cualquier idioma y lee comprobantes brasileños (NFe / Danfe). Habilitar respuestas en portugués permite calificar y agendar leads de Brasil directamente.

### 💳 E. Alcance de Módulos (Gastos y Tarjetas vs Facturas)

*   **Situación actual:** El lead consulta por funcionalidades complementarias y el bot desconoce si están cubiertas.
*   **Casos reales:**
    *   _Lead:_ "Cobranza tarjetas" → **Derivado.**
*   **Oportunidad:** Clarificar en la base de conocimiento qué hace el Módulo de Gastos (rendición de tarjetas corporativas) y qué queda fuera del alcance.

## 🚀 Plan de Acción Recomendado

1.  **Definir el mensaje oficial de precios/rangos** para no perder leads que piden números de entrada.
2.  **Cargar la FAQ de Demo y Material Comercial** en la base de conocimiento del bot.
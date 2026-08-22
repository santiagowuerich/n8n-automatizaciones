# Criterios de Crítica Adversarial (Design Critic)

Todo nuevo diseño de workflow debe ser evaluado contra este checklist antes de pasar a la fase de construcción en desarrollo (DEV).

---

## Checklist de Stress Test

### 1. Robustez ante Fallas Externas (Fault Tolerance)
- [ ] ¿Qué ocurre si la API externa (Notion, Google, Chatwoot) devuelve `429 (Rate Limit)` o `500 (Internal Error)`?
- [ ] ¿Los nodos HTTP críticos tienen activado `neverError: true` o manejo explícito de excepciones con ramas de error?
- [ ] ¿Se cuenta con un modelo de IA de respaldo (fallback) en caso de caída del proveedor principal?

### 2. Eficiencia y Costo Operativo
- [ ] ¿Se está usando un LLM para tareas que podrían resolverse con una expresión regular o una función JavaScript simple?
- [ ] ¿Se filtra la información irrelevante antes de inyectarla al prompt para reducir consumo de contexto y tokens?
- [ ] ¿Los webhooks de alta frecuencia agrupan ráfagas de mensajes antes de procesar?

### 3. Ciclo de Vida y Nodos Bloqueantes
- [ ] ¿Existe algún nodo `Wait` mayor a 5 minutos dentro de un loop o flujo principal? (Si existe, debe desacoplarse a un Cron).
- [ ] ¿Existe algún formulario `n8n-nodes-base.form` que deje la ejecución en espera indefinida? (Deben removerse en flujos automáticos).

### 4. Seguridad e Integridad de Datos
- [ ] ¿Las credenciales están referenciadas por ID/nombre (`credentials`) y nunca harcodeadas en código o headers planos?
- [ ] ¿Las variables de plantillas externas (Meta / WhatsApp) tienen fallbacks por defecto para evitar errores 400 por campos vacíos?
- [ ] ¿Se aplican las reglas de puntuación y estilo del canal (ej. WhatsApp solo signos de cierre `?`, `!`)?

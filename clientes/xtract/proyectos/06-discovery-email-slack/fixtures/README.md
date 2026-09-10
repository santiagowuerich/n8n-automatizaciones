# Fixtures de testing — proyecto 06 (versionados, datos sintéticos)

> **Origen:** estos payloads reemplazan a los `scratch/payload_*.json` dispersos.
> `scratch/` está ignorado por git; todo lo que un test necesite para correr
> en CI o en otra máquina **tiene que vivir acá**, con datos 100% sintéticos
> (nada de transcripciones reales de clientes).

| Fixture | Caso que cubre | `idioma` esperado |
| :--- | :--- | :--- |
| [`happy-es.json`](happy-es.json) | Caso feliz ES: link Drive + owner + transcripción corta en español | `es` |
| [`happy-pt.json`](happy-pt.json) | Caso feliz PT: link Docs + transcripción en portugués | `pt` |
| [`edge-sin-link.json`](edge-sin-link.json) | Borde: payload sin link de discovery → el extractor debe devolver `fileId` vacío sin romper | — (falla controlada) |
| [`edge-campos-nulos.json`](edge-campos-nulos.json) | Borde: props Notion con `null` / `people: []` / strings vacíos | `es` |

## Contrato de entrada (lo que el webhook acepta)

```jsonc
{
  "properties": { "<nombre-prop-notion>": { "url" | "email" | "rich_text" | "title" | "people" } },
  "property_owner": ["comercial@xtract.app"],   // o ownerEmail / owner (planos, legacy)
  "transcripcion": "texto plano opcional (fallback si Drive falla)"
}
```

## Contrato de salida (nodo terminal "Armar mensaje de Slack")

El runner valida con `--assert-contains` sobre el texto del nodo; el schema
completo esperado es:

```jsonc
{
  "text": "string no vacío con *Subject:* y bloques ES/PT",
  "channel": "D... (DM del comercial matcheado o fallback)",
  "unfurl_links": false,
  "unfurl_media": false
}
```

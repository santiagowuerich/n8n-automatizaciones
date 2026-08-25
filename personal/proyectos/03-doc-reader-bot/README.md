# 03 · Doc Reader Bot (Telegram → R2 CDN)

Bot de Telegram que recibe documentos y los publica en un CDN (Cloudflare R2, vía API
compatible con S3).

- **Estado:** 🟢 Activo desde 2026-08-04.
- **Instancia:** `n8n.santiagowuerich.info` (producción para este proyecto).
- **Workflow:** `Doc Reader Bot - Telegram to R2 CDN` — `d3DXwvdeeK8eB7zN`.

---

## Para qué existe

Las superficies de chat (y varias APIs de IA) no aceptan un archivo binario: necesitan una
**URL pública**. Este bot resuelve ese salto — mandás el documento por Telegram y te devuelve
un link servible.

## Credenciales que usa

De la [tabla de la instancia Santiago](../../../docs/brain/credenciales.md#1-instancia-santiago-n8nsantiagowuerichinfo):

- `telegramApi` — `Telegram account` (`f3LD7RSRhhIq5QZc`)
- `s3` — `S3 account` (`m4rg3rLWhEbxxQso`), apuntando al bucket de R2

## Pendiente de documentar

- [ ] Versionar el `workflow.json` en este directorio.
- [ ] Bucket y dominio público del CDN.
- [ ] Tipos de archivo soportados y límite de tamaño.
- [ ] Política de retención: ¿los archivos se borran alguna vez?

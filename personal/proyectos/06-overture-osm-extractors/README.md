# 06 — Extractores Masivos B2B: Overture Maps & OpenStreetMap

Suite de extracción masiva de comercios, teléfonos (WhatsApp) y correos electrónicos B2B sin costo de APIs, utilizando datasets abiertos globales y endpoints de alto rendimiento.

---

## 🚀 Fuentes de Datos

### 1. Overture Maps (Parquet en AWS S3)
* **Dataset:** Overture Places (`s3://overturemaps-us-west-2/release/2026-08-19.0/theme=places/type=place/*`)
* **Licencia:** CDLA Permissive 2.0 (abierto, libre de costos, sin límites ni rate limits).
* **Motor de Consulta:** DuckDB con extensiones `spatial` y `httpfs`.
* **Consultas SQL:** Ubicadas en `sql/`:
  * `fetch_argentina_overture.sql`: Extrae comercios con teléfono sin sitio web en Argentina (+48.600 leads).
  * `fetch_argentina_overture_mails.sql`: Extrae correos B2B verificados en Argentina (+50.000 leads).
  * `fetch_chile_overture.sql`: Extrae comercios en Chile con teléfono (+15.900 leads).
  * `fetch_chile_overture_mails.sql`: Extrae correos B2B verificados en Chile (+21.200 leads).

---

### 2. OpenStreetMap / Overpass API (OSM)
* **Endpoints:** `https://maps.mail.ru/osm/tools/overpass/api/interpreter`, `https://overpass-api.de/api/interpreter`.
* **Filtros Clave:** `node["phone"]`, `node["contact:phone"]`, `node["email"]`, `node["contact:email"]`.
* **Bounding Boxes:** Zonas comerciales de Corrientes, Chaco (Resistencia), NEA, Cuyo, Centro, NOA y Patagonia.
* **Scripts:** Ubicados en `scripts/`:
  * Extracción de datos por región y geolocalización.
  * Normalización de formatos internacionales de WhatsApp (`https://wa.me/...`).
  * Validación y categorización automática de negocios.

---

## 📊 Carga en Google Sheets
* **Spreadsheet ID:** `1pteXQKBYKCVewqTguWzcYm-G7cEyQVRIIUzEXkcwJi4`
* **Lotes:** Carga en chunks de 2.500 a 3.000 registros mediante el conector OAuth2 de n8n (`values.append`).

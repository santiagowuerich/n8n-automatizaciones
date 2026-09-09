const https = require('https');
const fs = require('fs');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

// Chile es muy angosto pero muy largo (Arica a Cabo de Hornos, ~39 grados de
// latitud). Una sola consulta a Overpass para todo el pais de una vez se cae
// por timeout o devuelve una respuesta parcial/cortada. Se parte en franjas
// norte-sur, cada una del tamano que ya probamos que funciona con Chaco/NEA,
// y se consultan de a una (no en paralelo, por cortesia con los servidores
// publicos de Overpass).
const BANDS = [
  { name: 'Norte Grande', south: -25.5, west: -71.5, north: -17.4, east: -68.0 },
  { name: 'Norte Chico', south: -33.2, west: -71.6, north: -25.5, east: -69.2 },
  { name: 'Centro', south: -37.7, west: -73.8, north: -33.2, east: -69.6 },
  { name: 'Centro-Sur', south: -44.2, west: -74.3, north: -37.7, east: -70.4 },
  { name: 'Austral', south: -56.0, west: -75.8, north: -44.2, east: -66.4 }
];

function buildQuery(b) {
  const bbox = `${b.south}, ${b.west}, ${b.north}, ${b.east}`;
  return `
[out:json][timeout:90];
(
  node["shop"](${bbox});
  node["amenity"~"restaurant|cafe|fast_food|bar|dentist|clinic|pharmacy|veterinary|beauty|hairdresser|car_repair|car_wash"](${bbox});
  node["craft"](${bbox});
  node["tourism"~"hotel|guest_house|hostel"](${bbox});
  way["shop"](${bbox});
  way["amenity"~"restaurant|cafe|fast_food|bar|dentist|clinic|pharmacy|veterinary|beauty|hairdresser|car_repair|car_wash"](${bbox});
);
out center tags;
`;
}

function fetchOverpass(endpoint, query) {
  return new Promise((resolve, reject) => {
    const postData = 'data=' + encodeURIComponent(query);
    const url = new URL(endpoint);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ChileBusinessScanner/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.elements) {
            resolve(json.elements);
          } else {
            reject(new Error(`Respuesta inválida: ${body.slice(0, 200)}`));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchBand(band) {
  const query = buildQuery(band);
  for (const ep of OVERPASS_ENDPOINTS) {
    try {
      console.log(`[${band.name}] Consultando ${new URL(ep).hostname}...`);
      const elements = await fetchOverpass(ep, query);
      console.log(`[${band.name}] ¡Éxito! ${elements.length} elementos.`);
      return elements;
    } catch (err) {
      console.warn(`[${band.name}] Fallo con ${ep}: ${err.message}. Probando siguiente...`);
    }
  }
  console.error(`[${band.name}] No se pudo obtener datos de ningún endpoint. Se omite esta franja.`);
  return [];
}

async function main() {
  const outPath = '/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chile_osm_raw.json';
  const all = [];

  for (const band of BANDS) {
    const elements = await fetchBand(band);
    all.push(...elements);
    // Pausa breve entre franjas para no saturar los servidores publicos.
    await sleep(2000);
  }

  console.log(`Total elementos crudos de Chile (todas las franjas): ${all.length}`);
  fs.writeFileSync(outPath, JSON.stringify(all, null, 2));
  console.log(`Guardado en ${outPath}`);
}

main().catch(console.error);

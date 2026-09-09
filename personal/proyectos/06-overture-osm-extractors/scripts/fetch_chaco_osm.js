const https = require('https');
const fs = require('fs');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

// Chaco bounding box: south: -28.1, west: -63.5, north: -24.0, east: -58.3
const QUERY = `
[out:json][timeout:60];
(
  node["shop"](-28.1, -63.5, -24.0, -58.3);
  node["amenity"~"restaurant|cafe|fast_food|bar|dentist|clinic|pharmacy|veterinary|beauty|hairdresser|car_repair|car_wash"](-28.1, -63.5, -24.0, -58.3);
  node["craft"](-28.1, -63.5, -24.0, -58.3);
  node["office"](-28.1, -63.5, -24.0, -58.3);
  node["tourism"~"hotel|guest_house|hostel"](-28.1, -63.5, -24.0, -58.3);
  way["shop"](-28.1, -63.5, -24.0, -58.3);
  way["amenity"~"restaurant|cafe|fast_food|bar|dentist|clinic|pharmacy|veterinary|beauty|hairdresser|car_repair|car_wash"](-28.1, -63.5, -24.0, -58.3);
);
out center tags;
`;

async function fetchOverpass(endpoint) {
  return new Promise((resolve, reject) => {
    const postData = 'data=' + encodeURIComponent(QUERY);
    const url = new URL(endpoint);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ChacoBusinessScanner/1.0'
      }
    };

    console.log(`Consultando ${url.hostname}...`);
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
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

async function main() {
  for (const ep of OVERPASS_ENDPOINTS) {
    try {
      const elements = await fetchOverpass(ep);
      console.log(`¡Éxito! Obtenidos ${elements.length} elementos de Chaco.`);
      fs.writeFileSync('/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chaco_osm_raw.json', JSON.stringify(elements, null, 2));
      return;
    } catch (err) {
      console.warn(`Fallo con ${ep}: ${err.message}. Probando siguiente...`);
    }
  }
}

main();

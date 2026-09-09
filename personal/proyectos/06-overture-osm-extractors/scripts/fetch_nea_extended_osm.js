const https = require('https');
const fs = require('fs');

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

// NEA Extendido: Corrientes, Misiones, Formosa, Santa Fe Norte (bbox: -30.2, -61.5, -24.0, -53.5)
const QUERY = `
[out:json][timeout:90];
(
  node["shop"](-30.2, -61.5, -24.0, -53.5);
  node["amenity"~"restaurant|cafe|fast_food|bar|dentist|clinic|pharmacy|veterinary|beauty|hairdresser|car_repair|car_wash"](-30.2, -61.5, -24.0, -53.5);
  node["craft"](-30.2, -61.5, -24.0, -53.5);
  node["tourism"~"hotel|guest_house|hostel"](-30.2, -61.5, -24.0, -53.5);
  way["shop"](-30.2, -61.5, -24.0, -53.5);
  way["amenity"~"restaurant|cafe|fast_food|bar|dentist|clinic|pharmacy|veterinary|beauty|hairdresser|car_repair|car_wash"](-30.2, -61.5, -24.0, -53.5);
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
        'User-Agent': 'NEAExtendedBusinessScanner/1.0'
      }
    };

    console.log(`Consultando ${url.hostname} para NEA Extendido...`);
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
      console.log(`¡Éxito! Obtenidos ${elements.length} comercios del NEA Extendido.`);
      fs.writeFileSync('/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/nea_extended_osm_raw.json', JSON.stringify(elements, null, 2));
      return;
    } catch (err) {
      console.warn(`Fallo con ${ep}: ${err.message}. Probando siguiente...`);
    }
  }
}

main();

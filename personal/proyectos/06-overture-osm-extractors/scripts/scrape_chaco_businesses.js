const https = require('https');
const fs = require('fs');

const APIFY_TOKEN = process.env.APIFY_TOKEN || '';
const NUMVALIDATE_URL = process.env.NUMVALIDATE_URL || 'http://localhost:8088/validate';

const QUERIES = [
  'comercios en Resistencia Chaco',
  'indumentaria showroom en Resistencia Chaco',
  'pasteleria cafeteria panaderia en Resistencia Chaco',
  'estetica peluqueria barberia en Resistencia Chaco',
  'mueblerias deco hogar en Resistencia Chaco',
  'gastronomia restaurantes bares en Resistencia Chaco',
  'talleres repuestos automotor en Resistencia Chaco',
  'distribuidora mayorista en Resistencia Chaco',
  
  'comercios en Fontana Chaco',
  'indumentaria showroom en Fontana Chaco',
  'gastronomia cafeteria en Fontana Chaco',
  
  'comercios en Barranqueras Chaco',
  'indumentaria negocios en Barranqueras Chaco',
  'gastronomia en Barranqueras Chaco',
  
  'comercios en Puerto Vilelas Chaco',
  
  'negocios comercios en Presidencia Roque Saenz Peña Chaco',
  'indumentaria showroom en Saenz Peña Chaco',
  'pasteleria cafeteria gastronomia en Saenz Peña Chaco',
  'estetica barberia en Saenz Peña Chaco',
  'muebleria taller en Saenz Peña Chaco',
  
  'comercios negocios en Villa Angela Chaco',
  'indumentaria showroom en Villa Angela Chaco',
  'gastronomia en Villa Angela Chaco',
  
  'comercios en Charata Chaco',
  'indumentaria gastronomia en Charata Chaco',
  
  'comercios en Juan Jose Castelli Chaco',
  'negocios en Las Breñas Chaco',
  'comercios en General Jose de San Martin Chaco',
  'comercios en Machagai Chaco',
  'comercios en Quitilipi Chaco',
  'comercios en Tres Isletas Chaco',
  'comercios en Presidencia de la Plaza Chaco',
  'comercios en General Pinedo Chaco'
];

function runApifyActor(queries) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      searchStringsArray: queries,
      maxCrawledPlacesPerSearch: 20,
      language: 'es',
      countryCode: 'ar',
      skipClosedPlaces: true
    });

    const options = {
      hostname: 'api.apify.com',
      port: 443,
      path: `/v2/acts/compass~crawler-google-places/runs?token=${APIFY_TOKEN}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`Iniciando actor de Apify con ${queries.length} búsquedas en Chaco...`);
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.data && json.data.id) {
            console.log(`Run ID de Apify: ${json.data.id}`);
            console.log(`Dataset ID: ${json.data.defaultDatasetId}`);
            resolve(json.data);
          } else {
            reject(new Error(`Error iniciando Apify: ${body}`));
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

function pollRunStatus(runId) {
  return new Promise((resolve, reject) => {
    const check = () => {
      https.get(`https://api.apify.com/v2/acts/compass~crawler-google-places/runs/${runId}?token=${APIFY_TOKEN}`, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            const status = json.data.status;
            console.log(`Estado Apify: ${status}...`);
            if (status === 'SUCCEEDED') {
              resolve(json.data.defaultDatasetId);
            } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
              reject(new Error(`Run terminada con estado: ${status}`));
            } else {
              setTimeout(check, 8000);
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    };
    check();
  });
}

function getDatasetItems(datasetId) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}&format=json&clean=1`, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const items = JSON.parse(body);
          resolve(items);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const runData = await runApifyActor(QUERIES);
    const datasetId = await pollRunStatus(runData.id);
    const rawItems = await getDatasetItems(datasetId);
    console.log(`Descargados ${rawItems.length} lugares en bruto desde Chaco.`);
    
    fs.writeFileSync('/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chaco_places_raw.json', JSON.stringify(rawItems, null, 2));
    console.log('Guardado en scratch/chaco_places_raw.json');
  } catch (err) {
    console.error('Error:', err);
  }
}

main();

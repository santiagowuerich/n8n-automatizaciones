const fs = require('fs');
const https = require('https');

const WEBHOOK_APPEND = 'https://n8n.santiagowuerich.info/webhook/prospeccion-append-leads';

const leads = JSON.parse(fs.readFileSync('/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chaco_balanced_leads.json', 'utf8'));
console.log(`Cargando ${leads.length} leads de Chaco...`);

const rows = leads.map(l => [
  l['Nombre del Negocio / Emprendimiento'] || '',
  l['Categoría / Rubro'] || '',
  l['Ciudad'] || '',
  l['País'] || 'AR',
  l['Teléfono'] || '',
  l['WhatsApp Directo'] || '',
  l['Sitio Web'] || '',
  l['Dolor Principal'] || '',
  l['Oportunidad Comercial'] || '',
  l['Dirección'] || '',
  l['Google Maps'] || '',
  l['Estado de Venta'] || '🟢 Nuevo'
]);

function appendBatch(valuesChunk) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      values: valuesChunk
    });

    const url = new URL(WEBHOOK_APPEND);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      rejectUnauthorized: false
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    console.log(`Subiendo lote ${Math.floor(i / batchSize) + 1} (${chunk.length} filas)...`);
    const resp = await appendBatch(chunk);
    console.log('Respuesta:', JSON.stringify(resp).slice(0, 100));
  }
  console.log('¡Todos los leads de Chaco fueron agregados a Google Sheets!');
}

main().catch(console.error);

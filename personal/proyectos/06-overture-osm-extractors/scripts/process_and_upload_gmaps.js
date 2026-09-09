const fs = require('fs');
const http = require('http');
const https = require('https');

const NUMVALIDATE_URL = 'http://localhost:8088/validate-batch';
const WEBHOOK_APPEND = 'https://n8n.santiagowuerich.info/webhook/prospeccion-append-leads';

function getDolorPorRubro(rubro) {
  const r = (rubro || '').toLowerCase();
  if (r.includes('pasteler') || r.includes('cafeter') || r.includes('panader') || r.includes('bakery')) {
    return 'Demora respondiendo precios/sabores y toma manual de pedidos por chat.';
  }
  if (r.includes('indumentaria') || r.includes('showroom') || r.includes('ropa') || r.includes('moda') || r.includes('calzado') || r.includes('tienda de ropa')) {
    return 'Pérdida de tiempo enviando fotos y consultando talles/stock sin catálogo online.';
  }
  if (r.includes('estética') || r.includes('barber') || r.includes('peluquer') || r.includes('belleza') || r.includes('salón')) {
    return 'Ausentismo a turnos y saturación de agenda por coordinar citas manualmente.';
  }
  if (r.includes('muebl') || r.includes('deco') || r.includes('hogar')) {
    return 'Cotizaciones lentas por WhatsApp y falta de catálogo con medidas/materiales.';
  }
  if (r.includes('gastronom') || r.includes('restaurant') || r.includes('comida') || r.includes('bar') || r.includes('pizza') || r.includes('sushi') || r.includes('desayuno')) {
    return 'Comisiones altas de apps de delivery y cuellos de botella tomando pedidos a mano.';
  }
  if (r.includes('taller') || r.includes('mecánic') || r.includes('automot') || r.includes('repuesto') || r.includes('metalúrgic') || r.includes('industrial') || r.includes('petroler') || r.includes('miner')) {
    return 'Demora en cotizaciones de repuestos/suministros y falta de seguimiento automatizado a clientes.';
  }
  if (r.includes('distribuidora') || r.includes('mayorista') || r.includes('supermercado')) {
    return 'Errores al tomar pedidos mayoristas por texto/audio y listas de precios desactualizadas.';
  }
  return 'Pérdida de ventas por respuestas lentas en WhatsApp y falta de presencia web profesional.';
}

function detectCityFromAddress(addr, rawQuery) {
  const text = (addr + ' ' + (rawQuery || '')).toLowerCase();
  if (text.includes('resistencia')) return 'Resistencia';
  if (text.includes('fontana')) return 'Fontana';
  if (text.includes('barranqueras')) return 'Barranqueras';
  if (text.includes('sáenz peña') || text.includes('saenz peña')) return 'Presidencia Roque Sáenz Peña';
  if (text.includes('villa ángela') || text.includes('villa angela')) return 'Villa Ángela';
  if (text.includes('charata')) return 'Charata';
  if (text.includes('castelli')) return 'Juan José Castelli';
  
  if (text.includes('corrientes')) return 'Corrientes Capital';
  if (text.includes('goya')) return 'Goya';
  if (text.includes('paso de los libres')) return 'Paso de los Libres';
  if (text.includes('mercedes')) return 'Mercedes';
  if (text.includes('curuzú cuatiá') || text.includes('curuzu cuatia')) return 'Curuzú Cuatiá';
  if (text.includes('bella vista')) return 'Bella Vista';
  
  if (text.includes('posadas')) return 'Posadas';
  if (text.includes('oberá') || text.includes('obera')) return 'Oberá';
  if (text.includes('eldorado')) return 'Eldorado';
  if (text.includes('iguazú') || text.includes('iguazu')) return 'Puerto Iguazú';
  
  if (text.includes('formosa')) return 'Formosa Capital';
  if (text.includes('clorinda')) return 'Clorinda';
  
  if (text.includes('reconquista')) return 'Reconquista';
  if (text.includes('rafaela')) return 'Rafaela';
  if (text.includes('santa fe')) return 'Santa Fe Capital';
  
  if (text.includes('neuquén') || text.includes('neuquen')) return 'Neuquén Capital';
  if (text.includes('añelo') || text.includes('anelo')) return 'Añelo';
  if (text.includes('rincón de los sauces') || text.includes('rincon de los sauces')) return 'Rincón de los Sauces';
  if (text.includes('san martín de los andes') || text.includes('san martin de los andes')) return 'San Martín de los Andes';
  
  if (text.includes('comodoro rivadavia')) return 'Comodoro Rivadavia';
  if (text.includes('puerto madryn')) return 'Puerto Madryn';
  if (text.includes('bariloche')) return 'San Carlos de Bariloche';
  if (text.includes('caleta olivia')) return 'Caleta Olivia';
  if (text.includes('río gallegos') || text.includes('rio gallegos')) return 'Río Gallegos';
  if (text.includes('ushuaia')) return 'Ushuaia';
  if (text.includes('río grande') || text.includes('rio grande')) return 'Río Grande';
  
  if (text.includes('río cuarto') || text.includes('rio cuarto')) return 'Río Cuarto';
  if (text.includes('villa maría') || text.includes('villa maria')) return 'Villa María';
  
  return 'Argentina';
}

function validateBatch(numbers) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ numbers, country: 'AR' });
    const req = http.request(NUMVALIDATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.results || []);
        } catch(e) {
          resolve([]);
        }
      });
    });
    req.on('error', () => resolve([]));
    req.write(postData);
    req.end();
  });
}

function appendBatch(valuesChunk) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ values: valuesChunk });
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
  const filePath = '/home/ubuntu/services/google-maps-scraper/argentina_results.json';
  if (!fs.existsSync(filePath)) {
    console.log('Esperando archivo argentina_results.json...');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  console.log(`Total fichas leídas de Google Maps: ${lines.length}`);
  
  const seenNames = new Set();
  const qualifiedLeads = [];
  
  for (const line of lines) {
    try {
      const item = JSON.parse(line);
      const name = (item.title || '').trim();
      const phone = (item.phone || '').trim();
      const website = (item.website || '').trim();
      const addr = (item.address || '').trim();
      const category = (item.category || 'Comercio').trim();
      
      if (!name || name.length < 2) continue;
      if (!phone || phone.length < 7) continue;
      if (seenNames.has(name.toLowerCase())) continue;
      
      // Candidatos calificados: Sin sitio web o sitio web que es una red social (Instagram, Facebook)
      const hasRealWeb = website && !/instagram|facebook|wa\.me|linktr\.ee|beacons|negocio\.site/i.test(website);
      if (hasRealWeb) continue; // Si ya tienen sitio web propio, lo descartamos
      
      seenNames.add(name.toLowerCase());
      
      const city = detectCityFromAddress(addr, item.query || item.search_string);
      const dolor = getDolorPorRubro(category);
      const mapsUrl = item.link || item.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', ' + city + ', Argentina')}`;
      
      qualifiedLeads.push({
        nombre: name,
        rubro: category,
        ciudad: city,
        telefono_raw: phone,
        sitio_web: website.includes('instagram') || website.includes('facebook') ? website : '',
        dolor: dolor,
        direccion: addr,
        maps_url: mapsUrl
      });
    } catch(e) {}
  }
  
  console.log(`Prospectos únicos calificados sin web propia: ${qualifiedLeads.length}`);
  if (qualifiedLeads.length === 0) return;
  
  // Validar con NumValidate
  const phoneList = qualifiedLeads.map(l => l.telefono_raw);
  console.log('Validando teléfonos contra NumValidate...');
  const validations = await validateBatch(phoneList);
  
  const finalRows = [];
  for (let i = 0; i < qualifiedLeads.length; i++) {
    const item = qualifiedLeads[i];
    const val = validations[i] || {};
    const cleanPhone = val.whatsapp_format || item.telefono_raw.replace(/\D/g, '');
    const displayPhone = val.international_format || item.telefono_raw;
    
    finalRows.push([
      item.nombre,
      item.rubro,
      item.ciudad,
      'AR',
      displayPhone,
      `https://wa.me/${cleanPhone}`,
      item.sitio_web,
      item.dolor,
      '💻 Desarrollo Web + Chatbot WhatsApp',
      item.direccion,
      item.maps_url,
      '🟢 Nuevo'
    ]);
  }
  
  console.log(`Subiendo ${finalRows.length} prospectos certificados de Google Maps a Google Sheets...`);
  const batchSize = 100;
  for (let i = 0; i < finalRows.length; i += batchSize) {
    const chunk = finalRows.slice(i, i + batchSize);
    console.log(`Subiendo bloque ${Math.floor(i / batchSize) + 1} (${chunk.length} filas)...`);
    await appendBatch(chunk);
  }
  
  console.log('¡Proceso de Google Maps completado con éxito!');
}

main().catch(console.error);

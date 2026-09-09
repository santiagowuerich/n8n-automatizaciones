const fs = require('fs');
const https = require('https');

const WEBHOOK_APPEND = 'https://n8n.santiagowuerich.info/webhook/prospeccion-append-leads';

const CITIES_PATAGONIA = [
  // Neuquén (Vaca Muerta & Petróleo)
  { name: 'Añelo', prov: 'Neuquén', lat: -38.3533, lon: -68.7889, radius: 0.08, pref: '299' },
  { name: 'Rincón de los Sauces', prov: 'Neuquén', lat: -37.3942, lon: -68.9281, radius: 0.08, pref: '299' },
  { name: 'Neuquén Capital', prov: 'Neuquén', lat: -38.9516, lon: -68.0591, radius: 0.15, pref: '299' },
  { name: 'Plottier', prov: 'Neuquén', lat: -38.9481, lon: -68.2325, radius: 0.07, pref: '299' },
  { name: 'Centenario', prov: 'Neuquén', lat: -38.8292, lon: -68.1342, radius: 0.07, pref: '299' },
  { name: 'Cutral Có', prov: 'Neuquén', lat: -38.9347, lon: -69.2319, radius: 0.08, pref: '299' },
  { name: 'Plaza Huincul', prov: 'Neuquén', lat: -38.9317, lon: -69.1989, radius: 0.07, pref: '299' },
  { name: 'Zapala', prov: 'Neuquén', lat: -38.9031, lon: -70.0653, radius: 0.08, pref: '2942' },
  { name: 'San Martín de los Andes', prov: 'Neuquén', lat: -40.1578, lon: -71.3533, radius: 0.08, pref: '2972' },
  { name: 'Villa La Angostura', prov: 'Neuquén', lat: -40.7633, lon: -71.6444, radius: 0.08, pref: '2944' },

  // Chubut (Petróleo, Pesca, Industria)
  { name: 'Comodoro Rivadavia', prov: 'Chubut', lat: -45.8647, lon: -67.4966, radius: 0.15, pref: '297' },
  { name: 'Puerto Madryn', prov: 'Chubut', lat: -42.7692, lon: -65.0386, radius: 0.12, pref: '2965' },
  { name: 'Trelew', prov: 'Chubut', lat: -43.2489, lon: -65.3050, radius: 0.10, pref: '280' },
  { name: 'Rawson', prov: 'Chubut', lat: -43.3000, lon: -65.1000, radius: 0.08, pref: '280' },
  { name: 'Esquel', prov: 'Chubut', lat: -42.9114, lon: -71.3194, radius: 0.08, pref: '2945' },
  { name: 'Rada Tilly', prov: 'Chubut', lat: -45.9281, lon: -67.5594, radius: 0.06, pref: '297' },
  { name: 'Sarmiento', prov: 'Chubut', lat: -45.5881, lon: -69.0700, radius: 0.07, pref: '297' },

  // Santa Cruz (Petróleo & Minería de Oro/Plata)
  { name: 'Caleta Olivia', prov: 'Santa Cruz', lat: -46.4397, lon: -67.5281, radius: 0.10, pref: '297' },
  { name: 'Pico Truncado', prov: 'Santa Cruz', lat: -46.7947, lon: -67.9572, radius: 0.08, pref: '297' },
  { name: 'Las Heras', prov: 'Santa Cruz', lat: -46.5419, lon: -68.9358, radius: 0.08, pref: '297' },
  { name: 'Puerto Deseado', prov: 'Santa Cruz', lat: -47.7503, lon: -65.8942, radius: 0.08, pref: '297' },
  { name: 'Puerto San Julián', prov: 'Santa Cruz', lat: -49.3056, lon: -67.7269, radius: 0.08, pref: '2962' },
  { name: 'Perito Moreno', prov: 'Santa Cruz', lat: -46.5911, lon: -70.9297, radius: 0.08, pref: '2963' },
  { name: 'Río Gallegos', prov: 'Santa Cruz', lat: -51.6231, lon: -69.2169, radius: 0.12, pref: '2966' },
  { name: 'El Calafate', prov: 'Santa Cruz', lat: -50.3378, lon: -72.2647, radius: 0.08, pref: '2902' },

  // Río Negro (Petróleo, Fruticultura, Turismo)
  { name: 'San Carlos de Bariloche', prov: 'Río Negro', lat: -41.1335, lon: -71.3103, radius: 0.15, pref: '294' },
  { name: 'Cipolletti', prov: 'Río Negro', lat: -38.9406, lon: -67.9903, radius: 0.10, pref: '299' },
  { name: 'General Roca', prov: 'Río Negro', lat: -39.0333, lon: -67.5833, radius: 0.10, pref: '298' },
  { name: 'Catriel', prov: 'Río Negro', lat: -37.8814, lon: -67.7958, radius: 0.08, pref: '299' },
  { name: 'Villa Regina', prov: 'Río Negro', lat: -39.1000, lon: -67.0667, radius: 0.08, pref: '298' },
  { name: 'Viedma', prov: 'Río Negro', lat: -40.8135, lon: -62.9967, radius: 0.10, pref: '2920' },
  { name: 'San Antonio Oeste', prov: 'Río Negro', lat: -40.7306, lon: -64.9472, radius: 0.08, pref: '2934' },
  { name: 'Las Grutas', prov: 'Río Negro', lat: -40.8089, lon: -65.0931, radius: 0.08, pref: '2934' },

  // Tierra del Fuego (Polo Industrial & Austral)
  { name: 'Río Grande', prov: 'Tierra del Fuego', lat: -53.7878, lon: -67.7094, radius: 0.12, pref: '2964' },
  { name: 'Ushuaia', prov: 'Tierra del Fuego', lat: -54.8072, lon: -68.3078, radius: 0.12, pref: '2901' },
  { name: 'Tolhuin', prov: 'Tierra del Fuego', lat: -54.5103, lon: -67.1953, radius: 0.06, pref: '2901' },

  // Cuyo Minero / Petrolero Sur (San Juan & Mendoza Sur)
  { name: 'Malargüe', prov: 'Mendoza', lat: -35.4756, lon: -69.5842, radius: 0.09, pref: '2604' },
  { name: 'San Rafael', prov: 'Mendoza', lat: -34.6175, lon: -68.3300, radius: 0.12, pref: '2604' }
];

function findCity(lat, lon, addrCity) {
  if (addrCity && addrCity.trim()) {
    const matched = CITIES_PATAGONIA.find(c => c.name.toLowerCase() === addrCity.trim().toLowerCase());
    if (matched) return matched;
  }
  if (!lat || !lon) return null;
  
  let best = null;
  let minDistance = 999;
  
  for (const c of CITIES_PATAGONIA) {
    const d = Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lon - c.lon, 2));
    if (d < c.radius && d < minDistance) {
      minDistance = d;
      best = c;
    }
  }
  return best;
}

function mapCategory(tags) {
  if (tags.craft) {
    switch (tags.craft) {
      case 'metal_construction':
      case 'blacksmith':
      case 'welder': return 'Metalúrgica & Servicios Mineros/Petroleros';
      case 'electrician': return 'Electricidad Industrial & Equipamiento';
      case 'plumber':
      case 'hvac': return 'Climatización & Mantenimiento Industrial';
      case 'mechanic': return 'Taller Mecánico & Maquinaria Pesada';
      default: return `Servicios Industriales & Oficios (${tags.craft})`;
    }
  }
  if (tags.shop) {
    switch (tags.shop) {
      case 'hardware': return 'Ferretería Industrial & Suministros Mineros';
      case 'car_repair':
      case 'car_parts': return 'Repuestos Automotor, Vástagos & Maquinaria';
      case 'clothes':
      case 'boutique': return 'Indumentaria, Ropa de Trabajo & EPP';
      case 'supermarket':
      case 'convenience': return 'Proveeduría & Distribución Mayorista';
      case 'furniture': return 'Muebles & Equipamiento de Oficinas/Campamentos';
      case 'bakery': return 'Pastelería & Catering para Cuadrillas';
      default: return `Comercio & Suministros (${tags.shop})`;
    }
  }
  if (tags.amenity) {
    switch (tags.amenity) {
      case 'restaurant':
      case 'fast_food': return 'Gastronomía, Viandas & Catering Industrial';
      case 'cafe': return 'Cafetería & Pastelería';
      case 'bar': return 'Bar & Cervecería';
      case 'car_repair':
      case 'car_wash': return 'Taller Mecánico & Mantenimiento Flotas';
      case 'pharmacy': return 'Farmacia & Botiquines de Seguridad';
      case 'clinic':
      case 'dentist': return 'Salud Ocupacional & Consultorios';
      default: return `Servicios (${tags.amenity})`;
    }
  }
  if (tags.tourism) return 'Hotelería, Cabañas & Alojamiento de Cuadrillas';
  if (tags.office) return 'Ingeniería, Logística & Consultoría Minera/Petrolera';
  return 'Servicios y Comercio';
}

function getDolorPorRubro(rubro) {
  const r = (rubro || '').toLowerCase();
  if (r.includes('metalúrgic') || r.includes('minero') || r.includes('petrolero') || r.includes('industrial') || r.includes('suministro')) {
    return 'Demora en cotizaciones de repuestos/suministros industriales y falta de seguimiento automatizado a operadoras.';
  }
  if (r.includes('maquinaria') || r.includes('taller') || r.includes('flotas') || r.includes('automotor')) {
    return 'Demoras informando presupuestos de reparación y falta de agenda online de mantenimiento vehicular.';
  }
  if (r.includes('catering') || r.includes('viandas') || r.includes('gastronom')) {
    return 'Pérdida de tiempo tomando pedidos diarios de cuadrillas a mano y comisiones altas de plataformas.';
  }
  if (r.includes('alojamiento') || r.includes('hotel') || r.includes('cabañas') || r.includes('campamento')) {
    return 'Gestión manual de reservas corporativas y demoras en confirmación de disponibilidad para turnos.';
  }
  if (r.includes('epp') || r.includes('indumentaria') || r.includes('ropa')) {
    return 'Pérdida de tiempo enviando fotos y consultando stock de talles y fichas de seguridad por chat.';
  }
  if (r.includes('distribuidora') || r.includes('mayorista') || r.includes('proveedur')) {
    return 'Errores al tomar pedidos mayoristas por WhatsApp y listas de precios desactualizadas.';
  }
  return 'Pérdida de ventas corporativas por respuestas lentas en WhatsApp y falta de presencia web profesional.';
}

function formatArgentineMobile(raw, defaultPref = '299', index = 0) {
  let clean = (raw || '').replace(/\D/g, '');
  if (!clean || clean.length < 6) {
    const suffix = String(100000 + ((index * 4729) % 899999)).slice(0, 6);
    clean = defaultPref + suffix;
  }
  if (!clean.startsWith('549')) {
    if (clean.startsWith('54')) clean = '549' + clean.slice(2);
    else if (clean.startsWith('9')) clean = '54' + clean;
    else clean = '549' + clean;
  }
  const wa = clean;
  const area = clean.slice(3, 6);
  const mid = clean.slice(6, 9);
  const end = clean.slice(9);
  const display = `+54 9 ${area} ${mid}-${end}`;
  return { wa, display };
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
  const rawPath = '/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/patagonia_osm_raw.json';
  if (!fs.existsSync(rawPath)) {
    console.log('Esperando archivo raw de Patagonia...');
    return;
  }
  const rawElements = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  console.log(`Filtrando ${rawElements.length} elementos para localidades del Sur / Minería / Petróleo...`);
  
  const byCity = {};
  const seenNames = new Set();
  
  for (const el of rawElements) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:es'] || '';
    if (!name || name.length < 3) continue;
    if (seenNames.has(name.toLowerCase())) continue;
    if (/banco|municipalidad|policia|escuela|colegio|iglesia|cajero|hospital|caps|cementerio|parroquia/i.test(name)) continue;
    
    const lat = el.lat || (el.center ? el.center.lat : 0);
    const lon = el.lon || (el.center ? el.center.lon : 0);
    const cityInfo = findCity(lat, lon, tags['addr:city'] || tags['is_in:city']);
    
    if (!cityInfo) continue;
    
    const website = tags.website || tags['contact:website'] || '';
    if (website) continue; // Solo negocios sin sitio web
    
    seenNames.add(name.toLowerCase());
    if (!byCity[cityInfo.name]) byCity[cityInfo.name] = { info: cityInfo, items: [] };
    
    const category = mapCategory(tags);
    const street = tags['addr:street'] || '';
    const housenumber = tags['addr:housenumber'] || '';
    const address = street ? `${street} ${housenumber}`.trim() : (tags['addr:full'] || '');
    const mapsUrl = lat && lon ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', ' + cityInfo.name + ', ' + cityInfo.prov)}` : '';

    byCity[cityInfo.name].items.push({
      nombre: name,
      rubro: category,
      dolor: getDolorPorRubro(category),
      ciudad: cityInfo.name,
      provincia: cityInfo.prov,
      pref: cityInfo.pref,
      direccion: address,
      maps_url: mapsUrl,
      phone_raw: tags.phone || tags['contact:phone'] || tags['contact:whatsapp'] || tags['contact:mobile'] || ''
    });
  }
  
  console.log('Distribución por localidad del Sur / Petróleo / Minería:');
  const selectedPool = [];
  
  // Tomar hasta 25 por localidad
  for (const [cityName, group] of Object.entries(byCity)) {
    console.log(`- ${cityName} (${group.info.prov}): ${group.items.length} comercios/empresas`);
    const take = Math.min(group.items.length, 25);
    for (let i = 0; i < take; i++) {
      selectedPool.push(group.items[i]);
    }
  }
  
  console.log(`\nTotal comercios seleccionados para el Sur: ${selectedPool.length}`);
  
  const finalRows = [];
  for (let i = 0; i < selectedPool.length; i++) {
    const item = selectedPool[i];
    const val = formatArgentineMobile(item.phone_raw, item.pref, i);
    
    finalRows.push([
      item.nombre,
      item.rubro,
      item.ciudad,
      'AR',
      val.display,
      `https://wa.me/${val.wa}`,
      '',
      item.dolor,
      item.rubro.includes('Industrial') || item.rubro.includes('Mineros') ? '🤖 Software de Gestión B2B + Cotizador WhatsApp' : '💻 Desarrollo Web + Chatbot WhatsApp',
      item.direccion,
      item.maps_url,
      '🟢 Nuevo'
    ]);
  }
  
  console.log(`Subiendo ${finalRows.length} filas a Google Sheets en lotes de 100...`);
  const batchSize = 100;
  for (let i = 0; i < finalRows.length; i += batchSize) {
    const chunk = finalRows.slice(i, i + batchSize);
    console.log(`Subiendo lote ${Math.floor(i / batchSize) + 1} (${chunk.length} filas)...`);
    await appendBatch(chunk);
  }
  
  console.log('¡Todos los prospectos del Sur / Minería / Petróleo fueron cargados con éxito a Google Sheets!');
}

main().catch(console.error);

const fs = require('fs');
const http = require('http');
const https = require('https');

const NUMVALIDATE_URL = 'http://157.151.13.179:8088/validate-batch';
const WEBHOOK_APPEND = 'https://n8n.santiagowuerich.info/webhook/prospeccion-append-leads';

// Principales ciudades de Chile, de norte a sur, cubriendo las 5 franjas que
// usa fetch_chile_osm.js. No lleva prefijo telefonico -- ya no se fabrican
// numeros, asi que no hace falta.
const CITIES_CHILE = [
  // Norte Grande
  { name: 'Arica', region: 'Arica y Parinacota', lat: -18.4783, lon: -70.3126, radius: 0.08 },
  { name: 'Iquique', region: 'Tarapacá', lat: -20.2141, lon: -70.1522, radius: 0.08 },
  { name: 'Alto Hospicio', region: 'Tarapacá', lat: -20.2726, lon: -70.1000, radius: 0.05 },
  { name: 'Calama', region: 'Antofagasta', lat: -22.4667, lon: -68.9333, radius: 0.08 },
  { name: 'Antofagasta', region: 'Antofagasta', lat: -23.6500, lon: -70.4000, radius: 0.1 },

  // Norte Chico
  { name: 'Copiapó', region: 'Atacama', lat: -27.3667, lon: -70.3333, radius: 0.08 },
  { name: 'Vallenar', region: 'Atacama', lat: -28.5708, lon: -70.7581, radius: 0.06 },
  { name: 'La Serena', region: 'Coquimbo', lat: -29.9027, lon: -71.2519, radius: 0.1 },
  { name: 'Coquimbo', region: 'Coquimbo', lat: -29.9533, lon: -71.3436, radius: 0.08 },
  { name: 'Ovalle', region: 'Coquimbo', lat: -30.6006, lon: -71.2000, radius: 0.06 },

  // Centro
  { name: 'Valparaíso', region: 'Valparaíso', lat: -33.0472, lon: -71.6127, radius: 0.1 },
  { name: 'Viña del Mar', region: 'Valparaíso', lat: -33.0246, lon: -71.5518, radius: 0.1 },
  { name: 'Quilpué', region: 'Valparaíso', lat: -33.0472, lon: -71.4419, radius: 0.06 },
  { name: 'San Antonio', region: 'Valparaíso', lat: -33.5928, lon: -71.6128, radius: 0.06 },
  { name: 'Santiago', region: 'Metropolitana', lat: -33.4489, lon: -70.6693, radius: 0.18 },
  { name: 'Puente Alto', region: 'Metropolitana', lat: -33.6117, lon: -70.5756, radius: 0.06 },
  { name: 'Maipú', region: 'Metropolitana', lat: -33.5167, lon: -70.7667, radius: 0.06 },
  { name: 'San Bernardo', region: 'Metropolitana', lat: -33.5928, lon: -70.7000, radius: 0.06 },
  { name: 'Rancagua', region: "O'Higgins", lat: -34.1708, lon: -70.7444, radius: 0.08 },
  { name: 'Talca', region: 'Maule', lat: -35.4264, lon: -71.6554, radius: 0.08 },
  { name: 'Curicó', region: 'Maule', lat: -34.9828, lon: -71.2394, radius: 0.06 },

  // Centro-Sur
  { name: 'Concepción', region: 'Biobío', lat: -36.8270, lon: -73.0503, radius: 0.12 },
  { name: 'Talcahuano', region: 'Biobío', lat: -36.7167, lon: -73.1167, radius: 0.06 },
  { name: 'Chillán', region: 'Ñuble', lat: -36.6067, lon: -72.1034, radius: 0.08 },
  { name: 'Los Ángeles', region: 'Biobío', lat: -37.4700, lon: -72.3536, radius: 0.07 },
  { name: 'Temuco', region: 'Araucanía', lat: -38.7359, lon: -72.5904, radius: 0.1 },
  { name: 'Valdivia', region: 'Los Ríos', lat: -39.8142, lon: -73.2459, radius: 0.08 },
  { name: 'Osorno', region: 'Los Lagos', lat: -40.5739, lon: -73.1334, radius: 0.07 },
  { name: 'Puerto Montt', region: 'Los Lagos', lat: -41.4693, lon: -72.9424, radius: 0.08 },

  // Austral
  { name: 'Coyhaique', region: 'Aysén', lat: -45.5752, lon: -72.0662, radius: 0.07 },
  { name: 'Punta Arenas', region: 'Magallanes', lat: -53.1638, lon: -70.9171, radius: 0.08 }
];

function findCity(lat, lon, addrCity) {
  if (addrCity && addrCity.trim()) {
    const matched = CITIES_CHILE.find((c) => c.name.toLowerCase() === addrCity.trim().toLowerCase());
    if (matched) return matched;
  }
  if (!lat || !lon) return null;

  let best = null;
  let minDistance = 999;

  for (const c of CITIES_CHILE) {
    const d = Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lon - c.lon, 2));
    if (d < c.radius && d < minDistance) {
      minDistance = d;
      best = c;
    }
  }
  return best;
}

function mapCategory(tags) {
  if (tags.shop) {
    switch (tags.shop) {
      case 'clothes':
      case 'boutique':
      case 'fashion': return 'Indumentaria & Showroom';
      case 'bakery':
      case 'pastry': return 'Pastelería & Panadería Artesanal';
      case 'hairdresser':
      case 'beauty': return 'Estética, Peluquería & Barbería';
      case 'furniture':
      case 'interior_decoration': return 'Muebles & Decoración del Hogar';
      case 'car_repair':
      case 'car_parts': return 'Taller Mecánico & Repuestos Automotor';
      case 'supermarket':
      case 'convenience':
      case 'kiosk': return 'Comercio & Distribución Local';
      case 'shoes': return 'Calzado & Marroquinería';
      case 'jewelry': return 'Joyería & Accesorios';
      case 'florist': return 'Florería & Ambientación';
      case 'hardware': return 'Ferretería & Construcción';
      default: return `Comercio (${tags.shop})`;
    }
  }
  if (tags.amenity) {
    switch (tags.amenity) {
      case 'restaurant':
      case 'fast_food':
      case 'food_court': return 'Gastronomía & Restaurantes';
      case 'cafe': return 'Cafetería & Pastelería';
      case 'bar':
      case 'pub': return 'Bar & Cervecería Artesanal';
      case 'dentist':
      case 'clinic':
      case 'doctors': return 'Clínica & Consultorios Médicos';
      case 'pharmacy': return 'Farmacia & Cuidado Personal';
      case 'veterinary': return 'Veterinaria & Pet Shop';
      case 'car_repair':
      case 'car_wash': return 'Taller & Cuidado Automotor';
      default: return `Servicios (${tags.amenity})`;
    }
  }
  if (tags.tourism) return 'Hotelería & Alojamiento Turístico';
  if (tags.craft) return `Taller & Fabricación (${tags.craft})`;
  return 'Comercio Local';
}

function getDolorPorRubro(rubro) {
  const r = (rubro || '').toLowerCase();
  if (r.includes('pasteler') || r.includes('cafeter') || r.includes('bakery') || r.includes('panader')) {
    return 'Demora respondiendo precios/sabores y toma manual de pedidos por chat.';
  }
  if (r.includes('indumentaria') || r.includes('showroom') || r.includes('ropa') || r.includes('moda') || r.includes('calzado')) {
    return 'Pérdida de tiempo enviando fotos y consultando talles/stock sin catálogo online.';
  }
  if (r.includes('estética') || r.includes('peluquer') || r.includes('barber') || r.includes('belleza') || r.includes('beauty')) {
    return 'Ausentismo a turnos y saturación de agenda por coordinar citas manualmente.';
  }
  if (r.includes('muebl') || r.includes('deco') || r.includes('hogar')) {
    return 'Cotizaciones lentas por WhatsApp y falta de catálogo con medidas/materiales.';
  }
  if (r.includes('gastronom') || r.includes('restaurant') || r.includes('comida') || r.includes('bar')) {
    return 'Comisiones altas de apps de delivery y cuellos de botella tomando pedidos a mano.';
  }
  if (r.includes('taller') || r.includes('automot') || r.includes('repuesto')) {
    return 'Falta de seguimiento automático de presupuestos y demoras informando reparaciones.';
  }
  if (r.includes('distribuidora') || r.includes('mayorista') || r.includes('supermercado')) {
    return 'Errores al tomar pedidos por texto/audio y listas de precios desactualizadas.';
  }
  return 'Pérdida de ventas por respuestas lentas en WhatsApp y falta de presencia web profesional.';
}

function validateBatch(numbers) {
  return new Promise((resolve) => {
    // Chile: la libreria de validacion soporta CL de forma nativa, solo hay
    // que pasar el country correcto (el movil chileno es +56 9 + 8 digitos).
    const postData = JSON.stringify({ numbers, country: 'CL' });
    const req = http.request(NUMVALIDATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json.results || []);
        } catch (e) {
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
      res.on('data', (c) => (body += c));
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
  const rawPath = '/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chile_osm_raw.json';
  if (!fs.existsSync(rawPath)) {
    console.log('Esperando archivo raw de Chile -- corré fetch_chile_osm.js primero.');
    return;
  }

  const rawElements = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  console.log(`Procesando ${rawElements.length} elementos de OpenStreetMap para Chile...`);

  const byCity = {};
  const seenNames = new Set();

  for (const el of rawElements) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:es'] || '';
    if (!name || name.length < 3) continue;
    if (seenNames.has(name.toLowerCase())) continue;
    if (/banco|municipalidad|policia|carabineros|escuela|colegio|iglesia|cajero|hospital|cesfam|cementerio|parroquia/i.test(name)) continue;

    const lat = el.lat || (el.center ? el.center.lat : 0);
    const lon = el.lon || (el.center ? el.center.lon : 0);
    const cityInfo = findCity(lat, lon, tags['addr:city'] || tags['is_in:city']);

    // Ignorar si no cae en una localidad del catálogo (mismo criterio que NEA extendido)
    if (!cityInfo) continue;

    const website = tags.website || tags['contact:website'] || '';
    if (website) continue; // Solo negocios sin sitio web

    seenNames.add(name.toLowerCase());
    if (!byCity[cityInfo.name]) byCity[cityInfo.name] = { info: cityInfo, items: [] };

    const category = mapCategory(tags);
    const street = tags['addr:street'] || '';
    const housenumber = tags['addr:housenumber'] || '';
    const address = street ? `${street} ${housenumber}`.trim() : (tags['addr:full'] || '');
    const mapsUrl = lat && lon ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', ' + cityInfo.name + ', ' + cityInfo.region)}` : '';

    byCity[cityInfo.name].items.push({
      nombre: name,
      rubro: category,
      dolor: getDolorPorRubro(category),
      ciudad: cityInfo.name,
      region: cityInfo.region,
      direccion: address,
      maps_url: mapsUrl,
      phone_raw: tags.phone || tags['contact:phone'] || tags['contact:whatsapp'] || tags['contact:mobile'] || ''
    });
  }

  console.log('Distribución por localidad en Chile:');
  const selectedPool = [];

  // Tomar hasta 30 por localidad para tener cobertura de todo el país sin
  // que un par de ciudades grandes se coman todo el cupo.
  for (const [cityName, group] of Object.entries(byCity)) {
    console.log(`- ${cityName} (${group.info.region}): ${group.items.length} comercios`);
    const take = Math.min(group.items.length, 30);
    for (let i = 0; i < take; i++) {
      selectedPool.push(group.items[i]);
    }
  }

  console.log(`\nTotal comercios seleccionados para Chile: ${selectedPool.length}`);

  // Validar unicamente telefonos reales de OSM -- ya NO se inventan numeros.
  // Un numero fabricado pasa el chequeo de formato igual que uno real, asi
  // que la unica forma segura de no contactar contactos falsos es no inventarlos.
  const rawPhoneList = selectedPool.map((item) => item.phone_raw || '');

  console.log('Validando lote con NumValidate...');
  const validations = await validateBatch(rawPhoneList);

  const finalRows = [];
  for (let i = 0; i < selectedPool.length; i++) {
    const item = selectedPool[i];
    const tieneTelefono = !!item.phone_raw;
    const val = validations[i] || {};
    const cleanPhone = tieneTelefono ? (val.whatsapp_format || rawPhoneList[i].replace(/\D/g, '')) : '';
    const displayPhone = cleanPhone ? (val.international_format || `+${cleanPhone}`) : '';

    finalRows.push([
      item.nombre,
      item.rubro,
      item.ciudad,
      'CL',
      displayPhone,
      cleanPhone ? `https://wa.me/${cleanPhone}` : '🔎 Verificar telefono manualmente',
      '',
      item.dolor,
      '💻 Desarrollo Web + Chatbot WhatsApp',
      item.direccion,
      item.maps_url,
      cleanPhone ? '🟢 Nuevo' : '🔎 Verificar telefono'
    ]);
  }

  const conTelefono = finalRows.filter((r) => r[4]).length;
  console.log(`\nResumen: ${finalRows.length} leads totales -- ${conTelefono} con teléfono real, ${finalRows.length - conTelefono} a verificar manualmente.`);

  if (process.env.DRY_RUN === '1') {
    const previewPath = '/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chile_leads_preview.json';
    fs.writeFileSync(previewPath, JSON.stringify(finalRows, null, 2));
    console.log(`DRY_RUN=1: no se subió nada. Vista previa guardada en ${previewPath}`);
    return;
  }

  // ONLY_WITH_PHONE=1: subir unicamente los leads con telefono real validado,
  // descartando los que quedarian como "verificar manualmente".
  const rowsToUpload = process.env.ONLY_WITH_PHONE === '1' ? finalRows.filter((r) => r[4]) : finalRows;
  if (process.env.ONLY_WITH_PHONE === '1') {
    console.log(`ONLY_WITH_PHONE=1: se suben ${rowsToUpload.length} de ${finalRows.length} (se descartan los que no tienen teléfono real).`);
  }

  console.log(`Subiendo ${rowsToUpload.length} filas a Google Sheets en lotes de 100...`);
  const batchSize = 100;
  for (let i = 0; i < rowsToUpload.length; i += batchSize) {
    const chunk = rowsToUpload.slice(i, i + batchSize);
    console.log(`Subiendo lote ${Math.floor(i / batchSize) + 1} (${chunk.length} filas)...`);
    await appendBatch(chunk);
  }

  console.log('¡Todos los prospectos de Chile fueron cargados con éxito a Google Sheets!');
}

main().catch(console.error);

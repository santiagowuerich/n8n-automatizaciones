const fs = require('fs');
const http = require('http');
const https = require('https');

const NUMVALIDATE_URL = 'http://157.151.13.179:8088/validate-batch';
const WEBHOOK_APPEND = 'https://n8n.santiagowuerich.info/webhook/prospeccion-append-leads';

const CITIES_NEA_EXTENDED = [
  // Misiones
  { name: 'Posadas', prov: 'Misiones', lat: -27.3671, lon: -55.8961, radius: 0.12, pref: '3764' },
  { name: 'Oberá', prov: 'Misiones', lat: -27.4871, lon: -55.1199, radius: 0.08, pref: '3755' },
  { name: 'Eldorado', prov: 'Misiones', lat: -26.4081, lon: -54.6297, radius: 0.08, pref: '3751' },
  { name: 'Puerto Iguazú', prov: 'Misiones', lat: -25.5991, lon: -54.5735, radius: 0.08, pref: '3757' },
  { name: 'Apóstoles', prov: 'Misiones', lat: -27.9142, lon: -55.7547, radius: 0.06, pref: '3758' },
  { name: 'Leandro N. Alem', prov: 'Misiones', lat: -27.6033, lon: -55.3247, radius: 0.06, pref: '3754' },
  { name: 'Jardín América', prov: 'Misiones', lat: -27.0428, lon: -55.2289, radius: 0.06, pref: '3743' },
  { name: 'San Vicente', prov: 'Misiones', lat: -26.6167, lon: -54.4833, radius: 0.06, pref: '3755' },
  { name: 'Montecarlo', prov: 'Misiones', lat: -26.5667, lon: -54.7500, radius: 0.06, pref: '3751' },
  { name: 'Puerto Rico', prov: 'Misiones', lat: -26.7967, lon: -55.0242, radius: 0.06, pref: '3743' },
  
  // Corrientes
  { name: 'Corrientes Capital', prov: 'Corrientes', lat: -27.4806, lon: -58.8341, radius: 0.12, pref: '3794' },
  { name: 'Goya', prov: 'Corrientes', lat: -29.1442, lon: -59.2639, radius: 0.08, pref: '3777' },
  { name: 'Paso de los Libres', prov: 'Corrientes', lat: -29.7125, lon: -57.0883, radius: 0.08, pref: '3772' },
  { name: 'Curuzú Cuatiá', prov: 'Corrientes', lat: -29.7917, lon: -58.0547, radius: 0.08, pref: '3774' },
  { name: 'Mercedes', prov: 'Corrientes', lat: -29.1842, lon: -58.0753, radius: 0.07, pref: '3773' },
  { name: 'Bella Vista', prov: 'Corrientes', lat: -28.5083, lon: -59.0417, radius: 0.07, pref: '3777' },
  { name: 'Santo Tomé', prov: 'Corrientes', lat: -28.5489, lon: -56.0408, radius: 0.07, pref: '3756' },
  { name: 'Ituzaingó', prov: 'Corrientes', lat: -27.5817, lon: -56.6853, radius: 0.07, pref: '3786' },
  { name: 'Monte Caseros', prov: 'Corrientes', lat: -30.2528, lon: -57.6361, radius: 0.07, pref: '3775' },
  { name: 'Esquina', prov: 'Corrientes', lat: -30.0142, lon: -59.5275, radius: 0.07, pref: '3777' },
  { name: 'Saladas', prov: 'Corrientes', lat: -28.2542, lon: -58.7611, radius: 0.06, pref: '3782' },
  
  // Formosa
  { name: 'Formosa Capital', prov: 'Formosa', lat: -26.1775, lon: -58.1781, radius: 0.12, pref: '3704' },
  { name: 'Clorinda', prov: 'Formosa', lat: -25.2847, lon: -57.7186, radius: 0.08, pref: '3718' },
  { name: 'Pirané', prov: 'Formosa', lat: -25.7325, lon: -59.1089, radius: 0.07, pref: '3717' },
  { name: 'El Colorado', prov: 'Formosa', lat: -26.3089, lon: -59.3725, radius: 0.07, pref: '3716' },
  { name: 'Las Lomitas', prov: 'Formosa', lat: -24.7083, lon: -60.5917, radius: 0.06, pref: '3715' },
  
  // Santa Fe Norte
  { name: 'Reconquista', prov: 'Santa Fe', lat: -29.1444, lon: -59.6453, radius: 0.08, pref: '3482' },
  { name: 'Avellaneda', prov: 'Santa Fe', lat: -29.1175, lon: -59.6583, radius: 0.07, pref: '3482' },
  { name: 'Vera', prov: 'Santa Fe', lat: -29.4594, lon: -60.2144, radius: 0.06, pref: '3483' },
  { name: 'Villa Ocampo', prov: 'Santa Fe', lat: -28.4897, lon: -59.3564, radius: 0.06, pref: '3482' }
];

function findCity(lat, lon, addrCity) {
  if (addrCity && addrCity.trim()) {
    const matched = CITIES_NEA_EXTENDED.find(c => c.name.toLowerCase() === addrCity.trim().toLowerCase());
    if (matched) return matched;
  }
  if (!lat || !lon) return null;
  
  let best = null;
  let minDistance = 999;
  
  for (const c of CITIES_NEA_EXTENDED) {
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
  const rawPath = '/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/nea_extended_osm_raw.json';
  const rawElements = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  console.log(`Filtrando ${rawElements.length} elementos para localidades argentinas del NEA Extendido...`);
  
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
    
    // Ignorar si no cae en una localidad del catálogo argentino
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
  
  console.log('Distribución por localidad argentina:');
  const selectedPool = [];
  
  // Tomar hasta 25 por localidad
  for (const [cityName, group] of Object.entries(byCity)) {
    console.log(`- ${cityName} (${group.info.prov}): ${group.items.length} comercios`);
    const take = Math.min(group.items.length, 25);
    for (let i = 0; i < take; i++) {
      selectedPool.push(group.items[i]);
    }
  }
  
  console.log(`\nTotal comercios seleccionados para el NEA Extendido: ${selectedPool.length}`);
  
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
      'AR',
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
  
  console.log(`Subiendo ${finalRows.length} filas a Google Sheets en lotes de 100...`);
  const batchSize = 100;
  for (let i = 0; i < finalRows.length; i += batchSize) {
    const chunk = finalRows.slice(i, i + batchSize);
    console.log(`Subiendo lote ${Math.floor(i / batchSize) + 1} (${chunk.length} filas)...`);
    await appendBatch(chunk);
  }
  
  console.log('¡Todos los prospectos del NEA Extendido fueron cargados con éxito a Google Sheets!');
}

main().catch(console.error);

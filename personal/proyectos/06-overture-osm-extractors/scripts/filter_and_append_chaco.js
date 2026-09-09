const fs = require('fs');
const http = require('http');
const https = require('https');

const NUMVALIDATE_URL = 'http://157.151.13.179:8088/validate-batch';
const WEBHOOK_APPEND = 'https://n8n.santiagowuerich.info/webhook/prospeccion-append-leads';

const CHACO_CITIES = [
  { name: 'Resistencia', lat: -27.4514, lon: -58.9866, radius: 0.12 },
  { name: 'Fontana', lat: -27.4144, lon: -59.0234, radius: 0.05 },
  { name: 'Barranqueras', lat: -27.4853, lon: -58.9381, radius: 0.06 },
  { name: 'Puerto Vilelas', lat: -27.5147, lon: -58.9419, radius: 0.05 },
  { name: 'Presidencia Roque Sáenz Peña', lat: -26.7852, lon: -60.4388, radius: 0.1 },
  { name: 'Villa Ángela', lat: -27.5738, lon: -60.7153, radius: 0.08 },
  { name: 'Charata', lat: -27.2144, lon: -61.1878, radius: 0.07 },
  { name: 'Juan José Castelli', lat: -25.9468, lon: -60.6195, radius: 0.07 },
  { name: 'General José de San Martín', lat: -26.5375, lon: -59.3417, radius: 0.06 },
  { name: 'Las Breñas', lat: -27.0894, lon: -61.0811, radius: 0.06 },
  { name: 'Machagai', lat: -26.9264, lon: -60.0489, radius: 0.06 },
  { name: 'Quitilipi', lat: -26.8711, lon: -60.2158, radius: 0.06 },
  { name: 'Tres Isletas', lat: -26.3408, lon: -60.4319, radius: 0.06 },
  { name: 'Presidencia de la Plaza', lat: -27.0014, lon: -59.7719, radius: 0.05 },
  { name: 'General Pinedo', lat: -27.3242, lon: -61.2789, radius: 0.06 },
  { name: 'La Leonesa', lat: -27.0375, lon: -58.7042, radius: 0.05 },
  { name: 'Las Palmas', lat: -27.0542, lon: -58.6811, radius: 0.05 },
  { name: 'Corzuela', lat: -26.9536, lon: -60.9697, radius: 0.05 },
  { name: 'Santa Sylvina', lat: -27.8333, lon: -61.1333, radius: 0.05 },
  { name: 'Campo Largo', lat: -26.8000, lon: -60.7667, radius: 0.05 },
  { name: 'Hermoso Campo', lat: -27.6083, lon: -61.3444, radius: 0.05 }
];

function findCity(lat, lon, addrCity) {
  if (addrCity && addrCity.trim()) return addrCity.trim();
  if (!lat || !lon) return 'Resistencia';
  
  let bestCity = 'Chaco';
  let minDistance = 999;
  
  for (const c of CHACO_CITIES) {
    const d = Math.sqrt(Math.pow(lat - c.lat, 2) + Math.pow(lon - c.lon, 2));
    if (d < c.radius && d < minDistance) {
      minDistance = d;
      bestCity = c.name;
    }
  }
  return bestCity;
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
  if (tags.office) return `Estudio & Oficina (${tags.office})`;
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

function appendLeadsToWebhook(leadsBatch) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      hoja: 'sin_sitio_web',
      leads: leadsBatch
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
          resolve({ raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const rawElements = JSON.parse(fs.readFileSync('/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chaco_osm_raw.json', 'utf8'));
  
  // Agrupar candidatos por ciudad
  const byCity = {};
  const seenNames = new Set();
  
  for (const el of rawElements) {
    const tags = el.tags || {};
    const name = tags.name || tags['name:es'] || '';
    if (!name || name.length < 3) continue;
    if (seenNames.has(name.toLowerCase())) continue;
    if (/banco|municipalidad|policia|escuela|colegio|iglesia|cajero|hospital|caps/i.test(name)) continue;
    
    const lat = el.lat || (el.center ? el.center.lat : 0);
    const lon = el.lon || (el.center ? el.center.lon : 0);
    const city = findCity(lat, lon, tags['addr:city'] || tags['is_in:city']);
    
    const website = tags.website || tags['contact:website'] || '';
    if (website) continue; // Solo negocios sin sitio web
    
    seenNames.add(name.toLowerCase());
    if (!byCity[city]) byCity[city] = [];
    
    const category = mapCategory(tags);
    const street = tags['addr:street'] || '';
    const housenumber = tags['addr:housenumber'] || '';
    const address = street ? `${street} ${housenumber}`.trim() : (tags['addr:full'] || '');
    const mapsUrl = lat && lon ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', ' + city + ', Chaco')}` : '';

    byCity[city].push({
      nombre: name,
      rubro: category,
      dolor: getDolorPorRubro(category),
      ciudad: city,
      direccion: address,
      maps_url: mapsUrl,
      phone_raw: tags.phone || tags['contact:phone'] || tags['contact:whatsapp'] || tags['contact:mobile'] || ''
    });
  }
  
  console.log('Distribución de comercios por localidad en Chaco:');
  const selectedPool = [];
  
  // Tomar hasta 25 por localidad para tener cobertura de todo Chaco
  for (const [cityName, list] of Object.entries(byCity)) {
    console.log(`- ${cityName}: ${list.length} comercios`);
    const takeCount = Math.min(list.length, 30);
    for (let i = 0; i < takeCount; i++) {
      selectedPool.push(list[i]);
    }
  }
  
  console.log(`\nTotal comercios seleccionados para Chaco: ${selectedPool.length}`);
  
  // Validar unicamente telefonos reales de OSM -- ya NO se inventan numeros.
  // Un numero fabricado pasa el chequeo de formato igual que uno real, asi
  // que la unica forma segura de no contactar contactos falsos es no inventarlos.
  const rawPhoneList = selectedPool.map((item) => item.phone_raw || '');

  console.log('Validando lote con NumValidate...');
  const validations = await validateBatch(rawPhoneList);
  console.log(`Validaciones retornadas: ${validations.length}`);

  const finalLeads = [];
  for (let i = 0; i < selectedPool.length; i++) {
    const item = selectedPool[i];
    const tieneTelefono = !!item.phone_raw;
    const val = validations[i] || {};
    const cleanPhone = tieneTelefono ? (val.whatsapp_format || rawPhoneList[i].replace(/\D/g, '')) : '';
    const displayPhone = cleanPhone ? (val.international_format || `+${cleanPhone}`) : '';

    finalLeads.push({
      'Nombre del Negocio / Emprendimiento': item.nombre,
      'Categoría / Rubro': item.rubro,
      'Ciudad': item.ciudad,
      'País': 'AR',
      'Teléfono': displayPhone,
      'WhatsApp Directo': cleanPhone ? `https://wa.me/${cleanPhone}` : '🔎 Verificar telefono manualmente',
      'Sitio Web': '',
      'Dolor Principal': item.dolor,
      'Oportunidad Comercial': '💻 Desarrollo Web + Chatbot WhatsApp',
      'Dirección': item.direccion,
      'Google Maps': item.maps_url,
      'Estado de Venta': cleanPhone ? '🟢 Nuevo' : '🔎 Verificar telefono'
    });
  }
  
  fs.writeFileSync('/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chaco_balanced_leads.json', JSON.stringify(finalLeads, null, 2));
  
  console.log(`Subiendo ${finalLeads.length} leads balanceados de Chaco a Google Sheets...`);
  const batchSize = 50;
  for (let i = 0; i < finalLeads.length; i += batchSize) {
    const chunk = finalLeads.slice(i, i + batchSize);
    console.log(`Subiendo bloque ${Math.floor(i / batchSize) + 1} (${chunk.length} leads)...`);
    await appendLeadsToWebhook(chunk);
  }
  
  console.log('¡Completado con éxito!');
}

main().catch(console.error);

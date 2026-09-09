const fs = require('fs');
const https = require('https');
const { validatePhoneNumber } = require('./numvalidate-service');

const WEBHOOK_APPEND = 'https://n8n.santiagowuerich.info/webhook/prospeccion-append-leads';
const INPUT_CSV = '/Users/santi/Downloads/n8n-automatizaciones/chile_overture_leads.csv';

// Traduce el rubro de Overture (ingles, snake_case) al mismo estilo de
// "Categoria / Rubro" que ya usan las hojas de Chaco/NEA.
const RUBRO_MAP = {
  restaurant: 'Gastronomía & Restaurantes',
  fast_food_restaurant: 'Gastronomía & Restaurantes',
  sushi_restaurant: 'Gastronomía & Restaurantes',
  peruvian_restaurant: 'Gastronomía & Restaurantes',
  seafood_restaurant: 'Gastronomía & Restaurantes',
  chinese_restaurant: 'Gastronomía & Restaurantes',
  pizza_restaurant: 'Gastronomía & Restaurantes',
  italian_restaurant: 'Gastronomía & Restaurantes',
  mexican_restaurant: 'Gastronomía & Restaurantes',
  cafe: 'Cafetería & Pastelería',
  bakery: 'Pastelería & Panadería Artesanal',
  ice_cream_shop: 'Heladería & Postres',
  bar: 'Bar & Cervecería Artesanal',
  pub: 'Bar & Cervecería Artesanal',
  beauty_salon: 'Estética, Peluquería & Barbería',
  hair_salon: 'Estética, Peluquería & Barbería',
  barber: 'Estética, Peluquería & Barbería',
  nail_salon: 'Estética, Peluquería & Barbería',
  spas: 'Estética, Peluquería & Barbería',
  spa: 'Estética, Peluquería & Barbería',
  gym: 'Gimnasio & Centro Deportivo',
  dentist: 'Clínica & Consultorios Médicos',
  veterinarian: 'Veterinaria & Pet Shop',
  pet_store: 'Veterinaria & Pet Shop',
  clothing_store: 'Indumentaria & Showroom',
  shoe_store: 'Calzado & Marroquinería',
  jewelry_store: 'Joyería & Accesorios',
  florist: 'Florería & Ambientación',
  flowers_and_gifts_shop: 'Florería & Ambientación',
  furniture_store: 'Muebles & Decoración del Hogar',
  hardware_store: 'Ferretería & Construcción',
  automotive_repair: 'Taller Mecánico & Repuestos Automotor',
  car_dealer: 'Concesionaria & Venta de Vehículos',
  grocery_store: 'Comercio & Distribución Local',
  convenience_store: 'Comercio & Distribución Local',
  professional_services: 'Estudio & Servicios Profesionales',
  nursery_and_gardening: 'Vivero & Jardinería',
  hostel: 'Hotelería & Alojamiento Turístico'
};

function getDolorPorRubro(rubro) {
  const r = (rubro || '').toLowerCase();
  if (r.includes('pasteler') || r.includes('cafeter') || r.includes('heladeria') || r.includes('postres')) {
    return 'Demora respondiendo precios/sabores y toma manual de pedidos por chat.';
  }
  if (r.includes('indumentaria') || r.includes('showroom') || r.includes('calzado') || r.includes('joyer')) {
    return 'Pérdida de tiempo enviando fotos y consultando talles/stock sin catálogo online.';
  }
  if (r.includes('estética') || r.includes('peluquer') || r.includes('barber')) {
    return 'Ausentismo a turnos y saturación de agenda por coordinar citas manualmente.';
  }
  if (r.includes('muebl') || r.includes('deco') || r.includes('ferreter') || r.includes('vivero') || r.includes('jardin')) {
    return 'Cotizaciones lentas por WhatsApp y falta de catálogo con medidas/materiales.';
  }
  if (r.includes('gastronom') || r.includes('restaurant') || r.includes('bar') || r.includes('cervecer')) {
    return 'Comisiones altas de apps de delivery y cuellos de botella tomando pedidos a mano.';
  }
  if (r.includes('taller') || r.includes('automot') || r.includes('concesionaria')) {
    return 'Falta de seguimiento automático de presupuestos y demoras informando reparaciones.';
  }
  if (r.includes('comercio') || r.includes('distribuci')) {
    return 'Errores al tomar pedidos por texto/audio y listas de precios desactualizadas.';
  }
  if (r.includes('veterinaria') || r.includes('pet shop')) {
    return 'Demoras en confirmación de turnos y consultas repetitivas sobre stock/coberturas.';
  }
  if (r.includes('gimnasio') || r.includes('deportivo')) {
    return 'Altas y renovaciones de socios a mano, sin recordatorios automáticos de clase o pago.';
  }
  if (r.includes('estudio') || r.includes('servicios profesionales')) {
    return 'Coordinación de reuniones y seguimiento de clientes a mano, sin agenda online.';
  }
  if (r.includes('hoteler') || r.includes('alojamiento')) {
    return 'Reservas y consultas de disponibilidad manuales, sin calendario online centralizado.';
  }
  return 'Pérdida de ventas por respuestas lentas en WhatsApp y falta de presencia web profesional.';
}

function parseCSVLine(line) {
  // CSV simple con comillas dobles (formato que exporta DuckDB con HEADER)
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function loadCsv(path) {
  const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/).filter((l) => l.length > 0);
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] || ''; });
    rows.push(obj);
  }
  return rows;
}

// Se valida LOCAL con la misma funcion que usa numvalidate-service, importada
// directo desde su index.js. Antes esto iba por HTTP al servidor remoto: si el
// servicio estaba caido, el script reportaba "0 numeros validos" -- un falso
// negativo indistinguible de un resultado real. Sin red no hay falla que
// disfrazar, y ademas es mucho mas rapido para 20k+ numeros.
function validateBatch(numbers) {
  return numbers.map((n) => validatePhoneNumber(n, 'CL'));
}

function appendBatch(valuesChunk) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ values: valuesChunk });
    const url = new URL(WEBHOOK_APPEND);
    const options = {
      hostname: url.hostname, port: 443, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) },
      rejectUnauthorized: false
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { resolve({ raw: body, status: res.statusCode }); } });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const raw = loadCsv(INPUT_CSV);
  console.log(`Leído ${raw.length} filas crudas de Overture Maps para Chile.`);

  // Dedupe por nombre+ciudad (mismo criterio que Chaco/NEA)
  const seen = new Set();
  const candidates = [];
  for (const r of raw) {
    const key = (r.nombre + '|' + r.ciudad).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(r);
  }
  console.log(`Después de deduplicar: ${candidates.length} negocios únicos.`);

  console.log(`Validando ${candidates.length} teléfonos localmente...`);
  const results = validateBatch(candidates.map((c) => c.telefono_raw));
  const validados = candidates.map((item, i) => ({ item, val: results[i] || {} }));

  // Solo se sube lo que es un celular real y valido -- para WhatsApp no sirve
  // un fijo, y no se inventa nada para completar el resto.
  const finalRows = [];
  for (const { item, val } of validados) {
    if (!val.valid || !val.is_mobile) continue;
    const cleanPhone = val.whatsapp_format;
    const rubro = RUBRO_MAP[item.rubro_overture] || 'Comercio Local';
    finalRows.push([
      item.nombre,
      rubro,
      item.ciudad || item.region || '',
      'CL',
      val.international_format || `+${cleanPhone}`,
      `https://wa.me/${cleanPhone}`,
      '',
      getDolorPorRubro(rubro),
      '💻 Desarrollo Web + Chatbot WhatsApp',
      item.direccion,
      '',
      '🟢 Nuevo'
    ]);
  }

  console.log(`\nResumen: ${candidates.length} negocios únicos -- ${finalRows.length} con celular real validado (${(finalRows.length / candidates.length * 100).toFixed(1)}%).`);

  if (process.env.DRY_RUN === '1') {
    const previewPath = '/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/chile_overture_preview.json';
    fs.writeFileSync(previewPath, JSON.stringify(finalRows.slice(0, 50), null, 2));
    console.log(`DRY_RUN=1: no se subió nada. Vista previa (50 primeras) guardada en ${previewPath}`);
    return;
  }

  const cap = process.env.MAX_UPLOAD ? parseInt(process.env.MAX_UPLOAD, 10) : finalRows.length;
  const rowsToUpload = finalRows.slice(0, cap);

  console.log(`Subiendo ${rowsToUpload.length} filas a Google Sheets en lotes de 1000...`);
  const batchSize = 1000;
  for (let i = 0; i < rowsToUpload.length; i += batchSize) {
    const chunk = rowsToUpload.slice(i, i + batchSize);
    console.log(`Subiendo lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(rowsToUpload.length / batchSize)} (${chunk.length} filas)...`);
    await appendBatch(chunk);
    await sleep(500);
  }

  console.log('¡Listo! Prospectos de Chile (Overture Maps) cargados a Google Sheets.');
}

main().catch(console.error);

const fs = require('fs');
const https = require('https');
const { getEnvironmentConfig } = require('../../../tools/config.js');
const config = getEnvironmentConfig('dev');

const workflow = {
  name: 'Prospector B2B — Scanner Instagram & WhatsApp (Sin Sitio Web)',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'prospeccion-instagram-osm',
        responseMode: 'responseNode',
        options: {}
      },
      name: 'Webhook Manual',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [240, 260],
      id: 'node-webhook-manual',
      webhookId: 'prospeccion-instagram-osm'
    },
    {
      parameters: {
        rule: {
          interval: [
            {
              field: 'minutes',
              minutesInterval: 5
            }
          ]
        }
      },
      name: 'Cron Cada 5 Minutos',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.1,
      position: [240, 460],
      id: 'node-cron-schedule'
    },
    {
      parameters: {
        jsCode: `// Configuración de Regiones Rotativas de Hispanoamérica (Rotación cada 5 minutos)
let body = {};
try {
  body = $('Webhook Manual').first()?.json?.body || {};
} catch(e) {}

const REGIONES = [
  { nombre: "Resistencia & Gran Resistencia", bbox: "-27.52,-59.05,-27.40,-58.90", pais: "AR" },
  { nombre: "Corrientes Capital", bbox: "-27.52,-58.88,-27.44,-58.75", pais: "AR" },
  { nombre: "Posadas & Garupá", bbox: "-27.45,-55.98,-27.35,-55.85", pais: "AR" },
  { nombre: "Formosa Capital", bbox: "-26.22,-57.75,-26.15,-57.65", pais: "AR" },
  { nombre: "Rosario Centro & Norte", bbox: "-33.00,-60.72,-32.90,-60.62", pais: "AR" },
  { nombre: "Santa Fe Capital", bbox: "-31.68,-60.75,-31.58,-60.65", pais: "AR" },
  { nombre: "Córdoba Capital Centro & Nueva Córdoba", bbox: "-31.45,-64.25,-31.38,-64.15", pais: "AR" },
  { nombre: "Córdoba Norte & Cerro de las Rosas", bbox: "-31.40,-64.28,-31.33,-64.18", pais: "AR" },
  { nombre: "CABA Palermo & Belgrano", bbox: "-34.59,-58.46,-34.54,-58.40", pais: "AR" },
  { nombre: "CABA Recoleta & Microcentro", bbox: "-34.61,-58.40,-34.57,-58.36", pais: "AR" },
  { nombre: "CABA Caballito & Flores", bbox: "-34.64,-58.47,-34.61,-58.42", pais: "AR" },
  { nombre: "GBA Norte (San Isidro & Vicente López)", bbox: "-34.53,-58.55,-34.45,-58.48", pais: "AR" },
  { nombre: "GBA Oeste (Ramos Mejía & Morón)", bbox: "-34.67,-58.62,-34.63,-58.54", pais: "AR" },
  { nombre: "GBA Sur (Quilmes & Lomas de Zamora)", bbox: "-34.78,-58.42,-34.70,-58.25", pais: "AR" },
  { nombre: "Mar del Plata", bbox: "-38.05,-57.60,-37.95,-57.50", pais: "AR" },
  { nombre: "Mendoza Capital & Godoy Cruz", bbox: "-32.93,-68.88,-32.86,-68.80", pais: "AR" },
  { nombre: "San Juan Capital", bbox: "-31.56,-68.56,-31.50,-68.48", pais: "AR" },
  { nombre: "Salta Capital", bbox: "-24.83,-65.45,-24.75,-65.38", pais: "AR" },
  { nombre: "San Miguel de Tucumán", bbox: "-26.85,-65.25,-26.78,-65.18", pais: "AR" },
  { nombre: "Neuquén Capital & Cipolletti", bbox: "-38.98,-68.12,-38.92,-67.98", pais: "AR" },
  { nombre: "Bariloche", bbox: "-41.16,-71.35,-41.11,-71.25", pais: "AR" },
  { nombre: "Bahía Blanca", bbox: "-38.75,-62.30,-38.68,-62.22", pais: "AR" },
  { nombre: "Santiago de Chile (Providencia & Las Condes)", bbox: "-33.44,-70.62,-33.38,-70.52", pais: "CL" },
  { nombre: "Santiago de Chile (Santiago Centro)", bbox: "-33.47,-70.68,-33.42,-70.63", pais: "CL" },
  { nombre: "Viña del Mar & Valparaíso", bbox: "-33.05,-71.64,-32.98,-71.50", pais: "CL" },
  { nombre: "Montevideo (Pocitos & Punta Carretas)", bbox: "-34.93,-56.17,-34.89,-56.12", pais: "UY" },
  { nombre: "Asunción del Paraguay", bbox: "-25.32,-57.63,-25.25,-57.54", pais: "PY" }
];

let region;
if (body.bbox) {
  region = { nombre: body.nombre || "Personalizada", bbox: body.bbox, pais: body.pais || "AR" };
} else if (body.region_index !== undefined && REGIONES[body.region_index]) {
  region = REGIONES[body.region_index];
} else {
  // Rotación cada 5 minutos
  const idx = Math.floor(Date.now() / (1000 * 60 * 5)) % REGIONES.length;
  region = REGIONES[idx];
}

const [south, west, north, east] = region.bbox.split(',');

const query = \`
[out:json][timeout:45];
(
  node["shop"](\${south},\${west},\${north},\${east});
  node["amenity"~"restaurant|cafe|bar|clinic|dentist|pharmacy|beauty|hairdresser|veterinary"](\${south},\${west},\${north},\${east});
  node["craft"](\${south},\${west},\${north},\${east});
  way["shop"](\${south},\${west},\${north},\${east});
  way["amenity"~"restaurant|cafe|bar|clinic|dentist|pharmacy|beauty|hairdresser|veterinary"](\${south},\${west},\${north},\${east});
);
out center tags;
\`;

return [{
  json: {
    region: region.nombre,
    pais: region.pais,
    overpassBody: 'data=' + encodeURIComponent(query.trim()),
    es_webhook: !!body.bbox || !!body.region_index || Object.keys(body).length > 0
  }
}];`
      },
      name: 'Configurar Región y Query',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [480, 360],
      id: 'node-config-region'
    },
    {
      parameters: {
        method: 'POST',
        url: 'https://overpass-api.de/api/interpreter',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: 'User-Agent',
              value: 'SantiagoInstagramProspector/1.0 (contact@santiagowuerich.info)'
            },
            {
              name: 'Accept',
              value: 'application/json'
            },
            {
              name: 'Content-Type',
              value: 'application/x-www-form-urlencoded'
            }
          ]
        },
        sendBody: true,
        specifyBody: 'string',
        body: '={{ $json.overpassBody }}',
        options: {
          timeout: 45000
        }
      },
      name: 'Fuente: Overpass OSM Universal',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [700, 360],
      id: 'node-fetch-osm'
    },
    {
      parameters: {
        jsCode: `const data = $input.first().json;
const elements = data.elements || [];
const meta = $('Configurar Región y Query').first().json;

const leads = [];
const seen = new Set();

const RUBROS_MAP = {
  clothes: 'Indumentaria & Moda',
  boutique: 'Boutique & Ropa',
  shoes: 'Calzado',
  beauty: 'Estética & Belleza',
  hairdresser: 'Peluquería / Barbería',
  restaurant: 'Gastronomía & Restaurante',
  cafe: 'Cafetería / Pastelería',
  bakery: 'Panadería & Repostería',
  furniture: 'Mueblería & Decoración',
  hardware: 'Ferretería & Materiales',
  electronics: 'Tecnología & Electrónica',
  optician: 'Óptica',
  clinic: 'Clínica / Centro Médico',
  dentist: 'Odontología',
  veterinary: 'Veterinaria & Pet Shop',
  car_repair: 'Taller Mecánico & Repuestos',
  gym: 'Gimnasio & Fitness'
};

for (const el of elements) {
  const t = el.tags || {};
  const nombre = (t.name || t.brand || '').trim();
  if (!nombre || nombre.length < 3) continue;

  let rawIg = (t['contact:instagram'] || t['instagram'] || '').trim();
  if (!rawIg && t['website'] && t['website'].includes('instagram.com')) {
    rawIg = t['website'];
  }

  let rawPhone = (t['contact:whatsapp'] || t['phone'] || t['contact:phone'] || '').trim();

  // Si no tiene Instagram ni teléfono, no es contactable
  if (!rawIg && !rawPhone) continue;

  let handle = '';
  if (rawIg) {
    const igMatch = rawIg.match(/instagram\\.com\\/([a-zA-Z0-9_\\.]{3,30})/i);
    if (igMatch) {
      handle = igMatch[1];
    } else {
      handle = rawIg.replace(/^@/, '').replace(/[^a-zA-Z0-9_\\.]/g, '');
    }
  }

  const igUrl = handle ? ('https://www.instagram.com/' + handle) : '';
  const website = (t.website || '').trim();
  const tieneWeb = website && !website.includes('instagram.com') && !website.includes('facebook.com') && !website.includes('linktr.ee');

  // Si no tiene web, es el lead perfecto para venderle sistema de gestión / e-commerce
  const dolor = tieneWeb 
    ? 'Atención manual por Instagram/WhatsApp sin integración con su sistema.'
    : 'No cuenta con sitio web ni sistema automatizado de pedidos; gestión 100% manual por chat.';

  const solucion = tieneWeb
    ? '💻 Chatbot Inteligente WhatsApp + Integración con su sistema.'
    : '🚀 Sistema Web / Catálogo E-Commerce + Gestión de Pedidos por WhatsApp.';

  const tipo = t.shop || t.amenity || t.craft || t.office || 'comercio';
  const rubroFinal = RUBROS_MAP[tipo] || (tipo.charAt(0).toUpperCase() + tipo.slice(1));
  const ciudad = t['addr:city'] || meta.region;

  const key = (handle || nombre).toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);

  // Parsear número limpio de WhatsApp
  let cleanPhone = rawPhone.replace(/\\D/g, '');
  let linkWa = '';
  let displayPhone = '';

  if (cleanPhone && cleanPhone.length >= 8) {
    if (meta.pais === 'AR') {
      if (cleanPhone.startsWith('54') && !cleanPhone.startsWith('549')) {
        cleanPhone = '549' + cleanPhone.slice(2);
      } else if (!cleanPhone.startsWith('54')) {
        cleanPhone = '549' + cleanPhone;
      }
    } else if (meta.pais === 'CL' && !cleanPhone.startsWith('56')) {
      cleanPhone = '56' + cleanPhone;
    }
    displayPhone = '+' + cleanPhone;
    linkWa = 'https://wa.me/' + cleanPhone;
  }

  leads.push({
    'Nombre del Negocio': nombre,
    'Categoría / Rubro': rubroFinal,
    'Ciudad': ciudad,
    'País': meta.pais,
    'Teléfono WhatsApp': displayPhone || '-',
    'Link WhatsApp': linkWa || '-',
    'Instagram URL': igUrl || '-',
    'Dolor Detectado': dolor,
    'Solución Propuesta': solucion,
    'Handle Instagram': handle ? ('@' + handle) : '-',
    'Tiene Sitio Web': tieneWeb ? 'Sí' : 'No',
    'Estado': '🟢 Nuevo'
  });
}

return leads.map(l => ({ json: l }));`
      },
      name: 'Filtrar y Enriquecer Leads',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [920, 360],
      id: 'node-process-leads'
    },
    {
      parameters: {
        operation: 'append',
        documentId: {
          '__rl': true,
          'value': 'https://docs.google.com/spreadsheets/d/1pteXQKBYKCVewqTguWzcYm-G7cEyQVRIIUzEXkcwJi4/edit',
          'mode': 'url'
        },
        sheetName: {
          '__rl': true,
          'value': 'leads_instagram',
          'mode': 'name'
        },
        columns: {
          mappingMode: 'autoMapInputData'
        },
        options: {}
      },
      name: 'Cargar en Google Sheets',
      type: 'n8n-nodes-base.googleSheets',
      typeVersion: 4.5,
      position: [1140, 360],
      id: 'node-append-sheets',
      credentials: {
        googleSheetsOAuth2Api: {
          id: 'vB1bfFFyDiA59OJt',
          name: 'Wuerich'
        }
      }
    },
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: '',
            typeValidation: 'strict'
          },
          conditions: [
            {
              id: 'cond-es-webhook',
              leftValue: "={{ $('Configurar Región y Query').first().json.es_webhook }}",
              rightValue: true,
              operator: {
                type: 'boolean',
                operation: 'equals'
              }
            }
          ],
          combinator: 'and'
        }
      },
      name: 'IF Disparado por Webhook',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [1360, 360],
      id: 'node-if-webhook'
    },
    {
      parameters: {
        respondWith: 'allIncomingItems',
        options: {}
      },
      name: 'Responder Webhook',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1.1,
      position: [1580, 260],
      id: 'node-respond-webhook'
    }
  ],
  connections: {
    'Webhook Manual': {
      main: [
        [
          {
            node: 'Configurar Región y Query',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Cron Cada 5 Minutos': {
      main: [
        [
          {
            node: 'Configurar Región y Query',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Configurar Región y Query': {
      main: [
        [
          {
            node: 'Fuente: Overpass OSM Universal',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Fuente: Overpass OSM Universal': {
      main: [
        [
          {
            node: 'Filtrar y Enriquecer Leads',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Filtrar y Enriquecer Leads': {
      main: [
        [
          {
            node: 'Cargar en Google Sheets',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Cargar en Google Sheets': {
      main: [
        [
          {
            node: 'IF Disparado por Webhook',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'IF Disparado por Webhook': {
      main: [
        [
          {
            node: 'Responder Webhook',
            type: 'main',
            index: 0
          }
        ],
        []
      ]
    }
  },
  settings: {
    executionOrder: 'v1'
  }
};

const payload = JSON.stringify({
  name: workflow.name,
  nodes: workflow.nodes,
  connections: workflow.connections,
  settings: workflow.settings
});

const url = new URL(config.baseUrl + '/workflows/qRwL0GY9SQLfCUso');
const req = https.request({
  hostname: url.hostname,
  path: url.pathname,
  method: 'PUT',
  headers: {
    'X-N8N-API-KEY': config.apiKey,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const resJson = JSON.parse(body);
    console.log('Updated WF in santiagowuerich.info:', resJson.name, '| ID:', resJson.id);
  });
});

req.on('error', console.error);
req.write(payload);
req.end();

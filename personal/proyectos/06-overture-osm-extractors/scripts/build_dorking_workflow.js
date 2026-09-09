const fs = require('fs');

const workflow = {
  name: 'Prospeccion - Google Dorking Instagram & TikTok a Sheets',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'prospeccion-dorking-instagram',
        responseMode: 'responseNode',
        options: {}
      },
      name: 'Webhook Manual Dorking',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [240, 300],
      id: 'node-webhook-dorking'
    },
    {
      parameters: {
        rule: {
          interval: [
            {
              field: 'hours',
              hoursInterval: 12
            }
          ]
        }
      },
      name: 'Cron Cada 12 Horas',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.1,
      position: [240, 500],
      id: 'node-cron-dorking'
    },
    {
      parameters: {
        jsCode: `const body = $('Webhook Manual Dorking').first()?.json?.body || {};
const provincia = body.provincia || body.ciudad || 'Chaco';
const rubros = body.rubros || ['showroom', 'indumentaria', 'pasteleria', 'estetica', 'muebleria', 'taller', 'gastronomia'];

const queries = [];
for (const r of rubros) {
  queries.push({
    query: \`site:instagram.com "wa.me/549" "\${provincia}" "\${r}"\`,
    provincia,
    rubro: r
  });
  queries.push({
    query: \`site:linktr.ee "wa.me/549" "\${provincia}" "\${r}"\`,
    provincia,
    rubro: r
  });
}

return queries.map(q => ({ json: q }));`
      },
      name: 'Generar Dorking Queries',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [480, 400],
      id: 'node-generate-queries'
    },
    {
      parameters: {
        url: '=https://html.duckduckgo.com/html/?q={{ encodeURIComponent($json.query) }}',
        options: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
          }
        }
      },
      name: 'Buscar en Motor SERP',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.1,
      position: [700, 400],
      id: 'node-fetch-serp'
    },
    {
      parameters: {
        jsCode: `const allItems = $input.all();
const extracted = [];
const seenHandles = new Set();

for (const item of allItems) {
  const html = item.json.data || item.json.body || '';
  const queryMeta = $('Generar Dorking Queries').itemMatching(item.itemIndex)?.json || {};
  
  if (typeof html !== 'string') continue;
  
  const igRegex = /instagram\\.com\\/([a-zA-Z0-9_\\.]{3,30})/gi;
  let igMatch;
  while ((igMatch = igRegex.exec(html)) !== null) {
    const handle = igMatch[1].toLowerCase();
    if (['p', 'reel', 'explore', 'about', 'accounts', 'directory', 'stories', 'tv'].includes(handle)) continue;
    if (seenHandles.has(handle)) continue;
    seenHandles.add(handle);
    
    const waRegex = /(?:wa\\.me\\/|whatsapp\\.com\\/send\\?phone=)(\\d{10,14})/gi;
    let waMatch = waRegex.exec(html);
    let rawPhone = waMatch ? waMatch[1] : '';
    
    if (!rawPhone) {
      const telRegex = /(?:\\+?54\\s*9?\\s*)?(?:362|379|370|376|299|297|11|351|341)\\s*\\d{3,4}[-\\s]?\\d{4}/gi;
      const telMatch = telRegex.exec(html);
      if (telMatch) rawPhone = telMatch[0];
    }
    
    const cleanNombre = handle.replace(/[._]/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase());
    
    extracted.push({
      nombre: cleanNombre,
      handle: '@' + handle,
      instagram_url: 'https://www.instagram.com/' + handle,
      rubro: queryMeta.rubro || 'Comercio & Redes',
      ciudad: queryMeta.provincia || 'Chaco',
      pais: 'AR',
      telefono_raw: rawPhone || '',
      fuente: 'Google Dorking Instagram'
    });
  }
}

return [{ json: { total_encontrados: extracted.length, leads: extracted } }];`
      },
      name: 'Extraer Handles y Telefonos',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [920, 400],
      id: 'node-parse-dorking'
    },
    {
      parameters: {
        method: 'POST',
        url: '=http://numvalidate:8080/validate-batch',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify({ items: $json.leads, country: "AR", filter_invalid: false }) }}',
        options: {}
      },
      name: 'Validar con NumValidate',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.1,
      position: [1140, 400],
      id: 'node-numvalidate-dork'
    },
    {
      parameters: {
        jsCode: `const res = $input.first().json;
const items = res.items || [];
const rows = [];

for (const item of items) {
  const v = item._validation || {};
  const cleanPhone = v.whatsapp_format || (item.telefono_raw || '').replace(/\\D/g, '');
  if (!cleanPhone || cleanPhone.length < 8) continue;
  
  const displayPhone = v.international_format || ('+' + cleanPhone);
  
  rows.push([
    item.nombre,
    item.rubro,
    item.ciudad,
    'AR',
    displayPhone,
    \`https://wa.me/\${cleanPhone}\`,
    item.instagram_url,
    'Pérdida de ventas por respuestas lentas en Instagram/WhatsApp.',
    '💻 Desarrollo Web + Chatbot WhatsApp Automatizado',
    item.handle,
    item.instagram_url,
    '🟢 Nuevo'
  ]);
}

return [{
  json: {
    ok: true,
    total_procesados: rows.length,
    values: rows
  }
}];`
      },
      name: 'Formatear para Google Sheets',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [1360, 400],
      id: 'node-format-sheets'
    },
    {
      parameters: {
        method: 'POST',
        url: 'https://sheets.googleapis.com/v4/spreadsheets/1pteXQKBYKCVewqTguWzcYm-G7cEyQVRIIUzEXkcwJi4/values/social_media!A:L:append?valueInputOption=RAW',
        authentication: 'predefinedCredentialType',
        nodeCredentialType: 'googleSheetsOAuth2Api',
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify({ values: $json.values }) }}',
        options: {}
      },
      id: 'node-append-social-sheets',
      name: 'Append a social_media',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [1580, 400],
      credentials: {
        googleSheetsOAuth2Api: {
          id: 'vB1bfFFyDiA59OJt',
          name: 'Wuerich'
        }
      }
    },
    {
      parameters: {
        respondWith: 'allIncomingItems',
        options: {}
      },
      name: 'Responder Webhook',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1,
      position: [1800, 400],
      id: 'node-resp-dork'
    }
  ],
  connections: {
    'Webhook Manual Dorking': {
      main: [
        [
          {
            node: 'Generar Dorking Queries',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Cron Cada 12 Horas': {
      main: [
        [
          {
            node: 'Generar Dorking Queries',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Generar Dorking Queries': {
      main: [
        [
          {
            node: 'Buscar en Motor SERP',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Buscar en Motor SERP': {
      main: [
        [
          {
            node: 'Extraer Handles y Telefonos',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Extraer Handles y Telefonos': {
      main: [
        [
          {
            node: 'Validar con NumValidate',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Validar con NumValidate': {
      main: [
        [
          {
            node: 'Formatear para Google Sheets',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Formatear para Google Sheets': {
      main: [
        [
          {
            node: 'Append a social_media',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Append a social_media': {
      main: [
        [
          {
            node: 'Responder Webhook',
            type: 'main',
            index: 0
          }
        ]
      ]
    }
  },
  settings: {
    executionOrder: 'v1'
  }
};

fs.writeFileSync('/Users/santi/.gemini/antigravity-ide/brain/e23bfcb1-03cf-46e1-adee-73457ec8e50f/scratch/dorking_wf_payload.json', JSON.stringify(workflow, null, 2));
console.log('Workflow JSON created successfully');

// Banco de pruebas del WF1 (envio) tras sacar Notion y pasar a la hoja.
//
// 'Filtrar elegibles y armar tanda' es el nodo mas peligroso del proyecto:
// decide A QUIEN se le manda un WhatsApp. Un bug aca no tira un error, manda
// un mensaje a la persona equivocada. Por eso corre contra el CSV REAL del
// piloto, no contra datos sinteticos.
const fs = require('fs');
const BASE = '/Users/santi/Downloads/marketplace-helper/n8n-automatizaciones/clientes/xtract/proyectos/04-reactivacion-closed-lost/';
const F = BASE + 'workflows/Closed Lost WhatsApp — 1. Envío vía Chatwoot.json';
const w = JSON.parse(fs.readFileSync(F, 'utf8'));
const src = nm => w.nodes.find(n => n.name === nm).parameters.jsCode;

const CONFIG = eval('(function(){' + src('Config') + '})()')[0].json;

let ok = 0, fail = 0;
const check = (nombre, cond, extra) => {
  if (cond) { ok++; console.log('  ok   ' + nombre); }
  else { fail++; console.log('  FALLA ' + nombre + (extra ? '  -> ' + extra : '')); }
};

// ---------- CSV con comillas ----------
function parseCSV(txt) {
  const filas = []; let campo = '', fila = [], q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) {
      if (c === '"' && txt[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') q = false;
      else campo += c;
    } else if (c === '"') q = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const h = filas.shift();
  return filas.filter(f => f.length === h.length)
    .map(f => Object.fromEntries(h.map((k, i) => [k, f[i]])));
}

const LEADS = parseCSV(fs.readFileSync(BASE + 'datos/piloto_whatsapp_listo.csv', 'utf8'));

// ---------- runner ----------
function filtrar({ leads = LEADS, enviados = null, config = {} } = {}) {
  const cfg = Object.assign({}, CONFIG, config);
  const nodos = {
    Config: { first: () => ({ json: cfg }) },
    'Leer leads del piloto': { all: () => leads.map(json => ({ json })) },
    // enviados = null simula que el nodo no pudo leer la hoja
    'Leer enviados': { all: () => {
      if (enviados === null) throw new Error('referenced node is unexecuted');
      return enviados.map(json => ({ json }));
    } }
  };
  const fn = new Function('$', 'return (function(){' + src('Filtrar elegibles y armar tanda') + '})()');
  return fn(n => nodos[n]);
}

console.log('=== Fuente de datos ===');
check('el CSV del piloto tiene 144 leads', LEADS.length === 144, LEADS.length);
check('ya no queda nada de Notion en el workflow',
  !JSON.stringify(w).includes('Notion - Leer') && !w.nodes.some(n => n.type.includes('notion')));

const R = filtrar();
check('respeta WA_LIMITE_TANDA', R.length === parseInt(CONFIG.WA_LIMITE_TANDA), R.length);
check('todos salen con telefono E.164', R.every(x => /^\+\d{10,15}$/.test(x.json.telefono_e164)));
check('todos traen primer_nombre para la plantilla', R.every(x => x.json.primer_nombre.length > 0));

console.log('\n=== Normalizacion de telefonos ===');
// El 9 argentino es el bug mas caro: sin el, WhatsApp trata el numero como
// fijo y el mensaje NO SE ENTREGA, sin devolver ningun error.
const uno = (tel, pais) => {
  const r = filtrar({ leads: [{ 'Empresa': 'X', 'Contacto': 'Juan Perez', 'Teléfono Normalizado': tel, 'País': pais }], enviados: [] });
  return r.length ? r[0].json.telefono : '';
};
check('argentino sin 9 -> se le inserta', uno('541127129056', 'Argentina') === '5491127129056', uno('541127129056', 'Argentina'));
check('argentino con 9 -> se respeta', uno('5491127129056', 'Argentina') === '5491127129056');
check('uruguayo -> no se le toca', uno('59898276718', 'Uruguay') === '59898276718');
check('local sin prefijo -> se le agrega el del pais', uno('01127129056', 'Argentina') === '5491127129056', uno('01127129056', 'Argentina'));
check('numero muy corto -> se descarta', uno('1234', 'Argentina') === '');
check('sin telefono -> se descarta', uno('', 'Argentina') === '');
// El campo Pais se carga a mano y suele estar mal. Si el numero ya trae un
// prefijo internacional valido, manda el numero, no la columna.
check('prefijo internacional gana sobre un Pais mal cargado',
  uno('59898276718', 'Argentina') === '59898276718');

console.log('\n=== Encabezados de la hoja ===');
// Los encabezados los escribe una persona. normKey los normaliza.
const variantes = [{ 'EMPRESA': 'ACME', 'contacto': 'Ana Diaz', 'telefono_normalizado': '5491127129056', 'pais': 'Argentina' }];
check('tolera mayusculas, snake_case y falta de acentos',
  filtrar({ leads: variantes, enviados: [] }).length === 1);
const conAcento = [{ 'Empresa': 'ACME', 'Contacto': 'Ana Diaz', 'Teléfono Normalizado': '5491127129056', 'País': 'Argentina' }];
check('tolera los acentos del export original',
  filtrar({ leads: conAcento, enviados: [] }).length === 1);

console.log('\n=== Dedupe contra Enviados WA ===');
const dos = R.slice(0, 2).map(x => ({ telefono: x.json.telefono, estado: 'enviado' }));
const r2 = filtrar({ enviados: dos });
check('un lead con estado "enviado" no vuelve a entrar',
  !r2.some(x => dos.some(d => d.telefono === x.json.telefono)));
// Si Meta rechazo la plantilla o hubo rate limit, ese lead TIENE que
// reintentarse. Bloquearlo por un fallo transitorio lo pierde para siempre.
check('un lead con estado "error" SI vuelve a entrar',
  filtrar({ enviados: [{ telefono: R[0].json.telefono, estado: 'error: rate limit' }] })
    .some(x => x.json.telefono === R[0].json.telefono));
check('la hoja con filas repetidas no manda dos veces', (() => {
  const t = filtrar({ leads: LEADS.concat(LEADS), enviados: [] }).map(x => x.json.telefono);
  return new Set(t).size === t.length;
})());
// Si la hoja no existe todavia o Google falla, es preferible mandar la tanda
// que cortarla entera: el peor caso es un duplicado, no 144 leads sin tocar.
check('si no se puede leer Enviados WA, la tanda sigue', filtrar({ enviados: null }).length > 0);

console.log('\n=== Filtro de calificacion ===');
// El CSV del piloto NO trae columna de calificacion: ya viene filtrado a
// Verdes. Filtrar por una columna ausente dejaria la tanda VACIA sin ningun
// error visible -- exactamente la clase de fallo silencioso a evitar.
check('sin columna Calificacion, WA_SOLO_VERDES no vacia la tanda',
  filtrar({ config: { WA_SOLO_VERDES: 'true' } }).length === parseInt(CONFIG.WA_LIMITE_TANDA));
const mixto = [
  { Empresa: 'A', Contacto: 'Ana Diaz', 'Teléfono Normalizado': '5491127129056', 'País': 'Argentina', Calificacion: 'Verde (Mucho match)' },
  { Empresa: 'B', Contacto: 'Beto Diaz', 'Teléfono Normalizado': '5491127129057', 'País': 'Argentina', Calificacion: 'Rojo' }
];
check('con columna Calificacion, filtra los que no son Verde',
  filtrar({ leads: mixto, enviados: [], config: { WA_SOLO_VERDES: 'true' } }).length === 1);
check('con WA_SOLO_VERDES en false, pasan todos',
  filtrar({ leads: mixto, enviados: [], config: { WA_SOLO_VERDES: 'false' } }).length === 2);

console.log('\n=== Loop de envio ===');
const c = w.connections;
const dest = (n, i) => ((c[n] && c[n].main && c[n].main[i]) || []).map(x => x.node);
check('el filtro entrega al loop', dest('Filtrar elegibles y armar tanda', 0).includes('Loop de envio'));
check('el loop manda de a UNO', w.nodes.find(n => n.name === 'Loop de envio').parameters.batchSize === 1);
check('la salida "loop" arranca la cadena de envio',
  dest('Loop de envio', 1).includes('Chatwoot - Buscar contacto'));
check('la salida "done" termina', dest('Loop de envio', 0).length === 0);
// Sin esta arista el loop manda solo el primero y se cuelga.
check('el ciclo se cierra: ultimo -> espera -> loop',
  dest('Chatwoot - Guardar contexto CRM', 0).includes('Esperar entre envios') &&
  dest('Esperar entre envios', 0).includes('Loop de envio'));
// Dentro de un loop, $('Filtro').item puede no resolver el paired item.
check('nadie referencia al filtro desde adentro del loop',
  !w.nodes.filter(n => n.name !== 'Filtrar elegibles y armar tanda')
    .some(n => JSON.stringify(n.parameters).includes("Filtrar elegibles y armar tanda")));

console.log('\n' + (fail ? '❌ ' + fail + ' fallas, ' + ok + ' ok' : '✅ ' + ok + ' pruebas ok'));
process.exit(fail ? 1 : 0);

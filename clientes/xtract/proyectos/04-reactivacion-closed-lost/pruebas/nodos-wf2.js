// Banco de pruebas de los nodos Code de WF2 tras el refactor a tools.
const fs = require('fs');
const F = '/Users/santi/Downloads/marketplace-helper/n8n-automatizaciones/clientes/xtract/proyectos/04-reactivacion-closed-lost/workflows/Closed Lost WhatsApp — 2. Recepción vía Chatwoot.json';
const w = JSON.parse(fs.readFileSync(F, 'utf8'));
const src = nm => w.nodes.find(n => n.name === nm).parameters.jsCode;

const CONFIG = eval('(function(){' + src('Config') + '})()')[0].json;

let ok = 0, fail = 0;
const check = (nombre, cond, extra) => {
  if (cond) { ok++; console.log('  ok   ' + nombre); }
  else { fail++; console.log('  FALLA ' + nombre + (extra ? '  -> ' + extra : '')); }
};

// ---------- runner de 'Preparar Datos Lead' ----------
function preparar({ msgs, meta }) {
  const nodos = {
    Config: { first: () => ({ json: CONFIG }) },
    'Cruzar con contexto del CRM': { all: () => [{ json: meta }] }
  };
  const fn = new Function('$', '$input', 'return (function(){' + src('Preparar Datos Lead') + '})()');
  return fn(n => nodos[n], { all: () => [{ json: { payload: msgs } }] });
}

// ---------- runner de 'Procesar Respuesta' ----------
function procesar({ pre, salidaModelo }) {
  const nodos = { 'Preparar Datos Lead': { item: { json: pre }, first: () => ({ json: pre }) } };
  const fn = new Function('$', '$input', 'return (function(){' + src('Procesar Respuesta') + '})()');
  return fn(n => nodos[n], { item: { json: { output: salidaModelo } } });
}

const META = {
  conversation_id: 55, message_id: 900, telefono: '5491122334455',
  nombre: 'Gabriela Perez', primer_nombre: 'Gabriela', empresa: 'ACME SA',
  email: 'Gabriela@Acme.com', pais: 'Argentina', sistema: 'SAP',
  motivo_perdida: 'presupuesto congelado', etiquetas: ['reactivacion'], texto: ''
};
const hist = (...pares) => {
  const out = [{ id: 100, private: false, message_type: 1, content: 'Hola Gabriela, le escribo de Xtract.' }];
  let id = 200;
  for (const [rol, texto] of pares) out.push({ id: id++, private: false, message_type: rol === 'c' ? 0 : 1, content: texto });
  return out;
};

console.log('\n=== Preparar Datos Lead ===');
{
  const msgs = hist(['c', 'hola, si me interesa']);
  msgs[msgs.length - 1].id = 900;
  const r = preparar({ msgs, meta: META });
  check('conversacion normal -> accion bot', r.length === 1 && r[0].json.accion === 'bot', r[0] && r[0].json.accion);
  check('el prompt propone el mail del CRM', r[0].json.promptSystem.includes('gabriela@acme.com'));
  check('el prompt nombra las dos herramientas',
    r[0].json.promptSystem.includes('Calendly - Consultar disponibilidad') &&
    r[0].json.promptSystem.includes('Calendly - Agendar reunion'));
  check('el prompt ya no pide el token AGENDAR', !/responde EXACTAMENTE: AGENDAR/.test(r[0].json.promptSystem));
  // El historial lo pasa el nodo 'Memoria por telefono'. Si alguien lo vuelve
  // a meter en el prompt, el modelo recibe la charla DOS veces.
  check('el prompt NO duplica el historial',
    !/CONVERSACION HASTA AHORA/.test(r[0].json.promptSystem) &&
    !r[0].json.promptSystem.includes('CLIENTE: hola, si me interesa'));
  check('las opciones y el horario salen del Config',
    r[0].json.promptSystem.includes('maximo 3 opciones') && r[0].json.promptSystem.includes('las 9:00 y las 18:00'));
}
{
  const meta = Object.assign({}, META, { email: '' });
  const msgs = hist(['c', 'dale']); msgs[msgs.length - 1].id = 900;
  const r = preparar({ msgs, meta });
  check('sin mail en el CRM el prompt lo pide', r[0].json.promptSystem.includes('No tenemos su correo'));
}
{
  const msgs = hist(['c', 'no me escriban mas']); msgs[msgs.length - 1].id = 900;
  const r = preparar({ msgs, meta: META });
  check('opt-out -> fija', r[0].json.accion === 'fija' && r[0].json.bloqueado === 'optout');
}
{
  const msgs = hist(['c', 'puedo dar de baja un usuario del sistema?']); msgs[msgs.length - 1].id = 900;
  const r = preparar({ msgs, meta: META });
  check('"dar de baja un usuario" NO es opt-out', r[0].json.accion === 'bot', r[0].json.bloqueado);
}
{
  const msgs = hist(['c', '']); msgs[msgs.length - 1].id = 900;
  const r = preparar({ msgs, meta: Object.assign({}, META, { texto: '' }) });
  check('audio/imagen -> sin_texto', r[0].json.bloqueado === 'sin_texto');
}
{
  const meta = Object.assign({}, META, { etiquetas: ['reactivacion', 'agendado'] });
  const msgs = hist(['c', 'gracias!']); msgs[msgs.length - 1].id = 900;
  check('etiqueta agendado -> silencio total', preparar({ msgs, meta }).length === 0);
}
{
  const msgs = [{ id: 100, private: true, message_type: 1, content: 'AGENDA_ESTADO {"etapa":"agendado"}' }]
    .concat(hist(['c', 'una consulta mas']));
  msgs[msgs.length - 1].id = 900;
  check('nota agendado -> silencio aunque falte la etiqueta', preparar({ msgs, meta: META }).length === 0);
}
{
  // El ultimo mensaje tiene que ser del CLIENTE: es el que dispara la ejecucion.
  const pares = []; for (let i = 0; i < 14; i++) pares.push(['n', 'respuesta ' + i], ['c', 'mensaje ' + i]);
  const msgs = hist.apply(null, pares); msgs[msgs.length - 1].id = 900;
  const r = preparar({ msgs, meta: META });
  check('tope de turnos -> fija', r.length === 1 && r[0].json.bloqueado === 'tope',
    r[0] && (r[0].json.bloqueado + ' turnos=' + r[0].json.turnos_modelo));
}
{
  const msgs = hist(['c', 'hola'], ['c', 'che'], ['c', 'una consulta']);
  msgs[msgs.length - 1].id = 900;
  const r = preparar({ msgs, meta: META });
  check('rafaga: se unen y cuentan como UN turno', r[0].json.input === 'hola. che. una consulta' && r[0].json.turnoCliente === 1,
    r[0].json.input + ' / turnos=' + r[0].json.turnoCliente);
}
{
  const msgs = hist(['c', 'primero'], ['c', 'segundo']);
  const r = preparar({ msgs, meta: Object.assign({}, META, { message_id: 200 }) });
  check('hay uno mas nuevo -> esta ejecucion se calla', r.length === 0);
}
{
  check('historial vacio -> no responde', preparar({ msgs: [], meta: META }).length === 0);
}

// ---------- runner de 'Filtrar solo entrantes' ----------
function filtrar(payload) {
  const nodos = { Config: { first: () => ({ json: CONFIG }) } };
  const fn = new Function('$', '$input', 'return (function(){' + src('Filtrar solo entrantes') + '})()');
  return fn(n => nodos[n], { all: () => [{ json: payload }] });
}
const MSG_WA = extra => Object.assign({
  event: 'message_created', message_type: 'incoming', private: false,
  inbox: { id: CONFIG.CHATWOOT_INBOX_ID }, conversation: { id: 55, labels: ['reactivacion'] },
  sender: { id: 7, phone_number: '+5491122334455', name: 'Gabriela' },
  content: 'hola', id: 900
}, extra || {});

console.log('\n=== Filtrar solo entrantes (descarte temprano) ===');
check('conversacion del piloto -> pasa', filtrar(MSG_WA()).length === 1);
check('etiquetada pero de otro flujo -> se descarta',
  filtrar(MSG_WA({ conversation: { id: 9, labels: ['soporte'] } })).length === 0);
// Si el payload no trae etiquetas, NO se puede filtrar por ellas: dejar pasar
// y que decida el cruce con la hoja. Filtrar por un campo ausente dejaria al
// bot mudo con todo el mundo y sin ningun error visible.
check('sin etiquetas en el payload -> pasa igual (fallback seguro)',
  filtrar(MSG_WA({ conversation: { id: 55 } })).length === 1);
check('inbox distinto -> se descarta',
  filtrar(MSG_WA({ inbox: { id: '999' } })).length === 0);
check('mensaje saliente -> se descarta', filtrar(MSG_WA({ message_type: 'outgoing' })).length === 0);
check('nota privada -> se descarta', filtrar(MSG_WA({ private: true })).length === 0);

// El WF1 deja el contexto del CRM en los custom_attributes del contacto.
// Si viene, el WF2 se saltea la lectura de la hoja de Sheets.
const CON_ATTRS = MSG_WA({ sender: {
  id: 7, phone_number: '+5491122334455', name: 'Gabriela',
  custom_attributes: { empresa: 'SRK', motivo_perdida: 'Precio alto', sistema: 'Tango' }
} });
{
  const r = filtrar(CON_ATTRS)[0].json;
  check('custom_attributes -> tiene_contexto true', r.tiene_contexto === true);
  check('custom_attributes viajan en .crm', r.crm.empresa === 'SRK' && r.crm.sistema === 'Tango');
}
// Un contacto puede existir en Chatwoot sin haber pasado nunca por el WF1.
// En ese caso NO hay atributos y hay que caer a la hoja igual: si esto diera
// true, el bot armaria la ficha vacia y le hablaria sin contexto a un lead.
check('contacto sin atributos -> tiene_contexto false',
  filtrar(MSG_WA()).length === 1 && filtrar(MSG_WA())[0].json.tiene_contexto === false);
check('atributos vacios -> tiene_contexto false',
  filtrar(MSG_WA({ sender: { id: 7, phone_number: '+549112233', name: 'X', custom_attributes: {} } }))[0].json.tiene_contexto === false);

// =====================================================================
// CACHE DE PROMPT: el bloque estatico tiene que ser IDENTICO entre leads.
// DeepSeek cachea por prefijo exacto; con una sola variable arriba de la
// ficha, el prefijo cambia por conversacion y no hay un solo cache hit.
// Son ~2300 tokens que se pagan enteros en CADA mensaje de CADA lead.
// Esta prueba existe para que ese error no vuelva sin que nadie lo note.
// =====================================================================
console.log('\n=== Prompt: prefijo cacheable ===');
{
  const base = { message_id: 900, texto: 'dale' };
  const msgs = [{ id: 1, message_type: 1, content: 'Hola, te escribo de Xtract' },
                { id: 900, message_type: 0, content: 'dale' }];
  const pA = preparar({ msgs, meta: Object.assign({ nombre: 'Gabriela Carrizo', primer_nombre: 'Gabriela',
    empresa: 'SRK', pais: 'Argentina', sistema: 'Tango', motivo_perdida: 'Precio alto',
    email: 'gabriela@acme.com' }, base) })[0].json.promptSystem;
  const pB = preparar({ msgs, meta: Object.assign({ nombre: 'Juan Perez', primer_nombre: 'Juan',
    empresa: 'Otra SA', pais: 'Uruguay', sistema: 'SAP', motivo_perdida: 'Timing',
    email: '' }, base) })[0].json.promptSystem;

  const M = '=== FICHA DEL CLIENTE ===';
  const preA = pA.slice(0, pA.indexOf(M));
  const preB = pB.slice(0, pB.indexOf(M));
  check('el prefijo estatico es identico entre leads distintos', preA.length > 0 && preA === preB);
  check('ningun dato del lead se filtro al prefijo',
    !preA.includes('Gabriela') && !preA.includes('SRK') && !preA.includes('Tango'));
  check('la ficha y la etapa quedan despues del prefijo',
    pA.indexOf(M) > 0 && pA.indexOf('ETAPA ACTUAL:') > pA.indexOf(M));
  check('el prefijo cacheable sigue siendo el grueso del prompt', preA.length > pA.length * 0.8);
}

console.log('\n=== Procesar Respuesta ===');
const PRE = { conversation_id: 55, primer_nombre: 'Gabriela', empresa: 'ACME SA', bloqueado: '' };
{
  const r = procesar({ pre: PRE, salidaModelo: 'Listo Gabriela, quedo agendada para el martes 11 a las 10:00 (horario de Argentina). [AGENDADO]' });
  check('[AGENDADO] marca agendado', r.json.agendado === true);
  check('[AGENDADO] no llega al cliente', !/agendado\]/i.test(r.json.mensaje_saliente), r.json.mensaje_saliente);
  check('[AGENDADO] pone la etiqueta terminal', r.json.etiquetas.includes('agendado'));
  check('[AGENDADO] escribe la nota candado', r.json.nota_agenda.startsWith('AGENDA_ESTADO'));
  check('[AGENDADO] cierra como agendado', r.json.cierre === 'agendado');
}
{
  const r = procesar({ pre: PRE, salidaModelo: 'Quedo agendada con nuestro especialista el martes a las 10. [AGENDADO]' });
  check('agendado gana sobre la red anti-escalacion', r.json.agendado === true && r.json.cierre === 'agendado', r.json.cierre);
}
{
  const r = procesar({ pre: PRE, salidaModelo: 'Necesito escalar su consulta al equipo tecnico.' });
  check('parafraseo de ESCALAR -> escalado', r.json.cierre === 'escalado' && r.json.etiquetas.includes('necesita-humano'));
}
{
  const r = procesar({ pre: PRE, salidaModelo: 'FUERA_DE_TEMA' });
  check('fuera de tema no escala', r.json.cierre === '' && !r.json.etiquetas.includes('necesita-humano'));
  check('fuera de tema responde algo util', r.json.mensaje_saliente.includes('facturas'));
}
{
  const r = procesar({ pre: Object.assign({}, PRE, { bloqueado: 'optout', respuestaFija: 'Entendido...' }), salidaModelo: '' });
  check('bloqueado optout ignora al modelo', r.json.mensaje_saliente === 'Entendido...' && r.json.etiquetas.includes('opt-out'));
}
{
  const r = procesar({ pre: Object.assign({}, PRE, { bloqueado: 'sin_texto', respuestaFija: 'Perdon, no puedo...' }), salidaModelo: '' });
  check('sin_texto NO es escalacion', !r.json.etiquetas.includes('necesita-humano') && r.json.cierre === '');
}
{
  const r = procesar({ pre: PRE, salidaModelo: '' });
  check('modelo mudo -> escala', r.json.cierre === 'escalado');
}

// =====================================================================
// Ramas del clasificador de intencion.
// El clasificador cuelga de la salida 'bot' del switch, o sea que solo ve
// mensajes que YA pasaron opt-out, estado terminal y tope de turnos.
// Nunca puede desactivar un candado; solo agregar restricciones.
// =====================================================================
console.log('\n=== Clasificador de intencion ===');
{
  const r = procesar({ pre: Object.assign({}, PRE, { bloqueado: 'no_responder', respuestaFija: '' }), salidaModelo: '' });
  check('no_responder -> no manda mensaje', r.json.mensaje_saliente === '');
  check('no_responder -> se puede medir', r.json.cierre === 'sin_respuesta');
  // LA PRUEBA IMPORTANTE. Si 'no_responder' etiquetara terminal, un error del
  // clasificador dejaria al lead sin contacto PARA SIEMPRE y sin traza. Asi,
  // el costo maximo de un falso positivo es un mensaje sin contestar.
  check('no_responder NO es terminal (falso positivo != lead perdido)',
    !r.json.etiquetas.some(e => ['opt-out', 'no-contactar', 'necesita-humano', 'escalado', 'agendado'].includes(e)));
  check('no_responder ignora lo que diga el modelo',
    procesar({ pre: Object.assign({}, PRE, { bloqueado: 'no_responder', respuestaFija: '' }),
      salidaModelo: 'Hola! Le cuento todo sobre nuestros precios.' }).json.mensaje_saliente === '');
}
{
  const r = procesar({ pre: Object.assign({}, PRE, { bloqueado: 'derivar_humano', respuestaFija: 'Le derivo la conversacion.' }), salidaModelo: '' });
  check('derivar_humano -> avisa al cliente', r.json.mensaje_saliente.length > 0);
  check('derivar_humano -> etiqueta necesita-humano', r.json.etiquetas.includes('necesita-humano'));
  check('derivar_humano -> cierra como escalado', r.json.cierre === 'escalado');
}
// El clasificador es un nodo nuevo adelante de TODAS las respuestas. Si un
// bloqueado desconocido cayera en un camino sin mensaje, el cliente quedaria
// sin respuesta y sin traza. Todo lo que no sea 'no_responder' contesta algo.
{
  const casos = ['optout', 'tope', 'sin_texto', 'derivar_humano'];
  const todos = casos.every(b => procesar({
    pre: Object.assign({}, PRE, { bloqueado: b, respuestaFija: 'texto' }), salidaModelo: ''
  }).json.mensaje_saliente.length > 0);
  check('solo no_responder deja el mensaje vacio', todos);
}

console.log('\n' + (fail ? '❌ ' + fail + ' fallas, ' + ok + ' ok' : '✅ ' + ok + ' pruebas ok'));
process.exit(fail ? 1 : 0);

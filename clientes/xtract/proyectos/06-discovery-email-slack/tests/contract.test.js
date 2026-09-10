#!/usr/bin/env node
/**
 * contract.test.js — Proyecto 06 Discovery Email Slack
 * Contract test LOCAL: no toca n8n ni Slack. Valida que:
 *  1. Los fixtures versionados existen y parsean.
 *  2. El nodo "Code - Extraer Datos" del workflow.json corre en sandbox
 *     con cada fixture y devuelve el contrato de entrada esperado.
 *  3. Los casos borde no rompen (fileId vacío, campos nulos).
 *
 * Uso: node clientes/xtract/proyectos/06-discovery-email-slack/tests/contract.test.js
 * Exit 0 = todo ok, Exit 1 = hay fallas (apto para CI).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const WF = path.join(ROOT, '..', 'workflow.json');
const FIXTURES = {
  'happy-es': path.join(ROOT, '..', 'fixtures', 'happy-es.json'),
  'happy-pt': path.join(ROOT, '..', 'fixtures', 'happy-pt.json'),
  'edge-sin-link': path.join(ROOT, '..', 'fixtures', 'edge-sin-link.json'),
  'edge-campos-nulos': path.join(ROOT, '..', 'fixtures', 'edge-campos-nulos.json'),
};

let ok = 0;
let fail = 0;
const check = (nombre, cond, extra) => {
  if (cond) { ok++; console.log('  ok   ' + nombre); }
  else { fail++; console.log('  FALLA ' + nombre + (extra ? '  -> ' + extra : '')); }
};

function loadWorkflowCode(nodeName) {
  const wf = JSON.parse(fs.readFileSync(WF, 'utf8'));
  const node = wf.nodes.find((n) => n.name === nodeName);
  if (!node) throw new Error('Nodo no encontrado en workflow.json: ' + nodeName);
  return node.parameters.jsCode;
}

function runExtractor(jsCode, payload) {
  const sandbox = {
    $input: { first: () => ({ json: payload }), all: () => [{ json: payload }], item: { json: payload } },
    $: () => ({ first: () => ({ json: {} }), all: () => [({ json: {} })] }),
  };
  const script = new vm.Script('(function(){\n' + jsCode + '\n})()');
  return script.runInContext(vm.createContext(sandbox), { timeout: 2000 });
}

console.log('\n=== 06 contract test — fixtures ===');
for (const [name, p] of Object.entries(FIXTURES)) {
  let data;
  try { data = JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { check(name + ' parsea como JSON', false, e.message); continue; }
  check(name + ' parsea como JSON', true);
  check(name + ' no contiene datos reales (spot-check @xtract.app real)', !JSON.stringify(data).includes('@xtract.app') || JSON.stringify(data).includes('.test@xtract.app'), 'revisar fixture');
}

console.log('\n=== 06 contract test — extractor (casos felices + edge-sin-link) ===');
const code = loadWorkflowCode('Code - Extraer Datos');

for (const name of ['happy-es', 'happy-pt', 'edge-sin-link']) {
  const payload = JSON.parse(fs.readFileSync(FIXTURES[name], 'utf8'));
  let out;
  try {
    out = runExtractor(code, payload);
  } catch (e) { check(name + ' no lanza excepción', false, e.message); continue; }
  const row = Array.isArray(out) ? out[0] && out[0].json : null;
  check(name + ' retorna [{ json }]', !!row, JSON.stringify(out).slice(0, 200));
  if (!row) continue;
  check(name + ' expone fileId (string)', typeof row.fileId === 'string', typeof row.fileId);
  check(name + ' expone ownerEmail (string)', typeof row.ownerEmail === 'string', typeof row.ownerEmail);
}

{
  const es = JSON.parse(fs.readFileSync(FIXTURES['happy-es'], 'utf8'));
  const row = runExtractor(code, es)[0].json;
  check('happy-es extrae fileId del link Drive', row.fileId.length > 10, row.fileId);
  // HALLAZGO-06-01 RESUELTO (ver HALLAZGOS-06.md): el extractor prioriza
  // raw.property_owner[0] por sobre el default. El test lo exige.
  check('happy-es respeta property_owner del payload', row.ownerEmail === 'nico.test@xtract.app', row.ownerEmail);
}
{
  const pt = JSON.parse(fs.readFileSync(FIXTURES['happy-pt'], 'utf8'));
  const row = runExtractor(code, pt)[0].json;
  // HALLAZGO-06-02 RESUELTO (ver HALLAZGOS-06.md): el regex matchea
  // /document/d/<id> de Google Docs además de /d/<id> de Drive.
  check('happy-pt extrae fileId del link Docs', row.fileId === '1PtBr9xYzAbCdEfGhIjKlMnOpQrStUv', row.fileId);
}
{
  const edge = JSON.parse(fs.readFileSync(FIXTURES['edge-sin-link'], 'utf8'));
  const row = runExtractor(code, edge)[0].json;
  check('edge-sin-link devuelve fileId vacío sin romper', row.fileId === '', JSON.stringify(row).slice(0, 200));
}
{
  const nulos = JSON.parse(fs.readFileSync(FIXTURES['edge-campos-nulos'], 'utf8'));
  let threw = null;
  let rowNulos = null;
  try { rowNulos = runExtractor(code, nulos)[0].json; } catch (e) { threw = e; }
  // HALLAZGO-06-03 RESUELTO (ver HALLAZGOS-06.md): guarda-null antes de
  // acceder a subpropiedades. El test exige que no lance.
  check('edge-campos-nulos no lanza excepción', !threw, threw && threw.message);
  if (!threw) {
    check('edge-campos-nulos retorna fileId vacío controlado', rowNulos.fileId === '', JSON.stringify(rowNulos).slice(0, 120));
  }
}

console.log('\n' + (fail ? '❌ ' + fail + ' fallas, ' + ok + ' ok' : '✅ ' + ok + ' pruebas ok'));
process.exit(fail ? 1 : 0);

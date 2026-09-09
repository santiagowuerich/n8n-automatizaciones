#!/usr/bin/env node
/**
 * tools/n8n-runner.js
 * Runner, tester y debugger interactivo para workflows de n8n (DEV y PROD).
 * 
 * Uso:
 *   # Disparar webhook y ver resultado completo:
 *   node tools/n8n-runner.js --webhook discovery-email-slack --payload @scratch/test.json --env prod
 * 
 *   # Inspeccionar última ejecución de un workflow y ver output de un nodo específico:
 *   node tools/n8n-runner.js --wf xP2LYks5hHkcmgN5 --node "Armar mensaje de Slack" --env prod
 * 
 *   # Usar directamente el archivo workflow.json local:
 *   node tools/n8n-runner.js --file clientes/xtract/proyectos/06-discovery-email-slack/workflow.json --node "Armar mensaje de Slack"
 * 
 *   # Listar últimas 10 ejecuciones en DEV o PROD:
 *   node tools/n8n-runner.js --list 10 --env prod
 * 
 *   # Inspeccionar una ejecución específica por ID:
 *   node tools/n8n-runner.js --exec 590155 --env prod
 */

const fs = require('fs');
const path = require('path');
const { getEnvironmentConfig } = require('./config');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m'
};

function printBanner(envName, baseUrl) {
  console.log(`\n${colors.bright}${colors.blue}╔══════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}║${colors.reset}  🚀  ${colors.bright}n8n-runner${colors.reset} — Entorno: ${colors.magenta}${envName.toUpperCase()}${colors.reset}  ${colors.gray}(${baseUrl})${colors.reset}`.padEnd(87) + `${colors.bright}${colors.blue}║${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    wfId: null,
    filePath: null,
    webhook: null,
    method: 'POST',
    isTestWebhook: false,
    env: 'prod',
    nodeName: null,
    payload: null,
    fixturePath: null,
    execId: null,
    list: null,
    status: null,
    waitMs: 3000,
    pollRetries: 10,
    jsonOnly: false,
    verbose: false,
    assertContains: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--wf' || arg === '-w') {
      options.wfId = args[++i];
    } else if (arg === '--file' || arg === '-f') {
      options.filePath = args[++i];
    } else if (arg === '--webhook' || arg === '-h') {
      options.webhook = args[++i];
    } else if (arg === '--test') {
      options.isTestWebhook = true;
    } else if (arg === '--method' || arg === '-m') {
      options.method = (args[++i] || 'POST').toUpperCase();
    } else if (arg === '--env' || arg === '-e') {
      options.env = args[++i];
    } else if (arg === '--node' || arg === '-n') {
      options.nodeName = args[++i];
    } else if (arg === '--exec' || arg === '-x') {
      options.execId = args[++i];
    } else if (arg === '--list' || arg === '-l') {
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('-')) {
        options.list = parseInt(nextArg, 10);
        i++;
      } else {
        options.list = 10;
      }
    } else if (arg === '--status') {
      options.status = args[++i];
    } else if (arg === '--payload' || arg === '-p') {
      const val = args[++i];
      if (val && val.startsWith('@')) {
        options.fixturePath = val.slice(1);
      } else if (val) {
        try {
          options.payload = JSON.parse(val);
        } catch (e) {
          options.payload = val;
        }
      }
    } else if (arg === '--assert-contains') {
      options.assertContains = args[++i];
    } else if (arg === '--wait') {
      options.waitMs = parseInt(args[++i], 10);
    } else if (arg === '--json') {
      options.jsonOnly = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    } else if (arg === '--help') {
      showHelp();
      process.exit(0);
    }
  }

  // Cargar fixture si se especificó
  if (options.fixturePath) {
    const fullPath = path.resolve(process.cwd(), options.fixturePath);
    if (fs.existsSync(fullPath)) {
      try {
        options.payload = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      } catch (e) {
        console.error(`${colors.red}Error parseando fixture JSON (${fullPath}): ${e.message}${colors.reset}`);
      }
    } else {
      console.error(`${colors.red}No se encontró el archivo fixture: ${fullPath}${colors.reset}`);
    }
  }

  // Extraer ID de workflow desde archivo si se pasó --file
  if (options.filePath && !options.wfId) {
    const fullPath = path.resolve(process.cwd(), options.filePath);
    if (fs.existsSync(fullPath)) {
      try {
        const wfContent = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (wfContent.id) {
          options.wfId = wfContent.id;
        }
      } catch (e) {
        // Ignorar si falla lectura
      }
    }
  }

  return options;
}

function showHelp() {
  console.log(`
${colors.bright}n8n-runner — Testing & Execution CLI para n8n${colors.reset}

${colors.yellow}Opciones Principales:${colors.reset}
  --env, -e <dev|prod>        Entorno a consultar (default: prod)
  --webhook, -h <slug>        Disparar webhook por slug (ej: discovery-email-slack)
  --test                      Disparar webhook de prueba (/webhook-test/...)
  --payload, -p <json|@file>  Payload en JSON o ruta a archivo con @ (ej: @fixtures/lead.json)
  --wf, -w <id>               ID del workflow en n8n
  --file, -f <path>           Ruta a un workflow.json local (extrae el ID automáticamente)
  --node, -n "<nombre>"       Inspeccionar y mostrar el output del nodo especificado
  --exec, -x <id>             Inspeccionar una ejecución específica por su ID numérico
  --list, -l [cantidad]       Listar las últimas N ejecuciones (default: 10)
  --status <success|error>    Filtrar lista por estado de ejecución
  --assert-contains "<txt>"   Verificar que la salida contenga el texto esperado (exit 0 / 1)
  --json                      Devolver salida en formato JSON crudo
  --verbose, -v               Mostrar logs detallados de red

${colors.yellow}Ejemplos de Uso:${colors.reset}
  # Disparar webhook en PROD con fixture:
  node tools/n8n-runner.js --env prod --webhook discovery-email-slack --payload @scratch/test_body.json

  # Disparar y ver el mensaje formateado del nodo Slack:
  node tools/n8n-runner.js --env prod --webhook discovery-email-slack --payload @scratch/test_body.json --wf xP2LYks5hHkcmgN5 --node "Armar mensaje de Slack"

  # Listar últimas 5 ejecuciones de PROD:
  node tools/n8n-runner.js --env prod --list 5

  # Inspeccionar nodo de una ejecución pasada:
  node tools/n8n-runner.js --env prod --exec 590155 --node "Armar mensaje de Slack"
`);
}

async function triggerWebhook(config, pathName, payload, method = 'POST', isTest = false, verbose = false) {
  const prefix = isTest ? 'webhook-test' : 'webhook';
  const url = `${config.webhookBaseUrl}/${prefix}/${pathName.replace(/^\//, '')}`;
  
  if (!verbose) {
    console.log(`${colors.cyan}➤ Disparando ${isTest ? 'Test ' : ''}Webhook:${colors.reset} ${colors.bright}${url}${colors.reset}`);
  } else {
    console.log(`${colors.cyan}➤ [HTTP ${method}] URL:${colors.reset} ${url}`);
    console.log(`${colors.gray}Payload:${colors.reset}`, JSON.stringify(payload, null, 2));
  }
  
  const startTime = Date.now();
  const fetchOptions = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (method !== 'GET' && payload) {
    fetchOptions.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  }

  const res = await fetch(url, fetchOptions);
  const duration = Date.now() - startTime;
  const statusColor = res.ok ? colors.green : colors.red;
  console.log(`${colors.cyan}➤ Respuesta HTTP:${colors.reset} ${statusColor}${res.status} ${res.statusText}${colors.reset} ${colors.gray}(${duration}ms)${colors.reset}`);
  
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return { status: res.status, ok: res.ok, data, duration };
}

async function listExecutions(config, limit = 10, statusFilter = null) {
  let url = `${config.baseUrl}/executions?limit=${limit}`;
  if (statusFilter) url += `&status=${statusFilter}`;

  const res = await fetch(url, {
    headers: { 'X-N8N-API-KEY': config.apiKey }
  });

  if (!res.ok) {
    throw new Error(`Error al listar ejecuciones (${res.status}): ${await res.text()}`);
  }

  const result = await res.json();
  return result.data || [];
}

async function fetchExecutionDetail(config, execId) {
  const url = `${config.baseUrl}/executions/${execId}?includeData=true`;
  const res = await fetch(url, {
    headers: { 'X-N8N-API-KEY': config.apiKey }
  });

  if (!res.ok) {
    throw new Error(`Error al consultar detalle de ejecución ${execId} (${res.status}): ${await res.text()}`);
  }

  return await res.json();
}

async function waitForExecutionCompletion(config, wfId, knownLatestId = null, maxAttempts = 10, intervalMs = 1500) {
  process.stdout.write(`${colors.gray}Esperando finalización de ejecución en n8n... ${colors.reset}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const list = await listExecutions(config, 3);
    const matching = wfId ? list.filter(e => e.workflowId === wfId) : list;

    if (matching.length > 0) {
      const candidate = matching[0];
      // Si candidate es más reciente que el anterior conocido o no había previo
      if (!knownLatestId || candidate.id !== knownLatestId || attempt > 2) {
        if (candidate.finished || candidate.status === 'success' || candidate.status === 'error') {
          process.stdout.write(`${colors.green}✔ completado en ${candidate.id}${colors.reset}\n`);
          return candidate.id;
        }
      }
    }

    process.stdout.write(`${colors.gray}.${colors.reset}`);
    await new Promise(r => setTimeout(r, intervalMs));
  }

  process.stdout.write(`\n`);
  return null;
}

function formatNodeOutput(nodeName, nodeData) {
  if (!nodeData || nodeData.length === 0) {
    return `${colors.yellow}(Sin datos de salida)${colors.reset}`;
  }

  const firstRun = nodeData[0];
  const mainOutputs = firstRun?.data?.main || [];
  if (mainOutputs.length === 0 || mainOutputs[0].length === 0) {
    return `${colors.yellow}(Array de salida vacío)${colors.reset}`;
  }

  const items = mainOutputs[0];
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const json = items[i].json || {};
    
    // Si contiene texto formateado típico (Slack, Email, Markdown)
    if (json.texto_slack || json.cuerpo_email || json.text || json.message) {
      const header = items.length > 1 ? `\n--- Item #${i + 1} ---` : '';
      const textContent = json.texto_slack || json.cuerpo_email || json.text || json.message;
      results.push(`${header}\n${textContent}`);
    } else {
      // JSON coloreado estructurado
      const jsonStr = JSON.stringify(json, null, 2);
      results.push(jsonStr);
    }
  }

  return results.join('\n\n');
}

async function run() {
  const opts = parseArgs();
  const config = getEnvironmentConfig(opts.env);

  if (!opts.jsonOnly) {
    printBanner(config.env, config.baseUrl);
  }

  if (!config.apiKey) {
    console.error(`${colors.red}Error: No se encontró la API Key de n8n para el entorno ${opts.env}.${colors.reset}`);
    process.exit(1);
  }

  // MODO 1: Listar ejecuciones
  if (opts.list !== null) {
    console.log(`${colors.cyan}➤ Listando últimas ${opts.list} ejecuciones en ${config.env}...${colors.reset}\n`);
    try {
      const execs = await listExecutions(config, opts.list, opts.status);
      if (execs.length === 0) {
        console.log(`${colors.yellow}No se encontraron ejecuciones.${colors.reset}`);
        return;
      }

      console.log(`${colors.bright}${'ID'.padEnd(10)} ${'ESTADO'.padEnd(12)} ${'WORKFLOW ID'.padEnd(20)} ${'INICIO'.padEnd(26)} ${'DURACIÓN'}${colors.reset}`);
      console.log(colors.gray + '─'.repeat(80) + colors.reset);

      for (const e of execs) {
        const statusColor = e.status === 'success' ? colors.green : e.status === 'error' ? colors.red : colors.yellow;
        const dur = e.stoppedAt && e.startedAt ? `${Math.round((new Date(e.stoppedAt) - new Date(e.startedAt)) / 1000)}s` : '-';
        console.log(`${e.id.toString().padEnd(10)} ${statusColor}${e.status.toUpperCase().padEnd(12)}${colors.reset} ${(e.workflowId || '-').padEnd(20)} ${(e.startedAt || '-').padEnd(26)} ${dur}`);
      }
      console.log('\n');
      return;
    } catch (err) {
      console.error(`${colors.red}Error listando ejecuciones: ${err.message}${colors.reset}`);
      process.exit(1);
    }
  }

  let targetExecId = opts.execId;

  // MODO 2: Disparar webhook
  if (opts.webhook) {
    let latestBefore = null;
    if (opts.wfId) {
      const recents = await listExecutions(config, 1);
      if (recents.length > 0) latestBefore = recents[0].id;
    }

    const triggerRes = await triggerWebhook(config, opts.webhook, opts.payload, opts.method, opts.isTestWebhook, opts.verbose);
    
    if (opts.wfId || !targetExecId) {
      const finishedId = await waitForExecutionCompletion(config, opts.wfId, latestBefore, opts.pollRetries, 1500);
      if (finishedId) {
        targetExecId = finishedId;
      }
    }
  }

  // Si no se pasó execId pero sí wfId, buscar la última ejecución de ese workflow
  if (!targetExecId && opts.wfId) {
    const recents = await listExecutions(config, 5);
    const wfExec = recents.find(e => e.workflowId === opts.wfId);
    if (wfExec) {
      targetExecId = wfExec.id;
    } else if (recents.length > 0) {
      targetExecId = recents[0].id;
    }
  }

  // MODO 3: Inspeccionar Detalle de Ejecución
  if (targetExecId) {
    console.log(`\n${colors.cyan}➤ Inspeccionando Ejecución ID:${colors.reset} ${colors.bright}${targetExecId}${colors.reset}`);
    try {
      const d = await fetchExecutionDetail(config, targetExecId);
      
      const statusColor = d.status === 'success' ? colors.green : colors.red;
      const statusIcon = d.status === 'success' ? '✔ SUCCESS' : '✖ ERROR';

      console.log(`\n${colors.bright}Resumen de Ejecución:${colors.reset}`);
      console.log(`  • ID:          ${d.id}`);
      console.log(`  • Estado:      ${statusColor}${statusIcon}${colors.reset}`);
      console.log(`  • Workflow:    ${d.workflowData?.name || d.workflowId || '-'}`);
      console.log(`  • Modo:        ${d.mode || 'webhook'}`);
      console.log(`  • Duración:    ${d.startedAt && d.stoppedAt ? Math.round((new Date(d.stoppedAt) - new Date(d.startedAt))) + 'ms' : '-'}`);

      const runData = d.data?.resultData?.runData || d.resultData?.runData || {};
      const nodeNames = Object.keys(runData);

      console.log(`\n${colors.bright}Topología de Nodos Ejecutados (${nodeNames.length}):${colors.reset}`);
      for (const name of nodeNames) {
        const nodeRuns = runData[name];
        const hasErr = nodeRuns.some(r => r.error);
        const execTime = nodeRuns.reduce((acc, r) => acc + (r.executionTime || 0), 0);
        const itemCount = nodeRuns[0]?.data?.main?.[0]?.length || 0;
        const status = hasErr ? `${colors.red}✖ ERROR${colors.reset}` : `${colors.green}✔ OK${colors.reset}`;

        console.log(`  ${status} ${colors.bright}${name.padEnd(36)}${colors.reset} ${colors.gray}[${itemCount} item(s), ${execTime}ms]${colors.reset}`);

        if (hasErr) {
          const errObj = nodeRuns.find(r => r.error)?.error;
          console.log(`    ${colors.red}↳ Detalle: ${errObj?.message || JSON.stringify(errObj)}${colors.reset}`);
        }
      }

      // MODO 4: Salida de nodo específico
      if (opts.nodeName) {
        console.log(`\n${colors.bright}${colors.cyan}═══════════════════ OUTPUT DEL NODO: "${opts.nodeName}" ═══════════════════${colors.reset}\n`);
        const targetNode = runData[opts.nodeName];
        if (!targetNode) {
          console.log(`${colors.yellow}El nodo "${opts.nodeName}" no se ejecutó en esta corrida.${colors.reset}`);
        } else {
          const formatted = formatNodeOutput(opts.nodeName, targetNode);
          console.log(formatted);

          // Chequeo de assertions si se configuró
          if (opts.assertContains) {
            console.log(`\n${colors.cyan}➤ Verificando Assertion: Contiene "${opts.assertContains}"...${colors.reset}`);
            if (formatted.includes(opts.assertContains)) {
              console.log(`${colors.green}${colors.bright}✔ ASSERTION PASÓ:${colors.reset} El texto esperado fue encontrado.`);
            } else {
              console.log(`${colors.red}${colors.bright}✖ ASSERTION FALLÓ:${colors.reset} No se encontró "${opts.assertContains}" en el output.`);
              process.exit(1);
            }
          }
        }
      }

    } catch (err) {
      console.error(`${colors.red}Error inspeccionando ejecución: ${err.message}${colors.reset}`);
      process.exit(1);
    }
  }

  console.log(`\n${colors.blue}════════════════════════════════════════════════════════════════════════════════${colors.reset}\n`);
}

if (require.main === module) {
  run();
}

module.exports = {
  triggerWebhook,
  listExecutions,
  fetchExecutionDetail,
  waitForExecutionCompletion
};

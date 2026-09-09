#!/usr/bin/env node
/**
 * tools/n8n-validator.js
 * Validador estático de arquitectura, linter y sandbox tester para workflows de n8n.
 * 
 * Uso:
 *   node tools/n8n-validator.js <path-al-workflow.json>
 *   node tools/n8n-validator.js --all
 *   node tools/n8n-validator.js --all --strict
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

function printBanner(title) {
  console.log(`\n${colors.bright}${colors.cyan}╔══════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}║${colors.reset}  🛡️  ${colors.bright}${title}${colors.reset}`.padEnd(87) + `${colors.bright}${colors.cyan}║${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}╚══════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
}

/**
 * Valida integralmente un archivo workflow.json
 */
function validateWorkflowFile(filePath, options = {}) {
  const issues = {
    errors: [],
    warnings: [],
    passes: [],
    stats: {
      totalNodes: 0,
      codeNodes: 0,
      triggerNodes: 0,
      httpNodes: 0
    }
  };

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    return {
      file: filePath,
      name: path.basename(filePath),
      valid: false,
      issues: { errors: [`El archivo no existe: ${resolvedPath}`], warnings: [], passes: [], stats: issues.stats }
    };
  }

  let wf;
  try {
    wf = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  } catch (err) {
    return {
      file: filePath,
      name: path.basename(filePath),
      valid: false,
      issues: { errors: [`Error al parsear JSON: ${err.message}`], warnings: [], passes: [], stats: issues.stats }
    };
  }

  // 1. Estructura General
  if (!wf.name) issues.warnings.push('El workflow no tiene un campo "name" definido.');
  if (!Array.isArray(wf.nodes)) {
    issues.errors.push('El workflow no tiene un array de "nodes" válido.');
    return { file: filePath, name: wf.name || path.basename(filePath), valid: false, issues };
  }

  const nodes = wf.nodes;
  issues.stats.totalNodes = nodes.length;

  const nodeMap = new Map();
  nodes.forEach(n => nodeMap.set(n.name, n));

  const connectedTargets = new Set();
  const connectedSources = new Set();
  const incomingConnectionsMap = new Map(); // nodeName -> [sourceNodeNames]

  for (const [sourceName, connGroup] of Object.entries(wf.connections || {})) {
    connectedSources.add(sourceName);

    // Verificar que el nodo origen exista
    if (!nodeMap.has(sourceName)) {
      issues.errors.push(`[Conexión Inválida] El origen "${sourceName}" en connections no existe en el array de nodos.`);
    }

    // Analizar todos los tipos de salidas (main, ai_languageModel, ai_tool, ai_memory, etc.)
    for (const [connType, outputsList] of Object.entries(connGroup)) {
      if (Array.isArray(outputsList)) {
        for (const outputs of outputsList) {
          if (Array.isArray(outputs)) {
            for (const target of outputs) {
              if (target && target.node) {
                connectedTargets.add(target.node);
                
                if (!incomingConnectionsMap.has(target.node)) {
                  incomingConnectionsMap.set(target.node, []);
                }
                incomingConnectionsMap.get(target.node).push(sourceName);

                // Verificar que el nodo destino exista
                if (!nodeMap.has(target.node)) {
                  issues.errors.push(`[Conexión Inválida] El nodo "${sourceName}" se conecta al nodo destino "${target.node}", pero este no existe.`);
                }
              }
            }
          }
        }
      }
    }
  }

  // 2. Análisis por Nodo
  for (const node of nodes) {
    const nodeType = node.type || '';
    const nodeName = node.name || 'Sin Nombre';

    const isTrigger = nodeType.toLowerCase().includes('trigger') || 
                      nodeType.toLowerCase().includes('webhook') ||
                      nodeType.toLowerCase().includes('poll') ||
                      nodeType.toLowerCase().includes('schedule');

    const isStickyNote = nodeType.toLowerCase().includes('stickynote');
    const isAiSubNode = nodeType.toLowerCase().includes('model') || 
                        nodeType.toLowerCase().includes('tool') || 
                        nodeType.toLowerCase().includes('memory') || 
                        nodeType.toLowerCase().includes('parser') || 
                        nodeType.toLowerCase().includes('embedding') ||
                        connectedSources.has(nodeName); // Si es un proveedor conectado como source a otro nodo

    if (isStickyNote) continue; // Ignorar sticky notes de canvas

    if (isTrigger) issues.stats.triggerNodes++;
    if (nodeType === 'n8n-nodes-base.code') issues.stats.codeNodes++;
    if (nodeType === 'n8n-nodes-base.httpRequest') issues.stats.httpNodes++;

    // A. Nodos Huérfanos
    if (!isTrigger && !isAiSubNode && !connectedTargets.has(nodeName)) {
      issues.warnings.push(`[Nodo Huérfano] El nodo "${nodeName}" no recibe datos de ningún nodo anterior.`);
    }

    // B. Credenciales con Placeholders
    if (node.credentials && typeof node.credentials === 'object') {
      for (const [credType, credVal] of Object.entries(node.credentials)) {
        const id = (credVal?.id || '').toString();
        const name = (credVal?.name || '').toString();
        if (id.includes('REEMPLAZAR_') || name.includes('REEMPLAZAR_') || id === 'TODO' || id === '') {
          issues.errors.push(`[Credencial Inválida] El nodo "${nodeName}" tiene la credencial "${credType}" sin configurar o con placeholder ("${id}").`);
        }
      }
    }

    // C. Reglas para Nodos Code (JS)
    if (nodeType === 'n8n-nodes-base.code') {
      const code = node.parameters?.jsCode || '';

      if (!code.trim()) {
        issues.warnings.push(`[Código Vacío] El nodo Code "${nodeName}" no contiene código JavaScript.`);
      }

      // Regla Dura: Prohibición de $env / process.env
      if (code.includes('$env') || code.includes('process.env')) {
        issues.errors.push(`[Regla Dura $env] El nodo Code "${nodeName}" utiliza $env o process.env. La instancia de n8n bloquea variables de entorno en Code nodes.`);
      } else {
        issues.passes.push(`[Seguridad $env] Nodo "${nodeName}" no utiliza variables de entorno bloqueadas.`);
      }

      // Regla: Deprecated Syntax (items[0].json vs $input)
      if (code.includes('items[') || code.includes('$node[')) {
        issues.warnings.push(`[Sintaxis Deprecada] El nodo "${nodeName}" utiliza "items[...]" o "$node[...]". Se recomienda modernizar a "$input.all()", "$input.first()" o "$('NodeName').first()".`);
      }

      // Regla: LangChain Output Unnesting
      const sources = incomingConnectionsMap.get(nodeName) || [];
      const hasLangChainSource = sources.some(srcName => {
        const src = nodeMap.get(srcName);
        return src && (src.type || '').includes('informationExtractor');
      });

      if (hasLangChainSource) {
        if (!code.includes('.output') && !code.includes('output ||') && !code.includes('output?.')) {
          issues.warnings.push(`[LangChain Unnesting] El nodo "${nodeName}" recibe datos de un Extractor de LangChain pero no parece desenvolver ".output" ($input.first().json.output || $input.first().json).`);
        } else {
          issues.passes.push(`[LangChain Unnesting] Nodo "${nodeName}" desenvuelve correctamente .output.`);
        }
      }

      // Sandbox VM Tester
      if (code && options.testSandbox !== false) {
        try {
          const mockInputItem = {
            json: {
              output: {
                tipo_reunion: 'hunting_discovery',
                idioma: 'es',
                empresa_cliente: 'Empresa Test',
                puntos_clave: ['Punto 1', 'Punto 2'],
                proximos_pasos: 'Paso 1\nPaso 2',
                desafios_puntos: ['Desafio 1'],
                solucion_xtract: 'Solucion propuesta',
                casos_exito_mencionados: []
              },
              empresa_cliente: 'Empresa Test',
              texto: 'Transcripción de prueba con texto suficiente para pruebas.',
              owner_email: 'test@xtract.app',
              deal_id: '12345',
              link_transcripcion: 'https://docs.google.com/document/d/123/edit'
            }
          };

          const sandbox = {
            $input: {
              first: () => mockInputItem,
              all: () => [mockInputItem],
              item: mockInputItem
            },
            $: (nName) => ({
              first: () => mockInputItem,
              all: () => [mockInputItem],
              item: mockInputItem
            }),
            $now: new Date().toISOString(),
            $today: new Date().toISOString().split('T')[0],
            JSON,
            Array,
            Object,
            String,
            Number,
            Boolean,
            RegExp,
            Math,
            Date
          };

          const script = new vm.Script(`(function() {\n${code}\n})()`);
          const context = vm.createContext(sandbox);
          const result = script.runInContext(context, { timeout: 1500 });

          if (Array.isArray(result) && result.length > 0 && result[0].json) {
            issues.passes.push(`[Sandbox VM] Nodo "${nodeName}" ejecutó y retornó array n8n válido ([{ json: ... }]).`);
          } else if (Array.isArray(result)) {
            issues.warnings.push(`[Sandbox VM] Nodo "${nodeName}" retornó un Array, pero sus elementos no tienen la clave "json" ({ json: ... }).`);
          } else {
            issues.warnings.push(`[Sandbox VM] Nodo "${nodeName}" no retornó un Array. En n8n los Code nodes deben retornar un Array.`);
          }
        } catch (vmErr) {
          issues.warnings.push(`[Sandbox VM] Alerta en nodo "${nodeName}": ${vmErr.message} (puede requerir inputs específicos de upstream).`);
        }
      }
    }

    // D. Reglas para Nodos HTTP / Slack
    if (nodeType === 'n8n-nodes-base.httpRequest') {
      const url = node.parameters?.url || '';
      const body = node.parameters?.jsonBody || node.parameters?.body || '';
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);

      const isSlackCall = url.includes('slack.com/api/chat.postMessage') || 
                          url.includes('hooks.slack.com') ||
                          nodeName.toLowerCase().includes('slack');

      if (isSlackCall) {
        if (!bodyStr.includes('"unfurl_links": false') || !bodyStr.includes('"unfurl_media": false')) {
          issues.warnings.push(`[Slack Unfurl] El nodo HTTP "${nodeName}" envía mensajes a Slack sin "unfurl_links: false" y "unfurl_media: false". Esto provoca previews no deseados.`);
        } else {
          issues.passes.push(`[Slack Unfurl] Nodo "${nodeName}" tiene unfurl_links y unfurl_media desactivados.`);
        }
      }
    }
  }

  const isValid = issues.errors.length === 0 && (!options.strict || issues.warnings.length === 0);

  return {
    file: filePath,
    name: wf.name || path.basename(filePath),
    valid: isValid,
    issues
  };
}

function printReport(result) {
  const { name, file, valid, issues } = result;
  const statusColor = valid ? colors.green : colors.red;
  const statusIcon = valid ? '✔ PASÓ' : '✖ FALLÓ';

  console.log(`${colors.bright}${name}${colors.reset} ${colors.gray}(${file})${colors.reset}`);
  console.log(`Estado: ${statusColor}${colors.bright}${statusIcon}${colors.reset} | Nodos: ${issues.stats.totalNodes} (Code: ${issues.stats.codeNodes}, HTTP: ${issues.stats.httpNodes}, Triggers: ${issues.stats.triggerNodes})`);

  if (issues.errors.length > 0) {
    console.log(`\n  ${colors.red}${colors.bright}Errores Bloqueantes (${issues.errors.length}):${colors.reset}`);
    issues.errors.forEach(e => console.log(`    ${colors.red}✖${colors.reset} ${e}`));
  }

  if (issues.warnings.length > 0) {
    console.log(`\n  ${colors.yellow}${colors.bright}Advertencias / Mejoras (${issues.warnings.length}):${colors.reset}`);
    issues.warnings.forEach(w => console.log(`    ${colors.yellow}⚠${colors.reset} ${w}`));
  }

  if (issues.passes.length > 0) {
    console.log(`\n  ${colors.green}${colors.bright}Chequeos Correctos (${issues.passes.length}):${colors.reset}`);
    issues.passes.forEach(p => console.log(`    ${colors.green}✔${colors.reset} ${p}`));
  }

  console.log('\n' + colors.gray + '─'.repeat(80) + colors.reset + '\n');
}

function findWorkflowFiles(dir, options = {}, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'scratch' && (options.includeBackups || file !== 'backups')) {
        findWorkflowFiles(fullPath, options, fileList);
      }
    } else if (file.endsWith('.json') && (file === 'workflow.json' || file.includes('workflow') || fullPath.includes('/proyectos/'))) {
      if (options.includeBackups || !fullPath.includes('/backups/')) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

// CLI Execution
if (require.main === module) {
  const args = process.argv.slice(2);
  printBanner('n8n-validator — Architectural Linter & Pre-Deploy Checker');

  if (args.length === 0 || args.includes('--help')) {
    console.log(`Uso:
  node tools/n8n-validator.js <path-al-workflow.json>
  node tools/n8n-validator.js --all
  node tools/n8n-validator.js --all --strict
  node tools/n8n-validator.js clientes/xtract/proyectos/06-discovery-email-slack/workflow.json
`);
    process.exit(0);
  }

  const isStrict = args.includes('--strict');
  const includeBackups = args.includes('--include-backups');
  let filesToValidate = [];

  if (args.includes('--all')) {
    filesToValidate = findWorkflowFiles(path.join(process.cwd(), 'clientes'), { includeBackups });
    if (filesToValidate.length === 0) {
      filesToValidate = findWorkflowFiles(process.cwd(), { includeBackups });
    }
  } else {
    filesToValidate = args.filter(a => !a.startsWith('--'));
  }

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const file of filesToValidate) {
    const result = validateWorkflowFile(file, { strict: isStrict });
    printReport(result);
    totalErrors += result.issues.errors.length;
    totalWarnings += result.issues.warnings.length;
  }

  console.log(`${colors.bright}Resumen Global de Auditoría:${colors.reset}`);
  console.log(`  • Workflows Auditados: ${filesToValidate.length}`);
  console.log(`  • Errores Totales:     ${totalErrors > 0 ? colors.red : colors.green}${totalErrors}${colors.reset}`);
  console.log(`  • Advertencias:        ${totalWarnings > 0 ? colors.yellow : colors.green}${totalWarnings}${colors.reset}\n`);

  if (totalErrors > 0 || (isStrict && totalWarnings > 0)) {
    console.log(`${colors.red}${colors.bright}❌ VALIDACIÓN FALLIDA: Hay problemas que deben corregirse antes de pasar a producción.${colors.reset}\n`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}✅ VALIDACIÓN EXITOSA: Todos los workflows cumplen los estándares de arquitectura.${colors.reset}\n`);
    process.exit(0);
  }
}

module.exports = {
  validateWorkflowFile
};

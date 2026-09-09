/**
 * tools/config.js
 * Configuración centralizada de conexiones a n8n (DEV y PROD).
 * Lee automáticamente las claves y URLs desde mcp_config.json o variables de entorno.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Desactivar temporalmente rechazo TLS estricto para n8n si es necesario sin ensuciar la salida
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.removeAllListeners('warning');

function getMcpConfig() {
  const possiblePaths = [
    path.join(os.homedir(), '.gemini', 'antigravity-ide', 'mcp_config.json'),
    path.join(os.homedir(), '.config', 'mcp_config.json'),
    path.join(process.cwd(), 'mcp_config.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        // Ignorar error de lectura y continuar con el siguiente path
      }
    }
  }
  return null;
}

function getEnvironmentConfig(envName = 'prod') {
  const isProd = envName.toLowerCase() === 'prod' || envName.toLowerCase() === 'production';
  const mcp = getMcpConfig();

  if (isProd) {
    const prodServer = mcp?.mcpServers?.n8n_prod;
    const fallbackServer = mcp?.mcpServers?.n8n;
    const server = prodServer || fallbackServer;

    return {
      env: 'PROD',
      baseUrl: (process.env.N8N_PROD_URL || server?.env?.N8N_API_URL || 'https://n8n.xtract.app/api/v1').replace(/\/$/, ''),
      webhookBaseUrl: (process.env.N8N_PROD_WEBHOOK_URL || 'https://n8n.xtract.app').replace(/\/$/, ''),
      apiKey: process.env.N8N_PROD_KEY || server?.env?.N8N_API_KEY || ''
    };
  } else {
    const devServer = mcp?.mcpServers?.n8n;

    return {
      env: 'DEV',
      baseUrl: (process.env.N8N_DEV_URL || devServer?.env?.N8N_API_URL || 'https://n8n.santiagowuerich.info/api/v1').replace(/\/$/, ''),
      webhookBaseUrl: (process.env.N8N_DEV_WEBHOOK_URL || 'https://n8n.santiagowuerich.info').replace(/\/$/, ''),
      apiKey: process.env.N8N_DEV_KEY || devServer?.env?.N8N_API_KEY || ''
    };
  }
}

module.exports = {
  getMcpConfig,
  getEnvironmentConfig
};

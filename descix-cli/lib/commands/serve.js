/**
 * descix serve - Unified local gateway.
 *
 * Boots Vite programmatically as a reverse-proxy that routes the entire
 * DeSciX mesh (PWA, Core API, Powch, microservices) through a single
 * HTTPS port. Mirrors production's GCP Load Balancer routing locally.
 *
 * Routing is entirely data-driven via .descix/workspace.json:
 *   Platform Dev Mode -> all targets are localhost
 *   App Dev Mode      -> Core/Powch/PWA point to production, only the
 *                        developer's microservice is local
 */

import chalk from 'chalk';
import { WorkspaceConfig } from '../workspace-config.js';
import { createViteProxyConfig, getViteHttpsConfig, watchWorkspaceConfig } from '@descix/app-sdk/dev';

/**
 * Build the Vite `define` map from workspace config.
 * These globals are injected into any frontend code served through the gateway.
 */
function buildDefines(wsConfig) {
  const env = wsConfig.env || {};
  const powchApp = wsConfig.communities?.descix?.apps?.powch;

  let powchAppUrl = env.powchUrl || 'https://powch.descix.net/';
  if (powchApp?.pwa?.port) {
    powchAppUrl = `https://localhost:${powchApp.pwa.port}/`;
  }

  const apiGatewayUrl = env.apiUrl || wsConfig.apiUrl || 'https://localhost:4000';

  return {
    '__STANDALONE_APP_ID__': 'null',
    '__STANDALONE_APP_URL__': 'null',
    '__POWCH_APP_URL__': JSON.stringify(powchAppUrl),
    '__API_GATEWAY_URL__': JSON.stringify(apiGatewayUrl),
    'global': 'globalThis',
  };
}

export async function runServe(options = {}) {
  const port = options.port || 5173;
  const workspaceRoot = options.workspaceRoot || process.cwd();

  let wsConfig;
  try {
    wsConfig = await WorkspaceConfig.load(workspaceRoot);
  } catch (e) {
    console.error(chalk.red(e.message));
    process.exit(1);
  }

  const env = wsConfig.env || {};
  const apiGatewayUrl = env.apiUrl || wsConfig.apiUrl || 'https://localhost:4000';

  console.log(chalk.cyan('\n  descix-serve') + chalk.dim(' — Unified Local Gateway\n'));
  console.log(chalk.dim('  Workspace: ') + wsConfig.workspaceRoot);
  console.log(chalk.dim('  API:       ') + apiGatewayUrl);
  console.log(chalk.dim('  Port:      ') + port);
  console.log();

  const proxyRules = createViteProxyConfig(wsConfig.workspaceRoot, { apiGatewayUrl });
  const httpsConfig = getViteHttpsConfig();

  logProxyTable(proxyRules);

  const { createServer } = await import('vite');

  let server = await createServer({
    configFile: false,
    root: workspaceRoot,
    server: {
      port,
      ...httpsConfig,
      host: true,
      proxy: proxyRules,
    },
    define: buildDefines(wsConfig),
    optimizeDeps: {
      noDiscovery: true,
    },
  });

  await server.listen();
  console.log(chalk.green(`\n  Gateway listening on https://localhost:${port}\n`));

  const watcher = watchWorkspaceConfig(wsConfig.workspaceRoot, async (newConfig) => {
    const newEnv = newConfig.env || {};
    const newApiUrl = newEnv.apiUrl || newConfig.apiUrl || 'https://localhost:4000';
    const newProxy = createViteProxyConfig(wsConfig.workspaceRoot, { apiGatewayUrl: newApiUrl });

    console.log(chalk.yellow('\n  workspace.json changed — restarting gateway...\n'));
    logProxyTable(newProxy);

    await server.close();

    server = await createServer({
      configFile: false,
      root: workspaceRoot,
      server: {
        port,
        ...httpsConfig,
        host: true,
        proxy: newProxy,
      },
      define: buildDefines(wsConfig),
      optimizeDeps: {
        noDiscovery: true,
      },
    });

    await server.listen();
    console.log(chalk.green(`\n  Gateway restarted on https://localhost:${port}\n`));
  });

  process.on('SIGINT', () => {
    watcher.close();
    server.close();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    watcher.close();
    server.close();
    process.exit(0);
  });
}

function logProxyTable(proxy) {
  console.log(chalk.dim('  Proxy routes:'));
  for (const [route, config] of Object.entries(proxy)) {
    const target = config.target || '?';
    console.log(chalk.dim('    ') + chalk.white(route.padEnd(40)) + chalk.dim(' → ') + target);
  }
  console.log();
}

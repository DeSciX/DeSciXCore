/**
 * Conformance: the gateway port has ONE owner, and the server cannot drift off it.
 *
 * The defect this pins shut (measured 2026-08-19, redteam G-4.2/G-5): this very
 * workspace sets `env.gateway.port: 5599`, so `descix app open` printed
 * `https://localhost:5599/p/<app>` and the shell baked `:5599` into
 * __WORKSPACE_PRODUCTS__ — while `descix serve` with no flag listened on 5173,
 * because the CLI supplied its own `'5173'` default that shadowed the workspace.
 * The map and the server disagreed and nothing said so. With no `strictPort`,
 * a second gateway also silently walked to another port.
 *
 * Run: `node --test tests/gateway-port.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveGatewayPort,
  assertPort,
  portInUseMessage,
  DEFAULT_GATEWAY_PORT,
} from '../src/dev/gatewayPort.js';
import { listenOrFailLoud } from '../src/dev/gateway.js';
import { buildWorkspaceProducts, resolveAppGatewayUrl } from '../src/dev/workspaceProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const CLI_ROOT = path.resolve(SDK_ROOT, '..', 'descix-cli');

const GATEWAY_SRC = fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'gateway.js'), 'utf8');

/** Strip comments so source-shape guards never match their own prose. */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function withWorkspace(config, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gw-port-'));
  try {
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(config, null, 2));
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ------------------------------------------------------- the resolution chain

test('the chain is: --port > env.gateway.port > built-in default', () => {
  const configured = { env: { gateway: { port: 5599 }, products: [] } };
  const bare = { env: { products: [] } };

  assert.deepEqual(resolveGatewayPort(bare), {
    port: DEFAULT_GATEWAY_PORT, portSource: `built-in default (${DEFAULT_GATEWAY_PORT})`,
  });
  assert.equal(DEFAULT_GATEWAY_PORT, 5173);

  const fromConfig = resolveGatewayPort(configured);
  assert.equal(fromConfig.port, 5599);
  assert.equal(fromConfig.portSource, 'env.gateway.port');

  const fromFlag = resolveGatewayPort(configured, { port: 7000, portSource: '--port' });
  assert.equal(fromFlag.port, 7000, 'the flag must win over env.gateway.port');
  assert.equal(fromFlag.portSource, '--port');

  // The flag also wins over the built-in default in a bare workspace.
  assert.equal(resolveGatewayPort(bare, { port: 7000 }).port, 7000);
});

test('an absent workspace, an absent env, and an absent gateway block all land on the default', () => {
  for (const config of [undefined, {}, { env: {} }, { env: { gateway: {} } }]) {
    assert.equal(resolveGatewayPort(config).port, DEFAULT_GATEWAY_PORT, JSON.stringify(config));
  }
});

test('a string port (what commander hands over) is accepted; junk fails loud', () => {
  assert.equal(resolveGatewayPort({}, { port: '7000' }).port, 7000);
  assert.equal(resolveGatewayPort({ env: { gateway: { port: '5599' } } }).port, 5599);
  assert.throws(() => assertPort('not-a-port', '--port'), /Not a valid port.*from --port/s);
  assert.throws(() => assertPort(0, 'env.gateway.port'), /Not a valid port/);
  assert.throws(() => assertPort(70000, 'env.gateway.port'), /Not a valid port/);
});

// ------------------------------------------------- map and server agree (G-4.2)

test('the product map the shell bakes reads the SAME owner as the server', () => {
  const config = {
    version: '2.1',
    env: {
      gateway: { port: 5599 },
      products: [{ appId: 'egpt-godsworld', localPath: 'godsworld/codesite', site: { static: '.' } }],
    },
  };
  withWorkspace(config, (dir) => {
    const serverPort = resolveGatewayPort(config).port;
    assert.equal(serverPort, 5599);

    // buildWorkspaceProducts — what __WORKSPACE_PRODUCTS__ carries into the shell
    assert.equal(buildWorkspaceProducts(dir)['egpt-godsworld'], `https://localhost:${serverPort}/p/egpt-godsworld`);

    // resolveAppGatewayUrl — what `descix app open` prints
    const opened = resolveAppGatewayUrl(dir, 'egpt-godsworld');
    assert.equal(opened.gatewayPort, serverPort);
    assert.equal(opened.url, `https://localhost:${serverPort}/p/egpt-godsworld`);
  });
});

test('neither workspaceProducts nor the gateway re-derives the port by hand', () => {
  const wp = stripComments(fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'workspaceProducts.js'), 'utf8'));
  assert.ok(!/gateway\?\.port\s*\|\|/.test(wp), 'workspaceProducts re-derives env.gateway.port with its own default');
  assert.match(wp, /resolveGatewayPort/);
  assert.match(stripComments(GATEWAY_SRC), /resolveGatewayPort/);
});

// ------------------------------------------------------------ strictPort (G-5)

test('every server the gateway boots sets strictPort — no silent walk to another port', () => {
  const src = stripComments(GATEWAY_SRC);
  const servers = [...src.matchAll(/server:\s*\{/g)];
  assert.ok(servers.length >= 2, `expected the boot AND the workspace-change restart, found ${servers.length}`);
  const strict = [...src.matchAll(/strictPort:\s*true/g)];
  assert.equal(strict.length, servers.length,
    `strictPort: true appears ${strict.length}x for ${servers.length} server configs`);
});

test('the gateway never hardcodes 5173 — the default has one home', () => {
  assert.ok(!/5173/.test(stripComments(GATEWAY_SRC)), 'gateway.js hardcodes 5173');
  assert.ok(
    !/5173/.test(stripComments(fs.readFileSync(path.join(CLI_ROOT, 'lib', 'commands', 'serve.js'), 'utf8'))),
    'the CLI wrapper substitutes its own port default, shadowing env.gateway.port',
  );
});

// -------------------------------------------------- the collision message bites

test('the port-in-use message names BOTH the configured source and the flag', () => {
  const msg = portInUseMessage(5599, 'env.gateway.port');
  assert.match(msg, /port 5599 \(from env\.gateway\.port\) in use/);
  assert.match(msg, /--port/);
  assert.match(portInUseMessage(5173, 'built-in default (5173)'), /from built-in default \(5173\)/);
});

test('IN USE BITES: listenOrFailLoud converts EADDRINUSE into the honest message', async () => {
  const inUse = Object.assign(new Error('listen EADDRINUSE: address already in use :::5599'), { code: 'EADDRINUSE' });
  await assert.rejects(
    () => listenOrFailLoud({ listen: async () => { throw inUse; } }, 5599, 'env.gateway.port'),
    /port 5599 \(from env\.gateway\.port\) in use — pass --port <n> or free it/,
  );

  // Vite's strictPort message shape carries no code — matched on text.
  await assert.rejects(
    () => listenOrFailLoud({ listen: async () => { throw new Error('Port 5599 is already in use'); } }, 5599, '--port'),
    /port 5599 \(from --port\) in use/,
  );
});

test('a non-collision listen error is re-thrown untouched, not mislabelled', async () => {
  await assert.rejects(
    () => listenOrFailLoud({ listen: async () => { throw new Error('EACCES: permission denied'); } }, 443, '--port'),
    /EACCES: permission denied/,
  );
});

/**
 * Conformance: every URL the shell iframes is on the GATEWAY origin (G-1).
 *
 * The defect this pins shut (measured 2026-08-19, redteam G-1): for a product
 * with `site.port` — i.e. any app being developed behind its own framework dev
 * server — buildWorkspaceProducts returned the app's OWN origin
 * (`https://localhost:<site.port>`). The shell bakes that map into
 * __WORKSPACE_PRODUCTS__ and feeds it to the CodeSite iframe `src`, so the
 * iframe loaded a DIFFERENT origin than the shell. SplitView dispatches actions
 * by reaching into `iframeRef.current.contentWindow.DeSciX_Actions` — direct
 * interframe scripting, explicitly NO postMessage bridge — which throws a
 * cross-origin SecurityError the moment the origins differ. SplitView was
 * therefore broken for precisely the apps a developer is working on, and the
 * same file's `resolveAppGatewayUrl` (what `descix app open` prints) already
 * gave the correct gateway answer: two answers to "where is this app" in one
 * file.
 *
 * Settled by CEO-D-2026-08-19-SERVE-UX-AMB-RULINGS AMB-4: apps are ALWAYS
 * shell-origin when iframed. The gateway already proxies /p/{appId} to the
 * dev server with no path rewrite, so the gateway URL is the whole answer.
 *
 * Run: `node --test tests/workspace-products-origin.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildWorkspaceProducts,
  resolveAppGatewayUrl,
  gatewayOrigin,
  gatewayProductUrl,
} from '../src/dev/workspaceProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');

/** Strip comments so source-shape guards never match their own prose. */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function withWorkspace(config, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wp-origin-'));
  try {
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix', 'workspace.json'), JSON.stringify(config, null, 2));
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** A workspace with one of every routable shape, on a non-default gateway port. */
const CONFIG = {
  env: {
    gateway: { port: 5599 },
    platform: { appId: 'daita', site: { port: 5174 } },
    products: [
      { appId: 'egpt-godsworld', localPath: 'godsworld/codesite', site: { static: '.' } },
      { appId: 'egpt-frqtl', localPath: 'FRAQTL/site', site: { port: 5511 } },
      { appId: 'powch', localPath: 'DeSciX/DeSciX_Powch', site: { port: 5175, protocol: 'https' } },
      { appId: 'unmapped', localPath: 'nowhere' },
    ],
  },
};

const GATEWAY = 'https://localhost:5599';

// ------------------------------------------------- the fix, case by case (G-1)

test('a dev-server product is served to the shell on the GATEWAY origin, not its own port', () => {
  withWorkspace(CONFIG, (dir) => {
    const map = buildWorkspaceProducts(dir);
    assert.equal(map['egpt-frqtl'], `${GATEWAY}/p/egpt-frqtl`);
    assert.equal(map['powch'], `${GATEWAY}/p/powch`);
  });
});

test('a static product keeps its gateway URL (unchanged by the fix)', () => {
  withWorkspace(CONFIG, (dir) => {
    assert.equal(buildWorkspaceProducts(dir)['egpt-godsworld'], `${GATEWAY}/p/egpt-godsworld`);
  });
});

test('the platform (the shell itself) is the gateway ROOT', () => {
  withWorkspace(CONFIG, (dir) => {
    assert.equal(buildWorkspaceProducts(dir)['daita'], `${GATEWAY}/`);
  });
});

test('a product with no site config is not routable and stays out of the map', () => {
  withWorkspace(CONFIG, (dir) => {
    assert.equal(buildWorkspaceProducts(dir)['unmapped'], undefined);
  });
});

// ------------------------------------------------------- the invariant itself

test('NO url in the map names a product dev-server port — every one is the gateway origin', () => {
  withWorkspace(CONFIG, (dir) => {
    const map = buildWorkspaceProducts(dir);
    const upstreamPorts = [5174, 5511, 5175];
    for (const [appId, url] of Object.entries(map)) {
      assert.ok(
        url.startsWith(`${GATEWAY}/`),
        `${appId} -> ${url} is not on the gateway origin — SplitView's contentWindow reach dies cross-origin`,
      );
      for (const p of upstreamPorts) {
        assert.ok(!url.includes(`:${p}`), `${appId} -> ${url} leaks upstream port ${p} to the browser`);
      }
    }
  });
});

test('site.protocol describes the UPSTREAM and never reaches the browser-facing map', () => {
  const config = {
    env: {
      gateway: { port: 5599 },
      products: [{ appId: 'httpapp', localPath: 'a', site: { port: 6001, protocol: 'http' } }],
    },
  };
  withWorkspace(config, (dir) => {
    assert.equal(buildWorkspaceProducts(dir)['httpapp'], `${GATEWAY}/p/httpapp`);
  });
});

// ------------------------------------------------ ONE answer, driven off data

test('the shell map and `descix app open` give the SAME answer for every app', () => {
  withWorkspace(CONFIG, (dir) => {
    const map = buildWorkspaceProducts(dir);
    for (const appId of Object.keys(map)) {
      const opened = resolveAppGatewayUrl(dir, appId);
      assert.equal(
        map[appId].replace(/\/$/, ''),
        opened.url.replace(/\/$/, ''),
        `two answers for '${appId}': map says ${map[appId]}, app open says ${opened.url}`,
      );
    }
  });
});

test('both answers come from the SAME url builders — drift is structurally impossible', () => {
  const src = stripComments(fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'workspaceProducts.js'), 'utf8'));
  // No hand-built browser-facing localhost URL anywhere in the file.
  const handBuilt = [...src.matchAll(/['"`]https?:\/\/localhost/g)];
  assert.equal(
    handBuilt.length,
    1,
    'exactly one place may spell out the localhost origin (gatewayOrigin); found ' + handBuilt.length,
  );
  assert.match(src, /gatewayProductUrl\(gatewayPort, p\.appId\)/);
  assert.match(src, /const url = gatewayProductUrl\(gatewayPort, appId\)/);
});

test('the url builders are pure and independently correct', () => {
  assert.equal(gatewayOrigin(5599), 'https://localhost:5599');
  assert.equal(gatewayProductUrl(5599, 'egpt-frqtl'), 'https://localhost:5599/p/egpt-frqtl');
});

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
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildWorkspaceProducts,
  resolveAppGatewayUrl,
  gatewayOrigin,
  gatewayProductUrl,
} from '../src/dev/workspaceProducts.js';
import { withV3Tree } from './support/v3Tree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');

/** Strip comments so source-shape guards never match their own prose. */
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/**
 * A workspace with one of every routable shape, on a non-default gateway port. v3: the
 * gateway workspace lists the shell and the app repos; each repo's OWN workspace.json
 * carries its appId and site. Repo names equal the app ids.
 */
const TREE = {
  gateway: {
    port: 5599,
    shell: 'daita',
    appRepos: ['egpt-godsworld', 'egpt-frqtl', 'powch', 'egpt-godsworld-dev', 'unmapped'],
  },
  repos: {
    daita: { appId: 'daita', site: { port: 5174 } },
    'egpt-godsworld': { appId: 'egpt-godsworld', site: { static: '.' } },
    'egpt-frqtl': { appId: 'egpt-frqtl', site: { port: 5511 } },
    powch: { appId: 'powch', site: { port: 5175, protocol: 'https' } },
    'egpt-godsworld-dev': { appId: 'egpt-godsworld-dev', site: { port: 5175, protocol: 'https' } },
    unmapped: { appId: 'unmapped' },
  },
};
const withWorkspace = (fn) => withV3Tree(TREE, ({ dir }) => fn(dir));

const GATEWAY = 'https://localhost:5599';

// ------------------------------------------------- the fix, case by case (G-1)

test('a dev-server product is served to the shell on the GATEWAY origin, not its own port', () => {
  withWorkspace((dir) => {
    const map = buildWorkspaceProducts(dir);
    assert.equal(map['egpt-frqtl'], `${GATEWAY}/p/egpt-frqtl`);
    assert.equal(map['egpt-godsworld-dev'], `${GATEWAY}/p/egpt-godsworld-dev`);
  });
});

test('POWCH IS THE EXCEPTION and is absent from this map', () => {
  // This assertion previously read `map['powch'] === GATEWAY/p/powch`, i.e. it
  // asserted the security regression. Powch is the ZK-SSO identity silo and is
  // cross-origin BY DESIGN; putting it in the shell-origin map hands the wallet
  // to every hosted app. Full invariant: tests/powch-origin-isolation.test.js.
  withWorkspace((dir) => {
    assert.equal(buildWorkspaceProducts(dir)['powch'], undefined);
  });
});

test('a static product keeps its gateway URL (unchanged by the fix)', () => {
  withWorkspace((dir) => {
    assert.equal(buildWorkspaceProducts(dir)['egpt-godsworld'], `${GATEWAY}/p/egpt-godsworld`);
  });
});

test('the platform (the shell itself) is the gateway ROOT', () => {
  withWorkspace((dir) => {
    assert.equal(buildWorkspaceProducts(dir)['daita'], `${GATEWAY}/`);
  });
});

test('a product with no site config is not routable and stays out of the map', () => {
  withWorkspace((dir) => {
    assert.equal(buildWorkspaceProducts(dir)['unmapped'], undefined);
  });
});

// ------------------------------------------------------- the invariant itself

test('NO url in the map names a product dev-server port — every one is the gateway origin', () => {
  withWorkspace((dir) => {
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
  const spec = {
    gateway: { port: 5599, appRepos: ['httpapp'] },
    repos: { httpapp: { appId: 'httpapp', site: { port: 6001, protocol: 'http' } } },
  };
  withV3Tree(spec, ({ dir }) => {
    assert.equal(buildWorkspaceProducts(dir)['httpapp'], `${GATEWAY}/p/httpapp`);
  });
});

// ------------------------------------------------ ONE answer, driven off data

test('the shell map and `descix app open` give the SAME answer for every app', () => {
  withWorkspace((dir) => {
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
  assert.match(src, /gatewayProductUrl\(gatewayPort, app\.appId\)/);
  assert.match(src, /const url = gatewayProductUrl\(gatewayPort, appId\)/);
});

test('the url builders are pure and independently correct', () => {
  assert.equal(gatewayOrigin(5599), 'https://localhost:5599');
  assert.equal(gatewayProductUrl(5599, 'egpt-frqtl'), 'https://localhost:5599/p/egpt-frqtl');
});

// ---------------------------------------------------- static serving: charset

test('the gateway serves text as UTF-8 — a static app must not be mojibake', async () => {
  const { staticSitePlugin } = await import('../src/dev/staticSitePlugin.js');
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'staticSitePlugin.js'), 'utf8');
  // Measured in Chromium 2026-08-19: an em dash in a page served through
  // /p/{appId} rendered as mojibake because Content-Type carried no charset.
  for (const ext of ['.html', '.htm', '.js', '.mjs', '.css', '.json', '.md', '.txt']) {
    const line = src.split('\n').find((l) => l.trim().startsWith(`'${ext}':`));
    assert.ok(line, `no MIME entry for ${ext}`);
    assert.match(line, /charset=utf-8/, `${ext} is served without an explicit charset`);
  }
  assert.ok(typeof staticSitePlugin === 'function');
});

test('binary types are NOT given a charset', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'staticSitePlugin.js'), 'utf8');
  for (const ext of ['.png', '.woff2', '.wasm', '.ico']) {
    const line = src.split('\n').find((l) => l.trim().startsWith(`'${ext}':`));
    if (line) assert.doesNotMatch(line, /charset/, `${ext} must not carry a charset`);
  }
});

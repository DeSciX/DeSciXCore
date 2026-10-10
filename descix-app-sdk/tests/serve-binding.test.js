/**
 * Conformance: `descix serve` binds ONE app, standalone, and says so at a
 * served URL (CEO-D-2026-08-19-SERVE-UX-AMB-RULINGS, AMB-1c / AMB-2 / AMB-5).
 *
 * What this pins:
 *  - the binding is SERVED, not compiled. Standalone was previously expressible
 *    only as a build-time Vite define, and the gateway hardcoded that define to
 *    'null' — so `descix serve` could not express standalone AT ALL, and could
 *    not have: the shell it fronts arrives pre-built from the cloud and never
 *    passes through a define.
 *  - cwd picks the app, --app overrides, and NOTHING is persisted to
 *    workspace.json (a stored "current app" pointer is mutable state that lies).
 *  - when it cannot name an app it FAILS LOUD naming both fixes. It never falls
 *    back to store chrome: store chrome under serve is a BUG, not a mode.
 *
 * Run: `node --test tests/serve-binding.test.js` from descix-app-sdk/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  resolveServeBinding,
  detectAppFromCwd,
  bindableApps,
  appBindingPlugin,
  APP_BINDING_PATH,
} from '../src/dev/serveBinding.js';
import { APP_BINDING_PATH as BROWSER_SIDE_PATH, fetchAppBinding } from '../src/util/appBinding.js';
import { gatewayProductUrl } from '../src/dev/workspaceProducts.js';
import { withV3Tree } from './support/v3Tree.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SDK_ROOT = path.resolve(__dirname, '..');
const PORT = 5599;

// v3: the gateway workspace lists the platform shell and each app repo; each repo's OWN
// workspace.json carries its appId and site. "Standing in an app" means standing inside that
// repo's directory, so the repos are sibling directories of the gateway workspace.
const TREE = {
  gateway: { port: PORT, shell: 'DeSciX/DeSciX_Cloud/site', appRepos: ['godsworld', 'FRAQTL', 'FRAQTL/packages/inner'] },
  repos: {
    'DeSciX/DeSciX_Cloud/site': { appId: 'daita', site: { port: 5174 } },
    godsworld: { appId: 'egpt-godsworld', site: { static: 'codesite' } },
    FRAQTL: { appId: 'egpt-frqtl', site: { port: 5511 } },
    // deliberately nested inside FRAQTL to prove longest-match wins
    'FRAQTL/packages/inner': { appId: 'frqtl-inner', site: { port: 5512 } },
  },
};

/** fn receives { dir (the gateway workspace root), repos (name -> abs dir), config }. */
const withWorkspace = (fn) => withV3Tree(TREE, fn);

// ------------------------------------------------------------------- AMB-2

test('standing in an app directory binds THAT app — zero config', () => {
  withWorkspace(({ dir, repos, config }) => {
    const b = resolveServeBinding(dir, config, { cwd: repos.godsworld, gatewayPort: PORT });
    assert.equal(b.appId, 'egpt-godsworld');
    assert.equal(b.source, 'cwd');
  });
});

test('a subdirectory deep inside the app still binds the app', () => {
  withWorkspace(({ dir, repos, config }) => {
    const deep = path.join(repos.godsworld, 'a', 'b', 'c');
    fs.mkdirSync(deep, { recursive: true });
    assert.equal(resolveServeBinding(dir, config, { cwd: deep, gatewayPort: PORT }).appId, 'egpt-godsworld');
  });
});

test('a product nested inside another product resolves to the INNER one', () => {
  withWorkspace(({ dir, repos, config }) => {
    const inner = repos['FRAQTL/packages/inner'];
    assert.equal(detectAppFromCwd(dir, inner).appId, 'frqtl-inner');
    // and the outer directory still resolves to the outer app
    assert.equal(detectAppFromCwd(dir, repos.FRAQTL).appId, 'egpt-frqtl');
  });
});

test('--app overrides cwd', () => {
  withWorkspace(({ dir, repos, config }) => {
    const b = resolveServeBinding(dir, config, {
      cwd: repos.godsworld, app: 'egpt-frqtl', gatewayPort: PORT,
    });
    assert.equal(b.appId, 'egpt-frqtl');
    assert.equal(b.source, '--app');
  });
});

test('resolving the binding NEVER writes to workspace.json — no "current app" pointer', () => {
  withWorkspace(({ dir, repos, config }) => {
    const wsPath = path.join(dir, '.descix', 'workspace.json');
    const before = fs.readFileSync(wsPath, 'utf8');
    resolveServeBinding(dir, config, { cwd: repos.godsworld, gatewayPort: PORT });
    resolveServeBinding(dir, config, { app: 'egpt-frqtl', cwd: dir, gatewayPort: PORT });
    assert.equal(fs.readFileSync(wsPath, 'utf8'), before);
  });
});

// ------------------------------------------------------------ AMB-5: fail loud

test('from a directory that is no app, it FAILS LOUD naming BOTH fixes — never store chrome', () => {
  withWorkspace(({ dir, repos, config }) => {
    assert.throws(
      () => resolveServeBinding(dir, config, { cwd: dir, gatewayPort: PORT }),
      (e) => {
        assert.match(e.message, /cannot tell which app to serve/);
        assert.match(e.message, /cd into your app/);
        assert.match(e.message, /--app <id>/);
        assert.match(e.message, /egpt-frqtl/, 'must list the apps it could have served');
        assert.match(e.message, /there is no store view here/, 'must say WHY it will not just boot the store');
        return true;
      },
    );
  });
});

test('--app with an unknown id fails loud and lists what exists', () => {
  withWorkspace(({ dir, repos, config }) => {
    assert.throws(
      () => resolveServeBinding(dir, config, { app: 'nope', cwd: dir, gatewayPort: PORT }),
      /not in this workspace[\s\S]*egpt-godsworld[\s\S]*descix app init/,
    );
  });
});

test('the platform shell cannot be served as its own standalone app', () => {
  withWorkspace(({ dir, repos, config }) => {
    assert.throws(
      () => resolveServeBinding(dir, config, { app: 'daita', cwd: dir, gatewayPort: PORT }),
      /PLATFORM shell itself/,
    );
    // and standing in the platform directory is the same refusal, not a silent store boot
    assert.throws(
      () => resolveServeBinding(dir, config, { cwd: repos['DeSciX/DeSciX_Cloud/site'], gatewayPort: PORT }),
      /cannot tell which app to serve/,
    );
  });
});

test('a missing gatewayPort is a programming error, not a guess', () => {
  withWorkspace(({ dir, repos, config }) => {
    assert.throws(() => resolveServeBinding(dir, config, { app: 'egpt-frqtl', cwd: dir }), /gatewayPort is required/);
  });
});

// ------------------------------------------------------- the payload + AMB-1c

test('the binding names the app and its GATEWAY url — same owner as the product map', () => {
  withWorkspace(({ dir, repos, config }) => {
    const b = resolveServeBinding(dir, config, { app: 'egpt-frqtl', cwd: dir, gatewayPort: PORT });
    assert.equal(b.mode, 'standalone');
    assert.equal(b.appUrl, gatewayProductUrl(PORT, 'egpt-frqtl'));
    assert.equal(b.appUrl, `https://localhost:${PORT}/p/egpt-frqtl`);
  });
});

test('bindableApps sees the platform shell and every listed app repo', () => {
  withWorkspace(({ dir, repos }) => {
    const apps = bindableApps(dir);
    assert.deepEqual(apps.map((a) => a.appId).sort(),
      ['daita', 'egpt-frqtl', 'egpt-godsworld', 'frqtl-inner']);
    assert.deepEqual(apps.filter((a) => a.isPlatform).map((a) => a.appId), ['daita'], 'only the shell is the platform');
    assert.equal(apps.find((a) => a.appId === 'egpt-frqtl').dir, repos.FRAQTL);
  });
  // a workspace that holds no app and lists none binds nothing
  withV3Tree({ env: { apiUrl: 'https://descix.net' } }, ({ dir }) => assert.deepEqual(bindableApps(dir), []));
});

test('bindableApps on a directory with no workspace fails loud — it never reports "no apps"', () => {
  assert.throws(() => bindableApps(path.join(SDK_ROOT, 'no-such-workspace')), /No \.descix\/workspace\.json/);
});

test('gateway and browser agree on ONE spelling of the binding path', () => {
  assert.equal(APP_BINDING_PATH, BROWSER_SIDE_PATH);
  assert.equal(APP_BINDING_PATH, '/__descix/app-binding.json');
});

// --------------------------------------------------------------- the plugin

function runMiddleware(plugin, url) {
  let mw;
  plugin.configureServer({ middlewares: { use: (fn) => { mw = fn; } } });
  const headers = {};
  let ended = null, nexted = false;
  mw({ url }, { setHeader: (k, v) => { headers[k] = v; }, end: (b) => { ended = b; } }, () => { nexted = true; });
  return { headers, ended, nexted };
}

test('the plugin answers the binding path and passes everything else through', () => {
  const binding = { mode: 'standalone', appId: 'egpt-frqtl', appUrl: 'https://localhost:5599/p/egpt-frqtl', source: 'cwd' };
  const plugin = appBindingPlugin(binding);

  const hit = runMiddleware(plugin, APP_BINDING_PATH);
  assert.equal(hit.nexted, false);
  assert.deepEqual(JSON.parse(hit.ended), binding);
  assert.match(hit.headers['Content-Type'], /application\/json/);
  // per-session state: a developer switching apps must not get a cached answer
  assert.equal(hit.headers['Cache-Control'], 'no-store');

  assert.equal(runMiddleware(plugin, APP_BINDING_PATH + '?v=1').nexted, false, 'query string must not defeat the route');
  assert.equal(runMiddleware(plugin, '/p/egpt-frqtl/').nexted, true);
  assert.equal(runMiddleware(plugin, '/').nexted, true, 'the shell root must still reach the proxy');
});

// ------------------------------------------------- the browser-side reader

test('fetchAppBinding returns the binding when the origin serves one', async () => {
  const binding = { mode: 'standalone', appId: 'egpt-frqtl', appUrl: 'x' };
  const got = await fetchAppBinding({ fetchImpl: async () => ({ ok: true, json: async () => binding }) });
  assert.deepEqual(got, binding);
});

test('no binding served (the STORE) is null, not an error', async () => {
  assert.equal(await fetchAppBinding({ fetchImpl: async () => ({ ok: false, status: 404 }) }), null);
});

test('a malformed binding is treated as absent, never half-applied', async () => {
  const bad = [{ mode: 'standalone' }, { appId: 'x' }, { mode: 'store', appId: 'x' }, null];
  for (const b of bad) {
    assert.equal(await fetchAppBinding({ fetchImpl: async () => ({ ok: true, json: async () => b }) }), null);
  }
});

test('a network failure degrades to the store rather than refusing to boot', async () => {
  assert.equal(await fetchAppBinding({ fetchImpl: async () => { throw new Error('offline'); } }), null);
});

// ------------------------------------------------------------- SUPER-DRY

test('the gateway no longer pretends to express standalone with a define', () => {
  const src = fs.readFileSync(path.join(SDK_ROOT, 'src', 'dev', 'gateway.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(src, /'__STANDALONE_APP_ID__'\s*:/, 'the dead define is still emitted');
  assert.doesNotMatch(src, /'__STANDALONE_APP_URL__'\s*:/, 'the dead define is still emitted');
  assert.match(src, /appBindingPlugin/, 'the gateway must serve the binding instead');
});

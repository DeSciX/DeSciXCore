/**
 * Tests for `descix microservice restart <name>`.
 *
 * All OS interactions are mocked via the `deps` dependency-injection seam
 * exposed by lib/commands/microservice-restart.js, so no real ports, PIDs,
 * processes, or files are touched.
 *
 * Run: node --test tests/microservice-restart.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { WorkspaceConfig } from '../lib/workspace-config.js';
import { makeV3Tree } from './tools/v3-tree.mjs';

import {
  buildRestartRegistry,
  resolveService,
  killPid,
  resolveLogPath,
  restartMicroservice
} from '../lib/commands/microservice-restart.js';

/* ------------------------------------------------------------------ */
/* Fixture helpers                                                     */
/* ------------------------------------------------------------------ */

/**
 * A real v3 gateway tree on disk, loaded through WorkspaceConfig.load: daita is the gateway
 * SHELL repo and the other apps are sibling repos the gateway lists, each holding its own
 * single-app workspace.json. The restart registry is whatever resolveWorkspaceApps makes of
 * that tree — never hand-expanded here. Only the OS (lsof/kill/spawn/fs) is mocked.
 *
 * @returns {Promise<{ ws: WorkspaceConfig, repos: Object<string,string> }>} repos: name -> abs dir
 */
async function fakeWorkspaceConfig(t, extraRepos = {}) {
  const repos = {
    daita: { appId: 'daita', microservice: { port: 4000, devCommand: 'nodemon app.js' } },
    beast: { appId: 'beast', microservice: { port: 3011, devCommand: 'node app.js' } },
    powch: { appId: 'powch', microservice: { port: 3003, devCommand: 'npm run dev:service' } },
    // Entry with no devCommand — kept in the registry so resolveService names the real gap.
    'noop-service': { appId: 'noop-service', microservice: { port: 9999 } },
    // Entry with neither port nor microservice — should NOT appear.
    'docs-only': { appId: 'docs-only' },
    ...extraRepos,
  };
  const tree = await makeV3Tree(t, {
    gateway: { shell: 'daita', appRepos: Object.keys(repos).filter((n) => n !== 'daita') },
    repos,
  });
  return { ws: await WorkspaceConfig.load(tree.dir), repos: tree.repos };
}

/**
 * Build a complete `deps` stub for restartMicroservice.
 *
 * `scenario` controls behavior:
 *   - listeningPid: PID returned by initial lsof (or null = no listener)
 *   - postLaunchPid: PID lsof returns *after* spawn (or null = bind timeout)
 *   - spawnPid: PID returned by spawn()
 *   - killBehavior: 'graceful' | 'requires_sigkill' | 'noop'
 */
function makeDeps(scenario = {}) {
  const calls = {
    execAsync: [],
    spawn: [],
    kill: [],
    fsMkdir: [],
    fsOpen: [],
    sleep: [],
    health: []
  };
  let lsofCallCount = 0;

  const deps = {
    // lsof -iTCP:<port> -sTCP:LISTEN -t
    execAsync: async (cmd) => {
      calls.execAsync.push(cmd);
      lsofCallCount++;
      // First lsof call = pre-kill detection.
      if (lsofCallCount === 1) {
        if (scenario.listeningPid) return { stdout: `${scenario.listeningPid}\n` };
        return { stdout: '' };
      }
      // Subsequent lsof calls = waitForPort polling.
      if (scenario.postLaunchPid) return { stdout: `${scenario.postLaunchPid}\n` };
      return { stdout: '' };
    },

    spawn: (cmd, args, opts) => {
      calls.spawn.push({ cmd, args, opts });
      return { pid: scenario.spawnPid ?? 99999, unref: () => {} };
    },

    processKill: (pid, sig) => {
      calls.kill.push({ pid, sig });
      const mode = scenario.killBehavior || 'graceful';
      if (sig === 0) {
        // probe: alive vs dead
        const sigtermCount = calls.kill.filter((c) => c.sig === 'SIGTERM').length;
        if (mode === 'graceful' && sigtermCount > 0) {
          const err = new Error('No such process');
          err.code = 'ESRCH';
          throw err;
        }
        if (mode === 'requires_sigkill') {
          // remains alive until SIGKILL.
          const sigkillCount = calls.kill.filter((c) => c.sig === 'SIGKILL').length;
          if (sigkillCount === 0) return; // still alive
          const err = new Error('No such process');
          err.code = 'ESRCH';
          throw err;
        }
        if (mode === 'noop') {
          const err = new Error('No such process');
          err.code = 'ESRCH';
          throw err;
        }
      }
    },

    fs: {
      mkdir: async (dir, opts) => { calls.fsMkdir.push({ dir, opts }); },
      open: async (p) => {
        calls.fsOpen.push(p);
        return { fd: 123, close: async () => {} };
      }
    },

    sleep: async (ms) => { calls.sleep.push(ms); },

    runHealth: async (opts) => {
      calls.health.push(opts);
      return {
        services: [{ appId: opts.microservice, healthy: scenario.healthOk !== false }]
      };
    },

    log: () => {}
  };

  return { deps, calls };
}

/* ------------------------------------------------------------------ */
/* Tests — registry / resolution                                       */
/* ------------------------------------------------------------------ */

test('buildRestartRegistry: includes every entry with a microservice.port', async (t) => {
  // Entries with port but missing devCommand are kept in the registry so
  // the user gets a specific 'add devCommand' error from resolveService —
  // not a generic 'not found' that would mask the real misconfiguration.
  const { ws } = await fakeWorkspaceConfig(t);
  const reg = buildRestartRegistry(ws);
  const names = reg.map((s) => s.name).sort();
  assert.deepEqual(names, ['beast', 'daita', 'noop-service', 'powch']);
  for (const svc of reg) {
    assert.ok(svc.port, `${svc.name} must have a port`);
    assert.ok(svc.microserviceDir.endsWith('/microservice'),
      `${svc.name} cwd must end with /microservice`);
    assert.equal(svc.microserviceDir, path.join(svc.dir, 'microservice'), `${svc.name} cwd is its own repo's microservice/`);
  }
  // docs-only has no microservice block at all — excluded.
  assert.equal(reg.find((s) => s.name === 'docs-only'), undefined);
});

test('resolveService: returns the beast entry from the unified registry', async (t) => {
  const { ws, repos } = await fakeWorkspaceConfig(t);
  const svc = resolveService(ws, 'beast');
  assert.equal(svc.name, 'beast');
  assert.equal(svc.port, 3011);
  assert.equal(svc.devCommand, 'node app.js');
  assert.equal(svc.microserviceDir, path.join(repos.beast, 'microservice'));
});

test('resolveService: HARD-FAILS with candidate list on unknown name', async (t) => {
  const { ws } = await fakeWorkspaceConfig(t);
  assert.throws(
    () => resolveService(ws, 'unknown-service'),
    (err) => {
      assert.match(err.message, /Service 'unknown-service' is not served by this workspace \(env\.app \/ env\.gateway\)/);
      assert.match(err.message, /Restart-eligible services/);
      assert.match(err.message, /beast/);
      assert.match(err.message, /powch/);
      assert.match(err.message, /daita/);
      return true;
    }
  );
});

test('resolveService: HARD-FAILS when devCommand is missing (no silent fallback)', async (t) => {
  // Per feedback_no-hardcoded-fallbacks: missing devCommand must surface a
  // specific 'add devCommand' error, never a guessed launch signature.
  const { ws } = await fakeWorkspaceConfig(t);
  assert.throws(
    () => resolveService(ws, 'noop-service'),
    (err) => {
      assert.match(err.message, /no microservice\.devCommand/);
      assert.match(err.message, /cannot determine canonical launch signature/);
      assert.match(err.message, /env\.app\.microservice/, 'remedy names the v3 location');
      return true;
    }
  );
});

test('buildRestartRegistry: two repos claiming ONE app id are refused by the app-set owner, not picked between', async (t) => {
  // Not legal in a real gateway config. The duplicate is refused where the app set is built
  // (resolveWorkspaceApps), so no restart-side "ambiguous" pick can ever be reached.
  const { ws } = await fakeWorkspaceConfig(t, {
    'duplicate-a': { appId: 'duplicate', microservice: { port: 1, devCommand: 'a' } },
    'duplicate-b': { appId: 'duplicate', microservice: { port: 2, devCommand: 'b' } },
  });
  assert.throws(() => buildRestartRegistry(ws), /app id 'duplicate' appears twice/);
});

test('buildRestartRegistry: a config with no workspaceRoot FAILS LOUD, never reads the cwd instead', () => {
  const bare = new WorkspaceConfig({ version: '3.0', env: { app: { appId: 'x', microservice: { port: 1, devCommand: 'a' } } } });
  assert.throws(() => buildRestartRegistry(bare), /carries no workspaceRoot/);
});

/* ------------------------------------------------------------------ */
/* Tests — kill behavior                                               */
/* ------------------------------------------------------------------ */

test('killPid: SIGTERM-only when process exits gracefully', async () => {
  const { deps, calls } = makeDeps({ killBehavior: 'graceful' });
  const res = await killPid(12345, { deps, gracePeriodMs: 1000, pollMs: 10 });
  assert.equal(res.method, 'SIGTERM');
  assert.deepEqual(
    calls.kill.filter((c) => c.sig === 'SIGTERM').map((c) => c.pid),
    [12345]
  );
  assert.equal(calls.kill.filter((c) => c.sig === 'SIGKILL').length, 0);
});

test('killPid: escalates to SIGKILL when SIGTERM is ignored', async () => {
  const { deps, calls } = makeDeps({ killBehavior: 'requires_sigkill' });
  const res = await killPid(54321, { deps, gracePeriodMs: 50, pollMs: 10 });
  assert.equal(res.method, 'SIGKILL');
  assert.ok(calls.kill.some((c) => c.sig === 'SIGTERM'));
  assert.ok(calls.kill.some((c) => c.sig === 'SIGKILL'));
});

/* ------------------------------------------------------------------ */
/* Tests — log path                                                    */
/* ------------------------------------------------------------------ */

test('resolveLogPath: canonical <app repo>/.descix/logs/ path', async (t) => {
  const { deps, calls } = makeDeps();
  const { ws, repos } = await fakeWorkspaceConfig(t);
  const svc = resolveService(ws, 'beast');
  const res = await resolveLogPath(svc, {
    deps,
    timestamp: '2026-05-26T12-34-56Z'
  });
  assert.equal(res.fallback, false);
  assert.equal(
    res.path,
    path.join(repos.beast, '.descix', 'logs', 'beast-2026-05-26T12-34-56Z.log')
  );
  assert.equal(calls.fsMkdir.length, 1);
});

test('resolveLogPath: falls back to /tmp when canonical dir is uncreatable', async (t) => {
  const { deps } = makeDeps();
  deps.fs.mkdir = async () => { throw new Error('EROFS read-only'); };
  const { ws } = await fakeWorkspaceConfig(t);
  const res = await resolveLogPath(resolveService(ws, 'beast'), {
    deps,
    timestamp: '2026-05-26T12-34-56Z'
  });
  assert.equal(res.fallback, true);
  assert.equal(res.path, '/tmp/beast-restart-2026-05-26T12-34-56Z.log');
  assert.match(res.fallbackReason, /EROFS/);
});

/* ------------------------------------------------------------------ */
/* Tests — top-level orchestrator                                      */
/* ------------------------------------------------------------------ */

test('restartMicroservice: env=demo HARD-FAILS with deploy-script pointer', async () => {
  await assert.rejects(
    restartMicroservice({ name: 'beast', env: 'demo' }),
    (err) => {
      assert.match(err.message, /DEMO and PROD restarts are out of scope/);
      assert.match(err.message, /gcloud run services update beast-demo/);
      return true;
    }
  );
});

test('restartMicroservice: env=prod HARD-FAILS with deploy-script pointer', async () => {
  await assert.rejects(
    restartMicroservice({ name: 'beast', env: 'prod' }),
    /gcloud run services update beast-prod/
  );
});

test('restartMicroservice: unknown service surfaces the candidate list', async (t) => {
  const { ws, repos } = await fakeWorkspaceConfig(t);
  const { deps } = makeDeps();
  await assert.rejects(
    restartMicroservice({ name: 'unknown', env: 'dev', deps, workspaceConfig: ws }),
    (err) => {
      assert.match(err.message, /Service 'unknown' is not served by this workspace \(env\.app \/ env\.gateway\)/);
      assert.match(err.message, /Restart-eligible services.*beast.*powch/s);
      return true;
    }
  );
});

test('restartMicroservice: full happy path — finds PID, kills, relaunches, emits new PID', async (t) => {
  const { ws, repos } = await fakeWorkspaceConfig(t);
  const { deps, calls } = makeDeps({
    listeningPid: 11111,    // pre-kill
    postLaunchPid: 22222,   // bound after relaunch
    spawnPid: 33333,
    killBehavior: 'graceful',
    healthOk: true
  });

  const res = await restartMicroservice({
    name: 'beast',
    env: 'dev',
    deps,
    workspaceConfig: ws
  });

  // Old PID was discovered + killed.
  assert.equal(res.oldPid, 11111);
  assert.ok(calls.kill.some((c) => c.pid === 11111 && c.sig === 'SIGTERM'));

  // New process was spawned with the canonical signature.
  assert.equal(calls.spawn.length, 1);
  const spawnCall = calls.spawn[0];
  assert.equal(spawnCall.cmd, 'bash');
  assert.deepEqual(spawnCall.args, ['-lc', 'node app.js']);
  assert.equal(spawnCall.opts.cwd, path.join(repos.beast, 'microservice'));
  assert.equal(spawnCall.opts.detached, true);

  // Port was confirmed bound; new PID surfaced.
  assert.equal(res.newPid, 22222);
  assert.equal(res.port, 3011);
  assert.match(res.logPath, /beast-.*\.log$/);
  assert.equal(res.logFallback, false);

  // Health check ran.
  assert.equal(calls.health.length, 1);
  assert.equal(calls.health[0].microservice, 'beast');
});

test('restartMicroservice: succeeds when no PID is listening initially (cold start)', async (t) => {
  const { ws, repos } = await fakeWorkspaceConfig(t);
  const { deps, calls } = makeDeps({
    listeningPid: null,      // nothing running
    postLaunchPid: 44444,
    spawnPid: 55555,
    killBehavior: 'noop'
  });

  const res = await restartMicroservice({
    name: 'beast',
    env: 'dev',
    deps,
    workspaceConfig: ws
  });

  assert.equal(res.oldPid, null);
  assert.equal(calls.kill.length, 0); // no kill issued
  assert.equal(res.newPid, 44444);
});

test('restartMicroservice: FAILS when port does not bind after launch', async (t) => {
  const { ws, repos } = await fakeWorkspaceConfig(t);
  const { deps } = makeDeps({
    listeningPid: 11111,
    postLaunchPid: null,    // never binds
    spawnPid: 33333,
    killBehavior: 'graceful'
  });

  await assert.rejects(
    restartMicroservice({
      name: 'beast',
      env: 'dev',
      deps,
      workspaceConfig: ws,
      waitOptions: { timeoutMs: 50, pollMs: 5 }
    }),
    /did not bind to :3011/
  );
});

test('restartMicroservice: powch uses its `npm run dev:service` signature', async (t) => {
  const { ws, repos } = await fakeWorkspaceConfig(t);
  const { deps, calls } = makeDeps({
    listeningPid: 7777,
    postLaunchPid: 8888,
    spawnPid: 9999,
    killBehavior: 'graceful'
  });

  const res = await restartMicroservice({
    name: 'powch',
    env: 'dev',
    deps,
    workspaceConfig: ws
  });

  assert.equal(res.devCommand, 'npm run dev:service');
  assert.equal(calls.spawn[0].args[1], 'npm run dev:service');
  assert.equal(calls.spawn[0].opts.cwd, path.join(repos.powch, 'microservice'));
  assert.equal(res.port, 3003);
});

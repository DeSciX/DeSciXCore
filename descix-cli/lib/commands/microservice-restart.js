/**
 * Microservice Restart Command (DEV only)
 *
 * Eliminates the "hand-kill + nohup-relaunch" tribal-knowledge workflow:
 *   1. Resolve the service from workspace.json `env.platform` / `env.products`
 *      (HARD-FAIL on unknown / ambiguous / missing devCommand).
 *   2. Find the running PID via `lsof -iTCP:<port> -sTCP:LISTEN` (or `ps`).
 *   3. SIGTERM → wait up to 5s → SIGKILL.
 *   4. Re-launch the canonical devCommand from `{workspaceRoot}/{localPath}/microservice/`
 *      detached via `setsid + nohup`, redirecting stdout/stderr to a canonical log.
 *   5. Poll until the port is bound again; print new PID + log path.
 *   6. Run `descix health -m <name>` and print the result.
 *
 * Scope:
 *   - v1: --env=dev only. --env=demo|prod HARD-FAIL with deploy-script pointer.
 *
 * Design rules:
 *   - NO hardcoded launch signatures (would mask workspace.json drift).
 *   - NO fallback log path defaults — falls back to /tmp ONLY if the canonical
 *     dir cannot be created (e.g. read-only FS), and logs the fallback reason.
 *   - Mockable: all OS interactions (lsof / ps / kill / spawn / fs / health)
 *     pass through injectable `deps`. Tests substitute an in-memory stub.
 */

import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { WorkspaceConfig } from '../workspace-config.js';

const execAsync = promisify(exec);

/** Sleep helper (real-time; tests inject a fake). */
const realSleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/* Service registry resolution                                         */
/* ------------------------------------------------------------------ */

/**
 * Build the restart-eligible service registry from workspace.json.
 * Only entries with BOTH `microservice.port` and `microservice.devCommand`
 * are restart-eligible (devCommand is the canonical launch signature).
 *
 * @param {WorkspaceConfig} wsConfig
 * @returns {Array<{name, localPath, port, devCommand, microserviceDir}>}
 */
export function buildRestartRegistry(wsConfig) {
  const env = wsConfig.env || {};
  const root = wsConfig.workspaceRoot;
  const out = [];

  const collect = (entry) => {
    if (!entry?.appId || !entry?.localPath) return;
    const ms = entry.microservice;
    if (!ms || !ms.port) return;
    out.push({
      name: entry.appId,
      localPath: entry.localPath,
      port: ms.port,
      devCommand: ms.devCommand || null,
      microserviceDir: path.join(root, entry.localPath, 'microservice')
    });
  };

  collect(env.platform);
  for (const p of (env.products || [])) collect(p);
  return out;
}

/**
 * Resolve a service entry by name. Hard-fail on unknown / ambiguous /
 * missing devCommand. Caller is expected to propagate the thrown Error.
 *
 * @param {WorkspaceConfig} wsConfig
 * @param {string} name
 * @returns {{name, localPath, port, devCommand, microserviceDir}}
 */
export function resolveService(wsConfig, name) {
  const registry = buildRestartRegistry(wsConfig);
  const matches = registry.filter((s) => s.name === name);

  if (matches.length === 0) {
    const candidates = registry.map((s) => s.name).join(', ') || '(none)';
    throw new Error(
      `Service '${name}' not found in workspace.json env.platform/env.products.\n` +
      `  Restart-eligible services (with microservice.port + microservice.devCommand): ${candidates}\n` +
      `  Add an entry to .descix/workspace.json or run 'descix microservice list'.`
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `Service name '${name}' is ambiguous — matches ${matches.length} entries: ` +
      matches.map((m) => `${m.name}@${m.localPath}`).join(', ')
    );
  }

  const svc = matches[0];
  if (!svc.devCommand) {
    throw new Error(
      `Service '${name}' has no microservice.devCommand in workspace.json — ` +
      `cannot determine canonical launch signature. ` +
      `Add 'devCommand' under env.products[].microservice to enable restart.`
    );
  }
  return svc;
}

/* ------------------------------------------------------------------ */
/* PID discovery                                                       */
/* ------------------------------------------------------------------ */

/**
 * Find the PID listening on a TCP port via `lsof`.
 * Returns null when nothing is listening (clean state — restart still
 * proceeds to launch).
 */
async function findPidByPort(port, deps) {
  const run = deps?.execAsync || execAsync;
  try {
    const { stdout } = await run(`lsof -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null`);
    const lines = stdout.split('\n').map((s) => s.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    // lsof -t emits PIDs one per line. If multiple, take the first listener.
    return parseInt(lines[0], 10) || null;
  } catch {
    // `lsof` exits non-zero when no match — that is the "nothing listening" case.
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Kill                                                                */
/* ------------------------------------------------------------------ */

/**
 * SIGTERM the PID, wait up to `gracePeriodMs`, then SIGKILL if still alive.
 * Considers PID "gone" when `process.kill(pid, 0)` throws ESRCH.
 */
export async function killPid(pid, opts = {}) {
  const deps = opts.deps || {};
  const gracePeriodMs = opts.gracePeriodMs ?? 5000;
  const pollMs = opts.pollMs ?? 250;
  const sleep = deps.sleep || realSleep;
  const procKill = deps.processKill || ((p, sig) => process.kill(p, sig));

  procKill(pid, 'SIGTERM');

  const deadline = Date.now() + gracePeriodMs;
  while (Date.now() < deadline) {
    try {
      procKill(pid, 0);
    } catch (err) {
      if (err.code === 'ESRCH') return { method: 'SIGTERM', pid };
      // EPERM = process exists but we cannot signal it — treat as alive.
    }
    await sleep(pollMs);
  }

  // Still alive — SIGKILL.
  try {
    procKill(pid, 'SIGKILL');
  } catch {
    /* already dead */
  }
  return { method: 'SIGKILL', pid };
}

/* ------------------------------------------------------------------ */
/* Launch                                                              */
/* ------------------------------------------------------------------ */

/**
 * Resolve the canonical log path for a restart.
 *   apps/<community>/<app>/.descix/logs/<service>-<ts>.log
 * Falls back to /tmp/<service>-restart-<ts>.log if the canonical dir
 * cannot be created.
 */
export async function resolveLogPath(wsConfig, serviceName, opts = {}) {
  const deps = opts.deps || {};
  const fsImpl = deps.fs || fs;
  const ts = (opts.timestamp || new Date().toISOString()).replace(/[:.]/g, '-');
  const root = wsConfig.workspaceRoot;
  const community = wsConfig.env?.communityId || 'unkamon';
  const canonicalDir = path.join(root, 'apps', community, serviceName, '.descix', 'logs');
  try {
    await fsImpl.mkdir(canonicalDir, { recursive: true });
    return {
      path: path.join(canonicalDir, `${serviceName}-${ts}.log`),
      fallback: false
    };
  } catch (err) {
    return {
      path: path.join('/tmp', `${serviceName}-restart-${ts}.log`),
      fallback: true,
      fallbackReason: err.message
    };
  }
}

/**
 * Launch the canonical devCommand detached, with stdout/stderr appended
 * to `logPath`. Returns the spawned PID.
 *
 * NOTE: We deliberately invoke through `bash -lc` so devCommands like
 * `npm run dev:service` or `nodemon app.js` resolve PATH the same way an
 * interactive shell would.
 */
export async function launchService(svc, logPath, opts = {}) {
  const deps = opts.deps || {};
  const fsImpl = deps.fs || fs;
  const spawnImpl = deps.spawn || spawn;

  // Open the log file in append mode for redirection.
  const logFd = await fsImpl.open(logPath, 'a');
  const stdout = logFd.fd ?? logFd; // node fs Promise FileHandle vs raw fd
  // For real fs/promises, we get a FileHandle; need .fd. For tests, accept raw.
  const stdoutFd = typeof stdout === 'number' ? stdout : logFd.fd;

  const child = spawnImpl('bash', ['-lc', svc.devCommand], {
    cwd: svc.microserviceDir,
    detached: true,
    stdio: ['ignore', stdoutFd, stdoutFd],
    env: { ...process.env }
  });

  // Detach so the child survives the CLI exit.
  if (typeof child.unref === 'function') child.unref();

  // Close our FD in the parent — the child has its own dup'd handle.
  if (typeof logFd.close === 'function') {
    try { await logFd.close(); } catch { /* fd already adopted */ }
  }

  return child.pid;
}

/* ------------------------------------------------------------------ */
/* Port-bound poll                                                     */
/* ------------------------------------------------------------------ */

/**
 * Wait until something is listening on `port`, polling every `pollMs`
 * up to `timeoutMs`. Returns the new PID, or null on timeout.
 */
export async function waitForPort(port, opts = {}) {
  const deps = opts.deps || {};
  const sleep = deps.sleep || realSleep;
  const timeoutMs = opts.timeoutMs ?? 15000;
  const pollMs = opts.pollMs ?? 500;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const pid = await findPidByPort(port, deps);
    if (pid) return pid;
    await sleep(pollMs);
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Top-level orchestrator                                              */
/* ------------------------------------------------------------------ */

/**
 * Restart a microservice. Returns a structured result for tests + CLI.
 *
 * @param {Object} args
 * @param {string} args.name        Service name (e.g. 'beast').
 * @param {string} args.env         'dev' | 'demo' | 'prod'.
 * @param {Object} [args.deps]      Dependency-injection overrides for tests.
 * @param {Object} [args.workspaceConfig] Pre-loaded config (test override).
 */
export async function restartMicroservice(args) {
  const { name, env, deps = {} } = args;
  const log = deps.log || ((msg) => console.log(msg));

  // Env gate — demo/prod out of scope for v1.
  if (env && env !== 'dev') {
    throw new Error(
      `DEMO and PROD restarts are out of scope for 'descix microservice restart'; ` +
      `use 'gcloud run services update ${name}-${env}' or the deploy script.`
    );
  }

  const wsConfig = args.workspaceConfig || await WorkspaceConfig.load(process.cwd());
  const svc = resolveService(wsConfig, name);

  log(chalk.cyan(`\nRestarting microservice '${svc.name}' (DEV)`));
  log(chalk.gray(`  cwd:        ${svc.microserviceDir}`));
  log(chalk.gray(`  command:    ${svc.devCommand}`));
  log(chalk.gray(`  port:       ${svc.port}\n`));

  // Step 1: locate running PID.
  const oldPid = await findPidByPort(svc.port, deps);
  if (oldPid) {
    log(chalk.gray(`  Found PID ${oldPid} listening on :${svc.port}`));
    const killResult = await killPid(oldPid, { deps });
    log(chalk.green(`  Killed PID ${oldPid} via ${killResult.method}`));
  } else {
    log(chalk.yellow(`  No PID listening on :${svc.port} — launching fresh`));
  }

  // Step 2: resolve log path.
  const logRes = await resolveLogPath(wsConfig, svc.name, { deps });
  if (logRes.fallback) {
    log(chalk.yellow(`  Canonical log dir unavailable (${logRes.fallbackReason}); using ${logRes.path}`));
  } else {
    log(chalk.gray(`  Log:        ${logRes.path}`));
  }

  // Step 3: launch.
  const newPid = await launchService(svc, logRes.path, { deps });
  log(chalk.gray(`  Spawned wrapper PID ${newPid}`));

  // Step 4: wait for port-bound confirmation.
  const boundPid = await waitForPort(svc.port, { deps, ...(args.waitOptions || {}) });
  if (!boundPid) {
    log(chalk.red(`\nFAIL: '${svc.name}' did not bind to port ${svc.port} within timeout`));
    log(chalk.gray(`  Inspect log: ${logRes.path}`));
    throw new Error(`microservice restart failed: ${svc.name} did not bind to :${svc.port}`);
  }

  log(chalk.green(`\nPASS: '${svc.name}' restarted`));
  log(chalk.gray(`  New PID:    ${boundPid}`));
  log(chalk.gray(`  Log:        ${logRes.path}`));

  // Step 5: health check via the existing `descix health` path.
  // Silence runHealth's own console output — we surface a single-line summary.
  if (deps.runHealth) {
    const origLog = console.log;
    console.log = () => {};
    try {
      const h = await deps.runHealth({ microservice: svc.name, json: true });
      console.log = origLog;
      const svcResult = (h?.services || []).find((s) => s.appId === svc.name);
      if (svcResult?.healthy) {
        log(chalk.green(`  Health:     PASS`));
      } else {
        log(chalk.yellow(`  Health:     ${svcResult ? 'FAIL' : 'unknown'}`));
      }
    } catch (err) {
      console.log = origLog;
      log(chalk.yellow(`  Health check skipped: ${err.message}`));
    }
  }

  return {
    name: svc.name,
    port: svc.port,
    oldPid,
    newPid: boundPid,
    logPath: logRes.path,
    logFallback: logRes.fallback,
    devCommand: svc.devCommand,
    microserviceDir: svc.microserviceDir
  };
}

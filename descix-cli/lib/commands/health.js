/**
 * Health Command — environment-aware platform health checker.
 *
 * WS-CLI-HEALTH-ENV-PIVOT (2026-05-26):
 *   `descix health --env <env>` pivots the probe surface based on env:
 *     - dev  (default): existing local-port checks (UNCHANGED behavior)
 *     - demo: gcloud probes against demo cloud resources + synthetic HTTPS
 *             probes against *.demo.descix.net hosts
 *     - prod: gcloud probes against prod cloud resources + synthetic HTTPS
 *             probes against the three in-scope hosts (descix.net, egpt.descix.net,
 *             powch.descix.net)
 *
 *   For any non-DEV env, missing gcloud auth is a HARD FAIL with a clear remediation
 *   message. There is NO silent fallback to local-port checks for --env=demo|prod.
 *
 *   Per feedback_no-hardcoded-fallbacks: no defaults, no silent fallback. Probe
 *   surface mismatches surface as failures.
 *
 *   See: DeSciX/V2_docs/architecture/platform-must-know-briefer.md §2 (health probes)
 *
 * Output format (all probes):
 *   <PASS|FAIL> <name> [<env>] (<probe>)
 *
 * Designed for use by platform-starter, EVPs, and pre-flight automation to verify
 * service availability BEFORE the MCP layer is running.
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import http from 'http';
import { WorkspaceConfig } from '../workspace-config.js';

const execAsync = promisify(exec);

// ─── Constants ───────────────────────────────────────────────────────────────

const SUPPORTED_ENVS = new Set(['dev', 'demo', 'prod']);

/**
 * In-scope PROD hosts per platform-must-know-briefer.md §2 (cutover #1).
 * Probing any other host in PROD is a misconfig and hard-fails.
 */
const PROD_INSCOPE_APPS = new Set(['daita', 'egpt', 'powch']);

/**
 * Canonical PROD host map (cutover #1 hosts).
 */
const PROD_HOST_BY_APP = {
    daita: 'descix.net',
    egpt:  'egpt.descix.net',
    powch: 'powch.descix.net',
};

const URL_MAP_NAME = 'descix-discord-app-lb';
const CLOUD_RUN_REGION = 'us-central1';

// ─── Default IO adapters (injectable for tests) ──────────────────────────────

/**
 * Default exec adapter. Returns { stdout, stderr } as strings.
 * Throws on non-zero exit. Tests replace this with a mock.
 */
async function defaultExec(cmd) {
    return execAsync(cmd, { maxBuffer: 16 * 1024 * 1024 });
}

/**
 * Default HTTPS probe. Resolves with { status, error? } — never rejects.
 * Tests replace this with a mock.
 */
function defaultHttpsProbe(url, timeoutMs = 8000) {
    return new Promise((resolve) => {
        try {
            const parsed = new URL(url);
            const client = parsed.protocol === 'http:' ? http : https;
            const req = client.get(url, { timeout: timeoutMs }, (res) => {
                res.resume();
                resolve({ status: res.statusCode });
            });
            req.on('error', (err) => resolve({ status: 0, error: err.message }));
            req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
        } catch (err) {
            resolve({ status: 0, error: err.message });
        }
    });
}

// ─── DEV path (UNCHANGED behavior) ───────────────────────────────────────────

/**
 * Build the service registry from workspace.json for DEV port checks.
 * Returns an array of { name, appId, port, type, protocol? }.
 */
function buildServiceRegistry(wsConfig) {
    const services = [];
    const env = wsConfig.env || {};

    if (env.platform) {
        if (env.platform.microservice?.port) {
            services.push({
                name: env.platform.appId || 'platform',
                appId: env.platform.appId,
                port: env.platform.microservice.port,
                type: 'microservice',
            });
        }
        if (env.platform.site?.port) {
            services.push({
                name: `${env.platform.appId || 'platform'}-site`,
                appId: env.platform.appId,
                port: env.platform.site.port,
                type: 'site',
                protocol: env.platform.site.protocol || 'https',
            });
        }
    }

    for (const product of (env.products || [])) {
        if (product.microservice?.port) {
            services.push({
                name: product.appId,
                appId: product.appId,
                port: product.microservice.port,
                type: 'microservice',
            });
        }
        if (product.site?.port) {
            services.push({
                name: `${product.appId}-site`,
                appId: product.appId,
                port: product.site.port,
                type: 'site',
                protocol: product.site.protocol || 'https',
            });
        }
    }

    return services;
}

/**
 * DEV mode: check if a local port is listening (lsof).
 */
async function checkPortDev(port, execFn) {
    try {
        const { stdout } = await execFn(`lsof -i :${port} -sTCP:LISTEN 2>/dev/null | head -3`);
        const listening = stdout.trim().length > 0;
        return { healthy: listening, method: 'port-check', port };
    } catch {
        return { healthy: false, method: 'port-check', port };
    }
}

// ─── CLOUD path (--env=demo|prod) ────────────────────────────────────────────

/**
 * HARD-FAIL probe: confirm gcloud has an active authenticated account.
 * Throws a clean Error (caught by runHealth) on failure.
 */
async function probeGcloudAuth(execFn) {
    let stdout;
    try {
        ({ stdout } = await execFn('gcloud auth list --filter=status:ACTIVE --format=json'));
    } catch (err) {
        throw new Error(
            `gcloud CLI is not installed or not on PATH.\n` +
            `  Remediation: install https://cloud.google.com/sdk/docs/install ` +
            `and run \`gcloud auth login\`.\n` +
            `  Underlying error: ${err.message}`
        );
    }
    let parsed;
    try {
        parsed = JSON.parse(stdout);
    } catch (err) {
        throw new Error(
            `gcloud auth list returned non-JSON output. Underlying error: ${err.message}`
        );
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(
            `No active gcloud account.\n` +
            `  Remediation: run \`gcloud auth login\` (and \`gcloud config set project descix\`).`
        );
    }
    return { account: parsed[0].account };
}

/**
 * Resolve the list of apps to probe for a given env.
 * - demo: every product in workspace + the platform app
 * - prod: only descix/egpt/powch (cutover #1 in-scope); raise on out-of-scope filter
 */
function resolveAppsForCloudProbe(env, wsConfig, filterAppId) {
    const allApps = [];
    if (wsConfig.env?.platform?.appId) {
        allApps.push(wsConfig.env.platform.appId);
    }
    for (const product of (wsConfig.env?.products || [])) {
        if (product.appId) allApps.push(product.appId);
    }
    // Dedupe
    const unique = [...new Set(allApps)];

    if (env === 'prod') {
        // PROD scope guard: only in-scope hosts allowed.
        if (filterAppId && !PROD_INSCOPE_APPS.has(filterAppId)) {
            throw new Error(
                `'${filterAppId}' is not in PROD cutover #1 scope. ` +
                `In-scope apps: ${[...PROD_INSCOPE_APPS].join(', ')}.`
            );
        }
        const inScope = unique.filter(a => PROD_INSCOPE_APPS.has(a));
        return filterAppId ? inScope.filter(a => a === filterAppId) : inScope;
    }

    // DEMO: all mapped apps (or filter if -m given)
    return filterAppId ? unique.filter(a => a === filterAppId) : unique;
}

/**
 * Build the HTTPS host for an app in a given env.
 */
function hostForApp(env, appId) {
    if (env === 'prod') {
        return PROD_HOST_BY_APP[appId] || `${appId}.descix.net`;
    }
    // demo
    return `${appId}.${env}.descix.net`;
}

/**
 * Probe the LB URL map. Returns { healthy, command, observed }.
 */
async function probeUrlMap(execFn) {
    const cmd = `gcloud compute url-maps describe ${URL_MAP_NAME} --format=json`;
    try {
        const { stdout } = await execFn(cmd);
        const parsed = JSON.parse(stdout);
        const hostRuleCount = Array.isArray(parsed.hostRules) ? parsed.hostRules.length : 0;
        const healthy = hostRuleCount > 0;
        return {
            healthy,
            command: cmd,
            observed: `hostRules=${hostRuleCount}`,
        };
    } catch (err) {
        return {
            healthy: false,
            command: cmd,
            observed: `error: ${err.message.split('\n')[0]}`,
        };
    }
}

/**
 * Probe Cloud Run services for env. Returns { healthy, command, observed, services[] }.
 */
async function probeCloudRunServices(env, execFn) {
    // gcloud's --filter regex uses POSIX ERE; ".*-{env}$" matches per-app services named like "daita-demo".
    const filterArg = `metadata.name~^.*-${env}$`;
    const cmd = `gcloud run services list --region=${CLOUD_RUN_REGION} --filter='${filterArg}' --format=json`;
    try {
        const { stdout } = await execFn(cmd);
        const parsed = JSON.parse(stdout);
        const list = Array.isArray(parsed) ? parsed : [];
        // Extract per-service ready state from .status.conditions[type='Ready']
        const services = list.map(svc => {
            const conditions = svc.status?.conditions || [];
            const readyCond = conditions.find(c => c.type === 'Ready');
            const ready = readyCond?.status === 'True';
            return { name: svc.metadata?.name, ready };
        });
        const allReady = services.length > 0 && services.every(s => s.ready);
        return {
            healthy: allReady,
            command: cmd,
            observed: `count=${services.length}, ready=${services.filter(s => s.ready).length}`,
            services,
        };
    } catch (err) {
        return {
            healthy: false,
            command: cmd,
            observed: `error: ${err.message.split('\n')[0]}`,
            services: [],
        };
    }
}

/**
 * Probe the central apiFront Cloud Function for env.
 */
async function probeApiFrontFunction(env, execFn) {
    const fnName = `apiFront-http-${env}`;
    const cmd = `gcloud functions describe ${fnName} --gen2 --region=${CLOUD_RUN_REGION} --format=json`;
    try {
        const { stdout } = await execFn(cmd);
        const parsed = JSON.parse(stdout);
        const state = parsed.state || parsed.status || 'UNKNOWN';
        return {
            healthy: state === 'ACTIVE',
            command: cmd,
            observed: `state=${state}`,
        };
    } catch (err) {
        return {
            healthy: false,
            command: cmd,
            observed: `error: ${err.message.split('\n')[0]}`,
        };
    }
}

/**
 * Synthetic HTTPS probe for a single app host.
 */
async function probeSyntheticHost(env, appId, httpsProbeFn) {
    const host = hostForApp(env, appId);
    const url = `https://${host}/`;
    const result = await httpsProbeFn(url);
    // Healthy = any 2xx/3xx (LB or app responded). 4xx/5xx/timeout = unhealthy.
    const healthy = result.status >= 200 && result.status < 400;
    return {
        healthy,
        command: `curl -sS -o /dev/null -w "%{http_code}" ${url}`,
        observed: result.error ? `error: ${result.error}` : `HTTP ${result.status}`,
        appId,
        url,
    };
}

// ─── Output formatting ───────────────────────────────────────────────────────

/**
 * Render a single probe result line in the canonical format:
 *   <PASS|FAIL> <name> [<env>] (<probe>)
 */
function formatProbeLine(name, env, healthy, probeDetail) {
    const status = healthy ? chalk.green('PASS') : chalk.red('FAIL');
    return `  ${status} ${name} [${env}] (${probeDetail})`;
}

// ─── Main entry ──────────────────────────────────────────────────────────────

/**
 * Run health checks. Env-aware:
 *   - dev (default): local port checks via lsof
 *   - demo|prod: gcloud + synthetic HTTPS probes
 *
 * @param {Object} options
 * @param {string} [options.env='dev'] - Target env (dev|demo|prod)
 * @param {string} [options.microservice] - Filter to a specific appId
 * @param {boolean} [options.json] - Emit JSON
 * @param {Function} [options._exec] - Inject exec adapter (test only)
 * @param {Function} [options._httpsProbe] - Inject HTTPS probe (test only)
 * @param {WorkspaceConfig} [options._wsConfig] - Inject workspace config (test only)
 * @returns {Promise<Object>} structured output
 */
export async function runHealth(options = {}) {
    const {
        env: rawEnv,
        microservice: filterName,
        json: jsonOutput,
        _exec,
        _httpsProbe,
        _wsConfig,
    } = options;

    const env = (rawEnv || 'dev').toLowerCase();
    if (!SUPPORTED_ENVS.has(env)) {
        const msg = `Unknown env: '${rawEnv}'. Supported: dev, demo, prod.`;
        if (jsonOutput) {
            console.log(JSON.stringify({ env: rawEnv, error: msg }, null, 2));
        } else {
            console.error(chalk.red(`\n${msg}\n`));
        }
        // Hard-fail by throwing — caller exits non-zero.
        throw new Error(msg);
    }

    const execFn = _exec || defaultExec;
    const httpsProbeFn = _httpsProbe || defaultHttpsProbe;

    // Load workspace config (skipped if injected).
    let wsConfig = _wsConfig;
    if (!wsConfig) {
        try {
            wsConfig = await WorkspaceConfig.load(process.cwd());
        } catch (err) {
            const msg = `Failed to load workspace config: ${err.message}`;
            if (jsonOutput) {
                console.log(JSON.stringify({ env, error: msg }, null, 2));
            } else {
                console.error(chalk.red(`\n${msg}`));
                console.error(chalk.gray('  Ensure .descix/workspace.json exists and is valid\n'));
            }
            throw err;
        }
    }

    if (env === 'dev') {
        return runHealthDev(wsConfig, filterName, jsonOutput, execFn);
    }

    return runHealthCloud(env, wsConfig, filterName, jsonOutput, execFn, httpsProbeFn);
}

/**
 * DEV path — unchanged from pre-pivot behavior.
 */
async function runHealthDev(wsConfig, filterName, jsonOutput, execFn) {
    let services = buildServiceRegistry(wsConfig);

    if (filterName) {
        services = services.filter(s => s.appId === filterName || s.name === filterName);
        if (services.length === 0) {
            const msg = `No service found matching "${filterName}" in workspace.json`;
            if (jsonOutput) {
                console.log(JSON.stringify({ env: 'dev', error: msg }, null, 2));
            } else {
                console.error(chalk.red(`\n${msg}`));
                console.error(chalk.gray('  Available services: ' +
                    buildServiceRegistry(wsConfig).map(s => s.appId).filter((v, i, a) => a.indexOf(v) === i).join(', ') + '\n'));
            }
            throw new Error(msg);
        }
    }

    const results = [];
    const startTime = Date.now();
    for (const svc of services) {
        const check = await checkPortDev(svc.port, execFn);
        results.push({
            service: svc.name,
            appId: svc.appId,
            type: svc.type,
            port: svc.port,
            ...check,
        });
    }
    const totalTime = Date.now() - startTime;

    const output = {
        environment: 'dev',
        timestamp: new Date().toISOString(),
        check_duration_ms: totalTime,
        probe_surface: 'local-port',
        services: results,
        all_healthy: results.every(r => r.healthy),
        summary: {
            total: results.length,
            healthy: results.filter(r => r.healthy).length,
            unhealthy: results.filter(r => !r.healthy).length,
        },
    };

    if (jsonOutput) {
        console.log(JSON.stringify(output, null, 2));
        return output;
    }

    console.log(chalk.cyan(`\nPlatform Health Check (DEV)`));
    console.log(chalk.cyan('='.repeat(50)));
    console.log(chalk.gray(`  Timestamp: ${output.timestamp}`));
    console.log(chalk.gray(`  Check duration: ${output.check_duration_ms}ms`));
    console.log(chalk.gray(`  Probe surface: local-port (lsof)\n`));

    for (const r of results) {
        const probeDetail = `${r.type}, port:${r.port}`;
        console.log(formatProbeLine(r.service, 'dev', r.healthy, probeDetail));
    }

    console.log();
    if (output.all_healthy) {
        console.log(chalk.green(`All ${output.summary.total} services healthy.\n`));
    } else {
        console.log(chalk.yellow(`${output.summary.healthy}/${output.summary.total} healthy, ${output.summary.unhealthy} unhealthy.\n`));
    }

    return output;
}

/**
 * CLOUD path — gcloud + synthetic HTTPS probes for --env=demo|prod.
 */
async function runHealthCloud(env, wsConfig, filterName, jsonOutput, execFn, httpsProbeFn) {
    const startTime = Date.now();
    const probes = [];

    // ── HARD FAIL: gcloud auth must be present ──
    let authInfo;
    try {
        authInfo = await probeGcloudAuth(execFn);
    } catch (err) {
        if (jsonOutput) {
            console.log(JSON.stringify({
                env,
                error: 'gcloud-auth-missing',
                message: err.message,
            }, null, 2));
        } else {
            console.error(chalk.red(`\nHEALTH HARD-FAIL: gcloud auth check failed for --env=${env}.`));
            console.error(chalk.gray(`  ${err.message}\n`));
        }
        throw err;
    }

    // ── 1. URL map ──
    const urlMap = await probeUrlMap(execFn);
    probes.push({
        name: URL_MAP_NAME,
        type: 'url-map',
        env,
        healthy: urlMap.healthy,
        command: urlMap.command,
        observed: urlMap.observed,
    });

    // ── 2. Cloud Run services ──
    const cloudRun = await probeCloudRunServices(env, execFn);
    probes.push({
        name: `cloud-run-${env}`,
        type: 'cloud-run-list',
        env,
        healthy: cloudRun.healthy,
        command: cloudRun.command,
        observed: cloudRun.observed,
        services: cloudRun.services,
    });

    // ── 3. apiFront Cloud Function ──
    const apiFront = await probeApiFrontFunction(env, execFn);
    probes.push({
        name: `apiFront-http-${env}`,
        type: 'cloud-function',
        env,
        healthy: apiFront.healthy,
        command: apiFront.command,
        observed: apiFront.observed,
    });

    // ── 4. Synthetic HTTPS probes per app ──
    let apps;
    try {
        apps = resolveAppsForCloudProbe(env, wsConfig, filterName || null);
    } catch (err) {
        if (jsonOutput) {
            console.log(JSON.stringify({ env, error: err.message }, null, 2));
        } else {
            console.error(chalk.red(`\nHEALTH HARD-FAIL: ${err.message}\n`));
        }
        throw err;
    }

    for (const appId of apps) {
        const synthetic = await probeSyntheticHost(env, appId, httpsProbeFn);
        probes.push({
            name: appId,
            type: 'synthetic-https',
            env,
            healthy: synthetic.healthy,
            command: synthetic.command,
            observed: synthetic.observed,
            appId,
            url: synthetic.url,
        });
    }

    const totalTime = Date.now() - startTime;

    const output = {
        environment: env,
        timestamp: new Date().toISOString(),
        check_duration_ms: totalTime,
        probe_surface: 'cloud (gcloud + HTTPS)',
        gcloud_account: authInfo.account,
        probes,
        all_healthy: probes.every(p => p.healthy),
        summary: {
            total: probes.length,
            healthy: probes.filter(p => p.healthy).length,
            unhealthy: probes.filter(p => !p.healthy).length,
        },
    };

    if (jsonOutput) {
        console.log(JSON.stringify(output, null, 2));
        return output;
    }

    console.log(chalk.cyan(`\nPlatform Health Check (${env.toUpperCase()})`));
    console.log(chalk.cyan('='.repeat(50)));
    console.log(chalk.gray(`  Timestamp: ${output.timestamp}`));
    console.log(chalk.gray(`  Check duration: ${output.check_duration_ms}ms`));
    console.log(chalk.gray(`  Probe surface: cloud (gcloud + HTTPS)`));
    console.log(chalk.gray(`  gcloud account: ${authInfo.account}\n`));

    for (const p of probes) {
        const probeDetail = `${p.type}: ${p.observed}`;
        console.log(formatProbeLine(p.name, env, p.healthy, probeDetail));
        // Print the underlying command in gray for transparency.
        console.log(chalk.gray(`         $ ${p.command}`));
    }

    console.log();
    if (output.all_healthy) {
        console.log(chalk.green(`All ${output.summary.total} probes healthy.\n`));
    } else {
        console.log(chalk.yellow(`${output.summary.healthy}/${output.summary.total} healthy, ${output.summary.unhealthy} unhealthy.\n`));
    }

    return output;
}

// Export probe builders for testing (advanced cases).
export const __internals = {
    buildServiceRegistry,
    resolveAppsForCloudProbe,
    hostForApp,
    PROD_INSCOPE_APPS,
    SUPPORTED_ENVS,
    URL_MAP_NAME,
    CLOUD_RUN_REGION,
};

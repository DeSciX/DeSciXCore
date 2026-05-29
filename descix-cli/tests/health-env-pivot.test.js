/**
 * WS-CLI-HEALTH-ENV-PIVOT — tests for `descix health --env <env>` probe-surface pivot.
 *
 * AC (WS-CLI-HEALTH-ENV-PIVOT, closed 2026-05-26 — see platform-must-know-briefer.md §2):
 *   1. `descix health --env=dev` runs local-port path (regression — no behavior change).
 *   2. `descix health --env=demo` invokes gcloud + synthetic HTTPS probes
 *      (NOT local-port checks).
 *   3. HARD-FAIL on missing gcloud auth with clear remediation message.
 *   4. Output format consistency: every probe emits `PASS|FAIL <name> [<env>] (<probe>)`.
 *   5. PROD scope guard: out-of-scope app filter hard-fails before any probe.
 *
 * Design: inject `_exec` and `_httpsProbe` adapters to mock gcloud + HTTPS without
 * touching the network or the gcloud CLI. Workspace config is injected via `_wsConfig`
 * so tests don't depend on cwd discovery.
 *
 * Run: `node --test tests/health-env-pivot.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runHealth, __internals } from '../lib/commands/health.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a synthetic WorkspaceConfig-shaped object (we only read .env).
 * Skips disk IO entirely — the cloud path doesn't need apiUrl or save().
 */
function fakeWsConfig({ platformAppId = 'daita', products = [] } = {}) {
    return {
        env: {
            platform: {
                appId: platformAppId,
                microservice: { port: 4000 },
                site: { port: 5174 },
            },
            products,
        },
    };
}

/**
 * Build an _exec mock from a route table.
 * Routes is an array of { match: RegExp|string, stdout: string, stderr?: string, throw?: Error }.
 * The first matching route wins. Unmatched commands throw with a clear error
 * (so the test fails loudly rather than silently passing an unmocked command through).
 */
function mockExec(routes) {
    const calls = [];
    const fn = async (cmd) => {
        calls.push(cmd);
        for (const route of routes) {
            const m = route.match;
            const matched = (m instanceof RegExp) ? m.test(cmd) : cmd.includes(m);
            if (matched) {
                if (route.throw) throw route.throw;
                return { stdout: route.stdout || '', stderr: route.stderr || '' };
            }
        }
        throw new Error(`mockExec: unmatched command in test: ${cmd}`);
    };
    fn.calls = calls;
    return fn;
}

/**
 * Build an _httpsProbe mock from a host→{status,error?} map.
 */
function mockHttpsProbe(byHost) {
    const calls = [];
    const fn = async (url) => {
        calls.push(url);
        const parsed = new URL(url);
        const host = parsed.host;
        if (host in byHost) return byHost[host];
        return { status: 0, error: `mockHttpsProbe: no route for host ${host}` };
    };
    fn.calls = calls;
    return fn;
}

// ─── AC1: --env=dev runs local-port path ────────────────────────────────────

test('AC1: --env=dev runs the local-port path (no gcloud calls)', async () => {
    const wsConfig = fakeWsConfig({
        products: [
            { appId: 'beast', microservice: { port: 3011 } },
        ],
    });
    // Mock lsof. Match any lsof call → return non-empty stdout (port listening).
    const exec = mockExec([
        { match: /^lsof -i :\d+/, stdout: 'node  12345 user  TCP *:3011 (LISTEN)\n' },
    ]);
    const httpsProbe = mockHttpsProbe({});

    // Capture stdout to keep test output clean.
    const origLog = console.log;
    const captured = [];
    console.log = (...args) => captured.push(args.join(' '));
    let result;
    try {
        result = await runHealth({
            env: 'dev',
            _exec: exec,
            _httpsProbe: httpsProbe,
            _wsConfig: wsConfig,
        });
    } finally {
        console.log = origLog;
    }

    assert.equal(result.environment, 'dev');
    assert.equal(result.probe_surface, 'local-port');
    assert.equal(result.all_healthy, true);

    // All exec calls must be lsof — NO gcloud in dev path.
    for (const cmd of exec.calls) {
        assert.match(cmd, /^lsof /, `dev path must only call lsof, got: ${cmd}`);
    }
    assert.equal(httpsProbe.calls.length, 0, 'dev path must not invoke HTTPS probe');
});

// ─── AC2: --env=demo invokes gcloud probes ──────────────────────────────────

test('AC2: --env=demo invokes gcloud probes (URL map + Cloud Run + CF) + synthetic HTTPS', async () => {
    const wsConfig = fakeWsConfig({
        platformAppId: 'daita',
        products: [
            { appId: 'powch' },
            { appId: 'beast' },
        ],
    });

    const exec = mockExec([
        // gcloud auth — must come first; return one active account
        {
            match: /^gcloud auth list/,
            stdout: JSON.stringify([{ account: 'sam@descix.net', status: 'ACTIVE' }]),
        },
        // URL map describe
        {
            match: /^gcloud compute url-maps describe descix-discord-app-lb/,
            stdout: JSON.stringify({
                name: 'descix-discord-app-lb',
                hostRules: [
                    { hosts: ['daita.demo.descix.net'], pathMatcher: 'daita-demo' },
                    { hosts: ['powch.demo.descix.net'], pathMatcher: 'powch-demo' },
                ],
            }),
        },
        // Cloud Run list
        {
            match: /^gcloud run services list/,
            stdout: JSON.stringify([
                {
                    metadata: { name: 'daita-demo' },
                    status: { conditions: [{ type: 'Ready', status: 'True' }] },
                },
                {
                    metadata: { name: 'powch-demo' },
                    status: { conditions: [{ type: 'Ready', status: 'True' }] },
                },
            ]),
        },
        // Cloud Function describe
        {
            match: /^gcloud functions describe apiFront-http-demo/,
            stdout: JSON.stringify({ name: 'apiFront-http-demo', state: 'ACTIVE' }),
        },
    ]);

    const httpsProbe = mockHttpsProbe({
        'daita.demo.descix.net': { status: 200 },
        'powch.demo.descix.net': { status: 200 },
        'beast.demo.descix.net': { status: 200 },
    });

    const origLog = console.log;
    const captured = [];
    console.log = (...args) => captured.push(args.join(' '));
    let result;
    try {
        result = await runHealth({
            env: 'demo',
            _exec: exec,
            _httpsProbe: httpsProbe,
            _wsConfig: wsConfig,
        });
    } finally {
        console.log = origLog;
    }

    assert.equal(result.environment, 'demo');
    assert.equal(result.probe_surface, 'cloud (gcloud + HTTPS)');

    // Must have called gcloud at least 4 times: auth, url-maps, run list, functions describe.
    const gcloudCalls = exec.calls.filter(c => c.startsWith('gcloud '));
    assert.ok(gcloudCalls.length >= 4,
        `expected ≥4 gcloud calls, got ${gcloudCalls.length}: ${JSON.stringify(gcloudCalls)}`);

    // Must NOT have called lsof — that's the dev path.
    const lsofCalls = exec.calls.filter(c => c.startsWith('lsof '));
    assert.equal(lsofCalls.length, 0, 'demo path must not call lsof');

    // Synthetic HTTPS probes hit each app's demo host.
    const expectedHosts = ['daita.demo.descix.net', 'powch.demo.descix.net', 'beast.demo.descix.net'];
    for (const host of expectedHosts) {
        const hit = httpsProbe.calls.find(u => u.includes(host));
        assert.ok(hit, `expected synthetic HTTPS probe for ${host}, got: ${JSON.stringify(httpsProbe.calls)}`);
    }

    assert.equal(result.all_healthy, true);
});

// ─── AC3: HARD-FAIL on missing gcloud auth ──────────────────────────────────

test('AC3: --env=demo HARD-FAILS when gcloud auth list returns empty (no active account)', async () => {
    const wsConfig = fakeWsConfig();
    const exec = mockExec([
        { match: /^gcloud auth list/, stdout: '[]' },
    ]);
    const httpsProbe = mockHttpsProbe({});

    const origErr = console.error;
    const errCaptured = [];
    console.error = (...args) => errCaptured.push(args.join(' '));
    try {
        await assert.rejects(
            () => runHealth({
                env: 'demo',
                _exec: exec,
                _httpsProbe: httpsProbe,
                _wsConfig: wsConfig,
            }),
            (err) => {
                assert.match(err.message, /No active gcloud account/);
                assert.match(err.message, /gcloud auth login/);
                return true;
            }
        );
    } finally {
        console.error = origErr;
    }

    // No further probes should have run.
    const urlMapCalls = exec.calls.filter(c => c.includes('url-maps describe'));
    assert.equal(urlMapCalls.length, 0, 'no url-maps probe should run when auth fails');
    assert.equal(httpsProbe.calls.length, 0, 'no HTTPS probe should run when auth fails');
});

test('AC3b: --env=demo HARD-FAILS when gcloud CLI is not installed', async () => {
    const wsConfig = fakeWsConfig();
    const exec = mockExec([
        { match: /^gcloud auth list/, throw: Object.assign(new Error('command not found: gcloud'), { code: 127 }) },
    ]);
    const httpsProbe = mockHttpsProbe({});

    const origErr = console.error;
    console.error = () => {};
    try {
        await assert.rejects(
            () => runHealth({
                env: 'demo',
                _exec: exec,
                _httpsProbe: httpsProbe,
                _wsConfig: wsConfig,
            }),
            (err) => {
                assert.match(err.message, /gcloud CLI is not installed/);
                assert.match(err.message, /gcloud auth login/);
                return true;
            }
        );
    } finally {
        console.error = origErr;
    }
});

// ─── AC4: Output format consistency ─────────────────────────────────────────

test('AC4: every probe line matches `PASS|FAIL <name> [<env>] (<probe>)` in JSON output', async () => {
    const wsConfig = fakeWsConfig({
        platformAppId: 'daita',
        products: [{ appId: 'powch' }],
    });

    const exec = mockExec([
        {
            match: /^gcloud auth list/,
            stdout: JSON.stringify([{ account: 'a@b.c', status: 'ACTIVE' }]),
        },
        {
            match: /^gcloud compute url-maps describe/,
            stdout: JSON.stringify({ hostRules: [{ hosts: ['x'] }] }),
        },
        {
            match: /^gcloud run services list/,
            stdout: JSON.stringify([
                { metadata: { name: 'daita-demo' }, status: { conditions: [{ type: 'Ready', status: 'True' }] } },
            ]),
        },
        {
            match: /^gcloud functions describe/,
            stdout: JSON.stringify({ state: 'ACTIVE' }),
        },
    ]);
    const httpsProbe = mockHttpsProbe({
        'daita.demo.descix.net': { status: 200 },
        'powch.demo.descix.net': { status: 503 },
    });

    const origLog = console.log;
    console.log = () => {};
    let result;
    try {
        result = await runHealth({
            env: 'demo',
            json: true,
            _exec: exec,
            _httpsProbe: httpsProbe,
            _wsConfig: wsConfig,
        });
    } finally {
        console.log = origLog;
    }

    // Every probe row has the canonical fields.
    for (const probe of result.probes) {
        assert.ok(typeof probe.name === 'string' && probe.name.length > 0, `probe.name required: ${JSON.stringify(probe)}`);
        assert.equal(probe.env, 'demo', `probe.env must be 'demo': ${JSON.stringify(probe)}`);
        assert.equal(typeof probe.healthy, 'boolean', `probe.healthy must be boolean: ${JSON.stringify(probe)}`);
        assert.ok(typeof probe.command === 'string' && probe.command.length > 0, `probe.command required: ${JSON.stringify(probe)}`);
        assert.ok(typeof probe.observed === 'string', `probe.observed required: ${JSON.stringify(probe)}`);
    }

    // Mixed pass/fail = not all healthy.
    assert.equal(result.all_healthy, false);
    const failed = result.probes.find(p => p.name === 'powch');
    assert.ok(failed, 'powch probe must be present');
    assert.equal(failed.healthy, false, 'powch returned HTTP 503 → must be FAIL');
});

// ─── AC5: PROD scope guard ──────────────────────────────────────────────────

test('AC5: --env=prod -m <out-of-scope-app> hard-fails before any probe', async () => {
    const wsConfig = fakeWsConfig({
        platformAppId: 'daita',
        products: [{ appId: 'beast' }, { appId: 'smile' }],
    });
    const exec = mockExec([
        { match: /^gcloud auth list/, stdout: JSON.stringify([{ account: 'a@b.c', status: 'ACTIVE' }]) },
        { match: /^gcloud compute url-maps describe/, stdout: JSON.stringify({ hostRules: [{}] }) },
        { match: /^gcloud run services list/, stdout: '[]' },
        { match: /^gcloud functions describe/, stdout: JSON.stringify({ state: 'ACTIVE' }) },
    ]);
    const httpsProbe = mockHttpsProbe({});

    const origErr = console.error;
    console.error = () => {};
    try {
        await assert.rejects(
            () => runHealth({
                env: 'prod',
                microservice: 'beast',
                _exec: exec,
                _httpsProbe: httpsProbe,
                _wsConfig: wsConfig,
            }),
            (err) => {
                assert.match(err.message, /not in PROD cutover #1 scope/);
                assert.match(err.message, /In-scope apps: .*daita.*egpt.*powch/);
                return true;
            }
        );
    } finally {
        console.error = origErr;
    }
});

test('AC5b: --env=prod (no filter) only probes the three in-scope hosts', async () => {
    // Workspace has many apps, but only daita/egpt/powch should be probed in PROD.
    const wsConfig = fakeWsConfig({
        platformAppId: 'daita',
        products: [
            { appId: 'powch' },
            { appId: 'beast' },
            { appId: 'smile' },
            { appId: 'egpt' },
            { appId: 'unk-cos' },
        ],
    });
    const exec = mockExec([
        { match: /^gcloud auth list/, stdout: JSON.stringify([{ account: 'a@b.c', status: 'ACTIVE' }]) },
        { match: /^gcloud compute url-maps describe/, stdout: JSON.stringify({ hostRules: [{}] }) },
        { match: /^gcloud run services list/, stdout: JSON.stringify([
            { metadata: { name: 'daita-prod' }, status: { conditions: [{ type: 'Ready', status: 'True' }] } },
        ]) },
        { match: /^gcloud functions describe apiFront-http-prod/, stdout: JSON.stringify({ state: 'ACTIVE' }) },
    ]);
    const httpsProbe = mockHttpsProbe({
        'descix.net': { status: 200 },
        'egpt.descix.net': { status: 200 },
        'powch.descix.net': { status: 200 },
    });

    const origLog = console.log;
    console.log = () => {};
    let result;
    try {
        result = await runHealth({
            env: 'prod',
            json: true,
            _exec: exec,
            _httpsProbe: httpsProbe,
            _wsConfig: wsConfig,
        });
    } finally {
        console.log = origLog;
    }

    // Only descix/egpt/powch HTTPS probes — beast/smile/unk-cos must NOT be probed.
    const syntheticProbes = result.probes.filter(p => p.type === 'synthetic-https');
    const probedApps = syntheticProbes.map(p => p.appId).sort();
    assert.deepEqual(probedApps, ['daita', 'egpt', 'powch'],
        `PROD must only probe in-scope apps, got: ${JSON.stringify(probedApps)}`);

    // And the probed URLs use the canonical hosts (no env subdomain).
    const probedUrls = httpsProbe.calls.sort();
    assert.deepEqual(probedUrls, [
        'https://descix.net/',
        'https://egpt.descix.net/',
        'https://powch.descix.net/',
    ]);
});

// ─── Probe-surface mismatch must HARD-FAIL ─────────────────────────────────

test('--env=demo HARD-FAILS when gcloud Cloud Run list throws (no silent fallback to local-port)', async () => {
    // Per feedback_no-hardcoded-fallbacks: cloud probe must not silently
    // degrade to local-port checks when --env=demo|prod.
    const wsConfig = fakeWsConfig({ platformAppId: 'daita', products: [{ appId: 'powch' }] });
    const exec = mockExec([
        { match: /^gcloud auth list/, stdout: JSON.stringify([{ account: 'a@b.c', status: 'ACTIVE' }]) },
        { match: /^gcloud compute url-maps describe/, stdout: JSON.stringify({ hostRules: [{}] }) },
        { match: /^gcloud run services list/, throw: new Error('permission denied') },
        { match: /^gcloud functions describe/, stdout: JSON.stringify({ state: 'ACTIVE' }) },
    ]);
    const httpsProbe = mockHttpsProbe({
        'daita.demo.descix.net': { status: 200 },
        'powch.demo.descix.net': { status: 200 },
    });

    const origLog = console.log;
    console.log = () => {};
    let result;
    try {
        result = await runHealth({
            env: 'demo',
            json: true,
            _exec: exec,
            _httpsProbe: httpsProbe,
            _wsConfig: wsConfig,
        });
    } finally {
        console.log = origLog;
    }

    // The Cloud Run probe must be marked FAIL (not silently dropped, not local-port fallback).
    const cloudRunProbe = result.probes.find(p => p.type === 'cloud-run-list');
    assert.ok(cloudRunProbe, 'cloud-run-list probe row must be present');
    assert.equal(cloudRunProbe.healthy, false, 'Cloud Run probe must FAIL on gcloud error');
    assert.match(cloudRunProbe.observed, /permission denied/);

    // And the probe surface is still cloud — never falls back to local-port.
    assert.equal(result.probe_surface, 'cloud (gcloud + HTTPS)');

    // No lsof calls at all.
    const lsofCalls = exec.calls.filter(c => c.startsWith('lsof '));
    assert.equal(lsofCalls.length, 0, 'cloud path must never fall back to lsof');
});

// ─── Unsupported env hard-fails ────────────────────────────────────────────

test('unsupported --env hard-fails with clear error', async () => {
    const wsConfig = fakeWsConfig();
    const origErr = console.error;
    console.error = () => {};
    try {
        await assert.rejects(
            () => runHealth({
                env: 'staging',
                _exec: mockExec([]),
                _httpsProbe: mockHttpsProbe({}),
                _wsConfig: wsConfig,
            }),
            (err) => {
                assert.match(err.message, /Unknown env: 'staging'/);
                assert.match(err.message, /Supported: dev, demo, prod/);
                return true;
            }
        );
    } finally {
        console.error = origErr;
    }
});

// ─── hostForApp internal ────────────────────────────────────────────────────

test('hostForApp: demo uses .demo.descix.net subdomain', () => {
    assert.equal(__internals.hostForApp('demo', 'daita'), 'daita.demo.descix.net');
    assert.equal(__internals.hostForApp('demo', 'powch'), 'powch.demo.descix.net');
    assert.equal(__internals.hostForApp('demo', 'unk-cos'), 'unk-cos.demo.descix.net');
});

test('hostForApp: prod uses canonical cutover hosts (no env subdomain)', () => {
    assert.equal(__internals.hostForApp('prod', 'daita'), 'descix.net');
    assert.equal(__internals.hostForApp('prod', 'egpt'),  'egpt.descix.net');
    assert.equal(__internals.hostForApp('prod', 'powch'), 'powch.descix.net');
});

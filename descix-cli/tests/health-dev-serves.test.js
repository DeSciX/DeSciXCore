/**
 * `descix health` in DEV must be a gate that can FAIL for SERVING, and must cover the gateway.
 *
 * WHY (measured 2026-09-16): the DEV path self-described as `Probe surface: local-port (lsof)`.
 * A port that answered 500 to every request reported PASS, and `env.gateway.port` had no row at
 * all — the one process a local platform developer most needs to see was structurally invisible.
 * A bound port is not a health check.
 *
 * THE OWNER of a microservice's health path is the service's OWN served manifest
 * (`GET /manifest` → `service.healthEndpoint`, built by cloud-core's buildManifestFromHandlers).
 * Measured live: cloud declares `/api/health` (and `/health` is a 404 there), powch declares
 * `/health`. So the probe reads the manifest first and never assumes a path — a per-app-id table
 * would be a second owner of that fact.
 *
 * Adapters are injected (`_exec` for lsof, `_httpsProbe` for HTTP); nothing here touches the
 * network. Run: `node --test tests/health-dev-serves.test.js` from descix-cli/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runHealth } from '../lib/commands/health.js';

function ws({ gatewayPort = 5599, products = [] } = {}) {
    return {
        env: {
            gateway: { port: gatewayPort },
            platform: { appId: 'daita', microservice: { port: 4000 }, site: { port: 5174 } },
            products,
        },
    };
}

/** lsof mock: every port listed in `listening` reads as bound. */
function lsof(listening) {
    const fn = async (cmd) => {
        const m = cmd.match(/^lsof -i :(\d+)/);
        if (!m) throw new Error(`unmocked exec: ${cmd}`);
        return { stdout: listening.includes(Number(m[1])) ? `node 1 u TCP *:${m[1]} (LISTEN)\n` : '', stderr: '' };
    };
    return fn;
}

/**
 * HTTP mock keyed by exact URL → { status, body }. Unrouted URLs read as connection refused,
 * which is what a probe against nothing sees. Records every URL it was asked for.
 */
function http(routes) {
    const calls = [];
    const fn = async (url) => {
        calls.push(url);
        if (url in routes) return routes[url];
        return { status: 0, error: `no route: ${url}` };
    };
    fn.calls = calls;
    return fn;
}

const manifest = (healthEndpoint) => ({ status: 200, body: JSON.stringify({ service: { name: 'x', healthEndpoint } }) });
const html = { status: 200, body: '<!DOCTYPE html><html><head><title>DeSciX</title></head></html>' };
const binding = { status: 200, body: JSON.stringify({ mode: 'standalone', appId: 'demo' }) };

async function run(opts) {
    const origLog = console.log;
    const lines = [];
    console.log = (...a) => lines.push(a.join(' '));
    try {
        const result = await runHealth({ env: 'dev', ...opts });
        return { result, lines };
    } finally {
        console.log = origLog;
    }
}

const byName = (result, name) => result.services.find((s) => s.service === name);

// ------------------------------------------------------------------ the defect, as a RED

test('a BOUND port whose health route answers 500 is NOT healthy (the measured defect)', async () => {
    const probe = http({
        'https://localhost:4000/manifest': manifest('/api/health'),
        'https://localhost:4000/api/health': { status: 500, body: 'boom' },
        'https://localhost:5174/': html,
        'https://localhost:5599/__descix/app-binding.json': binding,
    });
    const { result } = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: probe });
    const daita = byName(result, 'daita');
    assert.equal(daita.bound, true, 'lsof says bound');
    assert.equal(daita.serves, false, 'a 500 on its declared health route is not serving');
    assert.equal(daita.healthy, false);
    assert.equal(result.all_healthy, false);
});

test('positive control: the same service answering 200 on its declared route IS healthy', async () => {
    const probe = http({
        'https://localhost:4000/manifest': manifest('/api/health'),
        'https://localhost:4000/api/health': { status: 200, body: 'OK' },
        'https://localhost:5174/': html,
        'https://localhost:5599/__descix/app-binding.json': binding,
    });
    const { result } = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: probe });
    assert.equal(byName(result, 'daita').healthy, true);
    assert.equal(result.all_healthy, true);
});

// ------------------------------------------------------------------ the owner is the manifest

test('the health path comes from the served manifest, never from an assumed /health', async () => {
    const probe = http({
        'https://localhost:4000/manifest': manifest('/api/health'),
        'https://localhost:4000/api/health': { status: 200, body: 'OK' },
        'https://localhost:5174/': html,
        'https://localhost:5599/__descix/app-binding.json': binding,
    });
    await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: probe });
    assert.ok(probe.calls.includes('https://localhost:4000/api/health'), 'probed the declared route');
    assert.ok(!probe.calls.includes('https://localhost:4000/health'), 'never guessed /health (404 on cloud)');
});

test('a bound service that serves no /manifest is NOT healthy and says why', async () => {
    const probe = http({ 'https://localhost:5174/': html, 'https://localhost:5599/__descix/app-binding.json': binding });
    const { result } = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: probe });
    const daita = byName(result, 'daita');
    assert.equal(daita.bound, true);
    assert.equal(daita.serves, false);
    assert.match(daita.serves_probe, /\/manifest/);
});

test('a service whose manifest names no healthEndpoint is NOT healthy and names the field', async () => {
    const probe = http({
        'https://localhost:4000/manifest': { status: 200, body: JSON.stringify({ service: { name: 'cloud' } }) },
        'https://localhost:5174/': html,
        'https://localhost:5599/__descix/app-binding.json': binding,
    });
    const { result } = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: probe });
    const daita = byName(result, 'daita');
    assert.equal(daita.serves, false);
    assert.match(daita.serves_probe, /healthEndpoint/);
});

// ------------------------------------------------------------------ the gateway row

test('the gateway has a row from env.gateway.port, probed on its own binding path', async () => {
    const probe = http({
        'https://localhost:4000/manifest': manifest('/api/health'),
        'https://localhost:4000/api/health': { status: 200, body: 'OK' },
        'https://localhost:5174/': html,
        'https://localhost:5599/__descix/app-binding.json': binding,
    });
    const { result } = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: probe });
    const gw = byName(result, 'gateway');
    assert.ok(gw, 'gateway row exists');
    assert.equal(gw.port, 5599);
    assert.equal(gw.type, 'gateway');
    assert.equal(gw.healthy, true);
    assert.ok(probe.calls.includes('https://localhost:5599/__descix/app-binding.json'));
});

test('a vite dev server squatting on the gateway port is NOT a healthy gateway (HTML, not a binding)', async () => {
    const probe = http({
        'https://localhost:4000/manifest': manifest('/api/health'),
        'https://localhost:4000/api/health': { status: 200, body: 'OK' },
        'https://localhost:5174/': html,
        // vite answers 200 with index.html for ANY path — a status-only probe would call this healthy
        'https://localhost:5599/__descix/app-binding.json': html,
    });
    const { result } = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: probe });
    const gw = byName(result, 'gateway');
    assert.equal(gw.bound, true);
    assert.equal(gw.serves, false);
});

test('gateway down: bound=false, serves=false, and the run is not all_healthy', async () => {
    const probe = http({
        'https://localhost:4000/manifest': manifest('/api/health'),
        'https://localhost:4000/api/health': { status: 200, body: 'OK' },
        'https://localhost:5174/': html,
    });
    const { result } = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174]), _httpsProbe: probe });
    const gw = byName(result, 'gateway');
    assert.equal(gw.bound, false);
    assert.equal(gw.serves, false);
    assert.equal(result.all_healthy, false);
});

// ------------------------------------------------------------------ boundary + format

test('the command prints its coverage boundary on GREEN and on RED, and JSON carries it', async () => {
    const green = http({
        'https://localhost:4000/manifest': manifest('/api/health'),
        'https://localhost:4000/api/health': { status: 200, body: 'OK' },
        'https://localhost:5174/': html,
        'https://localhost:5599/__descix/app-binding.json': binding,
    });
    const g = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: green });
    assert.ok(g.lines.some((l) => /Not probed:/.test(l)), 'boundary printed on green');
    assert.match(g.result.probe_boundary, /Not probed:/);

    const red = http({ 'https://localhost:5174/': html });
    const r = await run({ _wsConfig: ws(), _exec: lsof([5174]), _httpsProbe: red });
    assert.ok(r.lines.some((l) => /Not probed:/.test(l)), 'boundary printed on red');
});

test('every probe line still matches `PASS|FAIL <name> [dev] (<probe>)` and names bound + serves', async () => {
    const probe = http({
        'https://localhost:4000/manifest': manifest('/api/health'),
        'https://localhost:4000/api/health': { status: 500, body: '' },
        'https://localhost:5174/': html,
        'https://localhost:5599/__descix/app-binding.json': binding,
    });
    const { lines } = await run({ _wsConfig: ws(), _exec: lsof([4000, 5174, 5599]), _httpsProbe: probe });
    const probeLines = lines.filter((l) => /\b(PASS|FAIL)\b/.test(l));
    assert.ok(probeLines.length >= 3);
    for (const l of probeLines) {
        // strip ANSI colour before matching the contract
        const plain = l.replace(/\x1b\[[0-9;]*m/g, '');
        assert.match(plain, /^\s+(PASS|FAIL) \S+ \[dev\] \(.+\)$/, plain);
        assert.match(plain, /bound:(yes|no)/, plain);
        assert.match(plain, /serves:(yes|no)/, plain);
    }
});

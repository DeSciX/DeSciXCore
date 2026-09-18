/**
 * GATE for the MCP-RESULTS-CARRY-NO-ORIGIN defect.
 *
 * MEASURED 2026-09-17: two sessions spent hours investigating a knowledge base as broken. Both
 * were reading DEV through the MCP connector while believing they were reading PROD, because no
 * MCP tool result said where it came from — `bin/mcp-server.js` returned every result as a bare
 * `JSON.stringify(result)`, no origin, no environment. `community_id`/`app_id` in the envelope
 * READ like provenance and are not.
 *
 * THE PROPERTY: every `tools/call` result — success AND error — carries the resolved origin and
 * environment name, from the ONE owner (`DeSciXApiClient.baseUrl`/`originSource`, set by
 * `resolveOrigin()` in `initialize()` — the same fact the CLI's own `env:` stderr line reports).
 *
 * Layer 1 (below) unit-tests the pure stamp module in isolation. Layer 2 drives the REAL shipped
 * `bin/mcp-server.js` over stdio JSON-RPC (the same harness pattern as
 * `scripts/check-mcp-stdout-purity.mjs`) so the property is proven on the artifact a client
 * actually talks to, not only on an imported function.
 *
 * NEGATIVE CONTROL (run it, do not take it on trust):
 *   cp bin/mcp-server.js /tmp/mcp-server.after.js
 *   git show HEAD:descix-cli/bin/mcp-server.js > bin/mcp-server.js   # pre-fix content
 *   node --test tests/mcp-origin-stamp.test.js                       # expect: Layer-2 tests RED
 *   cp /tmp/mcp-server.after.js bin/mcp-server.js                    # restore
 *   node --test tests/mcp-origin-stamp.test.js                       # expect: GREEN
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { originStampFor, formatOriginStampLine, stampToolResult } from '../lib/mcp-origin-stamp.js';

const CLI_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MCP_SERVER = path.join(CLI_ROOT, 'bin', 'mcp-server.js');

// ── Layer 1: the pure stamp module ──────────────────────────────────────────────────────────

test('originStampFor: refuses to stamp an uninitialized client (no guessing)', () => {
    assert.throws(() => originStampFor({ baseUrl: null, originSource: null }),
        /has no resolved baseUrl\/originSource/);
    assert.throws(() => originStampFor({ baseUrl: 'https://dev.descix.net', originSource: null }),
        /has no resolved baseUrl\/originSource/);
    assert.throws(() => originStampFor(null), /has no resolved baseUrl\/originSource/);
});

test('originStampFor: reads origin+source from the client and derives environment from the ONE env-name owner', () => {
    const stamp = originStampFor({ baseUrl: 'https://dev.descix.net', originSource: 'DESCIX_API_URL environment variable' });
    assert.deepEqual(stamp, {
        origin: 'https://dev.descix.net',
        source: 'DESCIX_API_URL environment variable',
        environment: 'dev',
    });

    // An origin outside the known ENV_MAP names itself honestly rather than guessing.
    const custom = originStampFor({ baseUrl: 'http://127.0.0.1:9999', originSource: 'explicit --api-url / caller-supplied baseUrl' });
    assert.equal(custom.environment, 'custom');
});

test('formatOriginStampLine: one spelling, names env + source + origin', () => {
    const line = formatOriginStampLine({ origin: 'https://descix.net', source: 'default — no workspace config', environment: 'prod' });
    assert.equal(line, '[DeSciX origin] env: prod (default — no workspace config) https://descix.net');
});

test('stampToolResult: APPENDS a content block and never touches the original content', () => {
    const original = { content: [{ type: 'text', text: '{"ok":true}' }] };
    const stamp = { origin: 'https://dev.descix.net', source: 'workspace', environment: 'dev' };
    const stamped = stampToolResult(original, stamp);

    // Original untouched (not mutated, and JSON.parse of the FIRST block still works exactly
    // as before — this is the "do not break existing consumers" requirement).
    assert.equal(original.content.length, 1, 'stampToolResult must not mutate its input');
    assert.deepEqual(stamped.content[0], { type: 'text', text: '{"ok":true}' });
    assert.deepEqual(JSON.parse(stamped.content[0].text), { ok: true });

    // A second, VISIBLE block carries the stamp — a reader cannot miss it.
    assert.equal(stamped.content.length, 2);
    assert.equal(stamped.content[1].type, 'text');
    assert.match(stamped.content[1].text, /^\[DeSciX origin\] env: dev /);

    // The MCP-spec extension point carries the same fact structurally, as a SIBLING of
    // `content` (not nested inside it), so it cannot be mistaken for tool payload.
    assert.deepEqual(stamped._meta.descix_origin, stamp);
});

test('stampToolResult: stamps an ERROR result exactly the same way', () => {
    const original = { content: [{ type: 'text', text: 'Error: boom' }], isError: true };
    const stamp = { origin: 'https://demo.descix.net', source: 'workspace', environment: 'demo' };
    const stamped = stampToolResult(original, stamp);
    assert.equal(stamped.isError, true);
    assert.equal(stamped.content[0].text, 'Error: boom');
    assert.match(stamped.content[1].text, /env: demo/);
    assert.deepEqual(stamped._meta.descix_origin, stamp);
});

test('stampToolResult: preserves an existing _meta rather than clobbering it', () => {
    const original = { content: [], _meta: { other: 1 } };
    const stamped = stampToolResult(original, { origin: 'https://descix.net', source: 's', environment: 'prod' });
    assert.equal(stamped._meta.other, 1);
    assert.ok(stamped._meta.descix_origin);
});

// ── Layer 2: the REAL shipped bin/mcp-server.js over stdio JSON-RPC ─────────────────────────

function tmpWorkspace(apiUrl, { wallet = false } = {}) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-origin-stamp-'));
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix/workspace.json'), JSON.stringify({
        version: '2.1', type: 'workspace', env: { products: [], apiUrl },
    }));
    if (wallet) {
        // A session token already present short-circuits ensureSession()'s own network call
        // (api-client.js: `if (this.credentials?.accessToken) return;`), so the ONLY network
        // hit a tools/call makes is the actual command POST — keeping the fixture deterministic.
        // Zeroed address/signature: no real identity, nothing that touches account state.
        fs.writeFileSync(path.join(dir, '.descix/wallet.json'), JSON.stringify({
            userId: 'origin-stamp-harness-not-a-real-user',
            walletAddress: '0x0000000000000000000000000000000000000000',
            signature: '0x' + '00'.repeat(65),
            sessionToken: 'harness-fake-session-token',
        }));
    }
    return dir;
}

/**
 * Drive the real mcp-server.js binary over stdio JSON-RPC and return the parsed
 * `tools/call` response for the given tool. Mirrors scripts/check-mcp-stdout-purity.mjs's
 * proven spawn/timing pattern.
 */
async function callTool(dir, toolName, args = {}) {
    const env = { ...process.env, HOME: dir, USERPROFILE: dir };
    delete env.DESCIX_API_URL;
    const p = spawn(process.execPath, [MCP_SERVER], { cwd: dir, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (d) => { out += d.toString('utf8'); });
    p.stderr.on('data', () => {});
    const send = (o) => p.stdin.write(JSON.stringify(o) + '\n');

    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'origin-stamp-gate', version: '0' } } });
    await new Promise((r) => setTimeout(r, 900));
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    await new Promise((r) => setTimeout(r, 300));
    send({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: toolName, arguments: args } });

    // Poll for the id:2 response rather than a single fixed sleep — bounded, deterministic.
    const deadline = Date.now() + 15000;
    let response = null;
    while (Date.now() < deadline && !response) {
        await new Promise((r) => setTimeout(r, 200));
        for (const line of out.split('\n')) {
            if (!line.trim()) continue;
            try {
                const j = JSON.parse(line);
                if (j && j.jsonrpc === '2.0' && j.id === 2) { response = j; break; }
            } catch { /* not a complete JSON line yet */ }
        }
    }
    p.kill('SIGKILL');
    assert.ok(response, `FIXTURE INVALID: no tools/call response for "${toolName}" within timeout. Raw stdout:\n${out}`);
    return response;
}

test('GATE: descix_doctor (local, no network) carries the origin stamp', async () => {
    // A real but unreachable origin — descix_doctor never dials out for its base report, so
    // this is a deterministic, network-free success path.
    const dir = tmpWorkspace('http://127.0.0.1:9');
    const resp = await callTool(dir, 'descix_doctor', { verify_remote: false });

    assert.ok(!resp.error, `descix_doctor returned a JSON-RPC error: ${JSON.stringify(resp.error)}`);
    const result = resp.result;
    assert.ok(Array.isArray(result.content) && result.content.length >= 2,
        'expected the original doctor report block PLUS an appended origin-stamp block');

    // Original payload is untouched and still parses — the "do not break JSON.parse" contract.
    const report = JSON.parse(result.content[0].text);
    assert.ok(report.status, 'FIXTURE INVALID: content[0] is not the doctor report');

    const stampLine = result.content[result.content.length - 1].text;
    assert.match(stampLine, /^\[DeSciX origin\] env: /, 'no visible origin stamp block on a SUCCESS result');
    assert.match(stampLine, /http:\/\/127\.0\.0\.1:9/, 'the stamp does not name the configured origin');

    assert.ok(result._meta?.descix_origin, 'no _meta.descix_origin on a SUCCESS result');
    assert.equal(result._meta.descix_origin.origin, 'http://127.0.0.1:9');
    assert.equal(result._meta.descix_origin.environment, 'custom');

    // The report itself also states it explicitly (doctor is the diagnostic surface).
    assert.deepEqual(report.origin_stamp, result._meta.descix_origin);
});

test('GATE: a real backend SUCCESS response is still stamped, and the original payload survives byte-for-byte', async () => {
    // A minimal mock backend — plain HTTP, no TLS needed for a 127.0.0.1 target — proving the
    // stamp attaches on the apiClient.invoke() dispatch path, not only descix_doctor's local one.
    const server = http.createServer((req, res) => {
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'OK', message: { balance_usd: 4.5, currency: 'USD' } }));
        });
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const dir = tmpWorkspace(`http://127.0.0.1:${port}`, { wallet: true });

    try {
        const resp = await callTool(dir, 'get_credit_balance', {});
        assert.ok(!resp.error, `get_credit_balance returned a JSON-RPC error: ${JSON.stringify(resp.error)}`);
        const result = resp.result;
        assert.ok(!result.isError, `expected success, got isError with content: ${JSON.stringify(result.content)}`);
        assert.equal(result.content.length, 2, 'expected the backend payload block PLUS the stamp block');

        const payload = JSON.parse(result.content[0].text);
        assert.deepEqual(payload.message, { balance_usd: 4.5, currency: 'USD' },
            'the backend payload must survive the stamp untouched');

        assert.match(result.content[1].text, new RegExp(`127\\.0\\.0\\.1:${port}`),
            'the stamp does not name the mock backend origin actually contacted');
        assert.equal(result._meta.descix_origin.origin, `http://127.0.0.1:${port}`);
    } finally {
        server.close();
    }
});

test('GATE: a real network ERROR result is stamped too — not only success', async () => {
    // Nothing listens on port 9 — a real, deterministic connection failure at the actual
    // command POST (ensureSession() is short-circuited by the pre-seeded sessionToken above).
    const dir = tmpWorkspace('http://127.0.0.1:9', { wallet: true });
    const resp = await callTool(dir, 'get_credit_balance', {});

    assert.ok(!resp.error, `expected a tool-level error result, not a JSON-RPC error: ${JSON.stringify(resp.error)}`);
    const result = resp.result;
    assert.equal(result.isError, true, 'expected the call to fail against an unreachable origin');
    assert.ok(result.content.length >= 2, 'an ERROR result must ALSO carry the appended stamp block');

    const stampLine = result.content[result.content.length - 1].text;
    assert.match(stampLine, /^\[DeSciX origin\] env: /, 'no visible origin stamp on an ERROR result — this is the exact defect measured 2026-09-17');
    assert.match(stampLine, /127\.0\.0\.1:9/);
    assert.ok(result._meta?.descix_origin, 'no _meta.descix_origin on an ERROR result');
});

console.error(
    '[mcp-origin-stamp gate] Layer 1 unit-tests the pure stamp module; Layer 2 drives the REAL ' +
    'bin/mcp-server.js over stdio JSON-RPC across 3 fixtures (local-only success, real-backend ' +
    'success via a mock HTTP server, real network error). CATCHES: any tools/call result — ' +
    'success or error, local or remote — returned without the origin/environment stamp, or a ' +
    'stamp that corrupts the original payload. DOES NOT READ: the packed tarball, or the ' +
    'HTTP /mcp transport (a separate surface — see WS-MCP-SSOT-TIER2). See the file header for ' +
    'the negative-control recipe (revert bin/mcp-server.js to HEAD and re-run: RED).',
);

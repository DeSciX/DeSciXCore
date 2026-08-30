#!/usr/bin/env node
/**
 * check-mcp-stdout-purity.mjs
 *
 * THE MCP STDIO SERVER'S STDOUT CARRIES ONLY JSON-RPC.
 *
 * WHY. bin/mcp-server.js speaks JSON-RPC over stdio, so its stdout IS the protocol stream. Before
 * 2026-08-30, driving one `tools/call` put 130 bytes of `[ApiClient] ...` text into it from
 * console.log calls in lib/api-client.js — on the credential-refresh path, which fires exactly
 * when a token expires.
 *
 * IT DRIVES THE REAL BINARY, not a unit under test: it spawns bin/mcp-server.js, speaks the
 * protocol to it, and reads what actually came back on fd 1. A line counts as clean only if it
 * parses as JSON with jsonrpc === '2.0'.
 *
 * THE CONTROL IS THE POINT. `--mode control` issues tools/list, which returns >80 KB of entirely
 * valid JSON-RPC. That is what makes a zero meaningful: it proves the harness read a large stream
 * and found nothing bad, rather than reading nothing at all and calling it clean.
 *
 * ZERO ACCOUNT STATE: a temp workspace, an origin pointed at the discard port, and a wallet.json
 * belonging to nobody (zero address, zero signature). Nothing is created, mutated, or
 * authenticated anywhere.
 *
 * COVERAGE BOUNDARY, printed with the verdict:
 *   · IT MEASURES A SURFACE AND CANNOT OBSERVE A HANG. A session that emits no bytes and then
 *     silently awaits a browser passes this gate. That blind spot is why
 *     check-mcp-headless-reachability.mjs exists beside it; neither substitutes for the other.
 *   · It drives two request shapes, not the whole tool surface.
 *   · It reads stdout only. stderr is expected to carry diagnostics and is not judged here.
 *
 * USAGE:  node scripts/check-mcp-stdout-purity.mjs [--mode invoke|control|both]
 * EXIT :  0 clean · 1 non-JSON-RPC bytes on stdout · 2 could not measure
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const die = (m) => { console.error(`check-mcp-stdout-purity: ${m}`); process.exit(2); };
const arg = (f, d) => { const i = process.argv.indexOf(f); return i === -1 ? d : process.argv[i + 1]; };

async function run(mode) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-purity-'));
    fs.mkdirSync(path.join(dir, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.descix/workspace.json'), JSON.stringify({
        version: '2.1', type: 'workspace', env: { products: [], apiUrl: 'http://127.0.0.1:9' },
    }));
    if (mode === 'invoke') {
        fs.writeFileSync(path.join(dir, '.descix/wallet.json'), JSON.stringify({
            userId: 'purity-harness-not-a-real-user',
            walletAddress: '0x0000000000000000000000000000000000000000',
            signature: '0x' + '00'.repeat(65),
        }));
    }
    const env = { ...process.env, HOME: dir, USERPROFILE: dir };
    delete env.DESCIX_API_URL;
    const p = spawn(process.execPath, [path.join(CLI, 'bin/mcp-server.js')], { cwd: dir, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = Buffer.alloc(0);
    p.stdout.on('data', (d) => { out = Buffer.concat([out, d]); });
    p.stderr.on('data', () => {});
    const send = (o) => p.stdin.write(JSON.stringify(o) + '\n');
    send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'purity', version: '0' } } });
    await new Promise((r) => setTimeout(r, 900));
    send({ jsonrpc: '2.0', method: 'notifications/initialized' });
    await new Promise((r) => setTimeout(r, 300));
    send(mode === 'invoke'
        ? { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_credit_balance', arguments: {} } }
        : { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
    await new Promise((r) => setTimeout(r, 4000));
    p.kill('SIGKILL');
    const bad = [];
    for (const line of out.toString('utf8').split('\n')) {
        if (line.trim() === '') continue;
        try { const j = JSON.parse(line); if (j && j.jsonrpc === '2.0') continue; } catch { /* not JSON */ }
        bad.push(line);
    }
    return { mode, stdoutBytes: out.length, badLines: bad.length, badBytes: Buffer.byteLength(bad.join('\n'), 'utf8'), sample: bad.slice(0, 4) };
}

const mode = arg('--mode', 'both');
const modes = mode === 'both' ? ['invoke', 'control'] : [mode];
let failed = false;
for (const m of modes) {
    const r = await run(m);
    if (m === 'control' && r.stdoutBytes < 80000) {
        die(`the control returned only ${r.stdoutBytes} bytes of stdout. A zero from a small stream proves nothing; refusing to report a verdict.`);
    }
    console.log(`  ${m.padEnd(8)} stdout=${r.stdoutBytes} badLines=${r.badLines} badBytes=${r.badBytes}`);
    for (const s of r.sample) console.log(`             ${s}`);
    if (r.badBytes > 0) failed = true;
}
console.log(`\n${failed ? 'RED' : 'GREEN'} — non-JSON-RPC bytes on the MCP stdio protocol stream`);
console.log(
    '\n  COVERAGE BOUNDARY: drives the REAL bin/mcp-server.js and judges fd 1 only. The control\n' +
    '  returns >80 KB of valid JSON-RPC, so a zero means "read a large stream, found nothing bad".\n' +
    '  IT MEASURES A SURFACE AND CANNOT OBSERVE A HANG — a session that emits nothing and then\n' +
    '  awaits a browser PASSES this gate; check-mcp-headless-reachability.mjs covers that axis.\n' +
    '  Two request shapes only. stderr is expected to carry diagnostics and is not judged here.');
process.exit(failed ? 1 : 0);

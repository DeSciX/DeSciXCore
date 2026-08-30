#!/usr/bin/env node
/**
 * check-mcp-headless-reachability.mjs
 *
 * FROM A CLIENT CONSTRUCTED THE WAY bin/mcp-server.js CONSTRUCTS IT, THE INTERACTIVE
 * DEVICE-LOGIN BRANCH MUST BE UNREACHABLE.
 *
 * WHY THIS EXISTS BESIDE THE STDOUT-PURITY GATE, AND WHY NEITHER SUBSTITUTES FOR THE OTHER.
 * The purity gate counts non-JSON-RPC bytes on stdout. It is a SURFACE gate, and it is blind to
 * the worst version of this defect: with diagnostics routed to stderr, an MCP session that hits
 * token expiry emits ZERO bad bytes and then silently `await`s `loginDevice()` — a browser flow —
 * inside a JSON-RPC request, forever. The purity gate goes GREEN on that. A loud corruption
 * traded for a silent hang, blessed by a correct instrument. Contract rev 10 made this a rule:
 * a gate can be property-shaped and still measure the wrong SURFACE; a behaviour property needs
 * a reachability gate beside the surface gate.
 *
 * HOW IT OBSERVES WITHOUT EXECUTING. An ESM resolve hook (scripts/mcp-auth-tripwire.mjs) throws
 * the instant `lib/commands/auth.js` is resolved. So the branch is caught REACHING for the
 * interactive flow; `loginDevice` never runs, no browser opens, and nothing waits. A negative
 * control that hangs is not a negative control — the tripwire is what makes RED observable in
 * bounded time.
 *
 * IT READS THE REAL CONSTRUCTION SITE. The probe is built from the options bin/mcp-server.js
 * actually passes, parsed with COMMENTS STRIPPED — this file's own prose says `serviceMode`
 * several times and a text scan would match its own documentation (measured: exactly that error
 * was made twice on this contract). Delete `serviceMode: true` from the construction site and
 * this gate goes RED by construction, because the probe stops setting it too.
 *
 * COVERAGE BOUNDARY, printed with the verdict:
 *   · It proves the branch is not REACHED. It does not prove `loginDevice` itself is correct.
 *   · It drives ONE failure shape (a server answering AUTH_FAILED). Other refresh failures may
 *     reach the same branch by other routes; this asserts the guarded one.
 *   · It constructs the client directly rather than running the stdio server, so it measures the
 *     client's reachability, not the transport. The purity harness measures the transport.
 *   · Nothing runs it automatically unless wired into CI.
 *
 * USAGE:  node scripts/check-mcp-headless-reachability.mjs
 * EXIT :  0 unreachable (good) · 1 reachable (RED) · 2 could not measure
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const die = (m) => { console.error(`check-mcp-headless-reachability: ${m}`); process.exit(2); };

if (process.argv.includes('--probe')) {
    const { runProbe } = await import('./mcp-headless-probe.mjs');
    await runProbe(CLI, process.argv.includes('--service-mode'));
    process.exit(0);
}

// ── Read the REAL construction site, comments stripped. ──────────────────────────────────────
const serverSrc = fs.readFileSync(path.join(CLI, 'bin/mcp-server.js'), 'utf8');
const m = serverSrc.match(/new DeSciXApiClient\(\s*\{[\s\S]*?\}\s*\)/);
if (!m) die('could not find the `new DeSciXApiClient({...})` construction site in bin/mcp-server.js');
const callNoComments = m[0].replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const declaresServiceMode = /serviceMode\s*:\s*true/.test(callNoComments);
const declaresBaseUrl = /baseUrl\s*:/.test(callNoComments);

console.log(`  CONSTRUCTION SITE (comments stripped): serviceMode=${declaresServiceMode} baseUrl=${declaresBaseUrl}`);

const r = spawnSync(process.execPath,
    [fileURLToPath(import.meta.url), '--probe', ...(declaresServiceMode ? ['--service-mode'] : [])],
    { cwd: CLI, encoding: 'utf8', timeout: 60000 });
if (r.error) die(`probe failed to run: ${r.error.message}`);
const line = (r.stdout || '').trim().split('\n').filter((l) => l.startsWith('{')).pop();
if (!line) die(`probe produced no result. stderr:\n${(r.stderr || '').slice(-600)}`);
const out = JSON.parse(line);

console.log(`  PROBE: headlessThrow=${out.headlessThrow} authModuleEntered=${out.authEntered}${out.other ? ` other=${out.other}` : ''}`);

const problems = [];
if (out.authEntered) problems.push('the interactive device-login module WAS entered — an MCP session would await a browser inside a JSON-RPC request');
if (!out.headlessThrow && !out.authEntered) problems.push(`refresh failure produced neither the headless throw nor an auth import (${out.other || 'unknown'})`);
if (declaresBaseUrl) problems.push('the construction site passes baseUrl, which prevents the origin owner from ever resolving (api-client.js resolves only `if (!this.baseUrl)`)');

for (const p of problems) console.log(`  RED: ${p}`);
console.log(`\n${problems.length ? 'RED' : 'GREEN'} — interactive device-login reachable from a stdio-constructed client: ${out.authEntered ? 'YES' : 'no'}`);
console.log(
    '\n  COVERAGE BOUNDARY: proves the branch is not REACHED from the real construction site, by\n' +
    '  tripping an ESM resolve hook rather than executing loginDevice — so RED is observable in\n' +
    '  bounded time with no browser and no hang. It does NOT verify loginDevice itself, drives ONE\n' +
    '  failure shape (server answers AUTH_FAILED), and measures the CLIENT rather than the stdio\n' +
    '  transport (the purity harness measures that). Nothing runs it automatically.');
process.exit(problems.length ? 1 : 0);

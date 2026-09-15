/**
 * G1 CENSUS RUNNER. Runs each CLI test file ALONE, with the census sensor armed, and classifies
 * it by what it actually did — not by what a grep found in it.
 *
 * THE LOOPBACK LISTENER: a real HTTP server on 127.0.0.1 that LOGS EVERY CONNECTION and answers
 * plausibly. The parent environment's DESCIX_API_URL points at it. A harness that does not pin
 * its own origin INHERITS this one, connects, and NAMES ITSELF in the listener's log. A harness
 * that pins elsewhere connects elsewhere. A harness that spawns with a CLEAN env resolves the
 * shipped PRODUCTION default and is caught by the sensor's non-loopback blocker instead.
 *
 * IT IS NOT A SILENT STUB. A silent stub reads identically whether anyone connected or not,
 * which is a gate that cannot fail. Every accept is logged with a monotonic sequence number, and
 * the run asserts its POSITIVE CONTROLS logged connections before it trusts any file's silence.
 *
 * EXIT STATUS IS READ DIRECTLY FROM THE CHILD (spawnSync().status). Never through a shell pipe.
 */
import { spawnSync, spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Derived from this file's OWN location, so the census always measures THE TREE IT SHIPS IN.
// A hardcoded path measures whichever checkout it names, which is the mistake this whole row is about.
const CLI = path.resolve(__dirname, '..', '..');
const TESTS = path.join(CLI, 'tests');
const TRACER = path.join(__dirname, 'census-tracer.mjs');
const OUTDIR = process.env.CENSUS_OUTDIR || path.join(os.tmpdir(), 'descix-harness-census');
fs.mkdirSync(OUTDIR, { recursive: true });

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const TIMEOUT_MS = Number(process.env.CENSUS_TIMEOUT_MS || 300000);

// ------------------------------------------------------------------ the loopback listener
// IN ITS OWN PROCESS: spawnSync blocks this runner's event loop for the whole of every child
// run, so an in-process server could never accept during a measurement. Measured, 2026-09-15.
const LISTENER_LOG = path.join(OUTDIR, 'listener.jsonl');
const PORTFILE = path.join(OUTDIR, 'listener.port');
try { fs.unlinkSync(PORTFILE); } catch { /* absent */ }
const listener = spawn(process.execPath, [path.join(__dirname, 'census-listener.mjs')], {
    stdio: 'inherit', detached: false,
    env: { ...process.env, CENSUS_LISTENER_LOG: LISTENER_LOG, CENSUS_LISTENER_PORTFILE: PORTFILE },
});
const deadline = Date.now() + 15000;
while (!fs.existsSync(PORTFILE) && Date.now() < deadline) {
    spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},100)']);   // block ~100ms without a timer
}
if (!fs.existsSync(PORTFILE)) { console.error('[census] LISTENER FAILED TO START'); process.exit(2); }
const PORT = Number(fs.readFileSync(PORTFILE, 'utf-8').trim());
const CENSUS_ORIGIN = `http://127.0.0.1:${PORT}`;
console.log(`[census] loopback listener (separate process) on ${CENSUS_ORIGIN} — logs every connection`);

/** Read the listener's log; entries are correlated to a file by TIME WINDOW. */
function listenerSince(t0, t1) {
    if (!fs.existsSync(LISTENER_LOG)) return [];
    return fs.readFileSync(LISTENER_LOG, 'utf-8').trim().split('\n').filter(Boolean)
        .map((l) => { try { return JSON.parse(l); } catch { return null; } })
        .filter((e) => e && e.t >= t0 && e.t <= t1);
}

// ------------------------------------------------------------------ one run
function runFile(label, argv, extraEnv = {}) {
    const log = path.join(OUTDIR, label.replace(/[^\w.-]/g, '_') + '.jsonl');
    fs.writeFileSync(log, '');
    const t0 = Date.now();
    const r = spawnSync(process.execPath, argv, {
        cwd: CLI,
        timeout: TIMEOUT_MS,
        encoding: 'utf-8',
        maxBuffer: 64 * 1024 * 1024,
        env: {
            ...process.env,
            DESCIX_API_URL: CENSUS_ORIGIN,       // the ambient origin an unpinned harness inherits
            NO_COLOR: '1', FORCE_COLOR: '0',
            NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --import ${TRACER}`.trim(),
            HARNESS_CENSUS_LOG: log,
            HARNESS_CENSUS_FILE: label,
            HARNESS_CENSUS_SELF: TRACER,
            HARNESS_CENSUS_PORT: String(PORT),
            ...extraEnv,
        },
    });
    // EXIT STATUS READ DIRECTLY FROM THE CHILD, not through a pipe.
    const status = r.status;
    const events = fs.readFileSync(log, 'utf-8').trim().split('\n').filter(Boolean)
        .map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const t1 = Date.now();
    const listenerHits = listenerSince(t0, t1 + 500);
    return { label, status, signal: r.signal, ms: t1 - t0, events, listenerHits,
             stdout: r.stdout || '', stderr: r.stderr || '' };
}

function classify(run) {
    const conns = run.events.filter((e) => e.kind === 'connect');
    const established = run.events.filter((e) => e.kind === 'established');
    // EITHER sensor naming the census origin counts: the pre-connect option read OR the
    // post-connect peer address. Two derivations, and a disagreement is itself a finding.
    const toCensus = [...conns.filter((e) => e.toCensusOrigin),
                      ...established.filter((e) => e.toCensusOrigin)];
    const blocked = run.events.filter((e) => e.kind === 'blocked-nonloopback');
    const otherLoop = conns.filter((e) => e.loopback && !e.toCensusOrigin);
    const spawns = run.events.filter((e) => e.kind === 'spawn');
    const unpinnedSpawns = spawns.filter((e) => !e.descixApiUrlPresent);
    const pinnedSpawns = spawns.filter((e) => e.descixApiUrlPresent);

    let verdict;
    if (blocked.length) verdict = 'REACHES-REAL-NETWORK';
    else if (toCensus.length) verdict = 'REACHES-AMBIENT-ORIGIN';
    else if (otherLoop.length) verdict = 'LOOPBACK-OWN-STUB-ONLY';
    else verdict = 'NEVER-CONNECTS';

    return {
        verdict,
        listenerAccepts: run.listenerHits.filter((h) => h.kind === 'connection').length,
        listenerRequests: run.listenerHits.filter((h) => h.kind === 'request').length,
        connectsTotal: conns.length,
        established: established.length,
        establishedRemotes: [...new Set(established.map((e) => `${e.remote}:${e.remotePort}`))],
        toCensusOrigin: toCensus.length,
        blockedNonLoopback: blocked.map((b) => `${b.host}:${b.port}`),
        otherLoopbackPorts: [...new Set(otherLoop.map((e) => String(e.port)))],
        // TRACED PROCESSES is the reliable population figure: arming propagates through
        // NODE_OPTIONS inheritance and every armed process writes a `tracer-armed` record.
        tracedProcs: new Set(run.events.filter((e) => e.kind === 'tracer-armed').map((e) => e.pid)).size,
        // DELIBERATELY NOT REPORTED AS A COUNT: the spawn-env sensor is BLIND to
        // `import { spawn } from 'node:child_process'`. ESM named imports bind to the builtin's
        // facade at wrap time and do NOT see a later mutation of the module object (measured
        // 2026-09-15: `namespace.spawnSync === patched` is false). Every harness in this suite
        // uses the named import, so this sensor read 0 for every file including ones that
        // demonstrably spawn. A zero here means "not observed", never "did not happen", so it is
        // not published as a number that a reader could mistake for a measurement.
        spawnSensorBlind: true,
    };
}

// ------------------------------------------------------------------ POSITIVE CONTROLS
// A listener that logs nothing reads identically to a listener nobody called. Prove it logs.
const results = [];
const PC = [];

// PC-A — instrument control: a child that we KNOW connects to the ambient origin.
{
    const src = path.join(OUTDIR, 'pc-a.mjs');
    fs.writeFileSync(src, `
import http from 'node:http';
const u = new URL(process.env.DESCIX_API_URL);
await new Promise((res, rej) => {
  const rq = http.request({host:u.hostname, port:u.port, path:'/apifront', method:'POST'}, (r)=>{
    r.resume(); r.on('end', res);
  });
  rq.on('error', rej); rq.end(JSON.stringify({command:'census_positive_control'}));
});
console.log('PC-A connected');
`);
    PC.push(runFile('POSITIVE-CONTROL-A-known-connector', [src]));
}

// PC-B — SUBJECT CONTROL: the REAL CLI BINARY driven to a genuinely network-bound verb.
// The first attempt used `app list` with no credential and the CLI refused at requireAuth BEFORE
// the network — proving nothing about the sensor. A harness that cannot reach the behaviour under
// test does not measure it. So this one supplies a DISPOSABLE, SHAPE-ONLY fixture wallet (no real
// address, no real signature, never leaves this machine, no account state touched) so the binary
// gets past auth and actually opens a socket.
{
    const src = path.join(OUTDIR, 'pc-b.mjs');
    const BIN = path.join(CLI, 'bin', 'descix.js');
    const fixture = path.join(OUTDIR, 'pc-b-fixture');
    fs.rmSync(fixture, { recursive: true, force: true });
    fs.mkdirSync(path.join(fixture, '.descix'), { recursive: true });
    fs.writeFileSync(path.join(fixture, '.descix', 'workspace.json'), JSON.stringify({
        version: '2.1', workspaceRoot: fixture, type: 'workspace',
        env: { environment: 'DEV', gateway: { port: 5173 },
               products: [{ appId: 'censusapp', localPath: '.', kbId: 'General', communityId: 'censuscomm' }] },
    }, null, 2));
    fs.writeFileSync(path.join(fixture, '.descix', 'wallet.json'), JSON.stringify({
        walletAddress: '0x' + 'a'.repeat(40),
        signature: 'fixture-not-a-credential',
        userId: 'census-disposable',
        sessionToken: 'fixture-not-a-credential',
        expiresAt: '2099-01-01T00:00:00.000Z',
    }, null, 2));
    fs.writeFileSync(src, `
import { spawnSync } from 'node:child_process';
const r = spawnSync(process.execPath, [${JSON.stringify(BIN)}, 'app', 'list'], {
  cwd: ${JSON.stringify(fixture)}, encoding: 'utf-8', timeout: 90000
});
console.log('PC-B cli status =', r.status);
console.log((r.stdout||'').slice(0,500));
console.log((r.stderr||'').slice(0,500));
`);
    PC.push(runFile('POSITIVE-CONTROL-B-real-cli-binary', [src]));
}

for (const pc of PC) {
    const c = classify(pc);
    results.push({ ...pc, cls: c });
    console.log(`\n[POSITIVE CONTROL] ${pc.label}`);
    console.log(`  exit=${pc.status} signal=${pc.signal} ms=${pc.ms}`);
    console.log(`  listener accepts=${c.listenerAccepts} requests=${c.listenerRequests}`);
    console.log(`  verdict=${c.verdict} connects=${c.connectsTotal} established=${c.established} ${JSON.stringify(c.establishedRemotes)}`);
    console.log(`  toCensusOrigin=${c.toCensusOrigin} blockedNonLoopback=${JSON.stringify(c.blockedNonLoopback)}`);
    if (pc.stdout.trim()) console.log('  stdout: ' + pc.stdout.trim().split('\n').slice(0, 6).join('\n          '));
    if (pc.stderr.trim()) console.log('  stderr: ' + pc.stderr.trim().split('\n').slice(0, 6).join('\n          '));
}

// ------------------------------------------------------------------ THE CONTROL GATE
// A LISTENER THAT LOGS NOTHING READS EXACTLY LIKE A LISTENER NOBODY CALLED. Every "this harness
// never connects" verdict below is an ABSENCE CLAIM, and an absence claim is evidence ONLY if
// this instrument can be shown to register a PRESENCE. That is what the two positive controls
// are for, and this gate makes them load-bearing instead of decorative: with either control dead
// the census REFUSES TO PUBLISH rather than printing 60 reassuring silences it cannot attribute.
{
    const dead = results.filter((r) => r.cls.listenerAccepts === 0 || r.cls.toCensusOrigin === 0);
    if (dead.length) {
        console.error('\nCENSUS REFUSES TO PUBLISH: its positive control(s) did not register.');
        for (const d of dead) {
            console.error(`  ${d.label}: listenerAccepts=${d.cls.listenerAccepts} ` +
                          `toAmbientOrigin=${d.cls.toCensusOrigin} exit=${d.status} signal=${d.signal}`);
        }
        console.error([
            '',
            '  WHY THIS BLOCKS THE WHOLE RUN: every verdict this census emits about a harness that',
            '  did NOT connect is an absence claim. An absence is evidence only if the instrument',
            '  could have recorded a presence. With a control dead, "NEVER-CONNECTS" and "the sensor',
            '  is broken" are the same reading, and publishing would be a gate that cannot fail.',
            '',
            '  DEBUG THE CONTROLS, NOT THE HARNESSES.',
        ].join('\n'));
        listener.kill();
        process.exit(3);
    }
    console.log('[census] CONTROL GATE PASSED: both positive controls registered on the listener.');
}

// ------------------------------------------------------------------ the census proper
const files = (only.length ? only : fs.readdirSync(TESTS).filter((f) => f.endsWith('.test.js')).sort());
console.log([
    '',
    '=== COVERAGE BOUNDARY (printed on GREEN as well as RED) ===',
    'COMPARES : every tests/*.test.js run ALONE, with a connection sensor armed in the runner',
    '           and propagated into every child via NODE_OPTIONS. Destination is read twice --',
    '           pre-connect from the options and post-connect from the peer address.',
    'CATCHES  : any TCP connection any traced process opens, and names its destination. A',
    '           connection to the ambient origin means the harness did not pin one. A',
    '           non-loopback connection is NAMED AND BLOCKED, never allowed to leave.',
    'DOES NOT : see a child spawned with an env that drops NODE_OPTIONS -- such a child is',
    '           untraced and its silence is NOT evidence. Does NOT report spawn-env pinning as a',
    '           count: that sensor is blind to ESM named imports (see classify()).',
    'DOES NOT : prove a harness is safe under code paths it did not execute. A harness that',
    '           refuses before its network step reads identically to one that has none.',
    'SAFETY   : nothing reaches a real origin; non-loopback is blocked at the socket.',
    'OBSERVER : blocking and NODE_OPTIONS injection are declared observer effects.',
    'RUN BY   : nothing automatic. This is an on-demand census, not part of `npm test`.',
    '==========================================================',
    '',
    `[census] ${files.length} test files (npm test glob: tests/*.test.js)`,
    '',
].join('\n'));

for (const f of files) {
    const run = runFile(f, ['--test', path.join('tests', f)]);
    const c = classify(run);
    results.push({ ...run, cls: c });
    console.log(`${c.verdict.padEnd(24)} ${f.padEnd(50)} exit=${String(run.status).padEnd(5)} ` +
                `tracedProcs=${String(c.tracedProcs).padEnd(3)} conns=${c.connectsTotal} ` +
                `toAmbientOrigin=${c.toCensusOrigin} ` +
                `nonLoopback=${c.blockedNonLoopback.length ? JSON.stringify(c.blockedNonLoopback) : '-'}`);
}

fs.writeFileSync(path.join(OUTDIR, 'census.json'),
    JSON.stringify(results.map((r) => ({ label: r.label, status: r.status, signal: r.signal,
        ms: r.ms, cls: r.cls })), null, 2));
listener.kill();
console.log(`\n[census] wrote ${path.join(OUTDIR, 'census.json')}`);

/**
 * CEO-D-2026-06-01-SCAFFOLD-DX-GAPS — gap #1: killExistingProcess must be
 * port-scoped and fail-safe.
 *
 * Proves:
 *  (a) isDebug=false  -> no-op (never kills in production).
 *  (b) port undefined -> FAILS SAFE: kills NOTHING (the old behavior killed every
 *      `node app.js`, including the daita Core :4000 backend, when it could not
 *      derive a DeSciX_ service dir from an apps/{app}/microservice/app.js path).
 *  (c) port 'auto' / out-of-range -> fail safe (kills nothing).
 *  (d) given a real port, it kills ONLY the process LISTENING on THAT port and
 *      provably leaves an unrelated listener on a different port ALIVE
 *      (this models "don't kill Core :4000 when booting apps/foo on :3015").
 *
 * No :4000 dependency — the test stands up its own throwaway listeners on
 * ephemeral ports, so it can run safely while Core is up.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { killExistingProcess } from '../src/processUtils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HERE = resolve(__dirname, '..');

// An apps/{app}/microservice/app.js-style URL — the layout that broke the old
// DeSciX_-segment path derivation and caused service:'any' (kill-all).
const APPS_LAYOUT_URL = 'file:///Users/dev/Unkamon/apps/descix-ssgpod/microservice/app.js';

/** Spawn a detached `node` child that binds `port` and then idles. Returns { pid, kill }. */
function spawnListener(port) {
    const code = `
        const net = require('net');
        const s = net.createServer(() => {});
        s.listen(${port}, '127.0.0.1', () => { process.stdout.write('UP'); });
        setInterval(() => {}, 1 << 30);
    `;
    const child = spawn(process.execPath, ['-e', code], { cwd: HERE, stdio: ['ignore', 'pipe', 'ignore'] });
    return new Promise((res, rej) => {
        let buf = '';
        const t = setTimeout(() => rej(new Error(`listener on ${port} never came up`)), 4000);
        child.stdout.on('data', (d) => {
            buf += d.toString();
            if (buf.includes('UP')) { clearTimeout(t); res(child); }
        });
        child.on('error', rej);
    });
}

function pidAlive(pid) {
    try { process.kill(pid, 0); return true; } catch { return false; }
}

async function freePort() {
    return new Promise((res) => {
        const srv = net.createServer();
        srv.listen(0, '127.0.0.1', () => {
            const p = srv.address().port;
            srv.close(() => res(p));
        });
    });
}

async function settle(ms = 250) { return new Promise(r => setTimeout(r, ms)); }

test('isDebug=false is a no-op (never kills in production)', async () => {
    const port = await freePort();
    const child = await spawnListener(port);
    try {
        killExistingProcess(APPS_LAYOUT_URL, /* isDebug */ false, port);
        await settle();
        assert.equal(pidAlive(child.pid), true, 'process must survive when isDebug=false');
    } finally {
        child.kill('SIGKILL');
    }
});

test('no port -> FAILS SAFE: kills nothing (apps/{app}/microservice layout)', async () => {
    const port = await freePort();
    const child = await spawnListener(port);
    try {
        // The exact scenario from the directive: an apps/{app}/microservice/app.js
        // URL with no port. Old code -> service:'any' -> killed all node app.js.
        killExistingProcess(APPS_LAYOUT_URL, true, undefined);
        await settle();
        assert.equal(pidAlive(child.pid), true, 'fail-safe: must not kill any process when port is unknown');
    } finally {
        child.kill('SIGKILL');
    }
});

test("port 'auto' / out-of-range -> fail safe", async () => {
    const port = await freePort();
    const child = await spawnListener(port);
    try {
        killExistingProcess(APPS_LAYOUT_URL, true, 'auto');
        killExistingProcess(APPS_LAYOUT_URL, true, 999999);
        killExistingProcess(APPS_LAYOUT_URL, true, 0);
        await settle();
        assert.equal(pidAlive(child.pid), true, 'invalid ports must not trigger any kill');
    } finally {
        child.kill('SIGKILL');
    }
});

test('port-scoped: kills ONLY the listener on the target port; unrelated app.js survives', async () => {
    const targetPort = await freePort();   // models apps/foo microservice
    const bystanderPort = await freePort(); // models the Core :4000 backend (unrelated node)
    assert.notEqual(targetPort, bystanderPort);

    const target = await spawnListener(targetPort);
    const bystander = await spawnListener(bystanderPort);
    try {
        killExistingProcess(APPS_LAYOUT_URL, true, targetPort);
        await settle();

        assert.equal(pidAlive(target.pid), false, 'the prior instance on the target port must be killed');
        assert.equal(pidAlive(bystander.pid), true, 'an unrelated node app.js on a different port must SURVIVE (Core :4000 safety)');
    } finally {
        target.kill('SIGKILL');
        bystander.kill('SIGKILL');
    }
});

test('no listener on target port -> no error, kills nothing', async () => {
    const port = await freePort(); // nothing bound here
    // Should simply log "no existing process" and return cleanly.
    killExistingProcess(APPS_LAYOUT_URL, true, port);
    await settle(100);
    assert.ok(true);
});

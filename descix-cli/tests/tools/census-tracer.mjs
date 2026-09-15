/**
 * G1 CENSUS SENSOR — preloaded via --import into the `node --test` parent AND propagated into
 * every child process the harness spawns.
 *
 * IT MEASURES TWO THINGS, neither of which is a grep:
 *   1. SPAWN ENV: for every spawn/spawnSync/execFile/fork, the RESOLVED value of DESCIX_API_URL
 *      in the child's environment — present-and-what, or absent (which means the child resolves
 *      the SHIPPED PRODUCTION DEFAULT via origin.js::resolveOrigin).
 *   2. OUTBOUND CONNECTIONS: every net.Socket.prototype.connect, with destination.
 *
 * NON-LOOPBACK CONNECTIONS ARE NAMED AND BLOCKED, never allowed. A census must not touch
 * production or any account state. Blocking is declared observer effect: the harness sees a
 * connection error instead of a response. We are measuring WHO REACHES OUT, not whether the
 * call would have succeeded.
 */
import net from 'node:net';
import tls from 'node:tls';
import cp from 'node:child_process';
import fs from 'node:fs';

const LOG = process.env.HARNESS_CENSUS_LOG;
const FILE = process.env.HARNESS_CENSUS_FILE || '<unknown>';
const SELF = process.env.HARNESS_CENSUS_SELF;
const CENSUS_PORT = process.env.HARNESS_CENSUS_PORT || '';

function rec(o) {
    try {
        fs.appendFileSync(LOG, JSON.stringify({ file: FILE, pid: process.pid, ...o }) + '\n');
    } catch { /* the sensor must never be the thing that fails the run */ }
}

const isLoopback = (h) =>
    h === undefined || h === null || h === '' ||
    h === '127.0.0.1' || h === 'localhost' || h === '::1' || h === '[::1]' ||
    /^127\./.test(String(h));

// ---------------------------------------------------------------- connection sensor
/**
 * MEASURED, not assumed (2026-09-15): Node does NOT call this with `(options, cb)`. It calls it
 * with ONE argument that is the ALREADY-NORMALIZED args array — an array-like whose [0] is the
 * real options object. Reading `args[0].host` therefore yields undefined on every single real
 * connection, which is exactly what the first positive-control run showed: host=null port=null
 * on a connection the listener simultaneously logged as accepted. Unwrap before reading.
 */
function destinationOf(args) {
    let o = args[0];
    if (o && typeof o === 'object' && !Array.isArray(o)
        && o.host === undefined && o.port === undefined && o.path === undefined
        && o[0] && typeof o[0] === 'object') {
        o = o[0];                                  // normalized-args array-like
    } else if (Array.isArray(o) && o[0] && typeof o[0] === 'object') {
        o = o[0];
    }
    if (o && typeof o === 'object') return { host: o.host, port: o.port, unixPath: o.path };
    if (typeof o === 'number' || (typeof o === 'string' && /^\d+$/.test(o))) {
        return { port: o, host: typeof args[1] === 'string' ? args[1] : undefined };
    }
    if (typeof o === 'string') return { unixPath: o };
    return {};
}

const origConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
    const { host, port, unixPath } = destinationOf(args);

    const loop = unixPath !== undefined ? true : isLoopback(host);
    const toCensus = String(port) === String(CENSUS_PORT) && isLoopback(host);

    rec({
        kind: 'connect',
        host: host ?? null,
        port: port ?? null,
        unixPath: unixPath ?? null,
        loopback: loop,
        toCensusOrigin: toCensus,
    });

    if (!loop) {
        // NAME IT AND REFUSE IT. This is the whole safety property of the census.
        rec({ kind: 'blocked-nonloopback', host: host ?? null, port: port ?? null });
        const err = new Error(
            `HARNESS CENSUS: blocked a NON-LOOPBACK connection to ${host}:${port}. ` +
            `This harness reaches the real network.`);
        err.code = 'ECENSUSBLOCKED';
        process.nextTick(() => this.destroy(err));
        return this;
    }
    const ret = origConnect.apply(this, args);
    // INDEPENDENT CONFIRMATION: the pre-connect option read and the post-connect peer address are
    // two derivations of one fact. Recording both is what caught the normalized-args defect.
    this.once('connect', () => {
        rec({ kind: 'established', remote: this.remoteAddress ?? null,
              remotePort: this.remotePort ?? null,
              toCensusOrigin: String(this.remotePort) === String(CENSUS_PORT) });
    });
    return ret;
};

// tls.connect can build its own socket; record the intent too.
const origTlsConnect = tls.connect;
tls.connect = function (...args) {
    const a0 = args[0];
    if (a0 && typeof a0 === 'object') {
        rec({ kind: 'tls-connect', host: a0.host ?? a0.servername ?? null, port: a0.port ?? null,
              loopback: isLoopback(a0.host) });
    }
    return origTlsConnect.apply(this, args);
};

// ---------------------------------------------------------------- spawn sensor + propagation
function describeEnv(options) {
    const explicit = !!(options && options.env);
    const e = explicit ? options.env : process.env;
    const has = Object.prototype.hasOwnProperty.call(e, 'DESCIX_API_URL');
    return {
        explicitEnvObject: explicit,
        spreadsParentEnv: explicit ? (e.PATH === process.env.PATH && Object.keys(e).length > 12) : true,
        descixApiUrl: has ? e.DESCIX_API_URL : null,
        descixApiUrlPresent: has,
    };
}

function injectTracer(options) {
    const o = { ...(options || {}) };
    const base = (o.env ? { ...o.env } : { ...process.env });
    base.NODE_OPTIONS = `${base.NODE_OPTIONS || ''} --import ${SELF}`.trim();
    base.HARNESS_CENSUS_LOG = LOG;
    base.HARNESS_CENSUS_FILE = FILE;
    base.HARNESS_CENSUS_SELF = SELF;
    base.HARNESS_CENSUS_PORT = CENSUS_PORT;
    o.env = base;
    return o;
}

/** child_process signatures put `options` in different slots; find it without guessing. */
function patchSpawnLike(name) {
    const orig = cp[name];
    if (typeof orig !== 'function') return;
    cp[name] = function (...args) {
        let idx = -1;
        for (let i = args.length - 1; i >= 1; i--) {
            if (args[i] && typeof args[i] === 'object' && !Array.isArray(args[i])) { idx = i; break; }
        }
        const options = idx === -1 ? undefined : args[idx];
        const cmd = String(args[0]);
        const argv = Array.isArray(args[1]) ? args[1].map(String) : [];
        rec({ kind: 'spawn', api: name, cmd, argv: argv.slice(0, 6), ...describeEnv(options) });

        const injected = injectTracer(options);
        if (idx === -1) args.push(injected); else args[idx] = injected;
        return orig.apply(this, args);
    };
}
['spawn', 'spawnSync', 'execFile', 'execFileSync', 'exec', 'execSync', 'fork'].forEach(patchSpawnLike);

rec({ kind: 'tracer-armed', argv: process.argv.slice(1, 4).map(String) });

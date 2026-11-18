/**
 * Preload (`node --import <this file>`) that makes every way out of the process throw, and records
 * each attempt, so a test can prove an invocation touched NOTHING outside it.
 *
 * Blocked and recorded: net (Socket.connect, connect, createConnection), tls.connect, dns lookups
 * (callback and promise APIs, resolve*), http/https request/get, http2.connect, global fetch.
 * Also recorded (not blocked): every read of a file named `wallet.json` (kind `wallet.read.*`),
 * every existence probe of one (kind `wallet.probe.*`), and every read of the command-surface cache
 * (kind `cache.read.*`).
 *
 * Each attempt is appended, one JSON line, to the file named by DESCIX_TEST_ATTEMPT_LOG. The log is
 * the evidence: a CLI that catches the throw and carries on would otherwise hide the attempt.
 */
import fs from 'node:fs';
import module from 'node:module';
import net from 'node:net';
import tls from 'node:tls';
import dns from 'node:dns';
import http from 'node:http';
import https from 'node:https';
import http2 from 'node:http2';

const LOG = process.env.DESCIX_TEST_ATTEMPT_LOG;
if (!LOG) throw new Error('no-network-preload: DESCIX_TEST_ATTEMPT_LOG must name the attempt log file');

// Keep the original appendFileSync: the fs wrappers below must not record the log's own writes.
const append = fs.appendFileSync.bind(fs);
function record(kind, detail) {
  append(LOG, JSON.stringify({ kind, detail: String(detail ?? '') }) + '\n');
}

function blocked(kind) {
  return function blockedCall(...args) {
    const first = args[0];
    const detail = typeof first === 'string' ? first : (first && (first.href || first.host || first.hostname || first.path)) || '';
    record(kind, detail);
    throw new Error(`no-network-preload: ${kind} is blocked in this test (${detail})`);
  };
}

net.Socket.prototype.connect = blocked('net.Socket.connect');
net.connect = blocked('net.connect');
net.createConnection = blocked('net.createConnection');
tls.connect = blocked('tls.connect');
for (const fn of ['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'resolveSrv', 'resolveTxt']) {
  dns[fn] = blocked(`dns.${fn}`);
  dns.promises[fn] = blocked(`dns.promises.${fn}`);
}
http.request = blocked('http.request');
http.get = blocked('http.get');
https.request = blocked('https.request');
https.get = blocked('https.get');
http2.connect = blocked('http2.connect');
globalThis.fetch = blocked('fetch');

function isWallet(p) {
  try {
    return typeof p === 'string' ? p.endsWith('wallet.json') : (p instanceof URL ? p.pathname.endsWith('wallet.json') : false);
  } catch {
    return false;
  }
}
function isSurfaceCache(p) {
  return typeof p === 'string' && p.endsWith('command-surface-cache.json');
}
function watchPath(obj, name, kind) {
  const original = obj[name];
  obj[name] = function watched(p, ...rest) {
    if (isWallet(p)) record(kind, p);
    if (kind.startsWith('wallet.read.') && isSurfaceCache(p)) record(kind.replace('wallet.read.', 'cache.read.'), p);
    return original.call(this, p, ...rest);
  };
}
for (const name of ['readFileSync', 'openSync', 'readFile', 'open', 'createReadStream']) {
  watchPath(fs, name, `wallet.read.fs.${name}`);
}
for (const name of ['readFile', 'open']) {
  watchPath(fs.promises, name, `wallet.read.fs.promises.${name}`);
}
for (const name of ['existsSync', 'statSync', 'accessSync']) {
  watchPath(fs, name, `wallet.probe.fs.${name}`);
}
for (const name of ['stat', 'access']) {
  watchPath(fs.promises, name, `wallet.probe.fs.promises.${name}`);
}

// Named ESM imports of builtins (`import { request } from 'node:https'`) see the patches only
// after this sync.
module.syncBuiltinESMExports();

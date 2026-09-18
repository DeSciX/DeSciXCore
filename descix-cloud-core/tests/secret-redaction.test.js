/**
 * GATE for SECRETS-IN-BOOTSTRAP-LOGS.
 *
 * MEASURED ON PROD: `[Config] Bootstrap (Env) ${key}=${this[key]}` (config.js, pre-fix) logged
 * EVERY bootstrap key with its VALUE, and `DEVELOPER_SIGNATURE` (config-schema.json
 * bootstrap_keys) — the CEO's durable wallet signature — is one of them. It was therefore in
 * PROD and DEV Cloud Logging in cleartext on every boot, readable by anyone with log access,
 * far wider than the Secret Manager binding it was stored behind.
 *
 * THE PROPERTY: a key classified secret in config-schema.json `secret_keys` is NEVER printed
 * with its value — at the bootstrap-key log site AND at the hot-reload log site (the "siblings"
 * this fix also covers) — while a non-secret key still prints normally. The classification is
 * read from the schema (one declarable place), not guessed per call site.
 *
 * NEGATIVE CONTROL (run it, do not take it on trust):
 *   cp src/config.js /tmp/config.after.js; cp config-schema.json /tmp/config-schema.after.json
 *   git show HEAD:descix-cloud-core/src/config.js > src/config.js
 *   git show HEAD:descix-cloud-core/config-schema.json > config-schema.json
 *   node --test tests/secret-redaction.test.js   # expect: the boot-log gate RED (secret value printed)
 *   cp /tmp/config.after.js src/config.js; cp /tmp/config-schema.after.json config-schema.json
 *   node --test tests/secret-redaction.test.js   # expect: GREEN
 *
 * NEVER PRINT A SECRET VALUE ANYWHERE — including in this file. The fixture value below
 * (SENTINEL) is an obviously-fake placeholder string, never a real credential, and every
 * assertion checks for its ABSENCE, never logs it itself on failure without redacting first.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import { isSecretConfigKey, loggableConfigValue, createCloudConfig, _resetCloudConfigForTests } from '../src/config.js';
import schema from '../config-schema.json' with { type: 'json' };

// An obviously-fake placeholder — never a real credential. Every assertion below checks for
// its ABSENCE from captured log output; it never appears in a passing test's own output.
const SENTINEL = 'FAKE-NOT-A-REAL-SIGNATURE-0xabc123';

async function mkConfigDir(t) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-secret-redaction-'));
    await fsp.writeFile(path.join(dir, 'defaults-config.json'), JSON.stringify({}, null, 2));
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });
    return dir;
}

/** Capture everything written via console.log during `fn()`. Restores console.log after. */
function captureConsoleLog(fn) {
    const orig = console.log;
    let out = '';
    console.log = (...args) => { out += args.map(String).join(' ') + '\n'; };
    try {
        fn();
    } finally {
        console.log = orig;
    }
    return out;
}

// ── Schema-driven classification (pure) ─────────────────────────────────────────────────────

test('the classification is DATA in config-schema.json, not a call-site guess', () => {
    assert.ok(Array.isArray(schema.secret_keys?.keys), 'config-schema.json must declare a secret_keys.keys array');
    assert.ok(schema.secret_keys.keys.includes('DEVELOPER_SIGNATURE'),
        'DEVELOPER_SIGNATURE (the measured PROD leak) must be classified secret in the schema');
});

test('isSecretConfigKey: true only for schema-classified keys', () => {
    assert.equal(isSecretConfigKey('DEVELOPER_SIGNATURE'), true);
    assert.equal(isSecretConfigKey('DEVELOPER_WALLET_ADDRESS'), false, 'the address is public per the schema\'s own comment');
    assert.equal(isSecretConfigKey('DEPLOY_ENV'), false);
    assert.equal(isSecretConfigKey('SOME_KEY_NOT_IN_ANY_LIST'), false);
});

test('loggableConfigValue: redacts a secret-classed key, passes a non-secret key through unchanged', () => {
    assert.equal(loggableConfigValue('DEVELOPER_SIGNATURE', SENTINEL), '<redacted>');
    assert.ok(!loggableConfigValue('DEVELOPER_SIGNATURE', SENTINEL).includes(SENTINEL));
    assert.equal(loggableConfigValue('DEVELOPER_WALLET_ADDRESS', '0xabc'), '0xabc',
        'a non-secret key must still print its value — this is not a blanket redaction');
});

test('loggableConfigValue: never a prefix or a length of the real value either', () => {
    const redacted = loggableConfigValue('DEVELOPER_SIGNATURE', SENTINEL);
    assert.equal(redacted, '<redacted>');
    assert.ok(!redacted.includes(SENTINEL.slice(0, 4)), 'must not leak even a prefix');
    assert.notEqual(redacted, String(SENTINEL.length), 'must not leak the value via its length');
});

// ── The actual boot-log site (config.js constructor → _loadBootstrapKeys) ──────────────────

test('GATE: booting with DEVELOPER_SIGNATURE set never prints its value to the bootstrap log', async (t) => {
    const dir = await mkConfigDir(t);
    const prevSig = process.env.DEVELOPER_SIGNATURE;
    const prevAddr = process.env.DEVELOPER_WALLET_ADDRESS;
    const prevEnv = process.env.DEPLOY_ENV;
    process.env.DEVELOPER_SIGNATURE = SENTINEL;
    process.env.DEVELOPER_WALLET_ADDRESS = '0xPUBLIC-ADDRESS-NOT-SECRET';
    process.env.DEPLOY_ENV = 'ci-test-env'; // not 'dev' (avoids the no-PORT hard-fail) and not 'prod'
    t.after(() => {
        if (prevSig === undefined) delete process.env.DEVELOPER_SIGNATURE; else process.env.DEVELOPER_SIGNATURE = prevSig;
        if (prevAddr === undefined) delete process.env.DEVELOPER_WALLET_ADDRESS; else process.env.DEVELOPER_WALLET_ADDRESS = prevAddr;
        if (prevEnv === undefined) delete process.env.DEPLOY_ENV; else process.env.DEPLOY_ENV = prevEnv;
    });

    _resetCloudConfigForTests();
    let captured = '';
    let cfg;
    captured = captureConsoleLog(() => {
        cfg = createCloudConfig({ rootPath: dir });
    });

    assert.equal(cfg.DEVELOPER_SIGNATURE, SENTINEL, 'FIXTURE INVALID: the signature never made it into config — nothing below measures the log');
    assert.match(captured, /Bootstrap \(Env\) DEVELOPER_SIGNATURE=/,
        'FIXTURE INVALID: the bootstrap log line for DEVELOPER_SIGNATURE never printed — nothing below measures the redaction');

    // THE ACTUAL DEFECT: the secret value must not appear ANYWHERE in the captured log.
    assert.ok(!captured.includes(SENTINEL),
        `SECRET LEAK: the fake signature value appeared in the bootstrap log:\n${captured}`);
    assert.match(captured, /Bootstrap \(Env\) DEVELOPER_SIGNATURE=<redacted>/,
        'the log line must say <redacted>, not merely omit the value silently');

    // NEGATIVE CONTROL WITHIN THE TEST: a non-secret bootstrap key printed alongside it in the
    // SAME run still shows its real value — proving this is a targeted redaction driven by the
    // schema, not a blanket "hide everything" that would pass by accident.
    assert.match(captured, /Bootstrap \(Env\) DEPLOY_ENV=ci-test-env/,
        'a non-secret bootstrap key must still print its real value');
});

test('GATE: the hot-reload log site (a sibling of the bootstrap log) also redacts a secret-classed key', async (t) => {
    const dir = await mkConfigDir(t);
    const prevEnv = process.env.DEPLOY_ENV;
    process.env.DEPLOY_ENV = 'ci-test-env';
    t.after(() => { if (prevEnv === undefined) delete process.env.DEPLOY_ENV; else process.env.DEPLOY_ENV = prevEnv; });

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    // Force the internal formatVal path via the SAME method the file-watcher calls
    // (_reloadDefaults), by writing a changed defaults-config.json and invoking it directly —
    // no real chokidar watcher needed, this measures the log line itself.
    // A secret should never legitimately land in defaults-config.json, but the log site must
    // redact defensively rather than trust that contract to hold forever.
    await fsp.writeFile(path.join(dir, 'defaults-config.json'), JSON.stringify({ STRIPE_SECRET_KEY: SENTINEL }, null, 2));

    const captured = captureConsoleLog(() => {
        cfg._reloadDefaults('test');
    });

    assert.match(captured, /HOT-RELOAD: STRIPE_SECRET_KEY/, 'FIXTURE INVALID: the hot-reload line for the changed key never printed');
    assert.ok(!captured.includes(SENTINEL), `SECRET LEAK via hot-reload log:\n${captured}`);
    assert.match(captured, /<redacted>/);
});

console.error(
    '[secret-redaction gate] Confirms (a) the classification lives in config-schema.json ' +
    'secret_keys as data, (b) the bootstrap-key boot log redacts a secret-classed key while ' +
    'still printing a non-secret one in the SAME run, and (c) the hot-reload log site (a sibling ' +
    'call site) redacts the same way. CATCHES: a secret value reaching either log line, a ' +
    'redaction that also hides non-secret keys (which would mask the defect by making everything ' +
    'look "safe"), and a classification hardcoded outside the schema. DOES NOT READ: Secret ' +
    'Manager-sourced values (_mergeConfig path) or a live Cloud Logging sink — see the file ' +
    'header for the negative-control recipe (revert to HEAD: RED).',
);

// The session token IS the credential. Logging it on expiry put a live session into Cloud Logging,
// which is readable far more widely than the session store itself — the same defect class as the
// bootstrap-key leak above, found in the same sweep (2026-09-17).
test('an expiring session is identified by user, never by its access token', async () => {
  const src = await fsp.readFile(new URL('../src/storageUtils.js', import.meta.url), 'utf8');
  const expiryLogs = src.split('\n').filter((l) => /Session .*expired/.test(l));
  assert.ok(expiryLogs.length > 0, 'the expiry log line must still exist');
  for (const line of expiryLogs) {
    assert.doesNotMatch(line, /\$\{access_token\}/, `expiry log prints the token: ${line.trim()}`);
  }
});

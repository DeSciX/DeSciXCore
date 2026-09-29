/**
 * dev-overrides.json applies ONLY config-schema.json dev_override_keys.
 *
 * _loadDevOverrides() force-wins over Secret Manager when DEPLOY_ENV=dev. It used to apply EVERY
 * non-null key in the file, so a dev overlay could silently replace any Secret Manager value. Now an
 * allowed key applies, and any other key present in the file REFUSES the boot, naming the key and
 * the file, never the value. Logs carry key names only.
 *
 * Run: `node --test tests/dev-overrides-allowlist.test.js` from descix-cloud-core/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { createCloudConfig, _resetCloudConfigForTests } from '../src/config.js';

const require = createRequire(import.meta.url);
const schema = require('../config-schema.json');
const ALLOWED = schema.dev_override_keys.keys;
const NOT_ALLOWED = 'GEMINI_API_KEY';
const SENTINEL = 'SENTINEL-OVERRIDE-VALUE-5b1e';

async function withOverrides(t, overrides) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-devov-'));
    await fsp.writeFile(path.join(dir, 'defaults-config.json'), '{}');
    await fsp.writeFile(path.join(dir, 'dev-overrides.json'),
        typeof overrides === 'string' ? overrides : JSON.stringify(overrides));
    const prev = process.env.DEPLOY_ENV;
    delete process.env.DEPLOY_ENV;
    const captured = [];
    const orig = { log: console.log, warn: console.warn, error: console.error };
    t.after(async () => {
        Object.assign(console, orig);
        _resetCloudConfigForTests();
        if (prev === undefined) delete process.env.DEPLOY_ENV; else process.env.DEPLOY_ENV = prev;
        await fsp.rm(dir, { recursive: true, force: true });
    });
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });
    cfg.DEPLOY_ENV = 'dev';
    for (const k of Object.keys(orig)) console[k] = (...a) => captured.push(a.map(String).join(' '));
    return { cfg, captured, file: path.join(dir, 'dev-overrides.json') };
}

test('FIXTURE: the probe key is outside the allowlist and the applied key is inside it', () => {
    assert.ok(!ALLOWED.includes(NOT_ALLOWED));
    assert.ok(ALLOWED.includes('POWCH_RP_NAME'));
});

test('an allowed key applies, and only its NAME is logged', async (t) => {
    const { cfg, captured } = await withOverrides(t, { _comment: 'x', POWCH_RP_NAME: SENTINEL });
    cfg._loadDevOverrides();
    assert.equal(cfg.POWCH_RP_NAME, SENTINEL);
    const out = captured.join('\n');
    assert.match(out, /POWCH_RP_NAME/);
    assert.ok(!out.includes(SENTINEL), 'a value was logged');
});

test('a key outside dev_override_keys REFUSES the boot by name and file, never by value', async (t) => {
    const { cfg, captured, file } = await withOverrides(t, { POWCH_RP_NAME: 'ok', [NOT_ALLOWED]: SENTINEL });
    let err;
    try { cfg._loadDevOverrides(); } catch (e) { err = e; }
    assert.ok(err, 'a non-allowed key must refuse, not apply or be skipped');
    assert.match(err.message, new RegExp(NOT_ALLOWED));
    assert.ok(err.message.includes(file), 'must name the file');
    assert.ok(!err.message.includes(SENTINEL), 'must not carry the value');
    assert.notEqual(cfg[NOT_ALLOWED], SENTINEL, 'the non-allowed value must not have been applied');
    assert.ok(!captured.join('\n').includes(SENTINEL), 'a value was logged');
});

test('a non-allowed key refuses even when its value is null', async (t) => {
    const { cfg } = await withOverrides(t, { [NOT_ALLOWED]: null });
    assert.throws(() => cfg._loadDevOverrides(), new RegExp(NOT_ALLOWED));
});

test('outside DEPLOY_ENV=dev the file is not read at all', async (t) => {
    const { cfg } = await withOverrides(t, { [NOT_ALLOWED]: SENTINEL });
    cfg.DEPLOY_ENV = 'prod';
    assert.doesNotThrow(() => cfg._loadDevOverrides());
    assert.notEqual(cfg[NOT_ALLOWED], SENTINEL);
});

test('the scaffold dev-overrides.example.json, copied as-is, passes the allowlist', async (t) => {
    const scaffold = path.join(path.dirname(new URL(import.meta.url).pathname), '..', '..',
        'descix-cli', 'templates', 'scaffolds', 'microservice', 'dev-overrides.example.json');
    const raw = await fsp.readFile(scaffold, 'utf8');
    const { cfg } = await withOverrides(t, raw);
    assert.doesNotThrow(() => cfg._loadDevOverrides());
    for (const k of Object.keys(JSON.parse(raw)).filter((k) => !k.startsWith('_'))) {
        assert.ok(cfg[k] !== undefined, `${k} did not apply`);
    }
});

test('SERVICE_SELF_REGISTER (powch local-dev registration toggle) applies as a boolean', async (t) => {
    const { cfg } = await withOverrides(t, { SERVICE_SELF_REGISTER: false });
    cfg._loadDevOverrides();
    assert.equal(cfg.SERVICE_SELF_REGISTER, false);
});

test('a malformed dev-overrides.json STOPS the boot, naming the file and the parse error, never its contents', async (t) => {
    const { cfg, captured, file } = await withOverrides(t, `{ "DEVELOPER_SIGNATURE": ${SENTINEL} }`);
    let err;
    try { cfg._loadDevOverrides(); } catch (e) { err = e; }
    assert.ok(err, 'a present-but-malformed overlay must refuse, not be skipped');
    assert.equal(err.name, 'CloudConfigFatalError');
    assert.ok(err.message.includes(file), 'must name the file');
    assert.match(err.message, /not valid JSON/);
    assert.ok(!err.message.includes(SENTINEL), 'the parse error must not quote file contents');
    assert.ok(!captured.join('\n').includes(SENTINEL), 'contents were logged');
});

test('an unreadable dev-overrides.json STOPS the boot, naming the file', async (t) => {
    const { cfg, file } = await withOverrides(t, '{}');
    await fsp.rm(file);
    await fsp.mkdir(file); // present but not a readable file
    assert.throws(() => cfg._loadDevOverrides(), (e) => e.name === 'CloudConfigFatalError' && e.message.includes(file));
});

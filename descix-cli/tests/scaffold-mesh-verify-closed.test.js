/**
 * The microservice scaffold ships a service that verifies the mesh context, with no branch of
 * its own to get wrong.
 *
 * MEASURED 2026-09-29: a PROD app answered an unsigned public POST to /api/<command> with its
 * command list. The scaffold every app starts from mounted `app.use('/api', apiRouter)` with no
 * verifier at all, and its defaults-config.json named no MESH_CTX_VERIFY_MODE.
 *
 * The rule's owner is @descix/cloud-core (CloudConfig._assertMeshPosture + mountMeshApi). This
 * suite pins the scaffold to it: the template asks for enforce, carries no copy of the platform
 * key, mounts only through the owner — and, measured rather than grepped, the template's own
 * config boots under the owner on a simulated managed runtime while the same config without
 * the mode is refused.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.resolve(here, '../templates/scaffolds/microservice');
const CLOUD_CORE_CONFIG = path.resolve(here, '../../descix-cloud-core/src/config.js');

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(TEMPLATE, rel), 'utf8'));

/** Strip block and line comments so a scan cannot match its own explanation. */
function code(src) {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('the template asks for enforce in its env-invariant base', () => {
    assert.equal(readJson('defaults-config.json').MESH_CTX_VERIFY_MODE, 'enforce');
});

test('no template config file carries a copy of the platform mesh key', () => {
    const files = fs.readdirSync(TEMPLATE).filter(f => /^(defaults-config.*|dev-overrides\.example)\.json$/.test(f));
    assert.ok(files.length >= 2, `expected the template config files, found ${files.join(', ')}`);
    for (const f of files) {
        const c = readJson(f);
        for (const k of ['MESH_CTX_PUBLIC_KEY', 'MESH_CTX_KEY_ID']) {
            assert.ok(!(k in c), `${f} carries ${k}; the key is owned by @descix/cloud-core`);
        }
    }
});

test('app.js mounts /api only through the owner, with no branch of its own', () => {
    const src = code(fs.readFileSync(path.join(TEMPLATE, 'app.js'), 'utf8'));
    assert.match(src, /mountMeshApi\(app, apiRouter\)/, 'app.js must mount /api with mountMeshApi(app, apiRouter)');
    assert.doesNotMatch(src, /app\.use\(\s*['"]\/api['"]/, 'app.js must not mount /api itself');
    assert.doesNotMatch(src, /MESH_CTX_VERIFY_MODE/, 'app.js must not decide whether to verify');
    assert.doesNotMatch(src, /createMeshContextVerifier/, 'app.js must not build its own verifier');
    const mountAt = src.indexOf('mountMeshApi(app, apiRouter)');
    const jsonAt = src.indexOf('express.json()');
    assert.ok(jsonAt !== -1 && jsonAt < mountAt, 'the body parser must precede the gate (it reads req.body._descix)');
});

/** Boot the template's own config files through the owner, on a simulated managed runtime. */
async function bootTemplateConfig(t, mutate = (c) => c) {
    const cfgmod = await import(CLOUD_CORE_CONFIG);
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'scaffold-mesh-'));
    const base = mutate({ ...readJson('defaults-config.json'), DEBUG_LOCAL: null });
    await fsp.writeFile(path.join(dir, 'defaults-config.json'), JSON.stringify(base));
    // The template's dev layer leaves FIRESTORE_DATABASE_ID null on purpose (a required key the
    // developer names); a deployed service has it set.
    await fsp.writeFile(path.join(dir, 'defaults-config-dev.json'),
        JSON.stringify({ ...readJson('defaults-config-dev.json'), FIRESTORE_DATABASE_ID: 'scaffold-test-db' }));
    const keys = ['DEPLOY_ENV', 'K_SERVICE', 'GAE_ENV', 'GAE_SERVICE', 'DEBUG_LOCAL', 'CONFIG_SECRET_NAME', 'GOOGLE_CLOUD_PROJECT'];
    const prev = Object.fromEntries(keys.map(k => [k, process.env[k]]));
    t.after(async () => {
        cfgmod._resetCloudConfigForTests();
        for (const k of keys) { if (prev[k] === undefined) delete process.env[k]; else process.env[k] = prev[k]; }
        await fsp.rm(dir, { recursive: true, force: true });
    });
    for (const k of keys) delete process.env[k];
    Object.assign(process.env, { DEPLOY_ENV: 'dev', K_SERVICE: 'scaffold-dev', GOOGLE_CLOUD_PROJECT: 'test-project' });
    cfgmod._resetCloudConfigForTests();
    const cfg = cfgmod.createCloudConfig({ rootPath: dir });
    return { cfg, cfgmod };
}

test('the template config boots under the owner on a managed runtime, verifying under the platform anchor', async (t) => {
    const { cfg } = await bootTemplateConfig(t);
    await cfg.initialize();
    assert.equal(cfg.meshPosture.verify, true);
    assert.equal(cfg.meshPosture.mode, 'enforce');
    assert.equal(cfg.meshPosture.keyId, 'mesh-dev-1');
});

test('negative control: the same template config without the mode is REFUSED on a managed runtime', async (t) => {
    const { cfg, cfgmod } = await bootTemplateConfig(t, ({ MESH_CTX_VERIFY_MODE, ...rest }) => rest);
    await assert.rejects(() => cfg.initialize(), (err) =>
        err instanceof cfgmod.CloudConfigFatalError && /MESH_CTX_VERIFY_MODE/.test(err.message));
});

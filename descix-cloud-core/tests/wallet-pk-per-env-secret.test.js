/**
 * P7 — WALLET_PK is sourced from its OWN per-env secret, never from a config blob.
 *
 * The signer private key used to be one of ~23 keys inside the per-env config blob
 * (descix_config_dev / _demo / _prod, and the shared-alias descix_config for preview).
 * A blob key cannot be granted, rotated or audited independently of the other 22, and
 * the same key travelled to every environment. WALLET_PK now lives in a dedicated
 * secret, `descix_wallet_pk_<DEPLOY_ENV>`, and the blob path is REFUSED — not fenced,
 * not warned about, not accepted-with-precedence. A blob that still carries WALLET_PK
 * is a misconfiguration an operator must see and fix at its source.
 *
 * Run: node --test tests/wallet-pk-per-env-secret.test.js   (from descix-cloud-core/)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import { createCloudConfig, _resetCloudConfigForTests, CloudConfigFatalError } from '../src/config.js';

// NOT a key. A syntactically obvious placeholder so a failing assertion can never
// print real key material, and so a reader cannot mistake the fixture for a secret.
const NEGATIVE_CONTROL_PK = '0xNEGATIVE_CONTROL_NOT_A_REAL_KEY';

async function mkConfig(t) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-wallet-pk-'));
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify({ GOOGLE_PROJECT_ID: 'test', FIRESTORE_DATABASE_ID: 'descix-dev' }, null, 2),
    );
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });
    return cfg;
}

/**
 * FIXTURE CHECK. A gate that cannot fail is not a gate, and a fixture whose inputs
 * cannot exhibit the failure does not measure the failure however green it runs.
 * Assert the blob fixture actually carries WALLET_PK before any refusal is asserted.
 */
test('FIXTURE CHECK: the blob fixture actually carries WALLET_PK', () => {
    const blob = blobWithWalletPk();
    assert.ok('WALLET_PK' in blob, 'fixture must contain WALLET_PK or it tests nothing');
    assert.equal(blob.WALLET_PK, NEGATIVE_CONTROL_PK);
    assert.ok(Object.keys(blob).length > 1, 'fixture must look like a real multi-key config blob');
});

function blobWithWalletPk() {
    return {
        GEMINI_API_KEY: 'fixture-not-a-secret',
        PINECONE_INDEX_NAME: 'fixture-index',
        WALLET_PK: NEGATIVE_CONTROL_PK,
        INFURA_API_ENDPOINT: 'https://fixture.invalid',
    };
}

function blobWithoutWalletPk() {
    const b = blobWithWalletPk();
    delete b.WALLET_PK;
    return b;
}

/**
 * NEGATIVE CONTROL — documents the behaviour this row exists to kill.
 *
 * Pre-change this whole test passes at the "accepted today" assertion and then FAILS
 * at the refusal, because no refusal exists: _mergeConfig happily takes WALLET_PK off
 * the blob. Post-change the refusal fires. That transition IS the gate; without the
 * first half there is no proof the gate ever had anything to refuse.
 */
test('NEGATIVE CONTROL: the raw merge path accepts a blob WALLET_PK (this is the exposure)', async (t) => {
    const cfg = await mkConfig(t);
    cfg.DEPLOY_ENV = 'dev';
    assert.equal(cfg.WALLET_PK, undefined, 'precondition: no WALLET_PK before the merge');

    cfg._mergeConfig(blobWithWalletPk());

    // If this assertion ever fails, the exposure is gone by some other route and this
    // test must be re-derived rather than deleted.
    assert.equal(cfg.WALLET_PK, NEGATIVE_CONTROL_PK,
        'the raw merge path is what P7 refuses; it must still demonstrably accept the key');
});

test('a config-secret payload carrying WALLET_PK is REFUSED, naming the per-env secret', async (t) => {
    const cfg = await mkConfig(t);
    cfg.DEPLOY_ENV = 'dev';

    assert.throws(
        () => cfg._ingestConfigSecretPayload(blobWithWalletPk()),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError,
                `refusal must be CloudConfigFatalError, got ${err && err.constructor && err.constructor.name}`);
            assert.match(err.message, /descix_wallet_pk_dev/,
                'refusal MUST name the per-env secret the operator has to populate');
            assert.match(err.message, /WALLET_PK/);
            // The refusal must never echo key material, even a placeholder.
            assert.ok(!err.message.includes(NEGATIVE_CONTROL_PK),
                'refusal must name the KEY, never print its VALUE');
            return true;
        },
    );

    assert.equal(cfg.WALLET_PK, undefined,
        'a refused payload must not have been partially merged');
});

test('the refusal names the right secret for every deployed env token', async (t) => {
    for (const [env, expected] of [
        ['dev', 'descix_wallet_pk_dev'],
        ['demo', 'descix_wallet_pk_demo'],
        ['prod', 'descix_wallet_pk_prod'],
        ['preview', 'descix_wallet_pk_preview'],
    ]) {
        const cfg = await mkConfig(t);
        cfg.DEPLOY_ENV = env;
        assert.equal(cfg._walletPkSecretName(), expected);
        assert.throws(
            () => cfg._ingestConfigSecretPayload(blobWithWalletPk()),
            new RegExp(expected),
            `${env} must be told to populate ${expected}`,
        );
    }
});

/**
 * POSITIVE CONTROL. The refusal must be specific to WALLET_PK — a gate that refuses
 * every blob would pass the negative control while breaking every environment.
 */
test('POSITIVE CONTROL: a blob without WALLET_PK ingests normally', async (t) => {
    const cfg = await mkConfig(t);
    cfg.DEPLOY_ENV = 'dev';

    cfg._ingestConfigSecretPayload(blobWithoutWalletPk());

    assert.equal(cfg.GEMINI_API_KEY, 'fixture-not-a-secret', 'the other 22 keys must still merge');
    assert.equal(cfg.PINECONE_INDEX_NAME, 'fixture-index');
    assert.equal(cfg.WALLET_PK, undefined, 'WALLET_PK stays unset — it comes from its own secret');
});

test('a null/absent WALLET_PK on the blob is not a refusal (nothing is being sourced)', async (t) => {
    const cfg = await mkConfig(t);
    cfg.DEPLOY_ENV = 'dev';
    // A blob that declares the key as null is a schema placeholder, not a key source.
    cfg._ingestConfigSecretPayload({ ...blobWithoutWalletPk(), WALLET_PK: null });
    assert.equal(cfg.WALLET_PK, null);
});

test('_walletPkSecretName refuses to guess when DEPLOY_ENV is unset', async (t) => {
    const cfg = await mkConfig(t);
    delete cfg.DEPLOY_ENV;
    assert.throws(() => cfg._walletPkSecretName(), CloudConfigFatalError,
        'no hardcoded env fallback — an unknown env must not silently reach a real key');
});

/**
 * SCOPING. Taking the key out of the shared blob is only a real reduction in blast
 * radius if non-signing services stop reading it. These two tests are the guarantee
 * that Powch / BEAST / SDK-only services make no call for the signer secret and need
 * no accessor on it. They stub the Secret Manager call, so nothing leaves the process.
 */
async function mkDeclaringConfig(t, additionalRequiredKeys) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-wallet-scope-'));
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify({ GOOGLE_PROJECT_ID: 'test', FIRESTORE_DATABASE_ID: 'descix-dev' }, null, 2),
    );
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir, additionalRequiredKeys });
    cfg.DEPLOY_ENV = 'dev';
    const calls = [];
    cfg.accessSecretVersion = async (name) => { calls.push(name); return '0xSTUBBED_NOT_A_REAL_KEY'; };
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });
    return { cfg, calls };
}

test('a service that DECLARES WALLET_PK loads it from the dedicated secret', async (t) => {
    // Mirrors DeSciX_Cloud/microservice/services/utils.js CLOUD_REQUIRED_KEYS.
    const { cfg, calls } = await mkDeclaringConfig(t, ['GEMINI_API_KEY', 'WALLET_PK']);
    await cfg._loadWalletPkSecret();
    assert.deepEqual(calls, ['descix_wallet_pk_dev'],
        'must read exactly the per-env signer secret, and nothing else');
    assert.equal(cfg.WALLET_PK, '0xSTUBBED_NOT_A_REAL_KEY');
});

test('a service that does NOT declare WALLET_PK never reads the signer secret', async (t) => {
    // Mirrors DeSciX_Powch/microservice/src/utils.js, which declares only CORE_API_URL.
    const { cfg, calls } = await mkDeclaringConfig(t, ['CORE_API_URL']);
    await cfg._loadWalletPkSecret();
    assert.deepEqual(calls, [],
        'a non-signing service must make no Secret Manager call for the signer key');
    assert.equal(cfg.WALLET_PK, undefined);
});

test('a declaring service that cannot read the secret fails loud, naming it', async (t) => {
    const { cfg } = await mkDeclaringConfig(t, ['WALLET_PK']);
    cfg.accessSecretVersion = async () => { throw new Error('PERMISSION_DENIED'); };
    await assert.rejects(
        () => cfg._loadWalletPkSecret(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError);
            assert.match(err.message, /descix_wallet_pk_dev/);
            return true;
        },
        'an unreadable signer secret must fail at boot, not at the first mint',
    );
});

/**
 * The defaults FILES are the obvious workaround for the blob refusal, and a strictly
 * worse one — a key in defaults-config*.json is in version control. Both layers are
 * refused through the same owner, and the refusal must survive the catch blocks in
 * those loaders, which otherwise downgrade every failure to a console.error.
 */
test('a per-env defaults FILE carrying WALLET_PK is refused, not swallowed by its catch', async (t) => {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-wallet-file-'));
    await fsp.writeFile(path.join(dir, 'defaults-config.json'),
        JSON.stringify({ GOOGLE_PROJECT_ID: 'test', WALLET_PK: null }));
    await fsp.writeFile(path.join(dir, 'defaults-config-dev.json'),
        JSON.stringify({ WALLET_PK: NEGATIVE_CONTROL_PK }));
    _resetCloudConfigForTests();
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });

    // FIXTURE CHECK: the file on disk really does carry a non-null value.
    const onDisk = JSON.parse(await fsp.readFile(path.join(dir, 'defaults-config-dev.json'), 'utf8'));
    assert.equal(onDisk.WALLET_PK, NEGATIVE_CONTROL_PK, 'fixture file must carry the key');

    process.env.DEPLOY_ENV = 'dev';
    try {
        assert.throws(
            () => createCloudConfig({ rootPath: dir }),
            (err) => {
                assert.ok(err instanceof CloudConfigFatalError,
                    'the loader catch must NOT downgrade this to a console.error');
                assert.match(err.message, /descix_wallet_pk_dev/);
                assert.match(err.message, /defaults-config-dev\.json/);
                return true;
            },
        );
    } finally {
        delete process.env.DEPLOY_ENV;
    }
});

test('the base defaults file is refused too, naming the secret pattern when env is unknown', async (t) => {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-wallet-base-'));
    await fsp.writeFile(path.join(dir, 'defaults-config.json'),
        JSON.stringify({ GOOGLE_PROJECT_ID: 'test', WALLET_PK: NEGATIVE_CONTROL_PK }));
    _resetCloudConfigForTests();
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });

    assert.throws(
        () => createCloudConfig({ rootPath: dir }),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError);
            assert.match(err.message, /descix_wallet_pk_/, 'must still name the secret');
            assert.match(err.message, /defaults-config\.json/);
            return true;
        },
    );
});

test('POSITIVE CONTROL: the real null placeholder in defaults-config.json still boots', async (t) => {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-wallet-null-'));
    // This mirrors the ACTUAL DeSciX_Cloud/microservice/defaults-config.json, which
    // declares "WALLET_PK": null as a schema placeholder. Refusing it would break boot
    // everywhere, so the gate must let it through.
    await fsp.writeFile(path.join(dir, 'defaults-config.json'),
        JSON.stringify({ GOOGLE_PROJECT_ID: 'test', FIRESTORE_DATABASE_ID: 'descix-dev', WALLET_PK: null }));
    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });
    assert.equal(cfg.WALLET_PK, null, 'the null placeholder is not key material and must not refuse');
});

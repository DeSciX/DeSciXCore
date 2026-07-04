/**
 * Anti-regression: required_keys enforcement + base-vs-per-service partition.
 *
 * WS-CONFIG-BOOTSTRAP-FIX item #2 established the loud boot hard-fail
 * (_assertRequiredKeys → CloudConfigFatalError). CEO-D-2026-06-01-APP-DEV-MODEL D1
 * RE-SCOPED which keys live in the shared base vs which are per-service:
 *
 *   - BASE (config-schema.json required_keys) — UNIVERSAL to every cloud-core
 *     consumer: FIRESTORE_DATABASE_ID, GOOGLE_PROJECT_ID.
 *   - PER-SERVICE (createCloudConfig({ additionalRequiredKeys })) — declared only by
 *     the services that use them. DeSciX_Cloud/daita declares the RAG/AI/chain/storage
 *     keys; Powch declares CORE_API_URL. A lightweight SDK-based service declares none.
 *
 * The hard-fail itself is UNCHANGED — feedback_no_hardcoded_fallbacks STILL HOLDS.
 * Only WHERE a key is required moved. These tests lock in that partition so a future
 * edit can't silently (a) re-monolith the base, or (b) drop the per-service hard-fail.
 *
 * Design: we do NOT call initializeCloudConfig() (needs network + Secret Manager).
 * We construct CloudConfig directly with a temp-dir rootPath and call
 * _assertRequiredKeys() — the same private method initialize() invokes at the end.
 * NOTE: GOOGLE_PROJECT_ID is normally resolved at runtime from GCP ADC inside
 * initialize() (auth.getProjectId()), so in these no-network unit tests we supply it
 * on disk to isolate the partition logic from ADC.
 *
 * Run: `node --test tests/required-keys-anti-regression.test.js` from descix-cloud-core/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import {
    createCloudConfig,
    CloudConfigFatalError,
    _resetCloudConfigForTests,
} from '../src/config.js';

async function mkConfigDir(t, defaults) {
    const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'cloud-core-required-keys-'));
    await fsp.writeFile(
        path.join(dir, 'defaults-config.json'),
        JSON.stringify(defaults, null, 2),
    );
    t.after(async () => {
        _resetCloudConfigForTests();
        await fsp.rm(dir, { recursive: true, force: true });
    });
    return dir;
}

/**
 * Minimal "all UNIVERSAL BASE keys present" defaults-config payload — the floor a
 * lightweight cloud-core service needs. Deliberately omits every RAG/AI/chain/storage
 * key to prove they are NOT base-required after the D1 partition.
 */
function baseDefaults(overrides = {}) {
    return {
        FIRESTORE_DATABASE_ID: 'descix-dev',
        GOOGLE_PROJECT_ID: 'test-project',
        ...overrides,
    };
}

// The 8 platform-node keys that were MOVED OUT of the base into per-service
// additionalRequiredKeys (DeSciX_Cloud/daita). NONE of these may be base-required.
const MOVED_PLATFORM_NODE_KEYS = [
    'PINECONE_INDEX_NAME',
    'PINECONE_API_KEY',
    'GEMINI_API_KEY',
    'INTELLIGENCE_LEVELS',
    'DEFAULT_AI_MODEL',
    'DEFAULT_INTELLIGENCE_LEVEL',
    'PLATFORM_DEFAULT_CHAIN',
    'STORAGE_BUCKET',
];

// ── BASE partition ──────────────────────────────────────────────────────────

test('BASE required_keys is exactly the universal set {FIRESTORE_DATABASE_ID, GOOGLE_PROJECT_ID}', async () => {
    const { default: schema } = await import('../config-schema.json', { with: { type: 'json' } });
    assert.deepEqual(
        [...schema.required_keys.keys].sort(),
        ['FIRESTORE_DATABASE_ID', 'GOOGLE_PROJECT_ID'].sort(),
        'base required_keys drifted — D1 mandates exactly the 2 universal keys',
    );
});

test('NONE of the moved platform-node keys are in the BASE required_keys', async () => {
    const { default: schema } = await import('../config-schema.json', { with: { type: 'json' } });
    const base = new Set(schema.required_keys.keys);
    for (const k of MOVED_PLATFORM_NODE_KEYS) {
        assert.ok(!base.has(k), `${k} must NOT be base-required (moved to per-service per D1)`);
    }
});

test('throws CloudConfigFatalError when a UNIVERSAL base key (FIRESTORE_DATABASE_ID) is missing', async (t) => {
    const defaults = baseDefaults();
    delete defaults.FIRESTORE_DATABASE_ID;
    const dir = await mkConfigDir(t, defaults);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    assert.throws(
        () => cfg._assertRequiredKeys(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError);
            assert.match(err.message, /FIRESTORE_DATABASE_ID/);
            assert.match(err.message, /required keys are unset after bootstrap/);
            assert.match(err.message, /defaults-config\.json/);
            return true;
        },
    );
});

test('a lightweight service with ONLY the universal base keys does NOT throw (the SSGPOD case)', async (t) => {
    // No PINECONE_*, no GEMINI_API_KEY, no AI/chain/storage keys present — exactly the
    // descix-ssgpod situation that used to hard-fail demanding PINECONE_INDEX_NAME.
    const dir = await mkConfigDir(t, baseDefaults());

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    assert.doesNotThrow(() => cfg._assertRequiredKeys(),
        'a service that uses no RAG/AI/chain/storage must boot with only the base keys');
});

// ── PER-SERVICE partition (additionalRequiredKeys) ───────────────────────────

test('DeSciX_Cloud per-service keys hard-fail when missing even though base passes', async (t) => {
    // Base keys present, but the daita service declares the RAG/AI/chain/storage keys
    // via additionalRequiredKeys. A missing one must still throw — the hard-fail moved,
    // it did not disappear.
    const dir = await mkConfigDir(t, baseDefaults());

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({
        rootPath: dir,
        additionalRequiredKeys: ['PINECONE_INDEX_NAME', 'GEMINI_API_KEY', 'PLATFORM_DEFAULT_CHAIN', 'STORAGE_BUCKET'],
    });

    assert.throws(
        () => cfg._assertRequiredKeys(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError);
            assert.match(err.message, /PINECONE_INDEX_NAME/);
            assert.match(err.message, /GEMINI_API_KEY/);
            assert.match(err.message, /STORAGE_BUCKET/);
            return true;
        },
    );
});

test('DeSciX_Cloud per-service keys pass when present alongside base keys', async (t) => {
    const dir = await mkConfigDir(t, baseDefaults({
        PINECONE_INDEX_NAME: 'descix-dev',
        PINECONE_API_KEY: 'k',
        GEMINI_API_KEY: 'g',
        INTELLIGENCE_LEVELS: { '2': { model: 'gemini-3.1-flash-lite' } },
        DEFAULT_AI_MODEL: 'gemini-3.1-flash-lite',
        DEFAULT_INTELLIGENCE_LEVEL: '2',
        PLATFORM_DEFAULT_CHAIN: 'polygon',
        STORAGE_BUCKET: 'descix-assets',
    }));

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({
        rootPath: dir,
        additionalRequiredKeys: [
            'PINECONE_INDEX_NAME', 'PINECONE_API_KEY',
            'GEMINI_API_KEY', 'INTELLIGENCE_LEVELS', 'DEFAULT_AI_MODEL',
            'DEFAULT_INTELLIGENCE_LEVEL', 'PLATFORM_DEFAULT_CHAIN', 'STORAGE_BUCKET',
        ],
    });

    assert.doesNotThrow(() => cfg._assertRequiredKeys());
});

test('Powch per-service key (CORE_API_URL) hard-fails when missing', async (t) => {
    const dir = await mkConfigDir(t, baseDefaults());

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir, additionalRequiredKeys: ['CORE_API_URL'] });

    assert.throws(
        () => cfg._assertRequiredKeys(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError);
            assert.match(err.message, /CORE_API_URL/);
            return true;
        },
    );
});

test('multiple missing keys (base + per-service) are ALL named in the error', async (t) => {
    const defaults = baseDefaults();
    delete defaults.FIRESTORE_DATABASE_ID;
    const dir = await mkConfigDir(t, defaults);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir, additionalRequiredKeys: ['PINECONE_INDEX_NAME'] });

    assert.throws(
        () => cfg._assertRequiredKeys(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError);
            assert.match(err.message, /FIRESTORE_DATABASE_ID/);
            assert.match(err.message, /PINECONE_INDEX_NAME/);
            return true;
        },
    );
});

test('treats explicit null the same as undefined (both trigger throw)', async (t) => {
    const defaults = baseDefaults({ FIRESTORE_DATABASE_ID: null });
    const dir = await mkConfigDir(t, defaults);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    assert.throws(() => cfg._assertRequiredKeys(), CloudConfigFatalError);
});

test('CloudConfigFatalError is exported and instanceof checks work', () => {
    const err = new CloudConfigFatalError('test');
    assert.equal(err.name, 'CloudConfigFatalError');
    assert.ok(err instanceof CloudConfigFatalError);
    assert.ok(err instanceof Error);
});

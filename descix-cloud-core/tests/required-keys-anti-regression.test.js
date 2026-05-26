/**
 * Anti-regression: required_keys enforcement (WS-CONFIG-BOOTSTRAP-FIX item #2).
 *
 * Coverage:
 *  - Constructing CloudConfig with a defaults-config.json that omits INTELLIGENCE_LEVELS
 *    and exercising the _assertRequiredKeys path triggers CloudConfigFatalError with
 *    a clear message that names the missing key + points at defaults-config.json.
 *  - A defaults-config.json with ALL required keys present does NOT throw.
 *  - CloudConfigFatalError is exported (consumers can `instanceof` check).
 *
 * Design: we do NOT call initializeCloudConfig() (which needs network + Secret Manager).
 * Instead we construct CloudConfig directly with a temp-dir rootPath and call
 * _assertRequiredKeys() — the same private method `initialize()` invokes at the end.
 * This proves the throw fires from the right cause without requiring GCP creds.
 *
 * Run: `node --test tests/required-keys-anti-regression.test.js` from descix-cloud-core/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import fsp from 'fs/promises';
import os from 'os';
import path from 'path';

import {
    createCloudConfig,
    CloudConfigFatalError,
    _resetCloudConfigForTests,
} from '../src/config.js';

/**
 * Write a defaults-config.json into a temp dir and return the dir path.
 */
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
 * Minimal "all required keys present" defaults-config payload.
 * Mirrors the production microservice/defaults-config.json structure for the
 * required_keys subset only.
 */
function fullDefaults(overrides = {}) {
    return {
        INTELLIGENCE_LEVELS: { "2": { label: "Standard", model: "gemini-3.1-flash-lite" } },
        DEFAULT_AI_MODEL: "gemini-3.1-flash-lite",
        DEFAULT_INTELLIGENCE_LEVEL: "2",
        PINECONE_INDEX_NAME: "descix-dev",
        PINECONE_API_KEY: "test-pc-key",
        PINECONE_NAMESPACE_MODE: "community_id",
        PLATFORM_DEFAULT_CHAIN: "polygon",
        FIRESTORE_DATABASE_ID: "descix-dev",
        GOOGLE_PROJECT_ID: "test-project",
        GEMINI_API_KEY: "test-gemini-key",
        STORAGE_BUCKET: "test-bucket",
        ...overrides,
    };
}

test('throws CloudConfigFatalError when INTELLIGENCE_LEVELS is missing from defaults-config.json', async (t) => {
    const defaults = fullDefaults();
    delete defaults.INTELLIGENCE_LEVELS;
    const dir = await mkConfigDir(t, defaults);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    assert.throws(
        () => cfg._assertRequiredKeys(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError, `expected CloudConfigFatalError, got ${err.constructor.name}`);
            assert.match(err.message, /INTELLIGENCE_LEVELS/, 'message must name the missing key');
            assert.match(err.message, /required keys are unset after bootstrap/, 'message must use the canonical phrasing');
            assert.match(err.message, /defaults-config\.json/, 'message must point at defaults-config.json as the remediation site');
            return true;
        },
    );
});

test('throws when multiple required keys are missing (all named)', async (t) => {
    const defaults = fullDefaults();
    delete defaults.INTELLIGENCE_LEVELS;
    delete defaults.PINECONE_INDEX_NAME;
    delete defaults.FIRESTORE_DATABASE_ID;
    const dir = await mkConfigDir(t, defaults);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    assert.throws(
        () => cfg._assertRequiredKeys(),
        (err) => {
            assert.ok(err instanceof CloudConfigFatalError);
            assert.match(err.message, /INTELLIGENCE_LEVELS/);
            assert.match(err.message, /PINECONE_INDEX_NAME/);
            assert.match(err.message, /FIRESTORE_DATABASE_ID/);
            return true;
        },
    );
});

test('treats explicit null the same as undefined (both trigger throw)', async (t) => {
    // The constructor's _mergeConfig only assigns non-null values, so a null in
    // defaults-config.json leaves the property as undefined. But a key absent
    // from the file entirely is also undefined. Both paths must throw.
    const defaults = fullDefaults({ INTELLIGENCE_LEVELS: null });
    const dir = await mkConfigDir(t, defaults);

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    assert.throws(() => cfg._assertRequiredKeys(), CloudConfigFatalError);
});

test('does NOT throw when all required keys are present', async (t) => {
    const dir = await mkConfigDir(t, fullDefaults());

    _resetCloudConfigForTests();
    const cfg = createCloudConfig({ rootPath: dir });

    assert.doesNotThrow(() => cfg._assertRequiredKeys());
});

test('CloudConfigFatalError is exported and instanceof checks work', () => {
    const err = new CloudConfigFatalError('test');
    assert.equal(err.name, 'CloudConfigFatalError');
    assert.ok(err instanceof CloudConfigFatalError);
    assert.ok(err instanceof Error, 'must extend Error so existing try/catch chains see it');
});

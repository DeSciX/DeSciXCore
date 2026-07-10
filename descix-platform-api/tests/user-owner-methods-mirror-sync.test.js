/**
 * Mirror-sync conformance test for WS-USER-DOMAIN-OWNERS (CEO-D-2026-07-09-USER-DOMAIN-OWNER-MODULES).
 *
 * The `User` model exists twice in the codebase (field-identical, but NOT a shared-source
 * refactor — see microservice/services/user-domain-owners.DESIGN.md "Two-mirror decision"):
 *   - Cloud:  DeSciX_Cloud/microservice/services/ipStorageUtils.js
 *   - Core:   DeSciX_Core/descix-platform-api/src/models/index.js (imported by Powch via
 *             @descix/platform-api)
 *
 * This test statically parses BOTH source files for owner-method definitions and asserts
 * set-equality against the pinned owner-method list. Drift between the mirrors (a method
 * added/renamed in one file but not the other) fails this test — that is the point.
 *
 * Static parsing (not dual import) is deliberate: the two files live in separate npm
 * packages with separate dependency graphs, so importing both into one test process is not
 * reliably possible. Precedent: canonical-stack-antiregression.test.js in this same
 * directory reads Cloud source files via readFileSync from Core's test suite.
 *
 * Pure file reads — no backend, no Firestore. Run from descix-platform-api/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// descix-platform-api/tests -> repo root (DeSciX_Core, or a worktree checkout of it, e.g. udo-core)
const CORE_REPO_ROOT = path.resolve(__dirname, '../..');
// descix-platform-api/tests -> ../src/models/index.js
const CORE_USER_FILE = path.resolve(__dirname, '../src/models/index.js');

const CLOUD_USER_RELATIVE_PATH = path.join('microservice', 'services', 'ipStorageUtils.js');

/**
 * Locate the sibling Cloud repo checkout. In the canonical layout Core and Cloud are
 * checked out as `DeSciX_Core`/`DeSciX_Cloud` siblings. Agent worktrees pair them under a
 * different name (e.g. `udo-core`/`udo-cloud`, `evg-core`/`evg-cloud`) but Core and Cloud
 * are still SIBLINGS under a common parent in every layout this org uses. Resolve by trying
 * the canonical name first, then a same-parent sibling whose name matches the Core
 * directory's name with "core" swapped for "cloud", then any same-parent sibling that
 * actually contains the Cloud User mirror file.
 */
function resolveCloudUserFile() {
    const parentDir = path.dirname(CORE_REPO_ROOT);
    const coreDirName = path.basename(CORE_REPO_ROOT);

    const candidates = [];
    // Canonical layout.
    candidates.push('DeSciX_Cloud');
    // Worktree-pair naming convention: swap "core" -> "cloud" (case-insensitive).
    if (/core/i.test(coreDirName)) {
        candidates.push(coreDirName.replace(/core/i, (m) => (m === m.toUpperCase() ? 'CLOUD' : 'cloud')));
    }

    for (const candidate of candidates) {
        const candidatePath = path.join(parentDir, candidate, CLOUD_USER_RELATIVE_PATH);
        if (existsSync(candidatePath)) return candidatePath;
    }

    // Fallback: scan siblings for anything containing the Cloud User mirror file.
    let siblings = [];
    try {
        siblings = readdirSync(parentDir);
    } catch {
        siblings = [];
    }
    for (const sibling of siblings) {
        const candidatePath = path.join(parentDir, sibling, CLOUD_USER_RELATIVE_PATH);
        if (existsSync(candidatePath)) return candidatePath;
    }

    // Nothing found — return the canonical path so the failure message is informative.
    return path.join(parentDir, 'DeSciX_Cloud', CLOUD_USER_RELATIVE_PATH);
}

const CLOUD_USER_FILE = resolveCloudUserFile();

// The pinned owner-method set for the User model (ws-user-domain-owners).
// Any change to this list is a deliberate design decision, not a drive-by edit.
const OWNER_METHODS = [
    'commitTosAndConnect',
    'isConnected',
    'stampBaseEntitlements',
    'hasBaseEntitlementStamp',
    'setPendingReferral',
    'clearPendingReferral',
    'setBaseFolderId',
    'markMigrated',
    'set_wallet_address_and_signature',
];

function readSource(filePath) {
    return readFileSync(filePath, 'utf8');
}

/**
 * Returns the subset of OWNER_METHODS that are defined as instance methods
 * (i.e. `methodName(` or `async methodName(` at the start of a line, inside the User class)
 * in the given source text.
 */
function definedOwnerMethods(source) {
    const found = new Set();
    for (const name of OWNER_METHODS) {
        const defPattern = new RegExp(`^\\s*(async\\s+)?${name}\\s*\\(`, 'm');
        if (defPattern.test(source)) {
            found.add(name);
        }
    }
    return found;
}

test('User mirrors: both source files exist and are readable', () => {
    assert.doesNotThrow(() => readSource(CORE_USER_FILE), `Core User mirror not found at ${CORE_USER_FILE}`);
    assert.doesNotThrow(() => readSource(CLOUD_USER_FILE), `Cloud User mirror not found at ${CLOUD_USER_FILE}`);
});

test('User mirrors: Core defines the full pinned owner-method set', () => {
    const coreMethods = definedOwnerMethods(readSource(CORE_USER_FILE));
    const missing = OWNER_METHODS.filter((m) => !coreMethods.has(m));
    assert.deepEqual(missing, [], `Core User mirror is missing owner methods: ${missing.join(', ')}`);
});

test('User mirrors: Cloud defines the full pinned owner-method set', () => {
    const cloudMethods = definedOwnerMethods(readSource(CLOUD_USER_FILE));
    const missing = OWNER_METHODS.filter((m) => !cloudMethods.has(m));
    assert.deepEqual(missing, [], `Cloud User mirror is missing owner methods: ${missing.join(', ')}`);
});

test('User mirrors: owner-method sets are identical across Core and Cloud (drift guard)', () => {
    const coreMethods = definedOwnerMethods(readSource(CORE_USER_FILE));
    const cloudMethods = definedOwnerMethods(readSource(CLOUD_USER_FILE));

    const onlyInCore = [...coreMethods].filter((m) => !cloudMethods.has(m));
    const onlyInCloud = [...cloudMethods].filter((m) => !coreMethods.has(m));

    assert.deepEqual(onlyInCore, [], `Owner methods present in Core but missing from Cloud: ${onlyInCore.join(', ')}`);
    assert.deepEqual(onlyInCloud, [], `Owner methods present in Cloud but missing from Core: ${onlyInCloud.join(', ')}`);
});

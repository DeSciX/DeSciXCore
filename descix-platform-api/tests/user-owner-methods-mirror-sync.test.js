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
 * The merge-stamp writers (markMigrated / unmarkMigrated) are CORE-ONLY: Core must define them,
 * Cloud must not, and Cloud's User.OPERATOR_STAMP_FIELDS must equal Core's.
 *
 * The Cloud tree is DESCIX_CLOUD_ROOT when set (e.g. a Cloud worktree under review), else the
 * sibling checkout resolved below.
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
    // An explicit Cloud checkout (a worktree pinned to a branch under review) wins, and is never second-guessed:
    // a DESCIX_CLOUD_ROOT without the mirror file fails the first test naming the path, it does not fall back.
    if (process.env.DESCIX_CLOUD_ROOT) return path.join(path.resolve(process.env.DESCIX_CLOUD_ROOT), CLOUD_USER_RELATIVE_PATH);

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

// The pinned owner-method set for the User model (ws-user-domain-owners): BOTH mirrors define each.
// Any change to this list is a deliberate design decision, not a drive-by edit.
const OWNER_METHODS = [
    'commitTosAndConnect',
    'isConnected',
    'stampBaseEntitlements',
    'hasBaseEntitlementStamp',
    'setPendingReferral',
    'clearPendingReferral',
    'setBaseFolderId',
    'set_wallet_address_and_signature',
];

// The merge stamp (in User.OPERATOR_STAMP_FIELDS) has ONE writer: Core's transactional markMigrated / unmarkMigrated,
// which refuse a missing or already-migrated record. A Cloud mirror defining either is a second, unguarded
// writer of the stamp: the test fails on it, whatever the body says.
const CORE_ONLY_METHODS = ['markMigrated', 'unmarkMigrated'];

function readSource(filePath) {
    return readFileSync(filePath, 'utf8');
}

/** The source with block comments and whole-line `//` comments removed (a comment naming a method is not a definition). */
function codeOnly(source) {
    return source
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((line) => !/^\s*\/\//.test(line))
        .join('\n');
}

/**
 * Whether `source` DEFINES a method `name` in any form a class or object can carry it: a method
 * (`name(`, `async name(`, `static name(`, `*name(`), a property holding a function (`name = async (`,
 * `name: function`), or a prototype assignment (`.prototype.name =`).
 */
function definesMethod(source, name) {
    const code = codeOnly(source);
    const forms = [
        new RegExp(`^\\s*(?:static\\s+)?(?:async\\s+)?\\*?\\s*${name}\\s*\\(`, 'm'),
        new RegExp(`^\\s*(?:static\\s+)?${name}\\s*[:=]\\s*(?:async\\b|function\\b|\\(|[A-Za-z_$][\\w$]*\\s*=>)`, 'm'),
        new RegExp(`\\.prototype\\.${name}\\s*=`),
        new RegExp(`\\.prototype\\s*,\\s*['"]${name}['"]`),
    ];
    return forms.some((re) => re.test(code));
}

/** The pinned owner methods `source` defines. */
function definedOwnerMethods(source) {
    return new Set(OWNER_METHODS.filter((name) => definesMethod(source, name)));
}

/**
 * The string list of `static OPERATOR_STAMP_FIELDS = Object.freeze([...])` in `source` (the USERS fields only
 * Core's transactional operator writers write; to_dict never carries them); throws when the declaration is
 * absent or holds anything but string literals (the list is read, never guessed).
 */
function stampFieldsOf(source, label) {
    const m = codeOnly(source).match(/static\s+OPERATOR_STAMP_FIELDS\s*=\s*Object\.freeze\(\s*\[([^\]]*)\]\s*\)/);
    if (!m) throw new Error(`${label}: no \`static OPERATOR_STAMP_FIELDS = Object.freeze([...])\` on its User`);
    const items = m[1].split(',').map((x) => x.trim()).filter(Boolean);
    return items.map((x) => {
        const lit = x.match(/^(['"])([^'"]*)\1$/);
        if (!lit) throw new Error(`${label}: OPERATOR_STAMP_FIELDS holds ${x}, not a string literal`);
        return lit[2];
    });
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

test('User mirrors: Core defines the core-only merge-stamp writers (markMigrated, unmarkMigrated)', () => {
    const src = readSource(CORE_USER_FILE);
    const missing = CORE_ONLY_METHODS.filter((m) => !definesMethod(src, m));
    assert.deepEqual(missing, [], `Core User is missing its core-only methods: ${missing.join(', ')}`);
});

test('User mirrors: Cloud defines NO core-only merge-stamp writer (a second, unguarded writer of the stamp)', () => {
    const present = CORE_ONLY_METHODS.filter((m) => definesMethod(readSource(CLOUD_USER_FILE), m));
    assert.deepEqual(present, [], `Cloud User mirror (${CLOUD_USER_FILE}) defines core-only method(s) ${present.join(', ')}: the merge stamp is written only by Core's transactional User.markMigrated / unmarkMigrated; delete Cloud's`);
});

test('User mirrors: Cloud\'s User.OPERATOR_STAMP_FIELDS equals Core\'s (one list, pinned)', () => {
    const core = stampFieldsOf(readSource(CORE_USER_FILE), `Core ${CORE_USER_FILE}`);
    const cloud = stampFieldsOf(readSource(CLOUD_USER_FILE), `Cloud ${CLOUD_USER_FILE}`);
    assert.ok(core.length > 0, 'Core\'s OPERATOR_STAMP_FIELDS is empty');
    assert.deepEqual(cloud, core, `Cloud's User.OPERATOR_STAMP_FIELDS ${JSON.stringify(cloud)} is not Core's ${JSON.stringify(core)}`);
});

// The detectors above are the gate; these fixtures show each one FAILS on what it must reject.
test('gate fixtures: a Cloud mirror defining a core-only method in any form is caught; a comment is not', () => {
    const caught = [
        'class User {\n    async markMigrated(to) {\n        return this.db.update_doc_fields(U, this.id, { migrated_to: to });\n    }\n}',
        'class User {\n    markMigrated(to) { }\n}',
        'class User {\n    unmarkMigrated = async (to) => { };\n}',
        'User.prototype.markMigrated = function (to) { };',
        'Object.defineProperty(User.prototype, \'unmarkMigrated\', { value() {} });',
    ];
    for (const src of caught) {
        assert.ok(CORE_ONLY_METHODS.some((m) => definesMethod(src, m)), `not caught: ${src}`);
    }
    const notDefinitions = [
        '// the merge stamp is written by Core\'s markMigrated(to)\nclass User {}',
        '/** Core\'s User.markMigrated / unmarkMigrated write it. */\nclass User {}',
        'class User {\n    foo() { return core.markMigrated(x); }\n}',
    ];
    for (const src of notDefinitions) {
        assert.equal(CORE_ONLY_METHODS.some((m) => definesMethod(src, m)), false, `a non-definition counted as one: ${src}`);
    }
});

test('gate fixtures: OPERATOR_STAMP_FIELDS is read exactly; a different, missing or old-named list is caught', () => {
    const src = (list, name = 'OPERATOR_STAMP_FIELDS') => `class User {\n    static ${name} = Object.freeze([${list}]);\n}`;
    assert.deepEqual(stampFieldsOf(src(`'migrated_to', 'migrated_at', 'admin_delete'`), 'f'), ['migrated_to', 'migrated_at', 'admin_delete']);
    assert.notDeepEqual(stampFieldsOf(src(`'migrated_to', 'migrated_at'`), 'f'), ['migrated_to', 'migrated_at', 'admin_delete']);
    assert.throws(() => stampFieldsOf('class User {}', 'f'), /no `static OPERATOR_STAMP_FIELDS/);
    assert.throws(() => stampFieldsOf(src(`'migrated_to', 'migrated_at'`, 'MIGRATION_FIELDS'), 'f'), /no `static OPERATOR_STAMP_FIELDS/, 'the old name is not read');
    assert.throws(() => stampFieldsOf(src(`'migrated_to', FIELD`), 'f'), /not a string literal/);
});

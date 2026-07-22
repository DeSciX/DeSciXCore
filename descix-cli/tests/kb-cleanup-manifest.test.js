/**
 * WS-EVP-DESCIX-KB-CLEANUP — conformance for the CLI-side manifest fixes (items 4-5).
 *
 * Item 4 (nested-source dedup): CorpusWalker.walkCorpus emits each physical file exactly ONCE — owned
 *         by the DEEPEST (most-specific) source root that contains it — so a manifest listing both a
 *         directory source AND a nested child source no longer double-collects the child's files
 *         (the deterministic upsert-vs-live dedup delta, e.g. the −175 on unk-beast/Corpus).
 * Item 5 (canonical schema): collectManifestSchemaWarnings flags deprecated `src_path` and unknown
 *         fields (warn, not throw); loadManifest normalizes `src_path` -> `raw_path`.
 *
 * Design: synthesizes a temp git workspace + manifests. No live platform.
 * Run: `node --test tests/kb-cleanup-manifest.test.js` from descix-cli/.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { walkCorpus } from '../lib/core/CorpusWalker.js';
import {
    loadManifest,
    collectManifestSchemaWarnings,
    CANONICAL_SOURCE_FIELDS,
    DEPRECATED_SOURCE_ALIASES,
} from '../lib/core/ManifestLoader.js';

async function mkTmp(prefix) {
    return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

function resolvedSource(root, rel, tier, extra = {}) {
    return {
        path: rel,
        absolutePath: path.join(root, rel),
        ref: 'main',
        tier,
        doc_type: 'source',
        syncignore: [],
        doc_class: undefined,
        license_basis: null,
        lint_exempt: [],
        exempt_reason: null,
        raw_path: null,
        ...extra,
    };
}

// ---------------- Item 4: nested-source dedup ----------------

test('item4: nested child source files are collected ONCE, owned by the deepest source', async () => {
    const root = await mkTmp('kbcleanup-walk-');
    try {
        execSync('git init -q', { cwd: root });
        await fs.mkdir(path.join(root, 'svc', 'handlers'), { recursive: true });
        await fs.writeFile(path.join(root, 'svc', 'a.js'), 'export const a = 1;\n');
        await fs.writeFile(path.join(root, 'svc', 'b.js'), 'export const b = 2;\n');
        await fs.writeFile(path.join(root, 'svc', 'handlers', 'c.js'), 'export const c = 3;\n');
        await fs.writeFile(path.join(root, 'svc', 'handlers', 'd.js'), 'export const d = 4;\n');

        // Mirror the unk-beast/Corpus shape: a broad dir source (tier 3) + a nested child (tier 2).
        const manifest = {
            _resolvedSources: [
                resolvedSource(root, 'svc', 3),
                resolvedSource(root, 'svc/handlers', 2),
            ],
        };

        const { files } = await walkCorpus(manifest, root);

        // Exactly 4 unique files — NOT 6 (c.js, d.js would be doubled without dedup).
        assert.equal(files.length, 4, `expected 4 unique files, got ${files.length}`);
        const rels = files.map(f => path.basename(f.absolute_path)).sort();
        assert.deepEqual(rels, ['a.js', 'b.js', 'c.js', 'd.js']);

        // No absolute_path appears twice.
        const seen = new Set();
        for (const f of files) {
            assert.ok(!seen.has(f.absolute_path), `duplicate file entry: ${f.absolute_path}`);
            seen.add(f.absolute_path);
        }

        // The nested files are owned by the DEEPER source (tier 2); the top files by tier 3.
        const tierOf = (name) => files.find(f => path.basename(f.absolute_path) === name).source_entry.tier;
        assert.equal(tierOf('c.js'), 2, 'handlers/c.js must be owned by the nested tier-2 source');
        assert.equal(tierOf('d.js'), 2);
        assert.equal(tierOf('a.js'), 3, 'svc/a.js must be owned by the tier-3 dir source');
        assert.equal(tierOf('b.js'), 3);
    } finally {
        await fs.rm(root, { recursive: true, force: true });
    }
});

test('item4: an explicit single-file source out-specifies its enclosing directory source', async () => {
    const root = await mkTmp('kbcleanup-walk2-');
    try {
        execSync('git init -q', { cwd: root });
        await fs.mkdir(path.join(root, 'svc'), { recursive: true });
        await fs.writeFile(path.join(root, 'svc', 'app.js'), 'export const app = 1;\n');
        await fs.writeFile(path.join(root, 'svc', 'other.js'), 'export const o = 2;\n');

        const manifest = {
            _resolvedSources: [
                resolvedSource(root, 'svc', 3),
                resolvedSource(root, 'svc/app.js', 2), // explicit file override
            ],
        };
        const { files } = await walkCorpus(manifest, root);
        assert.equal(files.length, 2);
        const appEntry = files.find(f => path.basename(f.absolute_path) === 'app.js');
        assert.equal(appEntry.source_entry.tier, 2, 'the explicit file source must own app.js');
    } finally {
        await fs.rm(root, { recursive: true, force: true });
    }
});

// ---------------- Item 5: canonical schema validator + normalization ----------------

test('item5: collectManifestSchemaWarnings flags a deprecated src_path alias', () => {
    const manifest = {
        kb_name: 'General',
        sources: [{ path: 'x/README.md', doc_class: 'guide', src_path: 'kb/General/README.md' }],
    };
    const warnings = collectManifestSchemaWarnings(manifest, '/tmp/General.json');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /DEPRECATED/);
    assert.match(warnings[0], /src_path/);
    assert.match(warnings[0], /raw_path/);
});

test('item5: collectManifestSchemaWarnings flags an unknown/misspelled field', () => {
    const manifest = {
        kb_name: 'General',
        sources: [{ path: 'x', synchignore: ['*.test.js'] }], // typo of syncignore
    };
    const warnings = collectManifestSchemaWarnings(manifest, '/tmp/General.json');
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /unknown field "synchignore"/);
});

test('item5: a fully-canonical manifest (both families) produces NO warnings', () => {
    // DeSciX-family source
    const descixFamily = {
        kb_name: 'Corpus',
        _purpose: 'annotation key is allowed',
        sources: [{ path: 'a', tier: 3, doc_type: 'source', syncignore: ['node_modules/'] }],
    };
    // EGPT-family source once migrated to raw_path
    const egptFamily = {
        kb_name: 'General',
        publish_tier: 'P',
        sources: [{ path: 'kb-dist/General/README.md', doc_class: 'guide', raw_path: 'kb/General/README.md' }],
    };
    assert.deepEqual(collectManifestSchemaWarnings(descixFamily, '/tmp/Corpus.json'), []);
    assert.deepEqual(collectManifestSchemaWarnings(egptFamily, '/tmp/General.json'), []);
});

test('item5: loadManifest normalizes src_path -> raw_path (does not throw)', async () => {
    const root = await mkTmp('kbcleanup-manifest-');
    try {
        const manifestObj = {
            kb_name: 'General',
            sources: [
                { path: 'README.md', doc_class: 'guide', src_path: 'kb/General/README.md' },
            ],
        };
        const mpath = path.join(root, 'General.json');
        await fs.writeFile(mpath, JSON.stringify(manifestObj));
        const loaded = await loadManifest(mpath, root);
        assert.equal(loaded._resolvedSources[0].raw_path, 'kb/General/README.md',
            'src_path must be normalized into the canonical raw_path field');
    } finally {
        await fs.rm(root, { recursive: true, force: true });
    }
});

test('item5: canonical field set + alias map are exported (single source of truth)', () => {
    assert.ok(CANONICAL_SOURCE_FIELDS.has('raw_path'));
    assert.ok(CANONICAL_SOURCE_FIELDS.has('syncignore'));
    assert.equal(DEPRECATED_SOURCE_ALIASES.src_path, 'raw_path');
});
